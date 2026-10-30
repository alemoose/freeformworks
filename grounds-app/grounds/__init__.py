import hashlib
import os
import re
import secrets
import time
from datetime import date, datetime, timedelta
from functools import wraps
from zoneinfo import ZoneInfo
import click
from flask import (
    Flask,
    abort,
    flash,
    g,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_wtf.csrf import CSRFProtect
from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash
from .models import (
    db,
    Business,
    Owner,
    Customer,
    Lead,
    Estimate,
    Schedule,
    Job,
    RateBucket,
    now,
)
from .domain import intake, price, amount, next_visit, FREQUENCIES, SERVICES


def create_app(config=None):
    app = Flask(__name__)
    production = os.getenv("GROUNDS_ENV") == "production"
    app.config.update(
        SECRET_KEY=os.getenv("GROUNDS_SECRET_KEY"),
        SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL", "sqlite:///grounds-dev.db"),
        SESSION_COOKIE_NAME="grounds_session",
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=production,
        PERMANENT_SESSION_LIFETIME=timedelta(hours=8),
        MAX_CONTENT_LENGTH=16384,
        PRODUCTION=production,
    )
    if config:
        app.config.update(config)
    if not app.config["SECRET_KEY"] or len(app.config["SECRET_KEY"]) < 32:
        raise RuntimeError(
            "Set GROUNDS_SECRET_KEY to a random secret of at least 32 characters."
        )
    if app.config["PRODUCTION"] and not app.config[
        "SQLALCHEMY_DATABASE_URI"
    ].startswith("postgresql+psycopg://"):
        raise RuntimeError("Production requires PostgreSQL (postgresql+psycopg://).")
    db.init_app(app)
    CSRFProtect(app)

    @app.after_request
    def headers(response):
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; style-src 'self'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Cache-Control"] = "no-store"
        if app.config["PRODUCTION"]:
            response.headers["Strict-Transport-Security"] = "max-age=31536000"
        return response

    @app.before_request
    def identity():
        g.owner = (
            db.session.get(Owner, session.get("owner_id"))
            if session.get("owner_id")
            else None
        )
        g.business = db.session.get(Business, g.owner.business_id) if g.owner else None

    def private(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            if not g.owner:
                return redirect(url_for("login"))
            return fn(*args, **kwargs)

        return wrapped

    def own(model, ident, lock=False):
        query = select(model).where(
            model.id == ident, model.business_id == g.owner.business_id
        )
        if lock:
            query = query.with_for_update()
        return db.session.execute(query).scalar_one_or_none() or abort(404)

    def rows(model):
        return select(model).where(model.business_id == g.owner.business_id)

    def limited(scope, limit, seconds=3600):
        # Atomic database counters work across workers. Trust no client-supplied IP headers.
        timestamp = int(time.time())
        ip = request.remote_addr or "unknown"
        digest = hashlib.sha256((app.config["SECRET_KEY"] + ip).encode()).hexdigest()
        key = f"{scope}:{digest}:{timestamp // seconds}"
        insert = pg_insert if db.engine.dialect.name == "postgresql" else sqlite_insert
        stmt = insert(RateBucket).values(key=key, count=1, expires=timestamp + seconds)
        stmt = stmt.on_conflict_do_update(
            index_elements=["key"], set_={"count": RateBucket.count + 1}
        ).returning(RateBucket.count)
        count = db.session.execute(stmt).scalar_one()
        db.session.execute(delete(RateBucket).where(RateBucket.expires < timestamp))
        db.session.commit()
        if count > limit:
            abort(429, description="Too many attempts. Please try again later.")

    @app.route("/")
    def home():
        return redirect(url_for("dashboard") if g.owner else url_for("login"))

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            limited("login", 20, 900)
            owner = db.session.execute(
                select(Owner).where(
                    Owner.email == request.form.get("email", "").strip().lower()
                )
            ).scalar_one_or_none()
            valid = check_password_hash(
                owner.password_hash if owner else app.config["DUMMY_HASH"],
                request.form.get("password", "")[:1024],
            )
            if owner and valid:
                session.clear()
                session["owner_id"] = owner.id
                session.permanent = True
                return redirect(url_for("dashboard"))
            flash("Email or password is incorrect.", "error")
        return render_template("login.html")

    @app.post("/logout")
    def logout():
        session.clear()
        return redirect(url_for("login"))

    @app.route("/quote/<slug>", methods=["GET", "POST"])
    def quote(slug):
        business = db.session.execute(
            select(Business).where(Business.slug == slug)
        ).scalar_one_or_none() or abort(404)
        if request.method == "POST":
            limited("quote", 10)
            if request.form.get("website"):
                abort(400, description="Unable to accept this request.")
            try:
                data = intake(request.form)
                consent = data.pop("marketing_consent")
                customer = Customer(
                    business_id=business.id,
                    **{k: data.pop(k) for k in ("name", "phone", "email", "address")},
                    marketing_consent=consent,
                    consent_at=now() if consent else None,
                )
                db.session.add(customer)
                db.session.flush()
                db.session.add(
                    Lead(
                        business_id=business.id,
                        customer_id=customer.id,
                        follow_up=datetime.now(ZoneInfo(business.timezone)).date()
                        + timedelta(days=1),
                        **data,
                    )
                )
                db.session.commit()
                return redirect(url_for("thanks", slug=slug))
            except ValueError as err:
                flash(str(err), "error")
        return render_template(
            "quote.html", business=business, frequencies=FREQUENCIES, services=SERVICES
        )

    @app.get("/quote/<slug>/thanks")
    def thanks(slug):
        return render_template("thanks.html")

    @app.get("/dashboard")
    @private
    def dashboard():
        leads = db.session.scalars(rows(Lead).order_by(Lead.created_at.desc())).all()
        customers = db.session.scalars(rows(Customer).order_by(Customer.name)).all()
        estimates = db.session.scalars(
            rows(Estimate).order_by(Estimate.id.desc())
        ).all()
        jobs = db.session.scalars(
            rows(Job).where(Job.status == "scheduled").order_by(Job.date)
        ).all()
        return render_template(
            "dashboard.html",
            leads=leads,
            customers=customers,
            estimates=estimates,
            jobs=jobs,
            frequencies=FREQUENCIES,
        )

    @app.get("/customers/<int:ident>")
    @private
    def customer(ident):
        item = own(Customer, ident)
        leads = db.session.scalars(rows(Lead).where(Lead.customer_id == item.id)).all()
        return render_template("customer.html", customer=item, leads=leads)

    @app.route("/leads/<int:ident>", methods=["GET", "POST"])
    @private
    def lead(ident):
        item = own(Lead, ident)
        if request.method == "POST":
            try:
                status = request.form.get("status")
                if status not in ("new", "contacted", "qualified", "won", "lost"):
                    raise ValueError("Invalid lead status.")
                follow_up = date.fromisoformat(request.form.get("follow_up", ""))
                draft = request.form.get("draft", "").strip()
                if len(draft) > 4000:
                    raise ValueError("Draft must be under 4,000 characters.")
                item.status, item.follow_up, item.draft = status, follow_up, draft
                db.session.commit()
                flash("Lead updated. No message was sent.", "success")
                return redirect(url_for("lead", ident=ident))
            except ValueError as err:
                flash(str(err), "error")
        estimates = db.session.scalars(
            rows(Estimate).where(Estimate.lead_id == item.id)
        ).all()
        return render_template(
            "lead.html", lead=item, estimates=estimates, frequencies=FREQUENCIES
        )

    @app.post("/leads/<int:ident>/estimate")
    @private
    def estimate(ident):
        item = own(Lead, ident)
        try:
            if item.service != "Lawn mowing":
                raise ValueError(
                    "The lawn calculator supports mowing only; other services need a separate estimating workflow."
                )
            breakdown, total = price(
                g.business.pricing,
                request.form.get("area", ""),
                request.form.get("difficulty"),
                item.frequency,
                request.form.get("adjustment", "0"),
            )
            note = request.form.get("adjustment_note", "").strip()
            if len(note) > 400 or (
                breakdown["manual_adjustment"] != "0.00" and not note
            ):
                raise ValueError(
                    "Explain manual adjustments in 400 characters or fewer."
                )
            db.session.add(
                Estimate(
                    business_id=g.owner.business_id,
                    lead_id=item.id,
                    breakdown=breakdown,
                    total_cents=total,
                    adjustment_note=note,
                )
            )
            db.session.commit()
            flash("Estimate saved for owner approval.", "success")
        except ValueError as err:
            flash(str(err), "error")
        return redirect(url_for("lead", ident=ident))

    @app.post("/estimates/<int:ident>/status")
    @private
    def estimate_status(ident):
        item = own(Estimate, ident, True)
        target = request.form.get("status")
        transitions = {
            "pending_approval": ("approved", "declined"),
            "approved": ("awaiting_decision", "declined"),
            "awaiting_decision": ("accepted", "declined"),
        }
        if target not in transitions.get(item.status, ()):
            abort(
                400,
                description="Invalid estimate transition. Owner approval must come first.",
            )
        item.status = target
        db.session.commit()
        flash(
            "Status recorded. Share approved quotes manually; no message was sent.",
            "success",
        )
        return redirect(url_for("lead", ident=item.lead_id))

    @app.post("/estimates/<int:ident>/schedule")
    @private
    def schedule(ident):
        item = own(Estimate, ident, True)
        if item.status != "accepted":
            abort(400, description="Record customer acceptance before scheduling.")
        try:
            start = date.fromisoformat(request.form.get("date", ""))
            if start < datetime.now(ZoneInfo(g.business.timezone)).date():
                raise ValueError("Choose today or a future date.")
            frequency = request.form.get("frequency")
            if frequency not in FREQUENCIES:
                raise ValueError("Choose a valid frequency.")
            existing = db.session.scalar(
                select(Schedule).where(Schedule.estimate_id == item.id)
            )
            if not existing:
                recurring = Schedule(
                    business_id=g.owner.business_id,
                    estimate_id=item.id,
                    frequency=frequency,
                    anchor_day=start.day,
                )
                db.session.add(recurring)
                db.session.flush()
                db.session.add(
                    Job(
                        business_id=g.owner.business_id,
                        schedule_id=recurring.id,
                        date=start,
                    )
                )
                item.lead.status = "won"
                db.session.commit()
            flash("Job scheduled.", "success")
        except ValueError as err:
            flash(str(err), "error")
        return redirect(url_for("dashboard"))

    @app.post("/jobs/<int:ident>/complete")
    @private
    def complete(ident):
        item = own(Job, ident)
        recurring = own(Schedule, item.schedule_id, True)
        changed = db.session.execute(
            update(Job)
            .where(
                Job.id == ident,
                Job.business_id == g.owner.business_id,
                Job.status == "scheduled",
            )
            .values(status="complete")
        ).rowcount
        if changed and recurring.active:
            following = next_visit(item.date, recurring.frequency, recurring.anchor_day)
            if following:
                db.session.add(
                    Job(
                        business_id=g.owner.business_id,
                        schedule_id=recurring.id,
                        date=following,
                    )
                )
            else:
                recurring.active = False
        db.session.commit()
        return redirect(url_for("dashboard"))

    @app.post("/schedules/<int:ident>")
    @private
    def edit_schedule(ident):
        recurring = own(Schedule, ident, True)
        try:
            if request.form.get("action") == "cancel":
                recurring.active = False
                db.session.execute(
                    update(Job)
                    .where(Job.schedule_id == ident, Job.status == "scheduled")
                    .values(status="cancelled")
                )
            else:
                frequency = request.form.get("frequency")
                day = date.fromisoformat(request.form.get("date", ""))
                if (
                    frequency not in FREQUENCIES
                    or day < datetime.now(ZoneInfo(g.business.timezone)).date()
                ):
                    raise ValueError("Choose a valid frequency and future date.")
                pending = db.session.scalar(
                    select(Job).where(
                        Job.schedule_id == ident, Job.status == "scheduled"
                    )
                )
                if not pending:
                    raise ValueError("No upcoming visit to edit.")
                pending.date = day
                recurring.frequency, recurring.anchor_day = frequency, day.day
            db.session.commit()
            flash("Schedule updated.", "success")
        except (ValueError, IntegrityError):
            db.session.rollback()
            flash("Invalid schedule or a visit already exists on that date.", "error")
        return redirect(url_for("dashboard"))

    @app.route("/settings", methods=["GET", "POST"])
    @private
    def settings():
        if request.method == "POST":
            try:
                pricing = {
                    key: str(amount(request.form.get(key, "")))
                    for key in g.business.pricing
                }
                g.business.pricing = pricing
                db.session.commit()
                flash(
                    "Pricing saved. Existing estimates retain their original breakdown.",
                    "success",
                )
            except ValueError as err:
                flash(str(err), "error")
        return render_template("settings.html")

    @app.cli.command("create-owner")
    @click.option("--business", prompt=True)
    @click.option("--slug", prompt=True)
    @click.option("--email", prompt=True)
    @click.option("--timezone", default="America/Chicago")
    @click.password_option()
    def create_owner(business, slug, email, timezone, password):
        if len(password) < 12 or len(password) > 1024:
            raise click.ClickException("Use a password of 12–1024 characters.")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug) or len(slug) > 80:
            raise click.ClickException("Use a short lowercase URL slug.")
        if (
            not business.strip()
            or len(business) > 120
            or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email)
            or len(email) > 254
        ):
            raise click.ClickException("Invalid business name or email.")
        try:
            ZoneInfo(timezone)
        except Exception:
            raise click.ClickException("Invalid IANA timezone.")
        tenant = Business(name=business, slug=slug, timezone=timezone)
        db.session.add(tenant)
        try:
            db.session.flush()
            db.session.add(
                Owner(
                    business_id=tenant.id,
                    email=email.strip().lower(),
                    password_hash=generate_password_hash(password),
                )
            )
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            raise click.ClickException("Email or business slug already exists.")
        click.echo(f"Owner created. Public intake path: /quote/{slug}")

    app.config["DUMMY_HASH"] = generate_password_hash(secrets.token_urlsafe(32))
    return app
