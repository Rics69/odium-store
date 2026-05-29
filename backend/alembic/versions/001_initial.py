"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-05-09

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # Типы создаём один раз; в колонках create_type=False, иначе SQLAlchemy создаёт их второй раз.
    postgresql.ENUM("user", "admin", name="userrole").create(op.get_bind(), checkfirst=True)
    postgresql.ENUM("manual", "automated", name="fulfillmenttype").create(
        op.get_bind(), checkfirst=True
    )
    postgresql.ENUM(
        "pending_payment",
        "paid",
        "fulfilled",
        "cancelled",
        name="orderstatus",
    ).create(op.get_bind(), checkfirst=True)
    postgresql.ENUM("text", "email", "password", name="inputfieldtype").create(
        op.get_bind(), checkfirst=True
    )

    userrole_col = postgresql.ENUM(
        "user", "admin", name="userrole", create_type=False
    )
    fulfillment_col = postgresql.ENUM(
        "manual", "automated", name="fulfillmenttype", create_type=False
    )
    orderstatus_col = postgresql.ENUM(
        "pending_payment",
        "paid",
        "fulfilled",
        "cancelled",
        name="orderstatus",
        create_type=False,
    )
    inputfield_col = postgresql.ENUM(
        "text", "email", "password", name="inputfieldtype", create_type=False
    )

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("avatar_url", sa.String(length=1024), nullable=True),
        sa.Column("role", userrole_col, nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.create_table(
        "products",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("old_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("fulfillment", fulfillment_col, nullable=False),
        sa.Column("is_published", sa.Boolean(), nullable=False),
        sa.Column("purchase_count", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_products_slug"), "products", ["slug"], unique=False)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_products_title_trgm ON products USING gin (title gin_trgm_ops)"
    )

    op.create_table(
        "homepage_sections",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )

    op.create_table(
        "product_images",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_product_images_product_id"), "product_images", ["product_id"])

    op.create_table(
        "product_input_fields",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("field_key", sa.String(length=80), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column("field_type", inputfield_col, nullable=False),
        sa.Column("required", sa.Boolean(), nullable=False),
        sa.Column("placeholder", sa.String(length=300), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_product_input_fields_product_id"),
        "product_input_fields",
        ["product_id"],
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("status", orderstatus_col, nullable=False),
        sa.Column("price_at_purchase", sa.Numeric(12, 2), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_orders_product_id"), "orders", ["product_id"])
    op.create_index(op.f("ix_orders_user_id"), "orders", ["user_id"])

    op.create_table(
        "order_input_values",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("field_key", sa.String(length=80), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_order_input_values_order_id"),
        "order_input_values",
        ["order_id"],
    )

    op.create_table(
        "reviews",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("order_id", sa.UUID(), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_review_user_product"),
    )
    op.create_index(op.f("ix_reviews_product_id"), "reviews", ["product_id"])
    op.create_index(op.f("ix_reviews_user_id"), "reviews", ["user_id"])

    op.create_table(
        "section_products",
        sa.Column("section_id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["section_id"],
            ["homepage_sections.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("section_id", "product_id"),
    )


def downgrade() -> None:
    op.drop_table("section_products")
    op.drop_table("reviews")
    op.drop_table("order_input_values")
    op.drop_table("orders")
    op.drop_table("product_input_fields")
    op.drop_table("product_images")
    op.drop_table("homepage_sections")
    op.drop_table("products")
    op.drop_table("users")
    op.execute("DROP INDEX IF EXISTS ix_products_title_trgm")
    for enum_name in ("inputfieldtype", "orderstatus", "fulfillmenttype", "userrole"):
        postgresql.ENUM(name=enum_name).drop(op.get_bind(), checkfirst=True)
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
