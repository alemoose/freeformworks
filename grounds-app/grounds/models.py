from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import UniqueConstraint

db = SQLAlchemy()


def now():
    return datetime.now(timezone.utc)


class Business(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(80), unique=True, nullable=False)
    timezone = db.Column(db.String(80), nullable=False, default="America/Chicago")
    pricing = db.Column(
        db.JSON,
        nullable=False,
        default=lambda: {
            "minimum": "40",
            "base": "20",
            "per_thousand": "5",
            "easy": "0",
            "moderate": "10",
            "hard": "25",
            "once": "10",
            "weekly": "0",
            "biweekly": "5",
            "monthly": "15",
        },
    )


class Owner(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.ForeignKey("business.id"), nullable=False)
    email = db.Column(db.String(254), unique=True, nullable=False)
    password_hash = db.Column(db.String(300), nullable=False)


class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.ForeignKey("business.id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(40), nullable=False)
    email = db.Column(db.String(254), nullable=False, default="")
    address = db.Column(db.String(400), nullable=False)
    marketing_consent = db.Column(db.Boolean, nullable=False, default=False)
    consent_at = db.Column(db.DateTime(timezone=True))


class Lead(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.ForeignKey("business.id"), nullable=False, index=True)
    customer_id = db.Column(db.ForeignKey("customer.id"), nullable=False)
    customer = db.relationship(Customer)
    service = db.Column(db.String(60), nullable=False)
    area = db.Column(db.Integer)
    frequency = db.Column(db.String(20), nullable=False)
    notes = db.Column(db.Text, nullable=False, default="")
    status = db.Column(db.String(30), nullable=False, default="new")
    follow_up = db.Column(db.Date, nullable=False)
    draft = db.Column(db.Text, nullable=False, default="")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=now)


class Estimate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.ForeignKey("business.id"), nullable=False, index=True)
    lead_id = db.Column(db.ForeignKey("lead.id"), nullable=False)
    lead = db.relationship(Lead)
    breakdown = db.Column(db.JSON, nullable=False)
    total_cents = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), nullable=False, default="pending_approval")
    adjustment_note = db.Column(db.String(400), nullable=False, default="")


class Schedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.ForeignKey("business.id"), nullable=False, index=True)
    estimate_id = db.Column(db.ForeignKey("estimate.id"), unique=True, nullable=False)
    estimate = db.relationship(Estimate)
    frequency = db.Column(db.String(20), nullable=False)
    anchor_day = db.Column(db.Integer, nullable=False)
    active = db.Column(db.Boolean, nullable=False, default=True)


class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.ForeignKey("business.id"), nullable=False, index=True)
    schedule_id = db.Column(db.ForeignKey("schedule.id"), nullable=False)
    schedule = db.relationship(Schedule)
    date = db.Column(db.Date, nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="scheduled")
    __table_args__ = (UniqueConstraint("schedule_id", "date"),)


class PaymentAccount(db.Model):
    """How one business gets paid. Keys are encrypted (see payments.encrypt)."""

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.ForeignKey("business.id"), unique=True, nullable=False)
    provider = db.Column(db.String(20), nullable=False, default="manual")
    secret_enc = db.Column(db.Text, nullable=False, default="")
    secret_hint = db.Column(db.String(8), nullable=False, default="")
    webhook_secret_enc = db.Column(db.Text, nullable=False, default="")
    square_location_id = db.Column(db.String(64), nullable=False, default="")
    sandbox = db.Column(db.Boolean, nullable=False, default=False)
    instructions = db.Column(db.String(400), nullable=False, default="")
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=now)


class Invoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.ForeignKey("business.id"), nullable=False, index=True)
    customer_id = db.Column(db.ForeignKey("customer.id"), nullable=False)
    customer = db.relationship(Customer)
    # A job invoice points at the visit; a deposit points at the accepted estimate.
    job_id = db.Column(db.ForeignKey("job.id"), unique=True)
    job = db.relationship(Job)
    estimate_id = db.Column(db.ForeignKey("estimate.id"), unique=True)
    kind = db.Column(db.String(20), nullable=False)  # job | deposit
    description = db.Column(db.String(200), nullable=False)
    amount_cents = db.Column(db.Integer, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="unpaid")  # unpaid | paid | void
    provider = db.Column(db.String(20), nullable=False)  # stripe | square | manual
    link_id = db.Column(db.String(120), nullable=False, default="", index=True)
    order_id = db.Column(db.String(120), nullable=False, default="", index=True)
    pay_url = db.Column(db.String(500), nullable=False, default="")
    paid_at = db.Column(db.DateTime(timezone=True))
    paid_method = db.Column(db.String(30), nullable=False, default="")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=now)


class RateBucket(db.Model):
    key = db.Column(db.String(100), primary_key=True)
    count = db.Column(db.Integer, nullable=False, default=0)
    expires = db.Column(db.BigInteger, nullable=False)
