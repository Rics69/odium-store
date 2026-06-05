"""order number and automated delivery url

Revision ID: 007_order_number_automated_url
Revises: 006_steam_topup_review_tags
"""

from alembic import op
import sqlalchemy as sa

revision = "007_order_number_automated_url"
down_revision = "006_steam_topup_review_tags"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 100001"))

    op.add_column("orders", sa.Column("order_number", sa.String(20), nullable=True))
    op.add_column(
        "products",
        sa.Column("automated_delivery_url", sa.String(2048), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("automated_delivery_url", sa.String(2048), nullable=True),
    )

    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT id FROM orders ORDER BY id ASC")
    ).fetchall()
    for i, row in enumerate(rows):
        num = 100001 + i
        conn.execute(
            sa.text("UPDATE orders SET order_number = :num WHERE id = :id"),
            {"num": str(num), "id": row[0]},
        )
    if rows:
        conn.execute(
            sa.text(
                "SELECT setval('order_number_seq', :next, false)"
            ),
            {"next": 100001 + len(rows)},
        )

    op.alter_column("orders", "order_number", nullable=False)
    op.create_index("ix_orders_order_number", "orders", ["order_number"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_orders_order_number", table_name="orders")
    op.drop_column("orders", "automated_delivery_url")
    op.drop_column("products", "automated_delivery_url")
    op.drop_column("orders", "order_number")
    op.execute(sa.text("DROP SEQUENCE IF EXISTS order_number_seq"))
