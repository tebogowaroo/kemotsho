
import { Schema } from "effect"
import { Context, Effect } from "effect"

// --- Value Objects ---
export const ProductId = Schema.String.pipe(Schema.brand("ProductId"))
export type ProductId = Schema.Schema.Type<typeof ProductId>

export const Slug = Schema.String.pipe(Schema.brand("Slug"))
export type Slug = Schema.Schema.Type<typeof Slug>

export const ProductSpecification = Schema.Struct({
    label: Schema.String,
    value: Schema.String
})

export const ProductVariant = Schema.Struct({
    name: Schema.String, // e.g. "Color", "Size"
    options: Schema.Array(Schema.String) // e.g. ["Red", "Blue"], ["S", "M", "L"]
})

export const StockStatus = Schema.Literal("in_stock", "out_of_stock", "pre_order", "discontinued")

export const VariantOverride = Schema.Struct({
    id: Schema.String, // Unique ID for stock tracking
    selections: Schema.Record({ key: Schema.String, value: Schema.String }), // e.g. { "Color": "Red", "Size": "L" }
    price: Schema.OptionFromNullOr(Schema.Number),
    sku: Schema.OptionFromNullOr(Schema.String),
    stockStatus: Schema.OptionFromNullOr(StockStatus),
    stockQuantity: Schema.OptionFromNullOr(Schema.Number)
})

// --- Entity ---
export const Product = Schema.Struct({
    id: ProductId,
    slug: Slug,
    title: Schema.String,
    description: Schema.OptionFromNullOr(Schema.String),
    category: Schema.OptionFromNullOr(Schema.String),
    images: Schema.Array(Schema.String), // Array of image URLs
    
    // Extended Attributes
    specifications: Schema.Array(ProductSpecification),
    variants: Schema.Array(ProductVariant),
    variantOverrides: Schema.Array(VariantOverride),
    stockStatus: StockStatus,
    stockQuantity: Schema.Number.pipe(Schema.propertySignature, Schema.withConstructorDefault(() => 0)),

    // Commerce fields
    sku: Schema.OptionFromNullOr(Schema.String),
    price: Schema.OptionFromNullOr(Schema.Number), // Stored as cents/smallest unit if integer, or just number. Ideally integers.
    currency: Schema.String, // default "ZAR"
    buyLink: Schema.OptionFromNullOr(Schema.String), // External link (Stripe, etc)
    isPurchasable: Schema.Boolean,
    
    // Metadata
    isPublished: Schema.Boolean,
    createdAt: Schema.Date,
    updatedAt: Schema.Date
})

export type Product = Schema.Schema.Type<typeof Product>

// --- Errors ---
export class ProductNotFound extends Schema.TaggedError<ProductNotFound>()("ProductNotFound", {
    message: Schema.String
}) {}

export class ProductError extends Schema.TaggedError<ProductError>()("ProductError", {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown)
}) {}

export class OutOfStockError extends Schema.TaggedError<OutOfStockError>()("OutOfStockError", {
    message: Schema.String,
    productId: Schema.optional(Schema.String),
    variantId: Schema.optional(Schema.String)
}) {}

// --- Repository Interface ---
export interface ProductRepository { // Define the shape directly in the interface for simplicity in Effect
    list: () => Effect.Effect<Product[], ProductError>
    getById: (id: string) => Effect.Effect<Product, ProductError | ProductNotFound>
    getBySlug: (slug: string) => Effect.Effect<Product, ProductError | ProductNotFound>
    create: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Effect.Effect<Product, ProductError>
    update: (id: string, data: Partial<Product>) => Effect.Effect<Product, ProductError | ProductNotFound>
    delete: (id: string) => Effect.Effect<void, ProductError>
    reserveStock: (items: { productId: string, variantId?: string | undefined, quantity: number }[]) => Effect.Effect<void, ProductError | ProductNotFound | OutOfStockError>
    releaseStock: (items: { productId: string, variantId?: string | undefined, quantity: number }[]) => Effect.Effect<void, ProductError | ProductNotFound>
}

// Tag for Dependency Injection
export const ProductRepository = Context.GenericTag<ProductRepository>("@modules/products/ProductRepository")
