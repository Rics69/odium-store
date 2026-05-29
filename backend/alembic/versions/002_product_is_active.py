"""product is_active for soft retire from storefront

Revision ID: 002_product_is_active
Revises: 001_initial
Create Date: 2026-05-09

"""

from alembic import op
import sqlalchemy as sa

revision = "002_product_is_active"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )


def downgrade() -> None:
    op.drop_column("products", "is_active")
