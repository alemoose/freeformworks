import base64
import hashlib
import hmac
import json
import time
from urllib.parse import parse_qs, urlparse

import pytest
from cryptography.fernet import Fernet
from sqlalchemy import select

from grounds import payments
from grounds.models import db, Invoice, Job, PaymentAccount
from test_app import app, client, post, login, estimate, schedule  # noqa: F401  (fixtures)


class FakeProviders:
    """Stands in for Stripe and Square; records every call."""

    def __init__(self):
        self.calls = []
        self.stripe_paid = set()
        self.square_paid = set()
        self.fail = False

    def __call__(self, method, url, headers, body):
        self.calls.append((method, url, headers, body))
        if self.fail:
            return 401, json.dumps({"error": {"message": "Invalid API Key provided"}}).encode()
        path = urlparse(url).path
        if "stripe.com" in url:
            assert headers["Authorization"] == "Bearer rk_test_abc123"
            form = parse_qs(body.decode()) if body else {}
            if path == "/v1/prices":
                return 200, json.dumps({"id": "price_1", "unit_amount": int(form["unit_amount"][0])}).encode()
            if path == "/v1/payment_links":
                assert form["restrictions[completed_sessions][limit]"] == ["1"]
                n = sum(1 for c in self.calls if urlparse(c[1]).path == "/v1/payment_links")
                return 200, json.dumps({"id": f"plink_{n}", "url": f"https://buy.stripe.com/test_{n}"}).encode()
            if path == "/v1/checkout/sessions":
                link = parse_qs(urlparse(url).query)["payment_link"][0]
                status = "paid" if link in self.stripe_paid else "unpaid"
                return 200, json.dumps({"data": [{"payment_status": status}]}).encode()
            if path.startswith("/v1/payment_links/"):
                return 200, b"{}"
        if "squareup" in url:
            assert headers["Authorization"] == "Bearer EAAAsquare"
            assert "squareupsandbox.com" in url
            if path == "/v2/online-checkout/payment-links" and method == "POST":
                data = json.loads(body)
                assert data["quick_pay"]["location_id"] == "LOC1"
                return 200, json.dumps({"payment_link": {"id": "sqlink_1", "url": "https://square.link/u/abc", "order_id": "order_1"}}).encode()
            if path.startswith("/v2/orders/"):
                oid = path.rsplit("/", 1)[1]
                order = {"state": "OPEN", "total_money": {"amount": 4000}, "net_amount_due_money": {"amount": 4000}}
                if oid in self.square_paid:
                    order.update(state="COMPLETED", net_amount_due_money={"amount": 0})
                return 200, json.dumps({"order": order}).encode()
            if method == "DELETE":
                return 200, b"{}"
        return 404, b"{}"


@pytest.fixture
def fake(monkeypatch):
    monkeypatch.setenv("GROUNDS_DATA_KEY", Fernet.generate_key().decode())
    providers = FakeProviders()
    monkeypatch.setattr(payments, "transport", providers)
    return providers


def finished_job(c):
    estimate(c)
    schedule(c)
    assert post(c, "/jobs/1/complete").status_code == 302


def connect_stripe(c):
    r = post(c, "/settings/payments", {"provider": "stripe", "secret": "rk_test_abc123", "webhook_secret": "whsec_test"}, "/settings/payments")
    assert r.status_code == 302


def stripe_sig(payload, secret="whsec_test", stamp=None):
    stamp = stamp or int(time.time())
    sig = hmac.new(secret.encode(), f"{stamp}.".encode() + payload, hashlib.sha256).hexdigest()
    return f"t={stamp},v1={sig}"


def test_keys_are_encrypted_and_never_shown(client, app, fake):
    login(client)
    connect_stripe(client)
    with app.app_context():
        acct = db.session.scalar(select(PaymentAccount))
        assert acct.provider == "stripe" and acct.secret_hint == "c123"
        assert "rk_test_abc123" not in acct.secret_enc and "whsec_test" not in acct.webhook_secret_enc
        assert payments.decrypt(acct.secret_enc) == "rk_test_abc123"
    page = client.get("/settings/payments").data
    assert b"rk_test_abc123" not in page and b"ends in c123" in page
    # A bad Stripe key is refused and nothing changes.
    post(client, "/settings/payments", {"provider": "stripe", "secret": "not-a-key"}, "/settings/payments")
    with app.app_context():
        assert payments.decrypt(db.session.scalar(select(PaymentAccount)).secret_enc) == "rk_test_abc123"


def test_stripe_invoice_webhook_and_check(client, app, fake):
    finished_job(client)
    connect_stripe(client)
    assert b"Get paid" in client.get("/dashboard").data
    r = post(client, "/jobs/1/invoice", {"amount": "40.00", "due_days": "7"}, "/dashboard")
    assert r.status_code == 302 and r.headers["Location"].endswith("/invoices/1")
    with app.app_context():
        inv = db.session.get(Invoice, 1)
        assert (inv.amount_cents, inv.provider, inv.link_id, inv.status) == (4000, "stripe", "plink_1", "unpaid")
    page = client.get("/invoices/1").data
    assert b"https://buy.stripe.com/test_1" in page and b"$40.00" in page
    # Same visit can't be invoiced twice.
    post(client, "/jobs/1/invoice", {"amount": "40"}, "/dashboard")
    with app.app_context():
        assert db.session.query(Invoice).count() == 1

    # Forged webhook is rejected; a signed one marks it paid.
    event = json.dumps({"type": "checkout.session.completed", "data": {"object": {"payment_link": "plink_1", "payment_status": "paid"}}}).encode()
    bad = client.post("/webhooks/stripe/alpha", data=event, headers={"Stripe-Signature": stripe_sig(event, "wrong")})
    assert bad.status_code == 400
    old = client.post("/webhooks/stripe/alpha", data=event, headers={"Stripe-Signature": stripe_sig(event, stamp=int(time.time()) - 3600)})
    assert old.status_code == 400
    # The other business's endpoint can't touch alpha's invoice.
    assert client.post("/webhooks/stripe/beta", data=event, headers={"Stripe-Signature": stripe_sig(event)}).status_code == 400
    ok = client.post("/webhooks/stripe/alpha", data=event, headers={"Stripe-Signature": stripe_sig(event)})
    assert ok.status_code == 200
    with app.app_context():
        inv = db.session.get(Invoice, 1)
        assert inv.status == "paid" and inv.paid_method == "stripe" and inv.paid_at


def test_check_payments_without_webhook(client, app, fake):
    finished_job(client)
    post(client, "/settings/payments", {"provider": "stripe", "secret": "rk_test_abc123"}, "/settings/payments")
    post(client, "/jobs/1/invoice", {"amount": "40"}, "/dashboard")
    post(client, "/invoices/check", {}, "/invoices")
    with app.app_context():
        assert db.session.get(Invoice, 1).status == "unpaid"
    fake.stripe_paid.add("plink_1")
    post(client, "/invoices/check", {}, "/invoices")
    with app.app_context():
        assert db.session.get(Invoice, 1).status == "paid"


def test_square_deposit_and_webhook(client, app, fake):
    estimate(client)
    for s in ["approved", "awaiting_decision"]:
        post(client, "/estimates/1/status", {"status": s})
    # No deposit before the customer accepts.
    assert post(client, "/estimates/1/deposit", {"amount": "20"}).status_code == 400
    post(client, "/estimates/1/status", {"status": "accepted"})
    r = post(client, "/settings/payments", {"provider": "square", "secret": "EAAAsquare", "webhook_secret": "sqkey", "square_location_id": "LOC1", "sandbox": "yes"}, "/settings/payments")
    assert r.status_code == 302
    assert post(client, "/estimates/1/deposit", {"amount": "20", "due_days": "0"}, "/leads/1").status_code == 302
    with app.app_context():
        inv = db.session.get(Invoice, 1)
        assert (inv.kind, inv.amount_cents, inv.order_id, inv.pay_url) == ("deposit", 2000, "order_1", "https://square.link/u/abc")
    event = json.dumps({"type": "payment.updated", "data": {"object": {"payment": {"order_id": "order_1", "status": "COMPLETED"}}}}).encode()
    url = "http://localhost/webhooks/square/alpha"
    good = base64.b64encode(hmac.new(b"sqkey", url.encode() + event, hashlib.sha256).digest()).decode()
    assert client.post("/webhooks/square/alpha", data=event, headers={"x-square-hmacsha256-signature": "nope"}).status_code == 400
    assert client.post("/webhooks/square/alpha", data=event, headers={"x-square-hmacsha256-signature": good}).status_code == 200
    with app.app_context():
        assert db.session.get(Invoice, 1).status == "paid"


def test_manual_payment_instructions_and_void(client, app, fake):
    finished_job(client)
    post(client, "/settings/payments", {"provider": "manual", "instructions": "Venmo @alpha-lawn"}, "/settings/payments")
    post(client, "/jobs/1/invoice", {"amount": "55.5", "due_days": "0"}, "/dashboard")
    page = client.get("/invoices/1").data
    assert b"Venmo @alpha-lawn" in page and b"$55.50" in page
    assert not any("stripe" in c[1] or "square" in c[1] for c in fake.calls)
    assert post(client, "/invoices/1/paid", {"method": "bitcoin"}, "/invoices/1").status_code == 400
    assert post(client, "/invoices/1/paid", {"method": "cash app"}, "/invoices/1").status_code == 302
    with app.app_context():
        inv = db.session.get(Invoice, 1)
        assert inv.status == "paid" and inv.paid_method == "cash app"
    # Paid invoices can't be voided.
    post(client, "/invoices/1/void", {}, "/invoices/1")
    with app.app_context():
        assert db.session.get(Invoice, 1).status == "paid"


def test_provider_errors_roll_back(client, app, fake):
    finished_job(client)
    connect_stripe(client)
    fake.fail = True
    r = post(client, "/jobs/1/invoice", {"amount": "40"}, "/dashboard")
    assert r.status_code == 302
    with app.app_context():
        assert db.session.query(Invoice).count() == 0
    assert b"Invalid API Key provided" in client.get("/dashboard").data


def test_invoice_rules_and_isolation(client, app, fake):
    estimate(client)
    schedule(client)
    # A visit that isn't finished can't be invoiced.
    assert post(client, "/jobs/1/invoice", {"amount": "40"}, "/dashboard").status_code == 400
    post(client, "/jobs/1/complete")
    for bad in ["0", "-5", "abc", "100001"]:
        post(client, "/jobs/1/invoice", {"amount": bad}, "/dashboard")
    with app.app_context():
        assert db.session.query(Invoice).count() == 0
    post(client, "/jobs/1/invoice", {"amount": "40"}, "/dashboard")
    post(client, "/logout")
    login(client, "beta")
    assert client.get("/invoices/1").status_code == 404
    for path in ["/invoices/1/paid", "/invoices/1/void", "/invoices/1/check", "/jobs/1/invoice"]:
        assert post(client, path, {"method": "cash"}, "/dashboard").status_code == 404
    assert b"Jane Example" not in client.get("/invoices").data
    with app.app_context():
        assert db.session.get(Invoice, 1).status == "unpaid"


def test_missing_data_key_is_explained(client, app, monkeypatch):
    monkeypatch.delenv("GROUNDS_DATA_KEY", raising=False)
    login(client)
    r = post(client, "/settings/payments", {"provider": "stripe", "secret": "rk_test_abc123"}, "/settings/payments")
    assert b"GROUNDS_DATA_KEY is missing" in r.data
    with app.app_context():
        assert db.session.scalar(select(PaymentAccount)) is None
