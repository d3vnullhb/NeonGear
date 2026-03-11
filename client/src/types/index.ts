export interface User {
  user_id: number
  full_name: string
  email: string
  phone?: string
  address?: string
  avatar_url?: string
  date_of_birth?: string
  role: string
  is_verified?: boolean
  last_login?: string
  created_at?: string
}

export interface Category {
  category_id: number
  name: string
  slug: string
  parent_id?: number
  image_url?: string
  is_visible?: boolean
  other_categories?: Category[]
}

export interface Brand {
  brand_id: number
  name: string
  slug: string
  description?: string
  logo_url?: string
}

export interface Attribute {
  attribute_id: number
  name: string
  data_type?: string
}

export interface ProductImage {
  image_id: number
  image_url: string
  alt_text?: string
  is_main?: boolean
  sort_order?: number
}

export interface ProductVariant {
  variant_id: number
  sku: string
  price: number | string
  compare_price?: number | string
  image_url?: string
  is_active?: boolean
  is_default?: boolean
  inventory?: { quantity: number }
  product_attribute_values?: { value: string; attributes?: { attribute_id: number; name: string } }[]
  product_images?: ProductImage[]
}

export interface Product {
  product_id: number
  name: string
  slug: string
  description?: string
  is_active?: boolean
  created_at?: string
  categories?: Category
  brands?: Brand
  product_images: ProductImage[]
  product_variants?: ProductVariant | ProductVariant[]
}

export interface CartItem {
  id: number
  cart_id: number
  variant_id: number
  quantity: number
  product_variants?: ProductVariant & { products?: { product_id: number; name: string; slug: string } }
}

export interface Cart {
  cart_id: number
  user_id: number
  cart_items: CartItem[]
}

export interface WishlistItem {
  wishlist_id: number
  user_id: number
  product_id: number
  variant_id?: number
  products?: { product_id: number; name: string; slug: string; product_images: ProductImage[] }
  product_variants?: { variant_id: number; sku: string; price: number; image_url?: string }
}

export interface OrderDetail {
  order_detail_id: number
  variant_id?: number
  product_name: string
  variant_info?: string
  sku: string
  price: number | string
  quantity: number
}

export interface OrderStatusHistory {
  history_id: number
  status_id: number
  changed_at: string
  note?: string
  order_status?: { name: string }
}

export interface Order {
  order_id: number
  order_code: string
  user_id: number
  total_amount: number | string
  discount_amount?: number | string
  shipping_fee?: number | string
  final_amount: number | string
  payment_method?: string
  payment_status?: string
  shipping_address: string
  note?: string
  created_at?: string
  order_status?: { status_id: number; name: string }
  order_details: OrderDetail[]
  order_status_history?: OrderStatusHistory[]
}

export interface Review {
  review_id: number
  product_id: number
  user_id: number
  rating: number
  comment?: string
  is_approved?: boolean
  created_at?: string
  users?: { user_id: number; full_name: string; avatar_url?: string }
  review_images?: { image_id: number; image_url: string }[]
}

export interface Coupon {
  coupon_id: number
  code: string
  discount_type?: string
  discount_value?: number | string
  min_order_amount?: number | string
  max_discount_amount?: number | string
  expiry_date?: string
  is_active?: boolean
}

export interface Post {
  post_id: number
  title: string
  slug: string
  thumbnail?: string
  excerpt?: string
  category?: string
  published_at?: string
  created_at?: string
  users?: { user_id: number; full_name: string }
}

export interface Pagination {
  total: number
  totalPages: number
  page: number
  limit: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  pagination?: Pagination
  errors?: unknown[]
}
