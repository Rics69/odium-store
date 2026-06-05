"""automated delivery urls as jsonb list

Revision ID: 008_automated_delivery_urls
Revises: 007_order_number_automated_url
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "008_automated_delivery_urls"
down_revision = "007_order_number_automated_url"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "automated_delivery_urls",
            postgresql.JSONB(),
            nullable=False,
            server_default="[]",
        ),
    )
    op.add_column(
        "orders",
        sa.Column(
            "automated_delivery_urls",
            postgresql.JSONB(),
            nullable=False,
            server_default="[]",
        ),
    )

    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE products
            SET automated_delivery_urls = jsonb_build_array(automated_delivery_url)
            WHERE automated_delivery_url IS NOT NULL
              AND btrim(automated_delivery_url) <> ''
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE orders
            SET automated_delivery_urls = jsonb_build_array(automated_delivery_url)
            WHERE automated_delivery_url IS NOT NULL
              AND btrim(automated_delivery_url) <> ''
            """
        )
    )

    op.drop_column("products", "automated_delivery_url")
    op.drop_column("orders", "automated_delivery_url")


def downgrade() -> None:
    op.add_column(
        "products",
        sa.Column("automated_delivery_url", sa.String(2048), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("automated_delivery_url", sa.String(2048), nullable=True),
    )

    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE products
            SET automated_delivery_url = automated_delivery_urls->>0
            WHERE jsonb_array_length(automated_delivery_urls) > 0
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE orders
            SET automated_delivery_url = automated_delivery_urls->>0
            WHERE jsonb_array_length(automated_delivery_urls) > 0
            """
        )
    )

    op.drop_column("products", "automated_delivery_urls")
    op.drop_column("orders", "automated_delivery_urls")
