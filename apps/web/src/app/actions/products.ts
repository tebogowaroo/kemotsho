"use server"

import { Product, ProductRepository } from "@kemotsho/module-commerce/products/domain/Product"
import { FirebaseProductRepositoryLive } from "@kemotsho/module-commerce/products/infrastructure/FirebaseProductRepository"
import { Effect, Layer } from "effect"
import { revalidatePath } from "next/cache"
import { Schema } from "effect"

// Layer composition
const ProductsLive = FirebaseProductRepositoryLive // ProductRepositoryLive depends on nothing or just Config

// Helper to run effects
const runServerAction = <T, E>(effect: Effect.Effect<T, E, ProductRepository>) =>  
    Effect.runPromise(
        Effect.provide(
            effect.pipe(
                Effect.map(data => ({ success: true as const, data })),
                Effect.catchAll(error => {
                    console.error("Server Action Failed:", JSON.stringify(error, null, 2))
                    // Next.js cannot serialize Error objects or Effect Class objects to the client.
                    // We must return a plain object.
                    return Effect.succeed({ 
                        success: false as const, 
                        error: JSON.parse(JSON.stringify(error)) 
                    })
                })
            ),
            ProductsLive
        )
    )

// --- Actions ---

export async function listProductsAction() {
    return runServerAction(
        Effect.gen(function* () {
            const repo = yield* ProductRepository
            const products = yield* repo.list()
            return yield* Schema.encode(Schema.Array(Product))(products)
        })
    )
}

export async function getProductAction(id: string) {
    return runServerAction(
        Effect.gen(function* () {
            const repo = yield* ProductRepository
            const product = yield* repo.getById(id)
            return yield* Schema.encode(Product)(product)
        })
    )
}

export async function getProductBySlugAction(slug: string) {
    return runServerAction(
        Effect.gen(function* () {
            const repo = yield* ProductRepository
            const product = yield* repo.getBySlug(slug)
            return yield* Schema.encode(Product)(product)
        })
    )
}

export async function createProductAction(data: Schema.Schema.Encoded<typeof Product>) {
    // Note: The ID in `data` might be ignored or generated. Domain usually separates CreateProductDTO.
    // We accept Encoded (primitive) data to play nice with Server Actions boundaries
    return runServerAction(
        Effect.gen(function* () {
            // Decode input first to ensure validity (and convert nulls to Options)
            const decoded = yield* Schema.decode(Product)(data)
            
            const repo = yield* ProductRepository
            // Use title to generate slug if not provided, or simple slugify
            const slug = decoded.slug || decoded.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

            const newProduct = yield* repo.create({
                ...decoded,
                slug: slug as any, // Cast to Branded type
                // Ensure defaults
                currency: decoded.currency || "ZAR",
                images: decoded.images || []
            })
            revalidatePath("/admin/products")
            // Return encoded so client can consume it safely
            return yield* Schema.encode(Product)(newProduct)
        })
    )
}

export async function updateProductAction(id: string, data: Partial<Schema.Schema.Encoded<typeof Product>>) {
    return runServerAction(
        Effect.gen(function* () {
            // Decode the partial input to ensure Options are created correctly from nulls
            const decodedPartial = yield* Schema.decode(Schema.partial(Product))(data)
            
            // Exclude ID from update payload to avoid type conflicts and accidental ID changes
            const { id: _, ...updateData } = decodedPartial

            const repo = yield* ProductRepository
            const updated = yield* repo.update(id, updateData as any) 
            
            revalidatePath("/admin/products")
            revalidatePath(`/products/${updated.slug}`)
            return yield* Schema.encode(Product)(updated)
        })
    )
}

export async function deleteProductAction(id: string) {
    return runServerAction(
        Effect.gen(function* () {
            const repo = yield* ProductRepository
            yield* repo.delete(id)
            revalidatePath("/admin/products")
        })
    )
}
