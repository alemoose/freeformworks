import os
import re
from datetime import date, timedelta
from concurrent.futures import ThreadPoolExecutor
import pytest
from sqlalchemy import select
from werkzeug.security import generate_password_hash
from grounds import create_app
from grounds.models import db, Business, Owner, Customer, Lead, Job
from grounds.domain import intake, price, next_visit


@pytest.fixture
def app(tmp_path):
    app = create_app(
        {
            "TESTING": True,
            "SECRET_KEY": "test-only-secret-at-least-32-characters",
            "SQLALCHEMY_DATABASE_URI": os.getenv(
                "TEST_DATABASE_URL", f"sqlite:///{tmp_path}/test.db"
            ),
        }
    )
    with app.app_context():
        db.drop_all()
        db.create_all()
        for slug in ["alpha", "beta"]:
            b = Business(name=slug, slug=slug)
            db.session.add(b)
            db.session.flush()
            db.session.add(
                Owner(
                    business_id=b.id,
                    email=f"{slug}@example.com",
                    password_hash=generate_password_hash("correct-password"),
                )
            )
        db.session.commit()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def post(c, path, data=None, page="/login"):
    token = (
        re.search(rb'name="csrf_token" value="([^"]+)"', c.get(page).data)
        .group(1)
        .decode()
    )
    return c.post(path, data={**(data or {}), "csrf_token": token})


def login(c, tenant="alpha"):
    assert (
        post(
            c,
            "/login",
            {"email": f"{tenant}@example.com", "password": "correct-password"},
        ).status_code
        == 302
    )


def quote(c):
    return post(
        c,
        "/quote/alpha",
        dict(
            name="Jane Example",
            phone="5551234567",
            email="jane@example.com",
            address="10 Sample Lane",
            service="Lawn mowing",
            frequency="weekly",
            area="4000",
            notes="<script>alert(1)</script>",
        ),
        "/quote/alpha",
    )


def estimate(c):
    assert quote(c).status_code == 302
    login(c)
    assert (
        post(
            c, "/leads/1/estimate", dict(area="4000", difficulty="easy", adjustment="0")
        ).status_code
        == 302
    )


def schedule(c):
    for s in ["approved", "awaiting_decision", "accepted"]:
        assert post(c, "/estimates/1/status", {"status": s}).status_code == 302
    for _ in range(2):
        assert (
            post(
                c,
                "/estimates/1/schedule",
                {
                    "date": (date.today() + timedelta(days=3)).isoformat(),
                    "frequency": "weekly",
                },
            ).status_code
            == 302
        )


def test_validation():
    base = dict(
        name="A",
        phone="5551234567",
        address="Test",
        service="Lawn mowing",
        frequency="weekly",
    )
    assert intake(base)["area"] is None and not intake(base)["marketing_consent"]
    assert intake(base | {"marketing_consent": "yes"})["marketing_consent"]
    for v in [
        {"name": ""},
        {"phone": "bad"},
        {"email": "a@"},
        {"frequency": "daily"},
        {"area": "nan"},
        {"area": "-1"},
        {"area": "10000001"},
        {"notes": "x" * 2001},
    ]:
        with pytest.raises(ValueError):
            intake(base | v)


def test_pricing():
    s = dict(
        base="20",
        minimum="40",
        per_thousand="5",
        easy="0",
        moderate="10",
        hard="25",
        once="10",
        weekly="0",
        biweekly="5",
        monthly="15",
    )
    assert price(s, "1000", "easy", "weekly")[1] == 4000
    assert price(s, "4500", "hard", "biweekly", "-2.50")[1] == 7000
    assert price(s, "1001", "easy", "once")[0]["area_cost"] == "5.01"
    for v in ["NaN", "Infinity", "-100000"]:
        with pytest.raises(ValueError):
            price(s, "1000", "easy", "weekly", v)


@pytest.mark.parametrize(
    "day,freq,result",
    [
        ("2028-02-25", "weekly", "2028-03-03"),
        ("2026-12-25", "biweekly", "2027-01-08"),
        ("2028-01-31", "monthly", "2028-02-29"),
        ("2027-01-31", "monthly", "2027-02-28"),
        ("2026-12-31", "monthly", "2027-01-31"),
    ],
)
def test_dates(day, freq, result):
    assert next_visit(date.fromisoformat(day), freq).isoformat() == result
    assert next_visit(date.fromisoformat(day), "once") is None
    assert next_visit(date(2027, 2, 28), "monthly", 31) == date(2027, 3, 31)


def test_auth(client):
    assert client.get("/dashboard").status_code == 302
    assert (
        client.post(
            "/login",
            data={"email": "alpha@example.com", "password": "correct-password"},
        ).status_code
        == 400
    )
    assert (
        post(
            client, "/login", {"email": "alpha@example.com", "password": "wrong"}
        ).status_code
        == 200
    )
    assert client.get("/dashboard").status_code == 302
    login(client)
    r = client.get("/dashboard")
    assert r.status_code == 200 and b"Room to grow" in r.data
    assert "frame-ancestors 'none'" in r.headers["Content-Security-Policy"]
    post(client, "/logout")
    assert client.get("/dashboard").status_code == 302


def test_persistence(client, app):
    quote(client)
    with app.app_context():
        c = db.session.scalar(select(Customer))
        assert c.name == "Jane Example" and not c.marketing_consent
        assert db.session.scalar(select(Lead)).area == 4000
    assert client.get("/customers/1").status_code == 302
    login(client)
    for path in ["/customers/1", "/leads/1", "/settings"]:
        assert client.get(path).status_code == 200
    assert b"&lt;script&gt;" in client.get("/leads/1").data
    assert b"<script>alert" not in client.get("/leads/1").data


def test_workflow_and_retry(client, app):
    estimate(client)
    assert (
        post(client, "/estimates/1/status", {"status": "accepted"}).status_code == 400
    )
    assert post(client, "/estimates/1/schedule").status_code == 400
    schedule(client)
    for _ in range(2):
        assert post(client, "/jobs/1/complete").status_code == 302
    with app.app_context():
        jobs = db.session.scalars(select(Job).order_by(Job.id)).all()
        assert len(jobs) == 2 and jobs[0].status == "complete"
        assert jobs[1].date == jobs[0].date + timedelta(days=7)
        assert db.session.scalar(select(Lead)).status == "won"
    assert client.get("/dashboard").status_code == 200
    assert client.get("/leads/1").status_code == 200
    day = (date.today() + timedelta(days=15)).isoformat()
    post(client, "/schedules/1", dict(action="edit", date=day, frequency="monthly"))
    with app.app_context():
        assert db.session.get(Job, 2).date.isoformat() == day
    post(client, "/schedules/1", {"action": "cancel"})
    post(client, "/jobs/2/complete")
    with app.app_context():
        assert (
            db.session.get(Job, 2).status == "cancelled"
            and len(db.session.scalars(select(Job)).all()) == 2
        )


def test_isolation(client, app):
    estimate(client)
    schedule(client)
    post(client, "/logout")
    login(client, "beta")
    assert b"Jane Example" not in client.get("/dashboard").data
    for path in ["/customers/1", "/leads/1"]:
        assert client.get(path).status_code == 404
    for path in [
        "/leads/1",
        "/leads/1/estimate",
        "/estimates/1/status",
        "/estimates/1/schedule",
        "/jobs/1/complete",
        "/schedules/1",
    ]:
        assert post(client, path, {"status": "approved"}).status_code == 404
    with app.app_context():
        assert db.session.get(Job, 1).status == "scheduled"


def test_spam(client, app):
    assert (
        post(client, "/quote/alpha", {"name": "Incomplete"}, "/quote/alpha").status_code
        == 200
    )
    assert (
        post(client, "/quote/alpha", {"website": "spam"}, "/quote/alpha").status_code
        == 400
    )
    for _ in range(8):
        quote(client)
    assert quote(client).status_code == 429
    with app.app_context():
        assert len(db.session.scalars(select(Customer)).all()) == 8


def test_production_requires_postgres():
    with pytest.raises(RuntimeError, match="PostgreSQL"):
        create_app(
            {
                "SECRET_KEY": "x" * 40,
                "PRODUCTION": True,
                "SQLALCHEMY_DATABASE_URI": "sqlite://",
            }
        )


def test_concurrent_completion(client, app):
    if not os.getenv("TEST_DATABASE_URL", "").startswith("postgresql"):
        pytest.skip("Requires PostgreSQL")
    estimate(client)
    schedule(client)

    def finish(_):
        c = app.test_client()
        login(c)
        return post(c, "/jobs/1/complete").status_code

    with ThreadPoolExecutor(max_workers=4) as pool:
        assert list(pool.map(finish, range(4))) == [302] * 4
    with app.app_context():
        assert len(db.session.scalars(select(Job)).all()) == 2
