
import { Effect, Layer, Option } from "effect"
import { db } from "@kemotsho/core/infra/firebase/admin"
import { Product, ProductRepository, ProductError, ProductNotFound, OutOfStockError, ProductId, Slug } from "@kemotsho/module-commerce/products/domain/Product"
import { Schema } from "effect"
import { Timestamp } from "firebase-admin/firestore"

const COLLECTION = "products"

const ProductFromFirestore = (id: string, data: any): Product => {
    return {
        id: id as ProductId,
        slug: data.slug as Slug,
        title: data.title,
        description: data.description ? Option.some(data.description) : Option.none(),
        category: data.category ? Option.some(data.category) : Option.none(),
        images: data.images || [],
        sku: data.sku ? Option.some(data.sku) : Option.none(),
        price: (typeof data.price === "number" || (data.price && !Number.isNaN(Number(data.price)))) ? Option.some(Number(data.price)) : Option.none(),
        currency: data.currency || "ZAR",
        
        // Extended Attributes
        specifications: data.specifications || [],
        variants: data.variants || [],
        variantOverrides: Array.isArray(data.variantOverrides) 
            ? data.variantOverrides.map((vo: any) => ({
                id: vo.id || "legacy_no_id", // Fallback for schema validation until migration
                selections: vo.selections || {},
                price: (typeof vo.price === "number") ? Option.some(vo.price) : Option.none(),
                sku: vo.sku ? Option.some(vo.sku) : Option.none(),
                stockStatus: vo.stockStatus ? Option.some(vo.stockStatus) : Option.none(),
                stockQuantity: (typeof vo.stockQuantity === "number") ? Option.some(vo.stockQuantity) : Option.none(),
            }))
            : [],
        stockStatus: data.stockStatus || "in_stock",
        stockQuantity: data.stockQuantity ?? 0,

        buyLink: data.buyLink ? Option.some(data.buyLink) : Option.none(),
        isPurchasable: data.isPurchasable || false,
        isPublished: data.isPublished || false,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
    }
}

export const FirebaseProductRepositoryLive = Layer.succeed(
    ProductRepository,
    ProductRepository.of({
        list: () =>
            Effect.tryPromise({
                try: async () => {
                    const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").get()
                    return snapshot.docs.map(doc => ProductFromFirestore(doc.id, doc.data()))
                },
                catch: (error) => new ProductError({ message: "Failed to list products", cause: error })
            }),

        getById: (id) =>
            Effect.tryPromise({
                try: async () => {
                    const doc = await db.collection(COLLECTION).doc(id).get()
                    if (!doc.exists) return null
                    return ProductFromFirestore(doc.id, doc.data())
                },
                catch: (error) => new ProductError({ message: `Failed to get product ${id}`, cause: error })
            }).pipe(
                Effect.flatMap((product) => 
                    product 
                        ? Effect.succeed(product) 
                        : Effect.fail(new ProductNotFound({ message: `Product ${id} not found` }))
                )
            ),

        getBySlug: (slug) =>
            Effect.tryPromise({
                try: async () => {
                    const snapshot = await db.collection(COLLECTION).where("slug", "==", slug).limit(1).get()
                    if (snapshot.empty) return null
                    const doc = snapshot.docs[0]
                    return ProductFromFirestore(doc!.id, doc!.data())
                },
                catch: (error) => new ProductError({ message: `Failed to get product by slug ${slug}`, cause: error })
            }).pipe(
                 Effect.flatMap((product) => 
                    product 
                        ? Effect.succeed(product) 
                        : Effect.fail(new ProductNotFound({ message: `Product with slug ${slug} not found` }))
                )
            ),

        create: (productData) =>
            Effect.tryPromise({
                try: async () => {
                    const now = new Date()
                    const docRef = db.collection(COLLECTION).doc() // Auto-ID
                    
                    // Manual Unwrapping of Options to Nulls for Firestore
                    const dataToSave = {
                        ...productData,
                        description: Option.getOrNull(productData.description),
                        category: Option.getOrNull(productData.category),
                        sku: Option.getOrNull(productData.sku),
                        price: Option.getOrNull(productData.price),
                        buyLink: Option.getOrNull(productData.buyLink),
                        
                        variantOverrides: productData.variantOverrides.map(vo => ({
                            ...vo,
                            price: Option.getOrNull(vo.price),
                            sku: Option.getOrNull(vo.sku),
                            stockStatus: Option.getOrNull(vo.stockStatus),
                            stockQuantity: Option.getOrNull(vo.stockQuantity)
                        })),

                        createdAt: now,
                        updatedAt: now
                    }
                    await docRef.set(dataToSave)
                    
                    // We return the construct, so we pass the SAVED data (which has nulls)
                    // ProductFromFirestore handles nulls correctly.
                    return ProductFromFirestore(docRef.id, dataToSave)
                },
                catch: (error: any) => new ProductError({ message: "Failed to create product", cause: error })
            }),

        update: (id, data) =>
            Effect.tryPromise({
                try: async () => {
                    const docRef = db.collection(COLLECTION).doc(id)
                     const snapshot = await docRef.get()
                     if (!snapshot.exists) return null

                    const now = new Date()
                    // Unwrap Options for Update
                    const updates: any = {
                        ...data,
                        updatedAt: now
                    }

                    if (data.description !== undefined) updates.description = Option.getOrNull(data.description)
                    if (data.category !== undefined) updates.category = Option.getOrNull(data.category)
                    if (data.sku !== undefined) updates.sku = Option.getOrNull(data.sku)
                    if (data.price !== undefined) updates.price = Option.getOrNull(data.price)
                    if (data.buyLink !== undefined) updates.buyLink = Option.getOrNull(data.buyLink)
                    
                    if (data.variantOverrides !== undefined) {
                        updates.variantOverrides = data.variantOverrides.map(vo => ({
                            ...vo,
                            price: Option.getOrNull(vo.price),
                            sku: Option.getOrNull(vo.sku),
                            stockStatus: Option.getOrNull(vo.stockStatus),
                            stockQuantity: Option.getOrNull(vo.stockQuantity)
                        }))
                    }

                    await docRef.update(updates)
                    
                    const updatedSnapshot = await docRef.get()
                    return ProductFromFirestore(id, updatedSnapshot.data())
                },
                catch: (error: any) => new ProductError({ message: "Failed to update product", cause: error })
            }).pipe(
                Effect.flatMap((product) => 
                    product 
                        ? Effect.succeed(product) 
                        : Effect.fail(new ProductNotFound({ message: `Product ${id} not found for update` }))
                )
            ),

        reserveStock: (items) =>
            Effect.tryPromise({
                try: async () => {
                    await db.runTransaction(async (t) => {
                        const productIds = Array.from(new Set(items.map(i => i.productId)))
                        const productRefs = productIds.map(id => db.collection(COLLECTION).doc(id))
                        const snapshots = await t.getAll(...productRefs)
                        
                        const docsMap = new Map()
                        snapshots.forEach(doc => {
                            if (doc.exists) docsMap.set(doc.id, doc)
                        })

                        for (const item of items) {
                            const doc = docsMap.get(item.productId)
                            if (!doc) throw { type: "ProductNotFound", id: item.productId }

                            const data = doc.data()
                            
                            if (item.variantId) {
                                // Variant Level Stock
                                const variantOverrides = (data.variantOverrides || []) as any[]
                                const variantIndex = variantOverrides.findIndex((v: any) => v.id === item.variantId)
                                
                                if (variantIndex === -1) {
                                    throw { type: "VariantNotFound", id: item.productId, variantId: item.variantId }
                                }
                                
                                const variant = variantOverrides[variantIndex]
                                const currentStock = (variant.stockQuantity ?? 0) as number
                                
                                if (currentStock < item.quantity) {
                                    throw { type: "OutOfStock", id: item.productId, variantId: item.variantId, title: data.title }
                                }
                                
                                // Direct update of nested array is hard in Firestore, needed to read-modify-write whole array
                                variantOverrides[variantIndex].stockQuantity = currentStock - item.quantity
                                t.update(doc.ref, { 
                                    variantOverrides: variantOverrides,
                                    updatedAt: new Date()
                                })
                            } else {
                                // Product Level Stock
                                const currentStock = (data.stockQuantity ?? 0) as number
                                if (currentStock < item.quantity) {
                                    throw { type: "OutOfStock", id: item.productId, title: data.title }
                                }
                                t.update(doc.ref, { 
                                    stockQuantity: currentStock - item.quantity,
                                    updatedAt: new Date()
                                })
                            }
                        }
                    })
                },
                catch: (error: any) => {
                    if (error.type === "ProductNotFound") {
                        return new ProductNotFound({ message: `Product ${error.id} not found` })
                    }
                    if (error.type === "OutOfStock") {
                        return new OutOfStockError({ 
                            message: `Product "${error.title || error.id}" is out of stock`,
                            productId: error.id,
                            variantId: error.variantId
                        })
                    }
                    return new ProductError({ message: "Failed to reserve stock", cause: error })
                }
            }),


        releaseStock: (items) =>
            Effect.tryPromise({
                try: async () => {
                    await db.runTransaction(async (t) => {
                        const productIds = Array.from(new Set(items.map(i => i.productId)))
                        const productRefs = productIds.map(id => db.collection(COLLECTION).doc(id))
                        const snapshots = await t.getAll(...productRefs)
                        
                        const docsMap = new Map()
                        snapshots.forEach(doc => {
                            if (doc.exists) docsMap.set(doc.id, doc)
                        })

                        for (const item of items) {
                            const doc = docsMap.get(item.productId)
                            if (!doc) continue // Ignore if product deleted

                            const data = doc.data()
                            
                            if (item.variantId) {
                                const variantOverrides = (data?.variantOverrides || []) as any[]
                                const variantIndex = variantOverrides.findIndex((v: any) => v.id === item.variantId)
                                
                                if (variantIndex !== -1) {
                                    const variant = variantOverrides[variantIndex]
                                    const currentStock = (variant.stockQuantity ?? 0) as number
                                    variantOverrides[variantIndex].stockQuantity = currentStock + item.quantity
                                    
                                    t.update(doc.ref, { 
                                        variantOverrides: variantOverrides,
                                        updatedAt: new Date()
                                    })
                                }
                            } else {
                                const currentStock = (data?.stockQuantity ?? 0) as number
                                t.update(doc.ref, { 
                                    stockQuantity: currentStock + item.quantity,
                                    updatedAt: new Date()
                                })
                            }
                        }
                    })
                },
                catch: (error) => new ProductError({ message: "Failed to release stock", cause: error })
            }),


        delete: (id) =>
            Effect.tryPromise({
                try: async () => {
                    await db.collection(COLLECTION).doc(id).delete()
                },
                catch: (error) => new ProductError({ message: "Failed to delete product", cause: error })
            })
    })
)
