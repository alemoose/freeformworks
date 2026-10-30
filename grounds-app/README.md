# Freeform Grounds

Independent, server-rendered Flask MVP for landscaping companies. The agency's HTML, assets, and Google Calendar endpoints remain unchanged. `/grounds` is a public static marketing page; this directory is the separately deployed owner application and is excluded from the agency's Vercel upload.

## Structure

- `../grounds/`: public landing page, illustrative pricing, explicitly fictional preview.
- `grounds/models.py`: tenant data, pricing snapshots, schedules, jobs, and shared rate-limit counters.
- `grounds/domain.py`: decimal-based lawn pricing, input validation, calendar recurrence.
- `grounds/__init__.py`: authentication, tenant-scoped routes, transactional workflow.
- `grounds/templates/`, `grounds/static/`: responsive, accessible HTML/CSS; no JavaScript dependency.
- `migrations/`: Alembic schema history. Never use automatic table creation in production.
- `tests/`: validation, authentication, authorization, persistence, pricing, recurrence and full workflow tests.

## Local development

Requires Python 3.12+, pip, and optionally PostgreSQL 16. No Google Calendar or Vercel credentials are needed.

```bash
cd grounds-app
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
export GROUNDS_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
export DATABASE_URL='sqlite:////tmp/grounds-local.db'
alembic upgrade head
flask --app grounds create-owner
flask --app grounds run --host 127.0.0.1 --port 8000
```

`create-owner` prompts for business name, unique lowercase slug, owner email, and a hidden password (12+ characters). One owner/business is provisioned by this command. Use a strong unique password. It does not create demo credentials or seed customer data. Sign in at `/login`; share `/quote/YOUR-SLUG` with customers. To keep SQLite data across machine restarts, choose a durable local path. SQLite is for local development/tests only; **production refuses SQLite**. Existing cloud tasks should use the existing checkout, not a new worktree.

For the agency site, from the repository root run `python3 -m http.server 8080`; the static landing page is at `/grounds/`. Production Vercel routes `/grounds` to its index. This static server does not run booking APIs or the Grounds application.

### Environment

| Variable | Purpose |
| --- | --- |
| `GROUNDS_SECRET_KEY` | Required random secret, 32+ characters; stable across workers/restarts. Use a secret manager. Rotation signs out every user. |
| `DATABASE_URL` | `postgresql+psycopg://...` in production; SQLite default only in development. Keep credentials private. |
| `GROUNDS_ENV` | Set `production` to enforce PostgreSQL, secure session cookies and HSTS. |
| `TEST_DATABASE_URL` | Optional dedicated disposable PostgreSQL test database. **Tests delete all application tables. Never point at production.** |

`.env.example` documents names; the app does not automatically load `.env`. Export variables in your shell or inject them through your hosting provider. Use different secrets and databases for development, tests, staging, and production. Do not commit populated environment files.

## Authentication and security

Owner accounts are administrator-provisioned, not public self-signup. Passwords use Werkzeug scrypt hashes. Signed, HTTP-only, SameSite=Lax sessions expire after eight hours; production cookies require HTTPS. Every private route authenticates and scopes record lookup by the logged-in owner's business. Form mutations require CSRF tokens, including login and public intake. Templates escape user input. CSP blocks scripts and framing. No public customer lookup or estimate-sharing endpoint exists.

Intake has field size/type checks, body size limits, a honeypot, and a shared atomic database limit of 10 submissions per IP/hour. Login is limited to 20 attempts per IP/15 minutes. Counters store salted IP hashes and expire. The application deliberately ignores forwarded IP headers. Behind a proxy, configure trusted client addressing at the hosting layer; otherwise users behind that proxy share a conservative quota. Do not blindly trust `X-Forwarded-For`. Add edge bot protection for an internet-facing launch.

Marketing consent is optional, separate from the request, and stored with a timestamp. No SMS, emails, calendar invitations, or marketing sends occur. Production operators must define their privacy notice, retention/deletion policy, backup policy, and applicable marketing-consent wording before collecting real customer data. Self-service password resets, MFA, team roles, and audit history are deferred. Administrator account recovery should happen through a controlled operational procedure; do not email passwords.

## Workflow

1. Customer submits a business-specific quote form; a customer and lead are saved together.
2. Owner reviews the inbox, updates lead status and follow-up date, and writes a message draft.
3. For mowing, enter **estimated mowable lawn area**, choose difficulty, and optionally add a signed manual adjustment with a reason.
4. Price = `max(minimum, base + area / 1000 × rate + difficulty + frequency surcharge) + adjustment`. Decimal arithmetic rounds monetary components to cents. Prices use USD. Other services can be captured as leads but the lawn calculator does not price them.
5. Estimate snapshots preserve their original breakdown when settings change. Owner approves, then records manual sharing, then customer acceptance. No automatic sending or customer-signature claim.
6. Accepted estimates can become one-time, weekly, biweekly, or monthly jobs. Repeated schedule creation does not create duplicate schedules.
7. Completing a scheduled job atomically changes its status and creates one successor. A schedule lock, conditional update, and unique `(schedule_id, date)` constraint prevent retry/concurrency duplicates on PostgreSQL. Cancellation and editing use the same schedule lock.

Jobs use business-local **date-only** visits, not UTC appointments. The business has an IANA time zone. Recurrence follows the previous scheduled date, even for late completion; overdue successors remain visible. Monthly recurrence preserves the original day anchor (Jan 31 → Feb 28/29 → Mar 31). Owners can edit the next date/frequency or cancel remaining visits. No time-of-day scheduling, route optimization, or external calendar sync is claimed.

## Tests and migrations

```bash
python -m pytest -q
# Optional: isolated PostgreSQL database; test suite is destructive to this database.
TEST_DATABASE_URL='postgresql+psycopg://USER:PASS@localhost/grounds_test' python -m pytest -q
alembic upgrade head
alembic check
```

SQLite tests skip only the PostgreSQL concurrency test. PostgreSQL runs all tests, including four concurrent completion attempts. Migrations must run before starting the app. Back up production before schema changes; review generated revisions. Test downgrade/upgrade on disposable data, never use downgrade as a production rollback without a recovery plan.

## Deployment (no deployment performed)

Deploy this directory independently on a Python/container host such as Render, Fly.io, or a managed container platform, with managed PostgreSQL. Do not place a SQLite database in Vercel serverless storage.

1. Provision PostgreSQL and backups; configure a least-privilege application database role. Use provider-required TLS and certificate verification.
2. Set `GROUNDS_ENV=production`, `GROUNDS_SECRET_KEY`, and `DATABASE_URL` in the host's secret configuration.
3. Build using `Dockerfile`, or install `requirements.txt`. Run `alembic upgrade head` once as a release step, with the same environment.
4. Provision an owner using the CLI in an authenticated administration session.
5. Run `gunicorn --bind 0.0.0.0:8000 --workers 2 'grounds:create_app()'` behind HTTPS. Configure trusted proxy/client addressing and edge abuse protection. Readiness can request `/login` (which queries the database for an existing session).
6. Point `app.freeformworks.com` at that host when explicitly approved. The agency's Vercel project retains its existing booking setup and only gains `/grounds`; no production app URL is assumed yet.
7. Verify login, public intake, tenant isolation, approved estimate → job, restart persistence, and backup restoration on staging before accepting customers.

No billing is implemented. Pricing tiers are illustrative; landing-page calls to action open an early-access inquiry email. Website generation, AI measurements, licensed measurement providers, SMS assistants, automatic lead qualification, crew coordination, offline access, and automated communications are deferred. A future licensed measurement adapter can supply a verified area to `domain.price`; it must preserve provenance and owner review, and must not substitute property lot size for mowable area.

## Validation performed for this MVP

- PostgreSQL 16: 14 tests passed, including concurrent completion and tenant isolation.
- SQLite: 13 tests passed; PostgreSQL-only concurrency test skipped.
- PostgreSQL migration upgrade → schema drift check → downgrade → upgrade passed.
- Gunicorn with two workers served the login, intake, and stylesheet successfully.
- Chromium at 390px and 1440px: landing page had no horizontal overflow. Mobile intake → login → approval → scheduling → completion produced the expected next weekly visit. No browser script errors occurred.
- Python lint and repository whitespace checks passed. Existing agency/booking source files and npm dependencies were not changed.

Managed production hosting, DNS, production database credentials, and deployment have not been configured or tested. No deployment or merge was performed.
