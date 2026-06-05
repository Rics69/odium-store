"""steam commission default 10%

Revision ID: 009_steam_commission_10
Revises: 008_automated_delivery_urls
"""

from alembic import op
import sqlalchemy as sa

revision = "009_steam_commission_10"
down_revision = "008_automated_delivery_urls"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "UPDATE products SET steam_commission_percent = 10 WHERE steam_commission_percent = 20"
        )
    )
    op.alter_column(
        "products",
        "steam_commission_percent",
        server_default="10",
    )


def downgrade() -> None:
    conn = op.get_bind()
    op.alter_column(
        "products",
        "steam_commission_percent",
        server_default="20",
    )
    conn.execute(
        sa.text(
            "UPDATE products SET steam_commission_percent = 20 WHERE steam_commission_percent = 10"
        )
    )
