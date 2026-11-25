"""Pay links through the owner's own Stripe or Square account.

Money always goes straight to the owner's account; Grounds only creates a one-time
pay link, then learns that it was paid (from a signed webhook or by asking the
provider). Keys are encrypted at rest with GROUNDS_DATA_KEY.
"""

import base64
import hashlib
import hmac
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

STRIPE_API = "https://api.stripe.com"
SQUARE_API = "https://connect.squareup.com"
SQUARE_SANDBOX_API = "https://connect.squareupsandbox.com"
SQUARE_VERSION = "2025-01-23"
PROVIDERS = ("stripe", "square", "manual")


class PaymentError(Exception):
    """A provider call failed; the message is safe to show the owner."""


# ---------- encryption of stored keys ----------


def _fernet():
    from cryptography.fernet import Fernet

    key = os.getenv("GROUNDS_DATA_KEY", "")
    if not key:
        raise PaymentError(
            "Payments are not set up on this server yet: GROUNDS_DATA_KEY is missing."
        )
    try:
        return Fernet(key.encode())
    except ValueError:
        raise PaymentError("GROUNDS_DATA_KEY is not a valid key.")


def encrypt(value):
    return _fernet().encrypt(value.encode()).decode() if value else ""


def decrypt(value):
    from cryptography.fernet import InvalidToken

    if not value:
        return ""
    try:
        return _fernet().decrypt(value.encode()).decode()
    except InvalidToken:
        raise PaymentError("A saved key can't be read. Enter it again in Payments.")


# ---------- HTTP (replaced in tests) ----------


def transport(method, url, headers, body):
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as err:
        return err.code, err.read()
    except (urllib.error.URLError, TimeoutError) as err:
        raise PaymentError(f"Could not reach the payment provider ({err}).")


def _call(method, url, headers, body=None):
    status, raw = transport(method, url, headers, body)
    try:
        data = json.loads(raw or b"{}")
    except ValueError:
        data = {}
    if status >= 400:
        if "stripe.com" in url:
            message = (data.get("error") or {}).get("message", "")
        else:
            message = "; ".join(e.get("detail", "") for e in data.get("errors", []))
        raise PaymentError(f"The payment provider refused the request: {message or status}")
    return data


# ---------- Stripe: a single-use Payment Link per invoice ----------


def _stripe(method, path, secret, form=None):
    headers = {"Authorization": f"Bearer {secret}"}
    body = None
    if form is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        body = urllib.parse.urlencode(form).encode()
    return _call(method, STRIPE_API + path, headers, body)


def stripe_create_link(secret, name, amount_cents, invoice_ref):
    price = _stripe(
        "POST",
        "/v1/prices",
        secret,
        {"currency": "usd", "unit_amount": amount_cents, "product_data[name]": name[:250]},
    )
    link = _stripe(
        "POST",
        "/v1/payment_links",
        secret,
        {
            "line_items[0][price]": price["id"],
            "line_items[0][quantity]": 1,
            # One payment per invoice: the link stops working after it is paid.
            "restrictions[completed_sessions][limit]": 1,
            "metadata[grounds_invoice]": invoice_ref,
        },
    )
    return link["id"], link["url"], ""


def stripe_is_paid(secret, link_id):
    query = urllib.parse.urlencode({"payment_link": link_id, "limit": 10})
    sessions = _stripe("GET", f"/v1/checkout/sessions?{query}", secret)
    return any(s.get("payment_status") == "paid" for s in sessions.get("data", []))


def stripe_close_link(secret, link_id):
    _stripe("POST", f"/v1/payment_links/{link_id}", secret, {"active": "false"})


def stripe_event(payload, signature_header, webhook_secret, tolerance=300):
    """Verify a Stripe webhook and return the event, or None if the signature is wrong."""
    parts = dict(
        p.split("=", 1) for p in (signature_header or "").split(",") if "=" in p
    )
    signatures = [
        v for k, v in (p.split("=", 1) for p in (signature_header or "").split(",") if "=" in p)
        if k == "v1"
    ]
    try:
        stamp = int(parts.get("t", ""))
    except ValueError:
        return None
    if abs(time.time() - stamp) > tolerance or not webhook_secret:
        return None
    expected = hmac.new(
        webhook_secret.encode(), f"{stamp}.".encode() + payload, hashlib.sha256
    ).hexdigest()
    if not any(hmac.compare_digest(expected, s) for s in signatures):
        return None
    try:
        return json.loads(payload)
    except ValueError:
        return None


# ---------- Square: a quick-pay Payment Link per invoice ----------


def _square(method, path, token, sandbox, payload=None):
    headers = {
        "Authorization": f"Bearer {token}",
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
    }
    base = SQUARE_SANDBOX_API if sandbox else SQUARE_API
    body = json.dumps(payload).encode() if payload is not None else None
    return _call(method, base + path, headers, body)


def square_create_link(token, location_id, sandbox, name, amount_cents, invoice_ref):
    data = _square(
        "POST",
        "/v2/online-checkout/payment-links",
        token,
        sandbox,
        {
            "idempotency_key": invoice_ref,
            "quick_pay": {
                "name": name[:255],
                "price_money": {"amount": amount_cents, "currency": "USD"},
                "location_id": location_id,
            },
        },
    )
    link = data["payment_link"]
    return link["id"], link["url"], link.get("order_id", "")


def square_is_paid(token, sandbox, order_id):
    order = _square("GET", f"/v2/orders/{order_id}", token, sandbox).get("order", {})
    total = (order.get("total_money") or {}).get("amount", 0)
    due = (order.get("net_amount_due_money") or {}).get("amount", total)
    return bool(order.get("tenders")) or order.get("state") == "COMPLETED" or (total > 0 and due == 0)


def square_close_link(token, sandbox, link_id):
    _square("DELETE", f"/v2/online-checkout/payment-links/{link_id}", token, sandbox)


def square_event(payload, signature_header, signature_key, notification_url):
    """Verify a Square webhook (HMAC-SHA256 of URL + body) and return the event, or None."""
    if not signature_key or not signature_header:
        return None
    expected = base64.b64encode(
        hmac.new(signature_key.encode(), notification_url.encode() + payload, hashlib.sha256).digest()
    ).decode()
    if not hmac.compare_digest(expected, signature_header):
        return None
    try:
        return json.loads(payload)
    except ValueError:
        return None
