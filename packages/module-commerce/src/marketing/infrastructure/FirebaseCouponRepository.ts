
import { Effect, Layer, Option } from "effect"
import { db } from "@kemotsho/core/infra/firebase/admin"
import { Coupon, CouponRepository, CouponError, CouponNotFound, CouponId } from "@kemotsho/module-commerce/marketing/domain/Coupon"
import { Timestamp } from "firebase-admin/firestore"

const COLLECTION = "coupons"

const CouponFromFirestore = (id: string, data: any): Coupon => {
    return {
        id: id as CouponId,
        code: data.code,
        description: data.description ? Option.some(data.description) : Option.none(),
        discountType: data.discountType || "fixed_amount",
        value: typeof data.value === "number" ? data.value : (Number(data.value) || 0),
        minSpend: data.minSpend ? Option.some(Number(data.minSpend) || 0) : Option.none(),
        expiresAt: data.expiresAt instanceof Timestamp ? Option.some(data.expiresAt.toDate()) : (data.expiresAt ? Option.some(new Date(data.expiresAt)) : Option.none()),
        usageLimit: data.usageLimit ? Option.some(Number(data.usageLimit) || 0) : Option.none(),
        usageCount: data.usageCount || 0,
        isActive: data.isActive ?? true
    }
}

export const FirebaseCouponRepositoryLive = Layer.succeed(
    CouponRepository,
    CouponRepository.of({
        getByCode: (code) => 
            Effect.tryPromise({
                try: async () => {
                    const snapshot = await db.collection(COLLECTION)
                        .where("code", "==", code.toUpperCase())
                        .where("isActive", "==", true)
                        .limit(1)
                        .get()
                    
                    if (snapshot.empty || !snapshot.docs[0]) return null
                    return CouponFromFirestore(snapshot.docs[0].id, snapshot.docs[0].data())
                },
                catch: (error) => new CouponError({ message: "Failed to fetch coupon", cause: error })
            }).pipe(
                Effect.flatMap((coupon) => 
                    coupon 
                    ? Effect.succeed(coupon) 
                    : Effect.fail(new CouponNotFound({ message: `Coupon ${code} not found` }))
                )
            ),

        incrementUsage: (id) =>
            Effect.tryPromise({
                try: async () => {
                    await db.collection(COLLECTION).doc(id).update({
                        usageCount: require("firebase-admin/firestore").FieldValue.increment(1)
                    })
                },
                catch: (error) => new CouponError({ message: "Failed to increment usage", cause: error })
            }),

        list: () => 
            Effect.tryPromise({
                try: async () => {
                    const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").get()
                    return snapshot.docs.map(doc => CouponFromFirestore(doc.id, doc.data()))
                },
                catch: (error) => new CouponError({ message: "Failed to list coupons", cause: error })
            }),

        create: (coupon) =>
            Effect.tryPromise({
                try: async () => {
                    const docRef = db.collection(COLLECTION).doc()
                    const data = {
                        code: coupon.code.toUpperCase(),
                        description: Option.getOrNull(coupon.description),
                        discountType: coupon.discountType,
                        value: coupon.value,
                        minSpend: Option.getOrNull(coupon.minSpend),
                        expiresAt: Option.getOrNull(coupon.expiresAt),
                        usageLimit: Option.getOrNull(coupon.usageLimit),
                        usageCount: 0,
                        isActive: coupon.isActive,
                        createdAt: new Date()
                    }
                    await docRef.set(data)
                    return CouponFromFirestore(docRef.id, data)
                },
                catch: (error) => new CouponError({ message: "Failed to create coupon", cause: error })
            }),
            
        toggleStatus: (id, isActive) =>
            Effect.tryPromise({
                try: async () => {
                    await db.collection(COLLECTION).doc(id).update({ isActive })
                },
                 catch: (error) => new CouponError({ message: "Failed to update coupon status", cause: error })
            }),

        delete: (id) =>
            Effect.tryPromise({
                try: async () => {
                    await db.collection(COLLECTION).doc(id).delete()
                },
                 catch: (error) => new CouponError({ message: "Failed to delete coupon", cause: error })
            })
    })
)
