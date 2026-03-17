--
-- PostgreSQL database dump
--

\restrict 1kSoVdAAHCzQbBzVVRZGmr5yPrEIoa9crimdHvDXceYIQCPK1mJtrP1hJwZmB7R

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: fn_calc_final_amount(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_calc_final_amount() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.final_amount = NEW.total_amount - COALESCE(NEW.discount_amount, 0) + COALESCE(NEW.shipping_fee, 0);
    RETURN NEW;
END;
$$;


--
-- Name: fn_create_cart_for_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_create_cart_for_new_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO carts (user_id) VALUES (NEW.user_id);
    RETURN NEW;
END;
$$;


--
-- Name: fn_decrease_inventory(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_decrease_inventory() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_qty INT;
BEGIN
    SELECT quantity INTO current_qty
    FROM inventory
    WHERE variant_id = NEW.variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Variant % không tồn tại trong inventory', NEW.variant_id;
    END IF;

    IF current_qty < NEW.quantity THEN
        RAISE EXCEPTION 'Variant % không đủ hàng (còn % | yêu cầu %)',
            NEW.variant_id, current_qty, NEW.quantity;
    END IF;

    UPDATE inventory
    SET quantity   = quantity - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE variant_id = NEW.variant_id;

    INSERT INTO inventory_transactions (variant_id, change_quantity, transaction_type, reference_id, note)
    VALUES (NEW.variant_id, -NEW.quantity, 'export', NEW.order_id, 'Xuất kho theo đơn hàng');

    RETURN NEW;
END;
$$;


--
-- Name: fn_increment_coupon_used(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_increment_coupon_used() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE coupons
    SET used_count = used_count + 1
    WHERE coupon_id = NEW.coupon_id;
    RETURN NEW;
END;
$$;


--
-- Name: fn_log_order_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_log_order_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        INSERT INTO order_status_history (order_id, status_id)
        VALUES (NEW.order_id, NEW.status_id);
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: fn_restore_inventory_on_cancel(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_restore_inventory_on_cancel() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status_id IN (
        SELECT status_id FROM order_status WHERE name IN ('cancelled', 'refunded')
    )
    AND OLD.status_id NOT IN (
        SELECT status_id FROM order_status WHERE name IN ('cancelled', 'refunded')
    )
    AND NEW.payment_status = 'paid'
    THEN
        UPDATE inventory i
        SET quantity   = i.quantity + od.quantity,
            updated_at = CURRENT_TIMESTAMP
        FROM order_details od
        WHERE od.order_id = NEW.order_id
          AND i.variant_id = od.variant_id;

        INSERT INTO inventory_transactions (variant_id, change_quantity, transaction_type, reference_id, note)
        SELECT od.variant_id, od.quantity, 'cancel_return', NEW.order_id,
               'Hoàn kho do huỷ / refund đơn hàng'
        FROM order_details od
        WHERE od.order_id = NEW.order_id;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: fn_set_published_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_set_published_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.is_published = TRUE AND (OLD.is_published = FALSE OR OLD.is_published IS NULL) THEN
        NEW.published_at = CURRENT_TIMESTAMP;
    END IF;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: fn_set_replied_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_set_replied_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.reply IS NOT NULL AND OLD.reply IS NULL THEN
        NEW.replied_at = CURRENT_TIMESTAMP;
        NEW.status = 'resolved';
    END IF;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attributes (
    attribute_id integer NOT NULL,
    name character varying(100) NOT NULL,
    data_type character varying(20)
);


--
-- Name: attributes_attribute_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attributes_attribute_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attributes_attribute_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attributes_attribute_id_seq OWNED BY public.attributes.attribute_id;


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    brand_id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(150) NOT NULL,
    description text,
    logo_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


--
-- Name: brands_brand_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.brands_brand_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brands_brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.brands_brand_id_seq OWNED BY public.brands.brand_id;


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    cart_id integer,
    variant_id integer,
    quantity integer NOT NULL,
    CONSTRAINT cart_items_quantity_check CHECK ((quantity > 0))
);


--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    cart_id integer NOT NULL,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: carts_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.carts_cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: carts_cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.carts_cart_id_seq OWNED BY public.carts.cart_id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    category_id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(150) NOT NULL,
    parent_id integer,
    image_url text,
    is_visible boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


--
-- Name: categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    contact_id integer NOT NULL,
    user_id integer,
    full_name character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20),
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    replied_by integer,
    replied_at timestamp without time zone,
    reply text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contacts_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'resolved'::character varying, 'closed'::character varying])::text[])))
);


--
-- Name: contacts_contact_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contacts_contact_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contacts_contact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contacts_contact_id_seq OWNED BY public.contacts.contact_id;


--
-- Name: coupon_usages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_usages (
    usage_id integer NOT NULL,
    user_id integer,
    coupon_id integer,
    order_id integer,
    used_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: coupon_usages_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coupon_usages_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coupon_usages_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coupon_usages_usage_id_seq OWNED BY public.coupon_usages.usage_id;


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    coupon_id integer NOT NULL,
    code character varying(50) NOT NULL,
    discount_type character varying(20),
    discount_value numeric(10,2),
    min_order_amount numeric(12,2) DEFAULT 0,
    max_discount_amount numeric(12,2),
    expiry_date date,
    usage_limit integer,
    used_count integer DEFAULT 0,
    per_user_limit integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    CONSTRAINT coupons_discount_type_check CHECK (((discount_type)::text = ANY ((ARRAY['percent'::character varying, 'fixed'::character varying])::text[]))),
    CONSTRAINT coupons_discount_value_check CHECK ((discount_value >= (0)::numeric))
);


--
-- Name: coupons_coupon_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coupons_coupon_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coupons_coupon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coupons_coupon_id_seq OWNED BY public.coupons.coupon_id;


--
-- Name: email_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_subscribers (
    subscriber_id integer NOT NULL,
    email character varying(150) NOT NULL,
    is_active boolean DEFAULT true,
    subscribed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at timestamp without time zone
);


--
-- Name: email_subscribers_subscriber_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_subscribers_subscriber_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_subscribers_subscriber_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_subscribers_subscriber_id_seq OWNED BY public.email_subscribers.subscriber_id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    inventory_id integer NOT NULL,
    variant_id integer,
    quantity integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT inventory_quantity_check CHECK ((quantity >= 0))
);


--
-- Name: inventory_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_inventory_id_seq OWNED BY public.inventory.inventory_id;


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_transactions (
    transaction_id integer NOT NULL,
    variant_id integer,
    change_quantity integer NOT NULL,
    transaction_type character varying(20),
    reference_id integer,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT inventory_transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['import'::character varying, 'export'::character varying, 'cancel_return'::character varying, 'adjust'::character varying])::text[])))
);


--
-- Name: inventory_transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_transactions_transaction_id_seq OWNED BY public.inventory_transactions.transaction_id;


--
-- Name: order_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_details (
    order_detail_id integer NOT NULL,
    order_id integer,
    variant_id integer,
    product_name character varying(255) NOT NULL,
    variant_info text,
    sku character varying(50) NOT NULL,
    price numeric(12,2) NOT NULL,
    quantity integer NOT NULL,
    CONSTRAINT order_details_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT order_details_quantity_check CHECK ((quantity > 0))
);


--
-- Name: order_details_order_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_details_order_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_details_order_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_details_order_detail_id_seq OWNED BY public.order_details.order_detail_id;


--
-- Name: order_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_status (
    status_id integer NOT NULL,
    name character varying(50) NOT NULL
);


--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_status_history (
    history_id integer NOT NULL,
    order_id integer,
    status_id integer,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    note text
);


--
-- Name: order_status_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_status_history_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_status_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_status_history_history_id_seq OWNED BY public.order_status_history.history_id;


--
-- Name: order_status_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_status_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_status_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_status_status_id_seq OWNED BY public.order_status.status_id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    order_id integer NOT NULL,
    order_code character varying(50) NOT NULL,
    user_id integer,
    total_amount numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0,
    shipping_fee numeric(12,2) DEFAULT 0,
    final_amount numeric(12,2) NOT NULL,
    status_id integer,
    coupon_id integer,
    shipping_address text NOT NULL,
    shipping_method character varying(50),
    payment_method character varying(50),
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_final_amount_check CHECK ((final_amount >= (0)::numeric)),
    CONSTRAINT orders_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT orders_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


--
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- Name: post_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    color character varying(20) DEFAULT '#00b4ff'::character varying,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: post_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_categories_id_seq OWNED BY public.post_categories.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    post_id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    thumbnail text,
    content text NOT NULL,
    excerpt text,
    category character varying(50) DEFAULT 'news'::character varying,
    is_published boolean DEFAULT false,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    CONSTRAINT posts_category_check CHECK (((category)::text = ANY ((ARRAY['news'::character varying, 'review'::character varying, 'guide'::character varying, 'promotion'::character varying])::text[])))
);


--
-- Name: posts_post_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posts_post_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posts_post_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posts_post_id_seq OWNED BY public.posts.post_id;


--
-- Name: product_attribute_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_attribute_values (
    id integer NOT NULL,
    variant_id integer,
    attribute_id integer,
    value text NOT NULL
);


--
-- Name: product_attribute_values_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_attribute_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_attribute_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_attribute_values_id_seq OWNED BY public.product_attribute_values.id;


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    image_id integer NOT NULL,
    product_id integer,
    variant_id integer,
    image_url text NOT NULL,
    alt_text character varying(255),
    is_main boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_one_and_only_one_fk CHECK ((((product_id IS NOT NULL) AND (variant_id IS NULL)) OR ((product_id IS NULL) AND (variant_id IS NOT NULL))))
);


--
-- Name: product_images_image_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_images_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_images_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_images_image_id_seq OWNED BY public.product_images.image_id;


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    variant_id integer NOT NULL,
    product_id integer,
    sku character varying(50) NOT NULL,
    price numeric(12,2) NOT NULL,
    compare_price numeric(12,2),
    image_url text,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    CONSTRAINT product_variants_price_check CHECK ((price >= (0)::numeric))
);


--
-- Name: product_variants_variant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_variants_variant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_variants_variant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_variants_variant_id_seq OWNED BY public.product_variants.variant_id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    product_id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    category_id integer,
    brand_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


--
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_product_id_seq OWNED BY public.products.product_id;


--
-- Name: review_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_images (
    image_id integer NOT NULL,
    review_id integer,
    image_url text NOT NULL,
    alt_text character varying(255),
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: review_images_image_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_images_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_images_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_images_image_id_seq OWNED BY public.review_images.image_id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    review_id integer NOT NULL,
    product_id integer,
    user_id integer,
    order_id integer,
    rating integer,
    comment text,
    is_approved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: reviews_review_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviews_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_review_id_seq OWNED BY public.reviews.review_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    phone character varying(20),
    address text,
    avatar_url text,
    date_of_birth date,
    is_verified boolean DEFAULT false,
    role character varying(20) DEFAULT 'user'::character varying,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    is_locked boolean DEFAULT false,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'user'::character varying])::text[])))
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlists (
    wishlist_id integer NOT NULL,
    user_id integer,
    product_id integer,
    variant_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: wishlists_wishlist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wishlists_wishlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wishlists_wishlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wishlists_wishlist_id_seq OWNED BY public.wishlists.wishlist_id;


--
-- Name: attributes attribute_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attributes ALTER COLUMN attribute_id SET DEFAULT nextval('public.attributes_attribute_id_seq'::regclass);


--
-- Name: brands brand_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands ALTER COLUMN brand_id SET DEFAULT nextval('public.brands_brand_id_seq'::regclass);


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: carts cart_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts ALTER COLUMN cart_id SET DEFAULT nextval('public.carts_cart_id_seq'::regclass);


--
-- Name: categories category_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);


--
-- Name: contacts contact_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts ALTER COLUMN contact_id SET DEFAULT nextval('public.contacts_contact_id_seq'::regclass);


--
-- Name: coupon_usages usage_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_usages ALTER COLUMN usage_id SET DEFAULT nextval('public.coupon_usages_usage_id_seq'::regclass);


--
-- Name: coupons coupon_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons ALTER COLUMN coupon_id SET DEFAULT nextval('public.coupons_coupon_id_seq'::regclass);


--
-- Name: email_subscribers subscriber_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_subscribers ALTER COLUMN subscriber_id SET DEFAULT nextval('public.email_subscribers_subscriber_id_seq'::regclass);


--
-- Name: inventory inventory_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory ALTER COLUMN inventory_id SET DEFAULT nextval('public.inventory_inventory_id_seq'::regclass);


--
-- Name: inventory_transactions transaction_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.inventory_transactions_transaction_id_seq'::regclass);


--
-- Name: order_details order_detail_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_details ALTER COLUMN order_detail_id SET DEFAULT nextval('public.order_details_order_detail_id_seq'::regclass);


--
-- Name: order_status status_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status ALTER COLUMN status_id SET DEFAULT nextval('public.order_status_status_id_seq'::regclass);


--
-- Name: order_status_history history_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history ALTER COLUMN history_id SET DEFAULT nextval('public.order_status_history_history_id_seq'::regclass);


--
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- Name: post_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_categories ALTER COLUMN id SET DEFAULT nextval('public.post_categories_id_seq'::regclass);


--
-- Name: posts post_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts ALTER COLUMN post_id SET DEFAULT nextval('public.posts_post_id_seq'::regclass);


--
-- Name: product_attribute_values id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attribute_values ALTER COLUMN id SET DEFAULT nextval('public.product_attribute_values_id_seq'::regclass);


--
-- Name: product_images image_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images ALTER COLUMN image_id SET DEFAULT nextval('public.product_images_image_id_seq'::regclass);


--
-- Name: product_variants variant_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN variant_id SET DEFAULT nextval('public.product_variants_variant_id_seq'::regclass);


--
-- Name: products product_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN product_id SET DEFAULT nextval('public.products_product_id_seq'::regclass);


--
-- Name: review_images image_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_images ALTER COLUMN image_id SET DEFAULT nextval('public.review_images_image_id_seq'::regclass);


--
-- Name: reviews review_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN review_id SET DEFAULT nextval('public.reviews_review_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: wishlists wishlist_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists ALTER COLUMN wishlist_id SET DEFAULT nextval('public.wishlists_wishlist_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
01f3ce7e-6fec-418b-8f33-3f78712cff31	df90ca3173f6147c318ffafbda0b37b7425ea7bc0e8ab8ea8ca557ec8ee53b59	2026-03-07 07:24:47.50739+07	20260307000000_init		\N	2026-03-07 07:24:47.50739+07	0
e5d07fad-d1aa-4122-a9e0-b391687b7ce9	e15c7c0399fa5a78cfe3da1ad2189227ff4634c23ac317a4fef611aeeb03b389	2026-03-15 17:57:39.876218+07	20260315105739_add_post_categories	\N	\N	2026-03-15 17:57:39.82744+07	1
d136e76b-2e18-4260-a370-6d6ec0535389	57ec070f0055faab8c529b7de9482392e347051b552f7241640f27dc9f7786aa	2026-03-15 20:04:43.798211+07	20260315130443_add_is_locked_to_users	\N	\N	2026-03-15 20:04:43.788638+07	1
\.


--
-- Data for Name: attributes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attributes (attribute_id, name, data_type) FROM stdin;
1	Switch Type	text
2	Connectivity	text
3	Form Factor	text
4	DPI	number
5	Polling Rate	text
6	Battery Life	text
7	Driver Size	text
8	Impedance	text
9	Frequency Response	text
10	RGB	boolean
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brands (brand_id, name, slug, description, logo_url, created_at, deleted_at) FROM stdin;
1	Logitech	logitech	Thương hiệu phụ kiện máy tính hàng đầu thế giới từ Thụy Sĩ	\N	2026-03-06 20:16:04.488577	\N
2	Razer	razer	Thương hiệu gaming gear nổi tiếng toàn cầu	\N	2026-03-06 20:16:04.488577	\N
3	SteelSeries	steelseries	Thương hiệu gaming cao cấp từ Đan Mạch	\N	2026-03-06 20:16:04.488577	\N
4	Keychron	keychron	Chuyên bàn phím cơ cao cấp	\N	2026-03-06 20:16:04.488577	\N
5	Akko	akko	Thương hiệu bàn phím cơ phổ biến tại Việt Nam	\N	2026-03-06 20:16:04.488577	\N
6	HyperX	hyperx	Dòng sản phẩm gaming của Kingston	\N	2026-03-06 20:16:04.488577	\N
7	Corsair	corsair	Thương hiệu gaming gear và linh kiện PC cao cấp	\N	2026-03-06 20:16:04.488577	\N
8	MelGeek	melgeek	MelGeek là thương hiệu bàn phím cơ cao cấp nổi tiếng với thiết kế sáng tạo (đặc biệt là phong cách trong suốt), switch từ tính (Hall Effect) tốc độ cao và khả năng tùy chỉnh sâu. Được thành lập năm 2014, hãng nổi bật với các dòng Mojo68, MADE68, và O2, cung cấp trải nghiệm gõ mượt mà, độ trễ thấp (8KHz), phù hợp cho cả game thủ và người làm việc sáng tạo.	\N	2026-03-15 13:24:30.115	\N
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cart_items (id, cart_id, variant_id, quantity) FROM stdin;
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carts (cart_id, user_id, created_at) FROM stdin;
1	1	2026-03-06 20:16:04.488577
2	2	2026-03-06 20:16:04.488577
3	3	2026-03-06 20:16:04.488577
4	4	2026-03-06 20:16:04.488577
5	5	2026-03-06 20:16:04.488577
6	6	2026-03-06 20:16:04.488577
7	7	2026-03-07 07:42:30.083211
8	9	2026-03-08 07:40:11.676381
9	10	2026-03-13 21:07:40.064648
10	11	2026-03-16 10:22:02.330874
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (category_id, name, slug, parent_id, image_url, is_visible, created_at, deleted_at) FROM stdin;
1	Bàn Phím	ban-phim	\N	\N	t	2026-03-06 20:16:04.488577	\N
2	Chuột	chuot	\N	\N	t	2026-03-06 20:16:04.488577	\N
3	Tai Nghe	tai-nghe	\N	\N	t	2026-03-06 20:16:04.488577	\N
4	Bàn Phím Cơ	ban-phim-co	1	\N	t	2026-03-06 20:16:04.488577	\N
6	Bàn Phím Không Dây	ban-phim-khong-day	1	\N	t	2026-03-06 20:16:04.488577	\N
7	Chuột Gaming	chuot-gaming	2	\N	t	2026-03-06 20:16:04.488577	\N
8	Chuột Văn Phòng	chuot-van-phong	2	\N	t	2026-03-06 20:16:04.488577	\N
9	Tai Nghe Gaming	tai-nghe-gaming	3	\N	t	2026-03-06 20:16:04.488577	\N
5	Bàn Phím Membrane	ban-phim-membrane	1	\N	t	2026-03-06 20:16:04.488577	2026-03-15 06:20:01.848
10	Tai Nghe Studio	tai-nghe-studio	3	\N	t	2026-03-06 20:16:04.488577	2026-03-15 06:30:39.612
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contacts (contact_id, user_id, full_name, email, phone, subject, message, status, replied_by, replied_at, reply, created_at) FROM stdin;
1	2	Nguyễn Văn An	an.nguyen@gmail.com	0901000002	Hỏi về chính sách bảo hành Keychron K2 Pro	Bàn phím của tôi bị lỗi 1 phím sau 3 tháng sử dụng. Tôi cần làm gì để được bảo hành?	pending	\N	\N	\N	2026-03-06 20:16:04.488577
2	\N	Khách Vãng Lai	khach@example.com	0909999999	Hỏi về tình trạng hàng G Pro X Superlight 2	Cho hỏi G Pro X Superlight 2 màu đen còn hàng không? Giao đến Cần Thơ mất bao lâu?	pending	\N	\N	\N	2026-03-06 20:16:04.488577
3	\N	Bảo	caohoaibao106@gmail.com	\N	Cách đổi sản phẩm	Tôi mua bàn phím bị lỗi muốn đổi sản phẩm thì làm như thế nào ?	resolved	1	2026-03-13 21:07:01.741944	alo	2026-03-09 04:40:21.874
4	\N	Phùng Thanh Độ	domixi@gmail.com	\N	Alo	Alo Vũ hả Vũ	pending	\N	\N	\N	2026-03-15 05:57:41.707
5	\N	Phan Tấn Trung	trung@gmail.com	\N	alo	alo	pending	\N	\N	\N	2026-03-15 07:54:16.164
\.


--
-- Data for Name: coupon_usages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coupon_usages (usage_id, user_id, coupon_id, order_id, used_at) FROM stdin;
1	3	1	2	2026-03-06 20:16:04.488577
2	1	1	17	2026-03-08 15:36:28.37
3	10	4	26	2026-03-15 10:22:35.056
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coupons (coupon_id, code, discount_type, discount_value, min_order_amount, max_discount_amount, expiry_date, usage_limit, used_count, per_user_limit, is_active, created_at, deleted_at) FROM stdin;
2	SAVE50K	fixed	50000.00	500000.00	\N	2026-06-30	500	0	1	t	2026-03-06 20:16:04.488577	\N
3	SUMMER15	percent	15.00	1000000.00	200000.00	2026-08-31	200	0	1	t	2026-03-06 20:16:04.488577	\N
5	FREESHIP	fixed	30000.00	0.00	30000.00	2026-12-31	9999	0	2	t	2026-03-06 20:16:04.488577	\N
1	WELCOME10	percent	10.00	0.00	50000.00	2026-12-31	1000	3	1	t	2026-03-06 20:16:04.488577	\N
4	NEONGEAR20	percent	20.00	2000000.00	300000.00	2026-12-31	100	2	1	t	2026-03-06 20:16:04.488577	\N
6	MUNGDAILE30/4	fixed	500000.00	2000000.00	500000.00	2026-05-01	100	0	1	t	2026-03-15 10:44:42.738	\N
\.


--
-- Data for Name: email_subscribers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_subscribers (subscriber_id, email, is_active, subscribed_at, unsubscribed_at) FROM stdin;
1	caothanhtung2016@gmail.com	t	2026-03-08 15:20:00.573	\N
2	domixi@gmail.com	t	2026-03-15 06:31:21.957	\N
3	magaming@gmail.com	t	2026-03-15 10:37:30.235	\N
4	user@gmail.com	t	2026-03-15 10:42:19.071	\N
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory (inventory_id, variant_id, quantity, updated_at) FROM stdin;
2	2	30	2026-03-06 20:16:04.488577
5	5	25	2026-03-06 20:16:04.488577
10	10	20	2026-03-06 20:16:04.488577
11	11	20	2026-03-06 20:16:04.488577
12	12	64	2026-03-15 17:24:20.426469
1	1	49	2026-03-06 20:16:04.488577
14	14	39	2026-03-06 20:16:04.488577
15	15	20	2026-03-15 17:24:20.444774
7	7	0	2026-03-15 17:34:58.349532
9	9	33	2026-03-15 19:40:12.959329
4	4	22	2026-03-15 19:50:26.591687
13	13	14	2026-03-15 19:56:17.395519
16	16	20	2026-03-15 13:39:57.32
8	8	9	2026-03-16 10:22:32.576018
6	6	19	2026-03-10 13:30:49.787
3	3	11	2026-03-15 06:32:10.591
\.


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_transactions (transaction_id, variant_id, change_quantity, transaction_type, reference_id, note, created_at) FROM stdin;
1	7	-1	export	1	Xuất kho theo đơn hàng	2026-03-06 20:16:04.488577
2	1	-1	export	2	Xuất kho theo đơn hàng	2026-03-06 20:16:04.488577
3	14	-1	export	3	Xuất kho theo đơn hàng	2026-03-06 20:16:04.488577
4	12	-1	export	4	Xuất kho theo đơn hàng	2026-03-08 06:50:57.143746
6	12	-1	export	5	Xuất kho theo đơn hàng	2026-03-08 06:50:58.164556
8	12	-1	export	6	Xuất kho theo đơn hàng	2026-03-08 06:51:04.395122
10	12	-1	export	7	Xuất kho theo đơn hàng	2026-03-08 07:03:51.273995
12	12	-1	export	8	Xuất kho theo đơn hàng	2026-03-08 07:03:51.972572
14	12	-1	export	9	Xuất kho theo đơn hàng	2026-03-08 07:36:49.53495
16	3	-7	export	10	Xuất kho theo đơn hàng	2026-03-08 16:55:20.332876
17	4	-2	export	10	Xuất kho theo đơn hàng	2026-03-08 16:55:20.332876
20	4	-2	export	11	Xuất kho theo đơn hàng	2026-03-08 16:55:32.79165
22	4	-2	export	12	Xuất kho theo đơn hàng	2026-03-08 17:04:26.098883
24	4	-2	export	13	Xuất kho theo đơn hàng	2026-03-08 17:04:27.421472
26	12	-1	export	14	Xuất kho theo đơn hàng	2026-03-08 17:05:08.950877
28	12	-1	export	15	Xuất kho theo đơn hàng	2026-03-08 17:10:30.141089
29	12	-1	export	15	Đơn hàng NGMMHLD3ZG	2026-03-08 10:10:30.155
30	13	-1	export	16	Xuất kho theo đơn hàng	2026-03-08 22:12:17.698285
31	13	-1	export	16	Đơn hàng NGMMHW57V4	2026-03-08 15:12:17.715
32	12	1	cancel_return	4	Hoàn kho do huỷ đơn NGMMGZ8D4A	2026-03-08 15:12:39.975
33	4	-1	export	17	Xuất kho theo đơn hàng	2026-03-08 22:36:28.351208
34	4	-1	export	17	Đơn hàng NGMMHX0B74	2026-03-08 15:36:28.366
35	3	7	cancel_return	10	Hoàn kho do huỷ đơn NGMMHKTLYZ	2026-03-09 04:55:42.755
36	4	2	cancel_return	10	Hoàn kho do huỷ đơn NGMMHKTLYZ	2026-03-09 04:55:42.755
37	6	-1	export	18	Xuất kho theo đơn hàng	2026-03-09 20:10:23.208221
38	6	-1	export	18	Đơn hàng NGMMJ78EP1	2026-03-09 13:10:28.495
39	6	-1	export	19	Xuất kho theo đơn hàng	2026-03-09 20:17:59.831926
40	6	-1	export	19	Đơn hàng NGMMJ7I2ZB	2026-03-09 13:17:59.843
41	12	-1	export	20	Xuất kho theo đơn hàng	2026-03-10 20:22:33.429982
42	12	-1	export	20	Đơn hàng NGMMKN3SQS	2026-03-10 13:22:33.477
43	4	-1	export	21	Xuất kho theo đơn hàng	2026-03-10 20:30:30.973392
44	4	-1	export	21	Đơn hàng NGMMKNE17X	2026-03-10 13:30:30.99
45	6	-1	export	22	Xuất kho theo đơn hàng	2026-03-10 20:30:49.775597
46	6	-1	export	22	Đơn hàng NGMMKNEFQL	2026-03-10 13:30:49.788
47	3	-2	export	23	Xuất kho theo đơn hàng	2026-03-15 13:32:06.211171
48	3	-2	export	23	Đơn hàng NGMMRDN7LK	2026-03-15 06:32:06.225
49	3	2	cancel_return	23	Hoàn kho do huỷ đơn NGMMRDN7LK	2026-03-15 06:32:10.593
50	15	-10	export	24	Xuất kho theo đơn hàng	2026-03-15 13:43:19.28703
51	7	1	cancel_return	\N	Hoàn kho thủ công - đơn huỷ	2026-03-15 14:56:21.448601
52	15	10	cancel_return	\N	Hoàn kho thủ công - đơn huỷ	2026-03-15 14:56:21.448601
53	8	-1	export	26	Xuất kho theo đơn hàng	2026-03-15 17:22:35.018157
54	8	-1	export	26	Đơn hàng NGMMRLVLZ2	2026-03-15 10:22:35.052
55	12	1	import	\N	Restore tồn kho từ đơn đã huỷ (script)	2026-03-15 10:24:20.44
56	15	10	import	\N	Restore tồn kho từ đơn đã huỷ (script)	2026-03-15 10:24:20.445
57	9	-1	export	28	Xuất kho theo đơn hàng	2026-03-15 19:40:12.959329
58	9	-1	export	28	Đơn hàng NGMMRQSLUA	2026-03-15 12:40:12.968
59	8	-1	export	29	Xuất kho theo đơn hàng	2026-03-15 19:44:09.041796
60	8	-1	export	29	Đơn hàng NGMMRQXO0G	2026-03-15 12:44:09.05
61	4	-1	export	30	Xuất kho theo đơn hàng	2026-03-15 19:46:41.336399
62	4	-1	export	30	Đơn hàng NGMMRR0XIU	2026-03-15 12:46:41.345
63	4	-1	export	31	Xuất kho theo đơn hàng	2026-03-15 19:47:01.644213
64	4	-1	export	31	Đơn hàng NGMMRR1D6Z	2026-03-15 12:47:01.649
65	4	-1	export	32	Xuất kho theo đơn hàng	2026-03-15 19:50:13.260936
66	4	-1	export	32	Đơn hàng NGMMRR5H1O	2026-03-15 12:50:13.267
67	4	1	import	32	Hoàn kho do huỷ đơn NGMMRR5H1O	2026-03-15 12:50:26.592
68	13	-1	export	33	Xuất kho theo đơn hàng	2026-03-15 19:56:17.395519
69	13	-1	export	33	Đơn hàng NGMMRRDA0H	2026-03-15 12:56:17.403
70	16	20	import	\N	Nhập kho ban đầu	2026-03-15 13:39:57.329
71	8	-1	export	34	Xuất kho theo đơn hàng	2026-03-16 10:22:32.576018
72	8	-1	export	34	Đơn hàng NG406A454E99	2026-03-16 03:22:32.599
\.


--
-- Data for Name: order_details; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_details (order_detail_id, order_id, variant_id, product_name, variant_info, sku, price, quantity) FROM stdin;
1	1	7	Logitech G Pro X Superlight 2	Màu: Trắng	LGPXSL2-WHT	3490000.00	1
2	2	1	Keychron K2 Pro	Màu: Đen | Switch: Red	KCHK2P-BLK-RED	1890000.00	1
3	3	14	Razer BlackShark V2 X	Màu: Đen	RZBSV2X-BLK	790000.00	1
4	4	12	SteelSeries Rival 3	DPI: 8500, Polling Rate: 1000Hz	SSRV3-BLK	490000.00	1
5	5	12	SteelSeries Rival 3	DPI: 8500, Polling Rate: 1000Hz	SSRV3-BLK	490000.00	1
6	6	12	SteelSeries Rival 3	DPI: 8500, Polling Rate: 1000Hz	SSRV3-BLK	490000.00	1
7	7	12	SteelSeries Rival 3	DPI: 8500, Polling Rate: 1000Hz	SSRV3-BLK	490000.00	1
8	8	12	SteelSeries Rival 3	DPI: 8500, Polling Rate: 1000Hz	SSRV3-BLK	490000.00	1
9	9	12	SteelSeries Rival 3	DPI: 8500, Polling Rate: 1000Hz	SSRV3-BLK	490000.00	1
10	10	3	Keychron K2 Pro	Switch Type: Gateron Red, Connectivity: Bluetooth 5.1 / USB-C, Form Factor: 75%, RGB: true	KCHK2P-WHT-RED	1990000.00	7
11	10	4	Akko 3087 Ocean Star	Switch Type: Akko CS Jelly Pink, Connectivity: USB-C, Form Factor: TKL 87%, RGB: false	AK3087-OCN-CS45	890000.00	2
12	11	4	Akko 3087 Ocean Star	Switch Type: Akko CS Jelly Pink, Connectivity: USB-C, Form Factor: TKL 87%, RGB: false	AK3087-OCN-CS45	890000.00	2
13	12	4	Akko 3087 Ocean Star	Switch Type: Akko CS Jelly Pink, Connectivity: USB-C, Form Factor: TKL 87%, RGB: false	AK3087-OCN-CS45	890000.00	2
14	13	4	Akko 3087 Ocean Star	Switch Type: Akko CS Jelly Pink, Connectivity: USB-C, Form Factor: TKL 87%, RGB: false	AK3087-OCN-CS45	890000.00	2
15	14	12	SteelSeries Rival 3	DPI: 8500, Polling Rate: 1000Hz	SSRV3-BLK	490000.00	1
16	15	12	SteelSeries Rival 3	DPI: 8500, Polling Rate: 1000Hz	SSRV3-BLK	490000.00	1
17	16	13	HyperX Cloud II Wireless	Driver Size: 53mm, Impedance: 32 Ohm, Frequency Response: 15Hz-23kHz, Battery Life: 30 giờ	HXCL2W-BLK	2190000.00	1
18	17	4	Akko 3087 Ocean Star	Switch Type: Akko CS Jelly Pink, Connectivity: USB-C, Form Factor: TKL 87%, RGB: false	AK3087-OCN-CS45	890000.00	1
19	18	6	Logitech MX Keys	Switch Type: Scissor, Connectivity: Logi Bolt / Bluetooth, Form Factor: Full-size	LGMXK-BLK	2490000.00	1
20	19	6	Logitech MX Keys	Switch Type: Scissor, Connectivity: Logi Bolt / Bluetooth, Form Factor: Full-size	LGMXK-BLK	2490000.00	1
21	20	12	SteelSeries Rival 3	DPI: 8500, Polling Rate: 1000Hz	SSRV3-BLK	490000.00	1
22	21	4	Akko 3087 Ocean Star	Switch Type: Akko CS Jelly Pink, Connectivity: USB-C, Form Factor: TKL 87%, RGB: false	AK3087-OCN-CS45	890000.00	1
23	22	6	Logitech MX Keys	Switch Type: Scissor, Connectivity: Logi Bolt / Bluetooth, Form Factor: Full-size	LGMXK-BLK	2490000.00	1
24	23	3	Keychron K2 Pro	Switch Type: Gateron Red, Connectivity: Bluetooth 5.1 / USB-C, Form Factor: 75%, RGB: true	KCHK2P-WHT-RED	1990000.00	2
25	24	15	SteelSeries Arctis Nova Pro	Driver Size: 40mm, Impedance: 32 Ohm, Frequency Response: 10Hz-40kHz, Battery Life: Hot-swap battery	SSNVPRO-BLK	4990000.00	10
27	26	8	Logitech G Pro X Superlight 2	DPI: 25600, Polling Rate: 2000Hz, Battery Life: 95 giờ	LGPXSL2-BLK	3490000.00	1
29	28	9	Razer DeathAdder V3	DPI: 30000, Polling Rate: 8000Hz	RZDAV3-BLK	1590000.00	1
30	29	8	Logitech G Pro X Superlight 2	DPI: 25600, Polling Rate: 2000Hz, Battery Life: 95 giờ	LGPXSL2-BLK	3490000.00	1
31	30	4	Akko 3087 Ocean Star	Switch Type: Akko CS Jelly Pink, Connectivity: USB-C, Form Factor: TKL 87%, RGB: false	AK3087-OCN-CS45	890000.00	1
32	31	4	Akko 3087 Ocean Star	Switch Type: Akko CS Jelly Pink, Connectivity: USB-C, Form Factor: TKL 87%, RGB: false	AK3087-OCN-CS45	890000.00	1
34	33	13	HyperX Cloud II Wireless	Driver Size: 53mm, Impedance: 32 Ohm, Frequency Response: 15Hz-23kHz, Battery Life: 30 giờ	HXCL2W-BLK	2190000.00	1
35	34	8	Logitech G Pro X Superlight 2	DPI: 25600, Polling Rate: 2000Hz, Battery Life: 95 giờ	LGPXSL2-BLK	3490000.00	1
\.


--
-- Data for Name: order_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_status (status_id, name) FROM stdin;
1	pending
2	confirmed
3	processing
4	shipping
5	delivered
6	cancelled
7	refunded
8	paid
9	failed
10	pending_cod
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_status_history (history_id, order_id, status_id, changed_at, note) FROM stdin;
1	1	1	2026-03-06 20:16:04.488577	Đơn hàng được tạo
2	1	2	2026-03-06 20:16:04.488577	Đã xác nhận thanh toán
3	1	3	2026-03-06 20:16:04.488577	Đang chuẩn bị hàng
4	1	4	2026-03-06 20:16:04.488577	Đã bàn giao cho đơn vị vận chuyển
5	1	5	2026-03-06 20:16:04.488577	Giao hàng thành công
6	2	1	2026-03-06 20:16:04.488577	Đơn hàng được tạo
7	2	2	2026-03-06 20:16:04.488577	Xác nhận chuyển khoản
8	2	5	2026-03-06 20:16:04.488577	Giao hàng thành công
9	3	1	2026-03-06 20:16:04.488577	Đơn hàng được tạo
10	4	1	2026-03-07 23:50:57.141	Đơn hàng được tạo
11	5	1	2026-03-07 23:50:58.163	Đơn hàng được tạo
12	6	1	2026-03-07 23:51:04.394	Đơn hàng được tạo
13	7	1	2026-03-08 00:03:51.272	Đơn hàng được tạo
14	8	1	2026-03-08 00:03:51.971	Đơn hàng được tạo
15	9	1	2026-03-08 00:36:49.533	Đơn hàng được tạo
16	5	3	2026-03-08 12:04:58.636544	\N
17	5	3	2026-03-08 05:04:58.663	\N
18	10	1	2026-03-08 09:55:20.331	Đơn hàng được tạo
19	11	1	2026-03-08 09:55:32.79	Đơn hàng được tạo
20	12	1	2026-03-08 10:04:26.096	Đơn hàng được tạo
21	13	1	2026-03-08 10:04:27.42	Đơn hàng được tạo
22	14	1	2026-03-08 10:05:08.949	Đơn hàng được tạo
23	15	1	2026-03-08 10:10:30.139	Đơn hàng được tạo
24	16	1	2026-03-08 15:12:17.696	Đơn hàng được tạo
25	4	6	2026-03-08 22:12:39.96741	\N
26	4	6	2026-03-08 15:12:39.969	Huỷ bởi khách hàng
27	16	3	2026-03-08 22:22:12.114528	\N
28	16	3	2026-03-08 15:22:12.118	\N
29	6	5	2026-03-08 22:22:40.844397	\N
30	6	5	2026-03-08 15:22:40.847	\N
31	8	3	2026-03-08 22:22:52.607034	\N
32	8	3	2026-03-08 15:22:52.61	\N
33	5	5	2026-03-08 22:22:55.659738	\N
34	5	5	2026-03-08 15:22:55.66	\N
35	15	5	2026-03-08 22:22:58.671056	\N
36	15	5	2026-03-08 15:22:58.672	\N
37	14	6	2026-03-08 22:23:14.766219	\N
38	14	6	2026-03-08 15:23:14.769	\N
39	15	3	2026-03-08 22:23:20.038864	\N
40	15	3	2026-03-08 15:23:20.039	\N
41	13	3	2026-03-08 22:23:29.898657	\N
42	13	3	2026-03-08 15:23:29.903	\N
43	13	5	2026-03-08 22:23:32.607423	\N
44	13	5	2026-03-08 15:23:32.608	\N
45	17	1	2026-03-08 15:36:28.349	Đơn hàng được tạo
46	10	6	2026-03-09 11:55:42.721389	\N
47	10	6	2026-03-09 04:55:42.75	Huỷ bởi khách hàng
48	17	2	2026-03-09 12:34:30.625599	\N
49	17	2	2026-03-09 05:34:30.628	\N
50	17	4	2026-03-09 12:34:32.219929	\N
51	17	4	2026-03-09 05:34:32.22	\N
52	17	5	2026-03-09 12:34:33.741367	\N
53	17	5	2026-03-09 05:34:33.742	\N
54	17	6	2026-03-09 12:34:35.30768	\N
55	17	6	2026-03-09 05:34:35.308	\N
56	17	5	2026-03-09 12:34:37.442197	\N
57	17	5	2026-03-09 05:34:37.442	\N
58	17	4	2026-03-09 12:34:38.772575	\N
59	17	4	2026-03-09 05:34:38.773	\N
60	17	2	2026-03-09 12:34:40.991594	\N
61	17	2	2026-03-09 05:34:40.992	\N
62	17	5	2026-03-09 12:34:43.907955	\N
63	17	5	2026-03-09 05:34:43.908	\N
64	18	1	2026-03-09 13:10:28.465	Đơn hàng được tạo
65	19	1	2026-03-09 13:17:59.831	Đơn hàng được tạo
66	20	1	2026-03-10 13:22:33.428	Đơn hàng được tạo
67	21	1	2026-03-10 13:30:30.972	Đơn hàng được tạo
68	22	1	2026-03-10 13:30:49.775	Đơn hàng được tạo
69	3	5	2026-03-15 12:54:56.648076	\N
70	3	5	2026-03-15 05:54:56.675	\N
71	23	1	2026-03-15 06:32:06.21	Đơn hàng được tạo
72	23	6	2026-03-15 13:32:10.586478	\N
73	23	6	2026-03-15 06:32:10.588	Huỷ bởi khách hàng
74	24	1	2026-03-15 06:43:19.286	Đơn hàng được tạo
75	24	6	2026-03-15 13:47:36.426515	\N
76	24	6	2026-03-15 06:47:36.429	\N
77	22	2	2026-03-15 13:55:29.718173	\N
78	22	2	2026-03-15 06:55:29.722	\N
79	21	2	2026-03-15 13:55:30.98683	\N
80	21	2	2026-03-15 06:55:30.99	\N
81	9	5	2026-03-15 13:55:48.553126	\N
82	9	5	2026-03-15 06:55:48.555	\N
83	7	5	2026-03-15 13:55:50.331389	\N
84	7	5	2026-03-15 06:55:50.334	\N
85	26	1	2026-03-15 10:22:35.017	Đơn hàng được tạo
86	26	2	2026-03-15 17:23:21.074053	\N
87	26	2	2026-03-15 10:23:21.076	\N
88	26	4	2026-03-15 17:25:20.998168	\N
89	26	4	2026-03-15 10:25:20.999	\N
90	4	4	2026-03-15 17:36:13.494746	\N
91	4	4	2026-03-15 10:36:13.497	\N
92	20	2	2026-03-15 17:36:18.393823	\N
93	20	2	2026-03-15 10:36:18.395	\N
94	16	5	2026-03-15 17:36:30.236588	\N
95	16	5	2026-03-15 10:36:30.239	\N
96	28	1	2026-03-15 12:40:12.957	Đơn hàng được tạo
97	29	1	2026-03-15 12:44:09.041	Đơn hàng được tạo
98	30	1	2026-03-15 12:46:41.335	Đơn hàng được tạo
99	31	1	2026-03-15 12:47:01.643	Đơn hàng được tạo
103	33	1	2026-03-15 12:56:17.395	Đơn hàng được tạo
104	26	5	2026-03-15 20:05:18.635928	\N
105	26	5	2026-03-15 13:05:18.639	\N
106	34	1	2026-03-16 03:22:32.589	Đơn hàng được tạo
107	34	2	2026-03-16 10:23:58.484896	\N
108	34	2	2026-03-16 03:23:58.488	\N
109	34	1	2026-03-16 10:29:38.663444	\N
110	34	1	2026-03-16 03:29:38.668	\N
111	34	2	2026-03-16 10:29:41.56518	\N
112	34	2	2026-03-16 03:29:41.568	\N
113	34	4	2026-03-16 10:29:43.774093	\N
114	34	4	2026-03-16 03:29:43.775	\N
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (order_id, order_code, user_id, total_amount, discount_amount, shipping_fee, final_amount, status_id, coupon_id, shipping_address, shipping_method, payment_method, payment_status, note, created_at) FROM stdin;
1	NG-20250601-001	2	3490000.00	0.00	30000.00	3520000.00	5	\N	123 Nguyễn Trãi, Q1, TP.HCM	Giao hàng nhanh	COD	paid	\N	2026-03-06 20:16:04.488577
2	NG-20250602-002	3	1890000.00	189000.00	30000.00	1731000.00	5	\N	456 Lê Lợi, Q. Hải Châu, Đà Nẵng	Giao hàng nhanh	bank_transfer	paid	\N	2026-03-06 20:16:04.488577
11	NGMMHKTVLG	1	1780000.00	0.00	30000.00	1810000.00	1	\N	Hà Nội	standard	bank_transfer	pending		2026-03-08 09:55:32.79
12	NGMMHL5B35	1	1780000.00	0.00	30000.00	1810000.00	1	\N	Hà Nội	express	bank_transfer	pending		2026-03-08 10:04:26.096
6	NGMMGZ8IQ1	7	490000.00	0.00	30000.00	520000.00	5	\N	145	standard	cod	pending		2026-03-07 23:51:04.394
8	NGMMGZOYZN	7	490000.00	0.00	30000.00	520000.00	3	\N	cần thơ	express	bank_transfer	pending		2026-03-08 00:03:51.971
5	NGMMGZ8DWZ	7	490000.00	0.00	30000.00	520000.00	5	\N	145	standard	cod	pending		2026-03-07 23:50:58.163
14	NGMMHL685V	7	490000.00	0.00	30000.00	520000.00	6	\N	157 ấp ngã cạy	express	bank_transfer	pending		2026-03-08 10:05:08.949
15	NGMMHLD3ZG	7	490000.00	0.00	30000.00	520000.00	3	\N	Cao Hoài Bảo - 0366945917\n146, xã đông yên, an biên, kiên giang	standard	cod	pending		2026-03-08 10:10:30.139
13	NGMMHL5C4C	1	1780000.00	0.00	30000.00	1810000.00	5	\N	Hà Nội	express	bank_transfer	pending		2026-03-08 10:04:27.42
10	NGMMHKTLYZ	1	15710000.00	0.00	30000.00	15740000.00	6	\N	Hà Nội	express	bank_transfer	pending		2026-03-08 09:55:20.331
17	NGMMHX0B74	1	890000.00	50000.00	30000.00	870000.00	5	1	Admin - 0338631274\n106 YÊN LÃNG, Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội	express	vnpay	pending	\N	2026-03-08 15:36:28.349
18	NGMMJ78EP1	1	2490000.00	0.00	30000.00	2520000.00	1	\N	Admin - 0338631274\n154, Phường Láng Hạ, Quận Đống Đa, Thành phố Hà Nội	standard	vnpay	pending	\N	2026-03-09 13:10:28.465
19	NGMMJ7I2ZB	1	2490000.00	0.00	30000.00	2520000.00	1	\N	Admin - 0338631274\n098, Phường Đồng Xuân, Quận Hoàn Kiếm, Thành phố Hà Nội	standard	momo	pending	\N	2026-03-09 13:17:59.831
3	NG-20250603-003	4	790000.00	0.00	30000.00	820000.00	5	\N	789 Trần Phú, Q. Ngô Quyền, Hải Phòng	Tiêu chuẩn	COD	pending	\N	2026-03-06 20:16:04.488577
23	NGMMRDN7LK	7	3980000.00	0.00	30000.00	4010000.00	6	\N	Cao Hoài Bảo - 0366945917\n132, Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội	standard	bank_transfer	pending	\N	2026-03-15 06:32:06.21
24	NGMMRE1MYD	7	49900000.00	30000.00	30000.00	49900000.00	6	5	Cao Hoài Bảo - 0366945917\n123, Phường Đồng Xuân, Quận Hoàn Kiếm, Thành phố Hà Nội	standard	cod	pending	Giao giờ hành chính	2026-03-15 06:43:19.286
22	NGMMKNEFQL	1	2490000.00	0.00	30000.00	2520000.00	2	\N	Admin - 0338631274\n123, Xã Đức Hạnh, Huyện Bảo Lâm, Tỉnh Cao Bằng	standard	momo	pending	\N	2026-03-10 13:30:49.775
21	NGMMKNE17X	1	890000.00	0.00	30000.00	920000.00	2	\N	Admin - 0338631274\n123, Phường Trần Phú, Thành phố Hà Giang, Tỉnh Hà Giang	standard	vnpay	pending	\N	2026-03-10 13:30:30.972
9	NGMMH0VCVG	7	490000.00	0.00	30000.00	520000.00	5	\N	cần thơ	express	bank_transfer	pending		2026-03-08 00:36:49.533
7	NGMMGZOYG8	7	490000.00	0.00	30000.00	520000.00	5	\N	cần thơ	express	bank_transfer	pending		2026-03-08 00:03:51.272
4	NGMMGZ8D4A	7	490000.00	0.00	30000.00	520000.00	4	\N	145	standard	cod	pending		2026-03-07 23:50:57.141
20	NGMMKN3SQS	1	490000.00	0.00	30000.00	520000.00	2	\N	Admin - 0338631274\n124, Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội	standard	vnpay	pending	\N	2026-03-10 13:22:33.428
16	NGMMHW57V4	7	2190000.00	0.00	30000.00	2220000.00	5	\N	Cao Hoài Bảo - 0366945917\n123, Phường Hưng Lợi, Quận Ninh Kiều, Thành phố Cần Thơ	express	bank_transfer	pending	\N	2026-03-08 15:12:17.696
28	NGMMRQSLUA	7	1590000.00	0.00	30000.00	1620000.00	1	\N	Cao Hoài Bảo - 0366945917\n143, Thị trấn Phó Bảng, Huyện Đồng Văn, Tỉnh Hà Giang	standard	bank_transfer	pending	\N	2026-03-15 12:40:12.957
29	NGMMRQXO0G	7	3490000.00	0.00	30000.00	3520000.00	1	\N	Cao Hoài Bảo - 0366945917\n132, Xã Lũng Cú, Huyện Đồng Văn, Tỉnh Hà Giang	standard	bank_transfer	pending	\N	2026-03-15 12:44:09.041
30	NGMMRR0XIU	7	890000.00	0.00	30000.00	920000.00	1	\N	Cao Hoài Bảo - 0366945917\n133, Phường Trúc Bạch, Quận Ba Đình, Thành phố Hà Nội	standard	bank_transfer	pending	\N	2026-03-15 12:46:41.335
31	NGMMRR1D6Z	7	890000.00	0.00	30000.00	920000.00	1	\N	Cao Hoài Bảo - 0366945917\n133, Thị trấn Phó Bảng, Huyện Đồng Văn, Tỉnh Hà Giang	standard	bank_transfer	pending	\N	2026-03-15 12:47:01.643
33	NGMMRRDA0H	7	2190000.00	0.00	30000.00	2220000.00	1	\N	Cao Hoài Bảo - 0366945917\n132, Phường Trúc Bạch, Quận Ba Đình, Thành phố Hà Nội	standard	momo	pending	\N	2026-03-15 12:56:17.395
26	NGMMRLVLZ2	10	3490000.00	300000.00	30000.00	3220000.00	5	4	Cao Hoài Bảo - 0366945917\n146, ấp Ngã Cạy, Xã Đông Yên, Huyện An Biên, Tỉnh Kiên Giang	standard	cod	pending	\N	2026-03-15 10:22:35.017
34	NG406A454E99	11	3490000.00	0.00	50000.00	3540000.00	4	\N	Nguyễn Văn A - 0583849780\n144, Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội	express	bank_transfer	pending	\N	2026-03-16 03:22:32.589
\.


--
-- Data for Name: post_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.post_categories (id, name, slug, color, created_at) FROM stdin;
1	Tin tức	news	#00b4ff	2026-03-15 17:58:31.624682
2	Đánh giá	review	#a78bfa	2026-03-15 17:58:31.624682
3	Hướng dẫn	guide	#00e5ff	2026-03-15 17:58:31.624682
4	Mẹo hay	tips	#00ff9d	2026-03-15 17:58:31.624682
5	Cập nhật	update	#ffb800	2026-03-15 17:58:31.624682
6	Sự kiện	event	#f97316	2026-03-15 17:58:31.624682
7	Test	test	#e879f9	2026-03-15 13:22:50.742
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.posts (post_id, user_id, title, slug, thumbnail, content, excerpt, category, is_published, published_at, created_at, updated_at, deleted_at) FROM stdin;
1	1	Top 5 Bàn Phím Cơ Đáng Mua Nhất 2025	top-5-ban-phim-co-dang-mua-nhat-2025	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773061931/neongear/posts/fverhodrcnyrwtn2udr8.jpg			review	t	2026-03-06 20:16:04.488577	2026-03-06 20:16:04.488577	2026-03-09 20:12:13.078112	\N
4	7	Giải ngố về bàn phím Rapid Trigger: "Hack" kỹ năng với RT, SOCD, DKS và hơn thế nữa	giai-ngo-ve-ban-phim-rapid-trigger-hack-ky-nang-voi-rt-socd-dks-va-hon-the-nua	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773555082/neongear/posts/rwtsgtku5ymassi8ugfx.webp	Nếu các bạn dạo quanh các group gaming gear hay cộng đồng Valorant/CS2 gần đây, chắc chắn cụm từ "Rapid Trigger" hay "bàn phím từ tính" (HE) đang chiếm sóng khắp nơi. Người ta bảo nhau đây là "Pay to Win", là "cheat phần cứng".\r\n\r\nNhưng thực sự mua một con phím HE về có giúp bạn leo rank ngay lập tức không? Hay chỉ tổ đau ví? Để trả lời câu hỏi này, chúng ta cần hiểu rõ những tính năng "thần thánh" đi kèm với nó. Không định nghĩa sách vở, bài viết này sẽ giải thích Rapid Trigger (RT), SOCD, DKS, Mod Tap... bằng ngôn ngữ của người chơi phím thực thụ và cách dùng nó trong thực tế.\r\n\r\n1. Rapid Trigger (RT) - "Linh hồn" của bàn phím từ tính\r\n\r\n\r\nĐây là tính năng quan trọng nhất, lý do chính khiến anh em xuống tiền.\r\n\r\nRapid Trigger? Ở phím cơ truyền thống, bạn phải nhả phím qua một điểm cố định (reset point) thì phím mới ngắt tín hiệu. Với Rapid Trigger, điểm reset không cố định. Ngay khoảnh khắc bạn nhả tay nhẹ lên (dù phím chưa nảy hết hành trình), tín hiệu sẽ ngắt ngay lập tức. Và ngược lại, nhích nhẹ xuống là nhận lại ngay.\r\n\r\nỨng dụng thực tế:\r\n\r\nGame FPS (Valorant/CS2): Đây là trùm cuối cho kỹ thuật Counter-Strafe. Bạn đang chạy (phím A), thả tay ra một chút xíu là nhân vật đứng khựng lại ngay để bắn chuẩn xác. Không còn độ trễ, không còn cảm giác nhân vật bị trôi.\r\nGame Rhythm (Osu!): Spam phím tốc độ cao cực sướng vì hành trình phím ngắn và phản hồi siêu lẹ.\r\n2. Rappy Snappy (RS) & Snappy Tappy (SOCD) - Kẻ gây tranh cãi\r\n\r\n\r\nHai thuật ngữ này thực chất nói về cùng một khái niệm xử lý tín hiệu đầu vào, nhưng mỗi hãng gọi một kiểu (Razer gọi là Snappy Tappy, Wooting gọi là Rappy Snappy). Gốc rễ của nó là SOCD (Simultaneous Opposing Cardinal Directions).\r\n\r\nNó là gì? Điều gì xảy ra khi bạn nhấn 2 phím đối lập (ví dụ A và D) cùng một lúc?\r\n\r\nPhím thường: Nhân vật đứng yên hoặc ưu tiên phím bấm trước.\r\nBật SOCD/Snappy Tappy: Bàn phím sẽ ưu tiên phím bấm sau cùng hoặc phím có hành trình sâu hơn.\r\nỨng dụng thực tế: Trong FPS, khi bạn đang strafe sang trái (A) và muốn đổi hướng sang phải (D) tức thì:\r\n\r\nBình thường bạn phải nhả A rồi mới bấm D (có một khoảng hở deadzone).\r\nVới tính năng này, bạn cứ giữ A và bấm đè D, nhân vật sẽ đổi hướng sang phải ngay lập tức mà không cần nhả A.\r\nLưu ý: Tính năng này hỗ trợ tốt đến mức Valve (CS2) đã từng phải ra lệnh cấm/hạn chế ở một số server vì nó làm giảm kỹ năng counter-strafe thủ công. Các bạn dùng nhớ check luật game bạn đang chơi nhé!\r\n\r\n3. Dynamic Keystroke (DKS) - Một phím, đa nhân cách\r\n\r\n\r\nNếu RT là về tốc độ, thì DKS là về sự đa năng.\r\n\r\nNó là gì? DKS cho phép bạn gán tới 4 hành động trên một lần nhấn phím dựa trên độ sâu hành trình:\r\n\r\nNhấn nhẹ (ví dụ 0.5mm) -> Hành động A.\r\nNhấn sâu (ví dụ 3.0mm) -> Hành động B.\r\nNhả nhẹ -> Hành động C.\r\nNhả hết -> Hành động D.\r\nỨng dụng thực tế:\r\n\r\nGame FPS/MMO: Gán phím W sao cho: nhấn nhẹ là đi bộ (Walk), nhấn sâu là chạy (Run). Không cần giữ thêm phím Shift hay Ctrl nữa.\r\nCombo Game: Trong một số game, bạn có thể cài đặt để vừa nhấn xuống là rút súng, nhấn sâu hơn là bắn luôn.\r\n4. Mod Tap (MT) - Cứu tinh của layout nhỏ\r\n\r\n\r\nNhững bạn thích chơi layout 60% hay 65% chắc chắn sẽ yêu tính năng này.\r\n\r\nNó là gì? Phân biệt hành động dựa trên việc bạn Gõ (Tap) hay Giữ (Hold) phím.\r\n\r\nỨng dụng thực tế:\r\n\r\nCụm mũi tên: Bạn có thể cài đặt 4 phím Right Shift, Fn, Ctrl, Menu ở góc dưới bên phải thành cụm mũi tên.\r\nGõ nhanh (Tap) = Lên/Xuống/Trái/Phải.\r\nGiữ (Hold) = Vẫn là Shift/Ctrl như bình thường.\r\nNút Caps Lock: Gõ nhanh là Esc, giữ là Ctrl (Rất tiện cho dân code hoặc dùng Vim).\r\n5. Toggle Switch (TGL) - Chế độ rảnh tay\r\nNó là gì? Biến một phím bất kỳ thành công tắc Bật/Tắt (On/Off). Nhấn một lần để kích hoạt và giữ luôn trạng thái đó, nhấn lần nữa để tắt.\r\n\r\nỨng dụng thực tế: thường tính năng này dùng để bổ trợ những setting mà game không hỗ trợ.\r\n\r\nAuto-run: Trong PUBG hay Fortnite, gán một phím TGL cho nút chạy. Bấm một cái rồi thả tay ra ngồi uống nước, nhân vật vẫn cứ chạy.\r\nGiữ tâm ngắm (ADS): Dành cho ai không thích phải giữ chuột phải liên tục để ngắm bắn.\r\n6. OKS (One Key Switching / On-board Key Storage)\r\nThuật ngữ này có thể thay đổi tùy hãng (như MonsGeek hay một số hãng Trung Quốc dùng định nghĩa riêng), nhưng thường được hiểu theo hướng tối ưu hóa macro hoặc chuyển layer nhanh.\r\n\r\nCách hiểu phổ biến: OKS thường cho phép bạn kích hoạt một chuỗi macro hoặc thay đổi toàn bộ layout bàn phím chỉ bằng việc giữ hoặc nhấn một phím cụ thể mà không cần độ trễ phần mềm.\r\n\r\nỨng dụng thực tế:\r\n\r\nChuyển đổi nhanh giữa bộ setting "Làm việc" (gõ êm, hành trình phím sâu để đỡ gõ nhầm) và bộ setting "Gaming" (Rapid trigger nhạy, hành trình ngắn) chỉ bằng một nút bấm nóng trên bàn phím.\r\n\r\nTổng kết: Có đáng tiền không?\r\nBàn phím Rapid Trigger với các công nghệ RS, DKS, SOCD không làm bạn từ "gà" hóa "pro" chỉ sau một đêm. Nhưng nó giúp xóa bỏ giới hạn phần cứng.\r\n\r\nNếu bạn cảm thấy tay mình nhanh hơn phím, hoặc bạn thua pha đấu súng chỉ vì nhân vật dừng lại chậm hơn địch 0.1 giây, thì đây chính là mảnh ghép bạn đang thiếu. Còn nếu chỉ gõ văn bản hay chơi game chill chill, một con phím cơ thường là quá đủ.\r\n\r\nLời khuyên: Đừng quá sa đà vào thông số, hãy chỉnh setting (độ nhạy RT) phù hợp với tay của mình. Chỉnh nhạy quá (0.1mm) mà tay hay run thì chỉ có tự bóp team thôi! Hãy học cách từng tính năng hoạt động, tự tay chỉnh từng thông số sao cho phù hợp với khả năng mình nhất để bạn tự tin chơi game thật thoáng tay, như cách các kỹ sư F1 tối ưu chiếc xe phù hợp cho từng tay đua vậy đó!		guide	t	2026-03-15 13:11:26.293775	2026-03-15 06:11:26.168	2026-03-15 13:11:26.293775	\N
5	7	5 Tiêu Chí Chọn Chuột Chơi Game Tốt Nhất: Cập nhật từ xu hướng và dữ liệu mới nhất	5-tieu-chi-chon-chuot-choi-game-tot-nhat-cap-nhat-tu-xu-huong-va-du-lieu-moi-nhat	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773555193/neongear/posts/j9adiyrjupmcjqrtgu53.webp	Thị trường gaming gear đầu năm 2026 vừa chứng kiến sự bùng nổ công nghệ tại triển lãm CES diễn ra tại Las Vegas. Khái niệm "chuột tốt" đã thay đổi hoàn toàn: Nó không còn là cuộc đua về chỉ số DPI vô nghĩa, mà là cuộc cách mạng về độ trễ (latency) và vật liệu học.\r\n\r\nNếu bạn đang tìm kiếm chuột chơi game để leo rank Valorant hay CS2 trong năm nay, đừng bỏ qua bài phân tích chuyên sâu dựa trên dữ liệu thực tế dưới đây.\r\n\r\n1. Trọng Lượng: Kỷ Nguyên "Magnesium & Carbon" (dưới 40g)\r\n\r\n\r\nĐã qua rồi thời kỳ chuột 60g được gọi là nhẹ. Năm 2026, chuẩn mực của chuột siêu nhẹ đã bị đẩy xuống mức cực hạn: 30g - 45g.\r\n\r\nVật liệu mới: Thay vì nhựa ABS đục lỗ (honeycomb) của năm 2023, các dòng flagship năm 2026 (như các mẫu vừa ra mắt tại CES 2026) sử dụng hợp kim Magie (Magnesium Alloy) hoặc sợi Carbon đúc nguyên khối. Điều này giúp chuột vừa nhẹ hơn, vừa cứng hơn gấp 3 lần nhựa.\r\nVật lý học trong game: Theo nghiên cứu từ humanbenchmark.com, việc giảm trọng lượng chuột từ 60g xuống 40g giúp cải thiện tốc độ "flick" mục tiêu nhanh hơn 12% và giảm lực hãm (stopping force) cần thiết, cho phép tâm dừng lại chính xác ngay đầu địch thủ.\r\nXu hướng Pro: Thống kê từ giải đấu Valorant Champions 2025 cho thấy 78% tuyển thủ sử dụng chuột có trọng lượng dưới 50g.\r\nHãy thử tìm kiếm các từ khóa "Magnesium Chassis" hoặc "Carbon Composite" trong bảng thông số kỹ thuật. Đây là tiêu chuẩn mới cho độ bền và trọng lượng, hoặc là trend mà các hãng công nghệ muốn bạn chi nhiều hơn trong năm 2026.\r\n\r\n2. Polling Rate & Cảm Biến: Cuộc Đua "Real 8KHz Wireless"\r\nChuột không dây siêu nhẹ Pulsar Xlite V4 eS (Đi kèm dongle 8K Polling Rate).\r\n\r\nNếu năm 2024, 4KHz là tính năng cao cấp, thì đến tháng 2026, 8000Hz (8K) không dây là tiêu chuẩn bắt buộc cho dòng High-end.\r\n\r\nTại sao con số này quan trọng?\r\nĐồng bộ với màn hình 540Hz: Năm 2026, màn hình tần số quét 540Hz đã phổ biến trong giới thi đấu. Một con chuột 1000Hz (gửi dữ liệu 1ms/lần) sẽ tạo ra hiện tượng "lệch pha" với màn hình 540Hz (làm mới 1.8ms/lần).\r\nDữ liệu từ NVIDIA Reflex: Các thử nghiệm mới nhất cho thấy chuột 8KHz giảm độ trễ hệ thống (system latency) xuống dưới 0.125ms. Trong các pha đấu súng tích tắc của CS2, con số này quyết định ai là người bắn viên đạn đầu tiên.\r\nMotion Sync: Các cảm biến thế hệ mới (như PAW3955 giả định) đã tích hợp thuật toán Motion Sync cấp phần cứng, giúp đường di chuột trên màn hình khớp hoàn hảo 1:1 với thao tác tay, loại bỏ hoàn toàn hiện tượng rung tâm (jitter) dù ở DPI cao.\r\n3. Form Cầm & Công Thái Học: Giải Mã Dữ Liệu Sinh Trắc Học\r\nKhông có con chuột nào hoàn hảo cho tất cả, nhưng dữ liệu thống kê năm 2026 đã chỉ ra sự phân hóa rõ rệt trong thiết kế form chuột.\r\n\r\nSố liệu từ ProSettings.net (Tính đến Q4/2025):\r\nNhóm Aim "Tay to" (Palm Grip): Các dòng chuột công thái học (Ergo) có thiết kế phần lưng (hump) lùi về sau đang chiếm ưu thế. Thiết kế này giải phóng không gian cho cổ tay, giảm 30% áp lực lên ống cổ tay (Carpal Tunnel) so với thiết kế lưng giữa cũ.\r\nNhóm Aim "Tay nhỏ/Linh hoạt" (Fingertip/Claw): Xu hướng chuột chơi game size mini với phần hông (sides) phẳng hoàn toàn đang lên ngôi. Thiết kế hông phẳng giúp ngón áp út và ngón út bám chặt hơn, hỗ trợ các pha "micro-adjustment" (điều chỉnh tâm nhỏ) chuẩn xác.\r\n4. Switch Chuột: Optical Gen 5 - Chấm Dứt Kỷ Nguyên Cơ Học\r\nNăm 2026, nếu bạn mua một con chuột gaming cao cấp mà vẫn dùng switch cơ học (mechanical switch), bạn đang lãng phí tiền.\r\n\r\nSự vượt trội của Quang học (Optical):\r\nTốc độ: Switch quang học thế hệ 5 (Gen 5) sử dụng chùm tia hồng ngoại để kích hoạt, đạt tốc độ phản hồi 0.2ms (nhanh gấp 3 lần switch cơ học tốt nhất).\r\nĐộ tin cậy: Thử nghiệm độ bền thực tế cho thấy switch quang học duy trì cảm giác nhấn (click feel) ổn định suốt 90 triệu lần nhấn, trong khi switch cơ học bắt đầu bị mềm đi (mushy) sau 20 triệu lần.\r\nDebounce Delay = 0: Bạn có thể spam chuột liên tục (như khi bắn súng lục trong Valorant) mà không sợ bị delay tín hiệu như chuột cơ học cũ.\r\n5. Chọn Chuột Theo Tựa Game: FPS Tactical vs. Fast-Paced\r\nChuột Chơi Valorant\r\nĐặc thù 2026: Meta game hiện tại tập trung vào các đặc vụ (Agents) có khả năng di chuyển siêu tốc (như Neon, Jett). Bạn cần chuột để phản xạ cực nhanh.\r\nCấu hình tối ưu:\r\nTrọng lượng: < 45g (Bắt buộc).\r\nFeet chuột: Dot Skates (Feet chấm tròn nhỏ) bằng kính hoặc PTFE cứng để giảm ma sát tối đa, giúp vẩy tâm nhanh.\r\nDáng: Đối xứng thấp (Low-profile symmetrical).\r\nChuột Chơi CS2\r\nĐặc thù 2026: Cơ chế sub-tick của CS2 ngày càng hoàn thiện, yêu cầu độ chính xác tuyệt đối trong từng pha spray control.\r\nCấu hình tối ưu:\r\nTrọng lượng: 55g - 60g (Cần một chút sức nặng để đầm tay).\r\nFeet chuột: Wall-to-wall PTFE (Feet bản lớn) để tăng lực hãm (stopping power), giúp dừng tâm chính xác ngay đầu địch.\r\nDáng: Công thái học (Ergo) để khóa chặt lòng bàn tay.\r\nKết Luận: Đừng Mua Theo Thương Hiệu, Hãy Mua Thuận Tay Nhất (và thông số tốt)\r\nNăm 2026 là năm của sự thực dụng. Một con chuột chơi game tốt nhất không phải là con chuột đắt nhất, mà là con chuột giúp bạn loại bỏ mọi rào cản vật lý giữa suy nghĩ và màn hình.\r\n\r\nHãy lưu lại checklist này khi chọm mua chuột chơi game mới nhé:\r\n\r\n[ ] Trọng lượng có dưới 50g không? (Trừ khi bạn chuyên bắn tỉa CS2).\r\n[ ] Có hỗ trợ Wireless 4KHz/8KHz không?\r\n[ ] Switch có phải là Quang học (Optical) không?\r\n[ ] Form cầm có phù hợp với kích thước tay của bạn không?\r\nTất nhiên toàn bộ tiêu chí trên không phải phù hợp với tất cả mọi người. Tuy gu, tùy thói quen mà vài mục trên có thể bỏ qua để tìm được mẫu chuột bạn dùng thuật tay nhất.		review	t	2026-03-15 13:13:16.474473	2026-03-15 06:13:16.452	2026-03-15 13:13:16.474473	\N
6	7	Cải thiện Osu! Ranking với tính năng Rapid Trigger: Có thực sự hiệu quả?	cai-thien-osu-ranking-voi-tinh-nang-rapid-trigger-co-thuc-su-hieu-qua	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773555408/neongear/posts/ubdskonecdtsk7nwy2fa.webp	Trong cộng đồng Osu!, câu chuyện về "giới hạn phần cứng" (hardware bottleneck) luôn là chủ đề gây tranh cãi. Tuy nhiên, sự xuất hiện của công nghệ Rapid Trigger trên các dòng bàn phím HE (Hall Effect) trong vài năm gần đây đã thay đổi hoàn toàn cục diện bảng xếp hạng thế giới.\r\n\r\nLiệu việc đầu tư vào một chiếc bàn phím rapid trigger có thực sự là "chiếc chìa khóa vàng" giúp bạn leo rank, hay chỉ là chiêu trò marketing? Hãy cùng phân tích dựa trên cơ chế hoạt động và dữ liệu thực tế.\r\n\r\n1. Rapid Trigger là gì và tại sao nó quan trọng trong Osu!?\r\n\r\n\r\nĐể hiểu tại sao Rapid Trigger lại gây sốt, chúng ta cần nhìn lại cơ chế của bàn phím cơ truyền thống.\r\n\r\nCơ chế truyền thống: Một switch cơ học thường có điểm kích hoạt (actuation point) cố định (ví dụ: 2.0mm) và điểm reset cố định. Bạn phải nhả phím qua điểm reset đó thì phím mới nhận tín hiệu ngắt, sau đó mới có thể nhấn lần tiếp theo.\r\nCơ chế Rapid Trigger: Công nghệ này loại bỏ điểm reset cố định. Phím sẽ reset ngay lập tức khi bạn nhả tay ra, dù chỉ là 0.1mm. Điều này cho phép bạn spam phím (stream) với tốc độ cao hơn mà không cần phím phải nảy lên hết hành trình.\r\nTóm lại:Rapid Trigger giúp giảm độ trễ vật lý khi thao tác phím liên tục, yếu tố sống còn trong các map Osu! có BPM (Beats Per Minute) cao.\r\n\r\n2. Bàn phím HE (Hall Effect) - "Trái tim" của công nghệ Rapid Trigger\r\nKhông phải bàn phím nào cũng có thể update firmware để có Rapid Trigger. Tính năng này hoạt động tốt nhất trên bàn phím HE (sử dụng switch từ tính).\r\n\r\nKhác với switch cơ học dùng lá đồng tiếp xúc, switch HE dùng nam châm và cảm biến để đo khoảng cách hành trình phím liên tục theo thời gian thực.\r\n\r\nTại sao Gamer Osu! cần bàn phím HE?\r\nĐộ bền tuyệt đối: Không có lá đồng ma sát, tuổi thọ switch lên tới hàng trăm triệu lần nhấn – cực kỳ quan trọng với cường độ spam phím của Osu!.\r\nTùy chỉnh độ nhạy: Bạn có thể chỉnh điểm nhận phím xuống mức cực thấp (0.1mm) trên bàn phím HE, giúp phản xạ nhanh hơn so với mức trung bình 2.0mm của Red Switch thông thường.\r\n3. Phân tích hiệu quả: Rapid Trigger có giúp tăng Rank?\r\nCâu trả lời ngắn gọn là: CÓ. Nhưng hãy nhìn vào các dẫn chứng và số liệu cụ thể.\r\n\r\nLuận điểm 1: Cải thiện tốc độ Stream và Stamina\r\nTrong Osu!, "Streaming" (nhấn hai phím liên tục ở tốc độ cao) là kỹ năng khó nhất.\r\n\r\nDẫn chứng kỹ thuật: Với switch truyền thống, bạn mất khoảng 30-50ms (mili-giây) cho hành trình hồi phím (debounce time và travel time). Với bàn phím rapid trigger, thời gian này gần như bằng 0.\r\nHiệu quả: Người chơi có thể thực hiện các đoạn deathstream 200-240 BPM dễ dàng hơn vì không bị kẹt phím (finger locking) do switch chưa kịp reset.\r\nLuận điểm 2: Giảm Unstable Rate (UR) – Tăng độ chính xác\r\nUR là chỉ số đo độ ổn định khi gõ nhịp. UR càng thấp, khả năng đạt SS hoặc PP (Performance Points) cao càng lớn.\r\n\r\nThực tế: Việc phím nhận tín hiệu ngay khi chạm nhẹ và ngắt ngay khi nhả giúp đồng bộ hóa tốt hơn giữa não bộ và ngón tay.\r\nSố liệu: Nhiều người chơi báo cáo mức UR giảm từ trung bình 120 xuống dưới 90 sau khi chuyển sang dùng Wooting 60HE (chiếc bàn phím rapid trigger tiêu chuẩn vàng hiện nay).\r\nLuận điểm 3: Sự thống trị của Top Player\r\nDẫn chứng thuyết phục nhất nằm ở bảng xếp hạng Osu! thế giới (Global Ranking).\r\n\r\nTop 1: Mrekk – người chơi giữ vị trí số 1 thế giới trong thời gian dài – sử dụng Wooting 60HE. Sự thống trị của Mrekk với các kỷ lục PP không tưởng (1300pp, 1400pp plays) phần lớn nhờ vào khả năng aim và speed khủng khiếp được hỗ trợ bởi Rapid Trigger.\r\nTop 100: Theo thống kê từ cộng đồng, hơn 70% người chơi trong Top 100 thế giới hiện nay đã chuyển sang sử dụng các loại bàn phím HE có tính năng Rapid Trigger.\r\nTiêu chí so sánh\tBàn phím cơ truyền thống (Red Switch)\tBàn phím HE (Rapid Trigger)\r\nĐiểm kích hoạt\tCố định (thường là 2.0mm)\tTùy chỉnh (0.1mm - 4.0mm)\r\nĐiểm Reset\tCố định\tĐộng (Dynamic) theo hành trình ngón tay\r\nKhả năng Stream\tDễ bị khựng ở BPM cao\tMượt mà, giới hạn là ngón tay bạn\r\nGiá thành\tPhổ thông\tTương đối cao\r\n4. Rapid Trigger không phải là "Phép màu"\r\nMặc dù bàn phím rapid trigger mang lại lợi thế phần cứng rõ rệt, nó không thể thay thế kỹ năng nền tảng.\r\n\r\nReading (Khả năng đọc map): Rapid Trigger không giúp bạn đọc AR11 (Approach Rate) nhanh hơn.\r\nAim (Khả năng di chuột): Nếu tay cầm chuột/tablet của bạn không chuẩn, bàn phím xịn đến mấy cũng vô dụng.\r\nKết luận: Rapid Trigger giúp loại bỏ rào cản vật lý để bạn phát huy 100% kỹ năng thực tế, nhưng nó không tự nhiên biến bạn từ hạng 6 chữ số lên 3 chữ số nếu bạn không luyện tập.\r\n\r\n5. Lời khuyên khi chọn mua bàn phím Rapid Trigger\r\nNếu bạn quyết định đầu tư, thị trường bàn phím HE hiện nay đã đa dạng hơn rất nhiều, không chỉ còn mỗi Wooting.\r\n\r\nPhân khúc cao cấp (Best Performance): Các dòng sản phẩm của MelGeek, DrunkDeer và WLmouse tuy không nổi tiếng từ thời kỳ đầu như Wooting nhưng hiệu năng, chất lượng hoàn thiện có thể sánh ngang và luôn cập nhật các côn nghệ mới nhanh chóng: MelGeek Centauri 80, DrunkDeer A75 Ultra, WLmouse HUAN63, Pulsar eS 70 HE,...\r\nPhân khúc tầm trung: Các dòng này tập trung vào mức hiệu năng trên giá thành tốt hơn, có thể hi sinh một chút về ngoại hình hoặc vật liệu chế tác nhưng hiệu năng không đổi: MelGeek Made68 Pro Plus, Real67, Pulsar PCMK3 HE,...\r\nPhân khúc giá rẻ: Giá thành vừa túi hơn đến từ các thương hiệu ít nổi tiếng hơn. Tuy nhiên hiệu năng có thể so sánh được với các thương hiệu nổi tiếng và độ chênh lệch không quá cao: Scyrox Xpunk63, DrunkDeer X60 Series,...\r\nTổng kết\r\nViệc cải thiện Osu! ranking với tính năng Rapid Trigger là hoàn toàn có cơ sở khoa học và thực tiễn. Công nghệ trên bàn phím HE giúp loại bỏ độ trễ dư thừa, cho phép game thủ bứt phá giới hạn tốc độ và độ chính xác. Nếu bạn đang cảm thấy mình bị "kẹt" ở một mức rank và phím cơ cũ không còn đáp ứng được tốc độ ngón tay, thì Rapid Trigger chính là khoản đầu tư đáng giá nhất lúc này.		guide	t	2026-03-15 13:16:51.327883	2026-03-15 06:16:51.304	2026-03-15 13:16:51.327883	\N
2	1	Hướng Dẫn Chọn Chuột Gaming Phù Hợp Với Tay Cầm	huong-dan-chon-chuot-gaming-phu-hop-tay-cam	\N	<p>Kiểu cầm chuột ảnh hưởng trực tiếp đến hiệu suất gaming...</p>	Palm grip, claw grip hay fingertip? Cách chọn chuột gaming đúng với kiểu cầm của bạn.	guide	t	2026-03-06 20:16:04.488577	2026-03-06 20:16:04.488577	2026-03-15 13:17:21.044447	2026-03-15 06:17:21.043
3	1	Flash Sale Cuối Tuần - Giảm Đến 20% Toàn Bộ Tai Nghe	flash-sale-cuoi-tuan-giam-20-tai-nghe	\N	<p>NeonGear trân trọng thông báo chương trình Flash Sale...</p>	Chương trình Flash Sale cuối tuần với ưu đãi lên đến 20% cho toàn bộ dòng tai nghe.	promotion	t	2026-03-06 20:16:04.488577	2026-03-06 20:16:04.488577	2026-03-15 13:17:23.152652	2026-03-15 06:17:23.151
\.


--
-- Data for Name: product_attribute_values; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_attribute_values (id, variant_id, attribute_id, value) FROM stdin;
1	1	1	Gateron Red
2	1	2	Bluetooth 5.1 / USB-C
3	1	3	75%
4	1	10	true
5	2	1	Gateron Brown
6	2	2	Bluetooth 5.1 / USB-C
7	2	3	75%
8	2	10	true
9	3	1	Gateron Red
10	3	2	Bluetooth 5.1 / USB-C
11	3	3	75%
12	3	10	true
13	4	1	Akko CS Jelly Pink
14	4	2	USB-C
15	4	3	TKL 87%
16	4	10	false
17	5	1	Scissor
18	5	2	Logi Bolt / Bluetooth
19	5	3	Full-size
20	6	1	Scissor
21	6	2	Logi Bolt / Bluetooth
22	6	3	Full-size
23	7	4	25600
24	7	5	2000Hz
25	7	6	95 giờ
26	8	4	25600
27	8	5	2000Hz
28	8	6	95 giờ
29	9	4	30000
30	9	5	8000Hz
31	10	4	8000
32	10	5	125Hz
33	10	2	Logi Bolt / Bluetooth
34	11	4	8000
35	11	5	125Hz
36	11	2	Logi Bolt / Bluetooth
37	12	4	8500
38	12	5	1000Hz
39	13	7	53mm
40	13	8	32 Ohm
41	13	9	15Hz-23kHz
42	13	6	30 giờ
43	14	7	50mm
44	14	8	32 Ohm
45	14	9	12Hz-28kHz
46	15	7	40mm
47	15	8	32 Ohm
48	15	9	10Hz-40kHz
49	15	6	Hot-swap battery
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_images (image_id, product_id, variant_id, image_url, alt_text, is_main, sort_order, created_at) FROM stdin;
1	1	\N	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773231744/neongear/products/z1rqvunkasm4koxbjs0q.webp	\N	t	0	2026-03-11 12:22:29.458
2	8	\N	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773555572/neongear/products/jalz9wndh5ezqdaj3t4m.jpg	\N	t	0	2026-03-15 06:19:36.123
3	9	\N	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773558829/neongear/products/ewaygzpjmdthur6br5gp.png	\N	t	0	2026-03-15 07:13:52.985
4	10	\N	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773570021/neongear/products/lnmypwaz06g6bdsf5swc.png	\N	t	0	2026-03-15 10:20:24.9
5	5	\N	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773570354/neongear/products/zhgayxqptkenoyharfsv.png	\N	t	0	2026-03-15 10:25:57.703
6	4	\N	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773570400/neongear/products/c3q5ysgvbr3nchrvglqd.webp	\N	t	0	2026-03-15 10:26:43.513
7	2	\N	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773570422/neongear/products/rvstwetnuamadfegghal.png	\N	t	0	2026-03-15 10:27:05.849
8	3	\N	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773570448/neongear/products/bk5pgtjkahm0ptu5n25l.webp	\N	t	0	2026-03-15 10:27:31.491
9	6	\N	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773570472/neongear/products/nqjaylelwbjksx6bn3dl.webp	\N	t	0	2026-03-15 10:27:55.701
10	7	\N	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773570496/neongear/products/wg1gj7mcal1pdaskwiya.jpg	\N	t	0	2026-03-15 10:28:19.873
11	5	\N	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773571582/neongear/products/t8tbjthwjkzeqrbhcatk.webp	\N	t	0	2026-03-15 10:46:25.826
12	11	\N	https://res.cloudinary.com/dxbebdpoq/image/upload/v1773581411/neongear/products/wsbmxa4b6ybcpaykugpz.webp	\N	t	0	2026-03-15 13:30:15.754
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_variants (variant_id, product_id, sku, price, compare_price, image_url, is_active, is_default, created_at, deleted_at) FROM stdin;
1	1	KCHK2P-BLK-RED	1890000.00	2100000.00	\N	t	t	2026-03-06 20:16:04.488577	\N
4	2	AK3087-OCN-CS45	890000.00	1050000.00	\N	t	t	2026-03-06 20:16:04.488577	\N
9	5	RZDAV3-BLK	1590000.00	1790000.00	\N	t	t	2026-03-06 20:16:04.488577	\N
13	8	HXCL2W-BLK	2190000.00	2490000.00	\N	t	t	2026-03-06 20:16:04.488577	\N
14	9	RZBSV2X-BLK	790000.00	990000.00	\N	t	t	2026-03-06 20:16:04.488577	\N
2	1	KCHK2P-BLK-BRN	1890000.00	\N	\N	t	f	2026-03-06 20:16:04.488577	\N
3	1	KCHK2P-WHT-RED	1990000.00	\N	\N	t	f	2026-03-06 20:16:04.488577	\N
5	3	LGMXK-GRY	2490000.00	\N	\N	t	t	2026-03-06 20:16:04.488577	\N
6	3	LGMXK-BLK	2490000.00	\N	\N	t	f	2026-03-06 20:16:04.488577	\N
7	4	LGPXSL2-WHT	3490000.00	\N	\N	t	t	2026-03-06 20:16:04.488577	\N
8	4	LGPXSL2-BLK	3490000.00	\N	\N	t	f	2026-03-06 20:16:04.488577	\N
10	6	LGMXM3S-GRY	2790000.00	\N	\N	t	t	2026-03-06 20:16:04.488577	\N
11	6	LGMXM3S-BLK	2790000.00	\N	\N	t	f	2026-03-06 20:16:04.488577	\N
12	7	SSRV3-BLK	490000.00	\N	\N	t	t	2026-03-06 20:16:04.488577	\N
15	10	SSNVPRO-BLK	4990000.00	\N	\N	t	t	2026-03-06 20:16:04.488577	\N
16	11	NG-20	2750000.00	\N	\N	t	f	2026-03-15 13:39:57.177	\N
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (product_id, name, slug, description, category_id, brand_id, is_active, created_at, deleted_at) FROM stdin;
1	Keychron K2 Pro	keychron-k2-pro	Bàn phím cơ 75% không dây Bluetooth 5.1, tương thích Mac/Windows, hot-swap switch.	4	4	t	2026-03-06 20:16:04.488577	\N
8	HyperX Cloud II Wireless	hyperx-cloud-ii-wireless	Tai nghe gaming không dây 7.1 surround, mic cardioid có thể tháo, pin 30 giờ.	9	6	t	2026-03-06 20:16:04.488577	\N
9	Razer BlackShark V2 X	razer-blackshark-v2-x	Tai nghe gaming có dây với driver TriForce 50mm, mic cardioid siêu định hướng.	9	2	t	2026-03-06 20:16:04.488577	\N
10	SteelSeries Arctis Nova Pro	steelseries-arctis-nova-pro	Tai nghe gaming cao cấp, ANC chủ động, pin hoán đổi nóng, Hi-Res audio.	9	3	t	2026-03-06 20:16:04.488577	\N
4	Logitech G Pro X Superlight 2	logitech-g-pro-x-superlight-2	Chuột gaming không dây siêu nhẹ 60g, sensor HERO 2 25K DPI, pin 95 giờ.	7	1	t	2026-03-06 20:16:04.488577	\N
2	Akko 3087 Ocean Star	akko-3087-ocean-star	Bàn phím cơ TKL với keycap dye-sub PBT họa tiết đại dương, switch Akko CS.	4	5	t	2026-03-06 20:16:04.488577	\N
3	Logitech MX Keys	logitech-mx-keys	Bàn phím không dây cao cấp cho văn phòng, kết nối Bolt USB + Bluetooth, sạc USB-C.	6	1	t	2026-03-06 20:16:04.488577	\N
6	Logitech MX Master 3S	logitech-mx-master-3s	Chuột văn phòng cao cấp, cuộn MagSpeed, kết nối Bolt/Bluetooth, 8K DPI.	8	1	t	2026-03-06 20:16:04.488577	\N
7	SteelSeries Rival 3	steelseries-rival-3	Chuột gaming có dây giá tốt, sensor TrueMove Core 8500 DPI, 6 nút.	7	3	t	2026-03-06 20:16:04.488577	\N
5	Razer DeathAdder V3	razer-deathadder-v3	Chuột gaming có dây ergonomic, sensor Focus Pro 30K, polling rate 8000Hz.	7	2	t	2026-03-06 20:16:04.488577	\N
11	MelGeek REAL67 – Bàn phím HE scan Rapid Trigger	melgeek-real67-ban-phim-he-scan-rapid-trigger	MelGeek REAL67 là bàn phím cơ Hall Effect (HE) 65% cao cấp, nổi bật với công nghệ Rapid Trigger siêu nhạy (độ chính xác 0.01mm) và tần số quét 16K, tối ưu cho game thủ chuyên nghiệp. Bàn phím có cấu trúc Gasket-mount 5 lớp giảm âm, switch từ tính ổn định, hỗ trợ Snap Tap và khả năng tùy chỉnh cao, mang lại cảm giác gõ mượt mà, âm thanh Hi-Fi. \n	4	8	t	2026-03-15 13:30:12.191	\N
\.


--
-- Data for Name: review_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.review_images (image_id, review_id, image_url, alt_text, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (review_id, product_id, user_id, order_id, rating, comment, is_approved, created_at, deleted_at) FROM stdin;
1	4	2	1	5	Chuột cực nhẹ, trơn tru, pin trâu. Dùng cả ngày không mỏi tay. Highly recommend!	t	2026-03-06 20:16:04.488577	\N
2	1	3	2	5	Keychron K2 Pro gõ rất sướng, kết nối Bluetooth ổn định. Chuyển Mac/Win dễ dàng.	t	2026-03-06 20:16:04.488577	\N
3	4	10	26	5	Bàn phím chất lượng	t	2026-03-15 13:15:09.988	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (user_id, full_name, email, password_hash, phone, address, avatar_url, date_of_birth, is_verified, role, last_login, created_at, deleted_at, is_locked) FROM stdin;
3	Trần Thị Bích	bich.tran@gmail.com	$2b$10$cz4tIV8I7rklnl/G8j1HyOrymWFH4A8uhvFQjc82l94T8MOYwY8f6	0901000003	Đà Nẵng	\N	\N	t	user	\N	2026-03-06 20:16:04.488577	2026-03-15 06:33:41.706	f
2	Nguyễn Văn An	an.nguyen@gmail.com	$2b$10$cz4tIV8I7rklnl/G8j1HyOrymWFH4A8uhvFQjc82l94T8MOYwY8f6	0901000002	TP. Hồ Chí Minh	\N	\N	t	user	\N	2026-03-06 20:16:04.488577	\N	f
4	Lê Minh Cường	cuong.le@gmail.com	$2b$10$cz4tIV8I7rklnl/G8j1HyOrymWFH4A8uhvFQjc82l94T8MOYwY8f6	0901000004	Hải Phòng	\N	\N	f	user	\N	2026-03-06 20:16:04.488577	\N	f
5	Phạm Thị Dung	dung.pham@gmail.com	$2b$10$cz4tIV8I7rklnl/G8j1HyOrymWFH4A8uhvFQjc82l94T8MOYwY8f6	0901000005	Cần Thơ	\N	\N	t	user	\N	2026-03-06 20:16:04.488577	\N	f
6	Hoàng Văn Em	em.hoang@gmail.com	$2b$10$cz4tIV8I7rklnl/G8j1HyOrymWFH4A8uhvFQjc82l94T8MOYwY8f6	0901000006	Bình Dương	\N	\N	t	user	\N	2026-03-06 20:16:04.488577	\N	f
9	Test	test_tmp@test.com	$2b$10$cz4tIV8I7rklnl/G8j1HyOrymWFH4A8uhvFQjc82l94T8MOYwY8f6	\N	\N	\N	\N	f	user	\N	2026-03-08 00:40:11.675	\N	f
1	Admin	admin@neongear.vn	$2b$10$cz4tIV8I7rklnl/G8j1HyOrymWFH4A8uhvFQjc82l94T8MOYwY8f6	0338631274	Kiên Giang	https://res.cloudinary.com/dxbebdpoq/image/upload/v1772983793/neongear/avatars/w8vrshrlaeui1nbevof5.jpg	\N	t	admin	2026-03-15 10:35:53.5	2026-03-06 20:16:04.488577	\N	f
10	Cao Hoài Bảo	caohoaibao106@gmail.com	$2b$10$NrHCEksU9D.euy1opZVoq.JUxweNFZ7BW4bDCGPHx6/4ESyTCiEAO			https://res.cloudinary.com/dxbebdpoq/image/upload/v1773553867/neongear/avatars/x36tx97ovsdcr67ijjxz.jpg	\N	f	user	2026-03-16 02:59:22.818	2026-03-13 14:07:40.063	\N	f
11	Nguyễn Văn A	bao226588@student.nctu.edu.vn	$2b$10$tmYcCiBmjCLN381Tkr74DebhdBKgzXOi7MOHNvjHkcBhrJDvbHHqu	\N	\N	\N	\N	f	user	\N	2026-03-16 03:22:02.329	\N	f
7	Cao Hoài Bảo	caohoaibao.work@gmail.com	$2b$10$1bhnw/t9TqAH2hGqSn4EJulsLJ7rp/Lh8JWS1o1gXIAHAyTe6txCC	0366945917	\N	\N	\N	f	admin	2026-03-16 03:23:50.896	2026-03-07 00:42:30.082	\N	f
\.


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wishlists (wishlist_id, user_id, product_id, variant_id, created_at) FROM stdin;
1	2	10	15	2026-03-06 20:16:04.488577
2	2	1	1	2026-03-06 20:16:04.488577
3	3	4	8	2026-03-06 20:16:04.488577
4	4	9	14	2026-03-06 20:16:04.488577
6	9	1	\N	2026-03-08 00:41:35.635
9	1	7	12	2026-03-08 15:37:02.503
10	1	3	6	2026-03-13 13:48:10.673
\.


--
-- Name: attributes_attribute_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attributes_attribute_id_seq', 10, true);


--
-- Name: brands_brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.brands_brand_id_seq', 8, true);


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 23, true);


--
-- Name: carts_cart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.carts_cart_id_seq', 10, true);


--
-- Name: categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_category_id_seq', 10, true);


--
-- Name: contacts_contact_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contacts_contact_id_seq', 5, true);


--
-- Name: coupon_usages_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupon_usages_usage_id_seq', 3, true);


--
-- Name: coupons_coupon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupons_coupon_id_seq', 6, true);


--
-- Name: email_subscribers_subscriber_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_subscribers_subscriber_id_seq', 4, true);


--
-- Name: inventory_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_inventory_id_seq', 16, true);


--
-- Name: inventory_transactions_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_transactions_transaction_id_seq', 72, true);


--
-- Name: order_details_order_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_details_order_detail_id_seq', 35, true);


--
-- Name: order_status_history_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_status_history_history_id_seq', 114, true);


--
-- Name: order_status_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_status_status_id_seq', 10, true);


--
-- Name: orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_order_id_seq', 34, true);


--
-- Name: post_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.post_categories_id_seq', 7, true);


--
-- Name: posts_post_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.posts_post_id_seq', 6, true);


--
-- Name: product_attribute_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_attribute_values_id_seq', 49, true);


--
-- Name: product_images_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_images_image_id_seq', 12, true);


--
-- Name: product_variants_variant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_variants_variant_id_seq', 16, true);


--
-- Name: products_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_product_id_seq', 11, true);


--
-- Name: review_images_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.review_images_image_id_seq', 1, false);


--
-- Name: reviews_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reviews_review_id_seq', 3, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_user_id_seq', 11, true);


--
-- Name: wishlists_wishlist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wishlists_wishlist_id_seq', 10, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: attributes attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_pkey PRIMARY KEY (attribute_id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (brand_id);


--
-- Name: brands brands_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_slug_key UNIQUE (slug);


--
-- Name: cart_items cart_items_cart_id_variant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_variant_id_key UNIQUE (cart_id, variant_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (cart_id);


--
-- Name: carts carts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key UNIQUE (user_id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (contact_id);


--
-- Name: coupon_usages coupon_usages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_pkey PRIMARY KEY (usage_id);


--
-- Name: coupon_usages coupon_usages_user_id_coupon_id_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_user_id_coupon_id_order_id_key UNIQUE (user_id, coupon_id, order_id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (coupon_id);


--
-- Name: email_subscribers email_subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_subscribers
    ADD CONSTRAINT email_subscribers_email_key UNIQUE (email);


--
-- Name: email_subscribers email_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_subscribers
    ADD CONSTRAINT email_subscribers_pkey PRIMARY KEY (subscriber_id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (inventory_id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: inventory inventory_variant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_variant_id_key UNIQUE (variant_id);


--
-- Name: order_details order_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_pkey PRIMARY KEY (order_detail_id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (history_id);


--
-- Name: order_status order_status_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status
    ADD CONSTRAINT order_status_name_key UNIQUE (name);


--
-- Name: order_status order_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status
    ADD CONSTRAINT order_status_pkey PRIMARY KEY (status_id);


--
-- Name: orders orders_order_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key UNIQUE (order_code);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: post_categories post_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_categories
    ADD CONSTRAINT post_categories_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (post_id);


--
-- Name: posts posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);


--
-- Name: product_attribute_values product_attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_pkey PRIMARY KEY (id);


--
-- Name: product_attribute_values product_attribute_values_variant_id_attribute_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_variant_id_attribute_id_key UNIQUE (variant_id, attribute_id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (image_id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (variant_id);


--
-- Name: product_variants product_variants_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_sku_key UNIQUE (sku);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: review_images review_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_images
    ADD CONSTRAINT review_images_pkey PRIMARY KEY (image_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (review_id);


--
-- Name: reviews reviews_product_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_user_id_key UNIQUE (product_id, user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (wishlist_id);


--
-- Name: idx_brands_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_deleted ON public.brands USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_cart_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_user ON public.carts USING btree (user_id);


--
-- Name: idx_categories_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_deleted ON public.categories USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_contacts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_email ON public.contacts USING btree (email);


--
-- Name: idx_contacts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_status ON public.contacts USING btree (status);


--
-- Name: idx_contacts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_user ON public.contacts USING btree (user_id);


--
-- Name: idx_coupon_usages_user_coup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_usages_user_coup ON public.coupon_usages USING btree (user_id, coupon_id);


--
-- Name: idx_coupons_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupons_deleted ON public.coupons USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_inventory_variant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_variant ON public.inventory USING btree (variant_id);


--
-- Name: idx_orders_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_code ON public.orders USING btree (order_code);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status_id);


--
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);


--
-- Name: idx_posts_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_deleted ON public.posts USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_posts_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_published ON public.posts USING btree (is_published, published_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: idx_posts_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_slug ON public.posts USING btree (slug);


--
-- Name: idx_posts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_user ON public.posts USING btree (user_id);


--
-- Name: idx_product_images_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_images_product ON public.product_images USING btree (product_id);


--
-- Name: idx_product_images_variant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_images_variant ON public.product_images USING btree (variant_id);


--
-- Name: idx_products_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_brand ON public.products USING btree (brand_id);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_deleted ON public.products USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_review_images_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_images_review ON public.review_images USING btree (review_id);


--
-- Name: idx_reviews_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_deleted ON public.reviews USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_reviews_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_product ON public.reviews USING btree (product_id);


--
-- Name: idx_users_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_deleted ON public.users USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_variants_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_variants_default ON public.product_variants USING btree (is_default) WHERE (is_default = true);


--
-- Name: idx_variants_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_variants_deleted ON public.product_variants USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_variants_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_variants_product ON public.product_variants USING btree (product_id);


--
-- Name: idx_wishlists_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wishlists_user ON public.wishlists USING btree (user_id);


--
-- Name: post_categories_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX post_categories_slug_key ON public.post_categories USING btree (slug);


--
-- Name: uniq_default_variant_per_product; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_default_variant_per_product ON public.product_variants USING btree (product_id) WHERE ((is_default = true) AND (deleted_at IS NULL));


--
-- Name: uniq_wishlist_user_product_variant; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_wishlist_user_product_variant ON public.wishlists USING btree (user_id, product_id, COALESCE(variant_id, '-1'::integer));


--
-- Name: orders trg_calc_final_amount; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_calc_final_amount BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fn_calc_final_amount();


--
-- Name: users trg_create_cart_on_register; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_create_cart_on_register AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.fn_create_cart_for_new_user();


--
-- Name: order_details trg_decrease_inventory; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_decrease_inventory AFTER INSERT ON public.order_details FOR EACH ROW EXECUTE FUNCTION public.fn_decrease_inventory();


--
-- Name: coupon_usages trg_increment_coupon_used; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_increment_coupon_used AFTER INSERT ON public.coupon_usages FOR EACH ROW EXECUTE FUNCTION public.fn_increment_coupon_used();


--
-- Name: orders trg_log_order_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_order_status AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fn_log_order_status();


--
-- Name: orders trg_restore_inventory_on_cancel; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_restore_inventory_on_cancel AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fn_restore_inventory_on_cancel();


--
-- Name: posts trg_set_published_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_published_at BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.fn_set_published_at();


--
-- Name: contacts trg_set_replied_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_replied_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.fn_set_replied_at();


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(cart_id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id);


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(category_id) ON DELETE SET NULL;


--
-- Name: contacts contacts_replied_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_replied_by_fkey FOREIGN KEY (replied_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: contacts contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: coupon_usages coupon_usages_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(coupon_id) ON DELETE CASCADE;


--
-- Name: coupon_usages coupon_usages_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE SET NULL;


--
-- Name: coupon_usages coupon_usages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: inventory_transactions inventory_transactions_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id) ON DELETE CASCADE;


--
-- Name: inventory inventory_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id) ON DELETE CASCADE;


--
-- Name: order_details order_details_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- Name: order_details order_details_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id) ON DELETE RESTRICT;


--
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- Name: order_status_history order_status_history_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.order_status(status_id);


--
-- Name: orders orders_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(coupon_id);


--
-- Name: orders orders_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.order_status(status_id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: product_attribute_values product_attribute_values_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attributes(attribute_id) ON DELETE CASCADE;


--
-- Name: product_attribute_values product_attribute_values_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_attribute_values
    ADD CONSTRAINT product_attribute_values_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id) ON DELETE CASCADE;


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


--
-- Name: product_images product_images_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


--
-- Name: products products_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id);


--
-- Name: review_images review_images_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_images
    ADD CONSTRAINT review_images_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(review_id) ON DELETE CASCADE;


--
-- Name: reviews reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE SET NULL;


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: wishlists wishlists_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 1kSoVdAAHCzQbBzVVRZGmr5yPrEIoa9crimdHvDXceYIQCPK1mJtrP1hJwZmB7R

