"""steam top-up product type, review tags, order steam deposit

Revision ID: 006_steam_topup_review_tags
Revises: 005_order_telegram_flow
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "006_steam_topup_review_tags"
down_revision = "005_order_telegram_flow"
branch_labels = None
depends_on = None


def upgrade() -> None:
    postgresql.ENUM("standard", "steam_topup", name="producttype").create(
        op.get_bind(), checkfirst=True
    )
    producttype_col = postgresql.ENUM(
        "standard", "steam_topup", name="producttype", create_type=False
    )

    op.add_column(
        "products",
        sa.Column(
            "product_type",
            producttype_col,
            nullable=False,
            server_default="standard",
        ),
    )
    op.add_column(
        "products",
        sa.Column("steam_commission_percent", sa.Numeric(5, 2), nullable=False, server_default="20"),
    )
    op.add_column(
        "products",
        sa.Column("steam_usd_to_rub", sa.Numeric(12, 4), nullable=False, server_default="92"),
    )
    op.add_column(
        "products",
        sa.Column("steam_kzt_to_rub", sa.Numeric(12, 6), nullable=False, server_default="0.2"),
    )

    op.add_column("reviews", sa.Column("tags", postgresql.JSONB(), nullable=False, server_default="[]"))

    op.add_column("orders", sa.Column("steam_deposit_amount", sa.Numeric(12, 2), nullable=True))
    op.add_column("orders", sa.Column("steam_deposit_currency", sa.String(10), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "steam_deposit_currency")
    op.drop_column("orders", "steam_deposit_amount")
    op.drop_column("reviews", "tags")
    op.drop_column("products", "steam_kzt_to_rub")
    op.drop_column("products", "steam_usd_to_rub")
    op.drop_column("products", "steam_commission_percent")
    op.drop_column("products", "product_type")
    postgresql.ENUM(name="producttype").drop(op.get_bind(), checkfirst=True)
