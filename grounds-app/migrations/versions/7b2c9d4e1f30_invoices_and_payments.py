"""Invoices and payment accounts"""

from alembic import op
import sqlalchemy as sa

revision = "7b2c9d4e1f30"
down_revision = "190301fadae1"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "payment_account",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False),
        sa.Column("secret_enc", sa.Text(), nullable=False),
        sa.Column("secret_hint", sa.String(length=8), nullable=False),
        sa.Column("webhook_secret_enc", sa.Text(), nullable=False),
        sa.Column("square_location_id", sa.String(length=64), nullable=False),
        sa.Column("sandbox", sa.Boolean(), nullable=False),
        sa.Column("instructions", sa.String(length=400), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["business.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id"),
    )
    op.create_table(
        "invoice",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("job_id", sa.Integer(), nullable=True),
        sa.Column("estimate_id", sa.Integer(), nullable=True),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("description", sa.String(length=200), nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False),
        sa.Column("link_id", sa.String(length=120), nullable=False),
        sa.Column("order_id", sa.String(length=120), nullable=False),
        sa.Column("pay_url", sa.String(length=500), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_method", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["business.id"]),
        sa.ForeignKeyConstraint(["customer_id"], ["customer.id"]),
        sa.ForeignKeyConstraint(["job_id"], ["job.id"]),
        sa.ForeignKeyConstraint(["estimate_id"], ["estimate.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("job_id"),
        sa.UniqueConstraint("estimate_id"),
    )
    op.create_index("ix_invoice_business_id", "invoice", ["business_id"])
    op.create_index("ix_invoice_link_id", "invoice", ["link_id"])
    op.create_index("ix_invoice_order_id", "invoice", ["order_id"])


def downgrade():
    op.drop_index("ix_invoice_order_id", table_name="invoice")
    op.drop_index("ix_invoice_link_id", table_name="invoice")
    op.drop_index("ix_invoice_business_id", table_name="invoice")
    op.drop_table("invoice")
    op.drop_table("payment_account")
