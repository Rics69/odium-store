"""product instruction/faq accordion JSON + pricing variants + order.variant_label

Revision ID: 003_product_extras (≤32 chars for alembic_version)
Revises: 002_product_is_active

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "003_product_extras"
down_revision = "002_product_is_active"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "instruction_sections",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "faq_sections",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "pricing_variants",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column("orders", sa.Column("variant_label", sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "variant_label")
    op.drop_column("products", "pricing_variants")
    op.drop_column("products", "faq_sections")
    op.drop_column("products", "instruction_sections")
