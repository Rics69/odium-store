"""instruction title+body; post_payment_fields; order snapshot

Revision ID: 004_instr_postpay
Revises: 003_product_extras

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004_instr_postpay"
down_revision = "003_product_extras"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "instruction_title",
            sa.String(length=400),
            nullable=False,
            server_default="",
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "instruction_body",
            sa.Text(),
            nullable=False,
            server_default="",
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "post_payment_fields",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )

    conn = op.get_bind()
    dialect = conn.dialect.name
    if dialect == "postgresql":
        op.execute(
            sa.text(
                """
                UPDATE products
                SET
                  instruction_title = COALESCE(NULLIF(trim(instruction_sections->0->>'title'), ''), ''),
                  instruction_body = COALESCE(NULLIF(trim(instruction_sections->0->>'content'), ''), '')
                WHERE instruction_sections IS NOT NULL
                  AND jsonb_typeof(instruction_sections) = 'array'
                  AND jsonb_array_length(instruction_sections) > 0
                """
            )
        )

    op.drop_column("products", "instruction_sections")

    op.add_column(
        "orders",
        sa.Column(
            "post_payment_snapshot",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )


def downgrade() -> None:
    op.drop_column("orders", "post_payment_snapshot")

    op.add_column(
        "products",
        sa.Column(
            "instruction_sections",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.execute(
        sa.text(
            """
            UPDATE products
            SET instruction_sections = CASE
              WHEN instruction_title <> '' OR instruction_body <> ''
              THEN jsonb_build_array(
                jsonb_build_object('title', instruction_title, 'content', instruction_body)
              )
              ELSE '[]'::jsonb
            END
            """
        )
    )
    op.drop_column("products", "post_payment_fields")
    op.drop_column("products", "instruction_body")
    op.drop_column("products", "instruction_title")
