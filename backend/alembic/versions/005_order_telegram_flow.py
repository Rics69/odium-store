"""order processing status, post-payment submitted payload

Revision ID: 005_order_telegram_flow
Revises: 004_instr_postpay

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "005_order_telegram_flow"
down_revision = "004_instr_postpay"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        # Новое значение ENUM доступно только после COMMIT — один блок с autocommit.
        with op.get_context().autocommit_block():
            op.execute(
                sa.text(
                    """
                    DO $block$
                    BEGIN
                      IF NOT EXISTS (
                        SELECT 1
                        FROM pg_enum e
                        JOIN pg_type t ON e.enumtypid = t.oid
                        WHERE t.typname = 'orderstatus'
                          AND e.enumlabel = 'processing'
                      ) THEN
                        ALTER TYPE orderstatus ADD VALUE 'processing';
                      END IF;
                    END
                    $block$;
                    """
                )
            )

    op.execute(
        sa.text(
            """
            UPDATE orders o
            SET status = 'processing'::orderstatus
            FROM products p
            WHERE o.product_id = p.id
              AND o.status = 'paid'::orderstatus
              AND p.fulfillment = 'manual'::fulfillmenttype
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE orders o
            SET status = 'fulfilled'::orderstatus
            FROM products p
            WHERE o.product_id = p.id
              AND o.status = 'paid'::orderstatus
              AND p.fulfillment = 'automated'::fulfillmenttype
            """
        )
    )

    op.add_column(
        "orders",
        sa.Column(
            "post_payment_submitted",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("orders", "post_payment_submitted")
    op.execute(
        sa.text(
            """
            UPDATE orders SET status = 'paid'::orderstatus
            WHERE status = 'processing'::orderstatus
            """
        )
    )
    # Оставшийся enum-значок 'processing' в PostgreSQL удалить безопасно нельзя в общем случае.
