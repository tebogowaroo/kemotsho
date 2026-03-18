
import { Effect, Layer, Option } from "effect"
import { db } from "@kemotsho/core/infra/firebase/admin"
import { Order, OrderId, OrderError, OrderNotFound, OrderStatus, PaymentMethod } from "@kemotsho/module-commerce/orders/domain/Order"
import { OrderRepository } from "@kemotsho/module-commerce/orders/domain/OrderRepository"
import { Timestamp } from "firebase-admin/firestore"

const COLLECTION = "orders"
const COUNTER_DOC = "counters/orders"

const OrderFromFirestore = (id: string, data: any): Order => {
    // Helper to normalize dates from Firestore timestamps or strings or Date objects
    const toDate = (val: any): Date => {
        if (!val) return new Date();
        if (val instanceof Timestamp) return val.toDate();
        if (typeof val === 'string') return new Date(val);
        return val;
    }

    // Helper to recover from "Bad Data" (serialized Option)
    const unwrapOption = (val: any) => {
        if (!val) return null;
        if (val._tag === 'Some' && val.value) return val.value
        if (val._tag === 'None') return null
        return val
    }
    const unwrapFulfillment = unwrapOption;

    const rawFulfillment = unwrapFulfillment(data.fulfillment)

    // Helper to inflate Address
    const AddressFromFirestore = (addr: any) => ({
        firstName: addr.firstName,
        lastName: addr.lastName,
        company: Option.fromNullable(unwrapOption(addr.company)),
        line1: addr.line1,
        line2: Option.fromNullable(unwrapOption(addr.line2)),
        city: addr.city,
        state: Option.fromNullable(unwrapOption(addr.state)),
        postalCode: addr.postalCode,
        country: addr.country,
        phone: addr.phone,
        email: addr.email
    })

    // Normalize Items (handle SKU/Options weirdness)
    const items = (data.items || []).map((item: any) => {
        const rawSku = unwrapOption(item.sku);
        // Force strings on SKU to avoid empty objects
        const cleanSku = (typeof rawSku === 'string' || typeof rawSku === 'number') ? String(rawSku) : null;

        return {
            ...item,
            sku: Option.fromNullable(cleanSku),
            options: Option.fromNullable(unwrapOption(item.options)),
            image: Option.fromNullable(unwrapOption(item.image))
        }
    })

    return {
        id: id as OrderId,
        orderNumber: data.orderNumber,
        customerId: data.customerId,
        userId: Option.fromNullable(data.userId),
        customerEmail: data.customerEmail || "",
        items: items,
        
        currency: data.currency || "ZAR",
        subtotal: data.subtotal || 0,
        discount: data.discount || 0,
        couponCode: Option.fromNullable(data.couponCode),
        shippingCost: data.shippingCost || 0,
        tax: data.tax || 0,
        total: data.total || 0,

        shippingAddress: AddressFromFirestore(data.shippingAddress),
        billingAddress: data.billingAddress ? Option.some(AddressFromFirestore(data.billingAddress)) : Option.none(),

        status: data.status as OrderStatus,
        paymentMethod: data.paymentMethod as typeof PaymentMethod.Type,
        paymentGatewayRef: Option.fromNullable(data.paymentGatewayRef),

        fulfillment: rawFulfillment ? Option.some({
            ...rawFulfillment,
            shippedAt: toDate(rawFulfillment.shippedAt)
        }) : Option.none(),

        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt)
    }
}

const OrderToFirestore = (order: Order) => {
    // Helper to flatten Address
    const AddressToFirestore = (addr: any) => ({
        ...addr,
        company: Option.getOrNull(addr.company),
        line2: Option.getOrNull(addr.line2),
        state: Option.getOrNull(addr.state)
    })

    return {
        ...order,
        userId: Option.getOrNull(order.userId),
        billingAddress: Option.isSome(order.billingAddress) ? AddressToFirestore(order.billingAddress.value) : null,
        shippingAddress: AddressToFirestore(order.shippingAddress),
        paymentGatewayRef: Option.getOrNull(order.paymentGatewayRef),
        items: order.items.map(item => ({
            ...item,
            sku: Option.getOrNull(item.sku),
            options: Option.getOrNull(item.options),
            image: Option.getOrNull(item.image)
        })),
        fulfillment: Option.isSome(order.fulfillment) ? {
            ...order.fulfillment.value,
            shippedAt: order.fulfillment.value.shippedAt 
        } : null
    }
}

export const FirebaseOrderRepositoryLive = Layer.succeed(
    OrderRepository,
    OrderRepository.of({
        getById: (id) =>
            Effect.tryPromise({
                try: async () => {
                    const doc = await db.collection(COLLECTION).doc(id).get()
                    if (!doc.exists) return null
                    return OrderFromFirestore(doc.id, doc.data())
                },
                catch: (error) => new OrderError({ message: "Failed to get order", cause: error })
            }).pipe(
                Effect.flatMap((order) => 
                    order 
                        ? Effect.succeed(order) 
                        : Effect.fail(new OrderNotFound({ message: `Order ${id} not found` }))
                )
            ),

        create: (orderData) =>
            Effect.tryPromise({
                 try: async () => {
                    const now = new Date()
                    const docRef = db.collection(COLLECTION).doc() // Auto-ID
                    // Use OrderToFirestore to clean data
                    const tempId = OrderId.make(docRef.id)
                    const dataToSave = OrderToFirestore({
                        ...orderData,
                        id: tempId,
                        createdAt: now,
                        updatedAt: now
                    })
                    
                    await docRef.set(dataToSave)
                    return OrderFromFirestore(docRef.id, dataToSave)
                 },
                 catch: (error) => {
                     console.error("Repo Create Error:", error);
                     return new OrderError({ message: "Failed to create order", cause: error })
                 }
            }),

        update: (order) =>
             Effect.tryPromise({
                try: async () => {
                    const docRef = db.collection(COLLECTION).doc(order.id)
                    const now = new Date()
                    const updates = OrderToFirestore({
                        ...order,
                        updatedAt: now
                    })
                    delete (updates as any).id 
                    
                    await docRef.set(updates, { merge: true })
                    return OrderFromFirestore(order.id, updates)
                },
                catch: (error) => new OrderError({ message: "Failed to update order", cause: error })
             }),

        list: (userId) =>
             Effect.tryPromise({
                 try: async () => {
                     let query = db.collection(COLLECTION).orderBy("createdAt", "desc")
                     if (userId) {
                         query = query.where("userId", "==", userId)
                     }
                     const snapshot = await query.get()
                     return snapshot.docs.map(doc => OrderFromFirestore(doc.id, doc.data()))
                 },
                 catch: (error) => new OrderError({ message: "Failed to list orders", cause: error })
             }),

        findByCustomerId: (customerId) =>
             Effect.tryPromise({
                try: async () => {
                    const snapshot = await db.collection(COLLECTION)
                        .where("customerId", "==", customerId)
                        .orderBy("createdAt", "desc")
                        .get()
                    return snapshot.docs.map(doc => OrderFromFirestore(doc.id, doc.data()))
                },
                catch: (error) => new OrderError({ message: "Failed to list customer orders", cause: error })
             }),

        listAll: () =>
             Effect.tryPromise({
                 try: async () => {
                     const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").get()
                     return snapshot.docs.map(doc => OrderFromFirestore(doc.id, doc.data()))
                 },
                 catch: (error) => new OrderError({ message: "Failed to list all orders", cause: error })
             }),

        getNextOrderNumber: () =>
             Effect.tryPromise({
                 try: async () => {
                     const docRef = db.doc(COUNTER_DOC)
                     const number = await db.runTransaction(async (t) => {
                         const doc = await t.get(docRef)
                         let next = 1000
                         if (doc.exists) {
                             next = doc.data()!.current + 1
                         }
                         t.set(docRef, { current: next })
                         return next
                     })
                     return `#${number}`
                 },
                 catch: (error) => new OrderError({ message: "Failed to generate order number", cause: error })
             })
    })
)
