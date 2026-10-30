import calendar
import re
from datetime import timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

FREQUENCIES = ("once", "weekly", "biweekly", "monthly")
SERVICES = ("Lawn mowing", "Garden maintenance", "Seasonal cleanup", "Other")


def amount(value, minimum=Decimal("0"), maximum=Decimal("100000")):
    try:
        n = Decimal(str(value))
        if not n.is_finite() or not minimum <= n <= maximum:
            raise ValueError()
        return n.quantize(Decimal(".01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError):
        raise ValueError("Enter a valid amount within the allowed range.")


def intake(data):
    out = {
        k: str(data.get(k, "")).strip()
        for k in ("name", "phone", "email", "address", "service", "frequency", "notes")
    }
    for key, limit in [
        ("name", 120),
        ("phone", 40),
        ("email", 254),
        ("address", 400),
        ("notes", 2000),
    ]:
        if len(out[key]) > limit:
            raise ValueError(f"{key.title()} is too long.")
    if not out["name"] or not out["address"]:
        raise ValueError("Name and property address are required.")
    if (
        not re.fullmatch(r"[+()\d\s.\-]{7,40}", out["phone"])
        or not 7 <= len(re.sub(r"\D", "", out["phone"])) <= 15
    ):
        raise ValueError("Enter a valid phone number.")
    if out["email"] and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", out["email"]):
        raise ValueError("Enter a valid email address.")
    if out["service"] not in SERVICES or out["frequency"] not in FREQUENCIES:
        raise ValueError("Choose a service and frequency.")
    area = str(data.get("area", "")).strip()
    if area and (not area.isdigit() or not 1 <= int(area) <= 10000000):
        raise ValueError("Lawn area must be 1–10,000,000 square feet.")
    out["area"] = int(area) if area else None
    out["marketing_consent"] = data.get("marketing_consent") == "yes"
    return out


def price(settings, area, difficulty, frequency, adjustment="0"):
    if difficulty not in ("easy", "moderate", "hard") or frequency not in FREQUENCIES:
        raise ValueError("Choose a valid difficulty and frequency.")
    if not str(area).isdigit() or not 1 <= int(area) <= 10000000:
        raise ValueError("Enter estimated mowable lawn area in square feet.")
    base = amount(settings["base"])
    area_cost = (Decimal(area) / 1000 * amount(settings["per_thousand"])).quantize(
        Decimal(".01"), rounding=ROUND_HALF_UP
    )
    diff, freq = amount(settings[difficulty]), amount(settings[frequency])
    subtotal = base + area_cost + diff + freq
    minimum_topup = max(Decimal("0"), amount(settings["minimum"]) - subtotal)
    manual = amount(adjustment, Decimal("-100000"))
    total = subtotal + minimum_topup + manual
    if total < 0 or total > 10000000:
        raise ValueError("Final price must be between $0 and $10,000,000.")
    parts = {
        "base": base,
        "area_cost": area_cost,
        "difficulty": diff,
        "frequency": freq,
        "minimum_topup": minimum_topup,
        "manual_adjustment": manual,
        "total": total,
    }
    return {k: str(v) for k, v in parts.items()} | {
        "mowable_area_sqft": int(area)
    }, int(total * 100)


def next_visit(day, frequency, anchor_day=None):
    if frequency == "once":
        return None
    if frequency in ("weekly", "biweekly"):
        return day + timedelta(days=7 if frequency == "weekly" else 14)
    if frequency != "monthly":
        raise ValueError("Invalid frequency.")
    year, month = day.year + (day.month == 12), day.month % 12 + 1
    return day.replace(
        year=year,
        month=month,
        day=min(anchor_day or day.day, calendar.monthrange(year, month)[1]),
    )
