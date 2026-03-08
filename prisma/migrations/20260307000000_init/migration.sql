-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "attributes" (
    "attribute_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "data_type" VARCHAR(20),

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("attribute_id")
);

-- CreateTable
CREATE TABLE "brands" (
    "brand_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("brand_id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" SERIAL NOT NULL,
    "cart_id" INTEGER,
    "variant_id" INTEGER,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "cart_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("cart_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "category_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "parent_id" INTEGER,
    "image_url" TEXT,
    "is_visible" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "contact_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "subject" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "status" VARCHAR(20) DEFAULT 'pending',
    "replied_by" INTEGER,
    "replied_at" TIMESTAMP(6),
    "reply" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("contact_id")
);

-- CreateTable
CREATE TABLE "coupon_usages" (
    "usage_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "coupon_id" INTEGER,
    "order_id" INTEGER,
    "used_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("usage_id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "coupon_id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "discount_type" VARCHAR(20),
    "discount_value" DECIMAL(10,2),
    "min_order_amount" DECIMAL(12,2) DEFAULT 0,
    "max_discount_amount" DECIMAL(12,2),
    "expiry_date" DATE,
    "usage_limit" INTEGER,
    "used_count" INTEGER DEFAULT 0,
    "per_user_limit" INTEGER DEFAULT 1,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("coupon_id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "inventory_id" SERIAL NOT NULL,
    "variant_id" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "transaction_id" SERIAL NOT NULL,
    "variant_id" INTEGER,
    "change_quantity" INTEGER NOT NULL,
    "transaction_type" VARCHAR(20),
    "reference_id" INTEGER,
    "note" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "order_details" (
    "order_detail_id" SERIAL NOT NULL,
    "order_id" INTEGER,
    "variant_id" INTEGER,
    "product_name" VARCHAR(255) NOT NULL,
    "variant_info" TEXT,
    "sku" VARCHAR(50) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "order_details_pkey" PRIMARY KEY ("order_detail_id")
);

-- CreateTable
CREATE TABLE "order_status" (
    "status_id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "order_status_pkey" PRIMARY KEY ("status_id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "history_id" SERIAL NOT NULL,
    "order_id" INTEGER,
    "status_id" INTEGER,
    "changed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "orders" (
    "order_id" SERIAL NOT NULL,
    "order_code" VARCHAR(50) NOT NULL,
    "user_id" INTEGER,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) DEFAULT 0,
    "shipping_fee" DECIMAL(12,2) DEFAULT 0,
    "final_amount" DECIMAL(12,2) NOT NULL,
    "status_id" INTEGER,
    "coupon_id" INTEGER,
    "shipping_address" TEXT NOT NULL,
    "shipping_method" VARCHAR(50),
    "payment_method" VARCHAR(50),
    "payment_status" VARCHAR(20) DEFAULT 'pending',
    "note" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "posts" (
    "post_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "thumbnail" TEXT,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "category" VARCHAR(50) DEFAULT 'news',
    "is_published" BOOLEAN DEFAULT false,
    "published_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("post_id")
);

-- CreateTable
CREATE TABLE "product_attribute_values" (
    "id" SERIAL NOT NULL,
    "variant_id" INTEGER,
    "attribute_id" INTEGER,
    "value" TEXT NOT NULL,

    CONSTRAINT "product_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "image_id" SERIAL NOT NULL,
    "product_id" INTEGER,
    "variant_id" INTEGER,
    "image_url" TEXT NOT NULL,
    "alt_text" VARCHAR(255),
    "is_main" BOOLEAN DEFAULT false,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "variant_id" SERIAL NOT NULL,
    "product_id" INTEGER,
    "sku" VARCHAR(50) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "compare_price" DECIMAL(12,2),
    "image_url" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "is_default" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("variant_id")
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category_id" INTEGER,
    "brand_id" INTEGER,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "review_images" (
    "image_id" SERIAL NOT NULL,
    "review_id" INTEGER,
    "image_url" TEXT NOT NULL,
    "alt_text" VARCHAR(255),
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_images_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "review_id" SERIAL NOT NULL,
    "product_id" INTEGER,
    "user_id" INTEGER,
    "order_id" INTEGER,
    "rating" INTEGER,
    "comment" TEXT,
    "is_approved" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "address" TEXT,
    "avatar_url" TEXT,
    "date_of_birth" DATE,
    "is_verified" BOOLEAN DEFAULT false,
    "role" VARCHAR(20) DEFAULT 'user',
    "last_login" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "wishlist_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "product_id" INTEGER,
    "variant_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("wishlist_id")
);

-- CreateTable
CREATE TABLE "email_subscribers" (
    "subscriber_id" SERIAL NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "subscribed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed_at" TIMESTAMP(6),

    CONSTRAINT "email_subscribers_pkey" PRIMARY KEY ("subscriber_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "idx_brands_deleted" ON "brands"("deleted_at") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_variant_id_key" ON "cart_items"("cart_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");

-- CreateIndex
CREATE INDEX "idx_cart_user" ON "carts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "idx_categories_deleted" ON "categories"("deleted_at") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_contacts_email" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "idx_contacts_status" ON "contacts"("status");

-- CreateIndex
CREATE INDEX "idx_contacts_user" ON "contacts"("user_id");

-- CreateIndex
CREATE INDEX "idx_coupon_usages_user_coup" ON "coupon_usages"("user_id", "coupon_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_usages_user_id_coupon_id_order_id_key" ON "coupon_usages"("user_id", "coupon_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "idx_coupons_deleted" ON "coupons"("deleted_at") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_variant_id_key" ON "inventory"("variant_id");

-- CreateIndex
CREATE INDEX "idx_inventory_variant" ON "inventory"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_status_name_key" ON "order_status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_code_key" ON "orders"("order_code");

-- CreateIndex
CREATE INDEX "idx_orders_code" ON "orders"("order_code");

-- CreateIndex
CREATE INDEX "idx_orders_status" ON "orders"("status_id");

-- CreateIndex
CREATE INDEX "idx_orders_user" ON "orders"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "idx_posts_deleted" ON "posts"("deleted_at") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_posts_published" ON "posts"("is_published", "published_at" DESC) WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_posts_slug" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "idx_posts_user" ON "posts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_values_variant_id_attribute_id_key" ON "product_attribute_values"("variant_id", "attribute_id");

-- CreateIndex
CREATE INDEX "idx_product_images_product" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_images_variant" ON "product_images"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_default_variant_per_product" ON "product_variants"("product_id") WHERE ((is_default = true) AND (deleted_at IS NULL));

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "idx_variants_default" ON "product_variants"("is_default") WHERE (is_default = true);

-- CreateIndex
CREATE INDEX "idx_variants_deleted" ON "product_variants"("deleted_at") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_variants_product" ON "product_variants"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "idx_products_brand" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "idx_products_deleted" ON "products"("deleted_at") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_review_images_review" ON "review_images"("review_id");

-- CreateIndex
CREATE INDEX "idx_reviews_deleted" ON "reviews"("deleted_at") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_reviews_product" ON "reviews"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_product_id_user_id_key" ON "reviews"("product_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_deleted" ON "users"("deleted_at") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_wishlists_user" ON "wishlists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_subscribers_email_key" ON "email_subscribers"("email");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("cart_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("category_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_replied_by_fkey" FOREIGN KEY ("replied_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("coupon_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "order_status"("status_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("coupon_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "order_status"("status_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("attribute_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("brand_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("review_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE SET NULL ON UPDATE NO ACTION;
