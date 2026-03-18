
import { Effect, Layer } from "effect"
import { db } from "@kemotsho/core/infra/firebase/admin"
import { Customer, CustomerId, CustomerRepository, CustomerError, CustomerNotFound } from "../domain/Customer"
import { Address } from "@kemotsho/module-commerce/orders/domain/Address"
import { Timestamp } from "firebase-admin/firestore"
import { Schema } from "effect"
import { Option } from "effect"

const COLLECTION = "customers"

const CustomerFromFirestore = (id: string, data: any): Customer => {
    // When reading from Firestore, we get nulls. We need to decode to Options.
    // Using Schema.decodeSync would be safest but might be strict on missing fields.
    // Let's stick to manual or lenient decode for now to avoid read errors on old data.
    // Actually, Schema.decodeUnknownSync(Customer) is best.
    
    // We strictly assume data matches schema for now, or fallback.
    return Schema.decodeUnknownSync(Customer)({
        ...data,
        id,
        // Convert Timestamps to ISO Strings (Schema.Date expects strings in some contexts)
        createdAt: ((data.createdAt as Timestamp)?.toDate() || new Date()).toISOString(),
        updatedAt: ((data.updatedAt as Timestamp)?.toDate() || new Date()).toISOString()
    })
}

const createCustomerRepository = CustomerRepository.of({
        getById: (id) => 
            Effect.tryPromise({
                try: async () => {
                    const doc = await db.collection(COLLECTION).doc(id).get()
                    if (!doc.exists) {
                        throw new CustomerNotFound({ message: `Customer ${id} not found` })
                    }
                    return CustomerFromFirestore(doc.id, doc.data())
                },
                catch: (error) => {
                    if (error instanceof CustomerNotFound) return error
                    return new CustomerError({ message: "Failed to fetch customer", cause: error })
                }
            }),
        
        getByUserId: (userId) =>
            Effect.tryPromise({
                try: async () => {
                     const snapshot = await db.collection(COLLECTION).where("userId", "==", userId).limit(1).get()
                     if (snapshot.empty) {
                         throw new CustomerNotFound({ message: `No customer profile for user ${userId}` })
                     }
                     const doc = snapshot.docs[0]
                     if (!doc) throw new CustomerNotFound({ message: `No customer profile for user ${userId}` })
                     return CustomerFromFirestore(doc.id, doc.data())
                },
                catch: (error) => {
                    if (error instanceof CustomerNotFound) return error
                    return new CustomerError({ message: "Failed to fetch customer by user ID", cause: error })
                }
            }),

        getByEmail: (email) =>
            Effect.tryPromise({
                try: async () => {
                     const snapshot = await db.collection(COLLECTION).where("email", "==", email).limit(1).get()
                     if (snapshot.empty) {
                         throw new CustomerNotFound({ message: `No customer profile for email ${email}` })
                     }
                     const doc = snapshot.docs[0]
                     if (!doc) throw new CustomerNotFound({ message: `No customer profile for email ${email}` })
                     return CustomerFromFirestore(doc.id, doc.data())
                },
                catch: (error) => {
                    if (error instanceof CustomerNotFound) return error
                    return new CustomerError({ message: "Failed to fetch customer by email", cause: error })
                }
            }),

        create: (data) =>
            Effect.tryPromise({
                try: async () => {
                    const docRef = db.collection(COLLECTION).doc()
                    const now = new Date()
                    
                    // Construct Full Domain Object
                    const fullCustomer: Customer = {
                        ...data,
                        id: docRef.id as CustomerId, // Safe cast, ID is string
                        createdAt: now,
                        updatedAt: now
                    }

                    // Encode for Persistence (Option -> null)
                    // We must treat the input data as Domain Objects (using Option) and output Encoded (using null)
                    // The error suggests that we are passing 'null' where 'Option' is expected during encoding check,
                    // OR that Schema.encodeSync is failing on validation.
                    
                    // Actually, 'userId: params.userId || null' in OrderWorkflow is passed as 'string | null'.
                    // The repo.create expects Omit<Customer, ...>.
                    // Customer definition Expects 'Option<UserId>'.
                    // If OrderWorkflow passed 'null' instead of 'Option.none()', that's the type error.
                    // But Typescript compilation passed? Ah, `any` casting in OrderWorkflow?
                    // Let's manually map just to be ultra safe and dependency-free on Schema hidden behaviors.
                    
                    const persistenceData = {
                        id: docRef.id,
                        userId: Option.isOption(data.userId) ? Option.getOrNull(data.userId) : data.userId, // handle both just in case
                        email: data.email,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        phone: Option.isOption(data.phone) ? Option.getOrNull(data.phone) : data.phone,
                        
                        addresses: data.addresses.map(a => Schema.encodeSync(Address)(a)),
                        defaultShippingAddress: Option.isOption(data.defaultShippingAddress) ? 
                            (Option.getOrNull(data.defaultShippingAddress) ? Schema.encodeSync(Address)(Option.getOrNull(data.defaultShippingAddress)!) : null) 
                            : null,
                        defaultBillingAddress: Option.isOption(data.defaultBillingAddress) ? 
                            (Option.getOrNull(data.defaultBillingAddress) ? Schema.encodeSync(Address)(Option.getOrNull(data.defaultBillingAddress)!) : null) 
                            : null,

                        createdAt: now,
                        updatedAt: now
                    }

                    await docRef.set(persistenceData)
                    return fullCustomer
                },
                catch: (error) => {
                    console.error("Firebase Create Customer Error:", error)
                    return new CustomerError({ message: "Failed to create customer: " + String(error), cause: error })
                }
            }),
        
        update: (id, data) => 
            Effect.tryPromise({
                try: async () => {
                    const docRef = db.collection(COLLECTION).doc(id)
                    const now = new Date()
                    
                    // We can't easily Schema.encode a partial update.
                    // But we know 'data' contains Options that need to be nulls.
                    // We can cheat by using a temporary schema or manual mapping.
                    // For now, let's assume 'data' might be problematic and implement a safer way if this fails.
                    // Actually, let's do manual shallow encoding for known fields.
                    
                    const updateData: any = { ...data, updatedAt: now }
                    
                    // Helper to unwrap options if they exist in the update payload
                    if (data.phone !== undefined) updateData.phone = Option.getOrNull(data.phone)
                    if (data.userId !== undefined) updateData.userId = Option.getOrNull(data.userId)
                    
                    // Address fields are trickier as they are nested. 
                    // Ideally we should read -> merge -> encode -> write, but that's expensive.
                    // Since 'Address' is a Value Object, we usually replace the whole address.
                    // And Address.schema encodes to JSON with nulls natively via Schema.encode.
                    // So if we pass an Address object that obeys the Schema, we should encode IT.
                    
                    if (data.defaultShippingAddress !== undefined) {
                         const addr = Option.getOrNull(data.defaultShippingAddress)
                         updateData.defaultShippingAddress = addr ? Schema.encodeSync(Address)(addr) : null
                    }
                    
                    if (data.defaultBillingAddress !== undefined) {
                        const addr = Option.getOrNull(data.defaultBillingAddress)
                        updateData.defaultBillingAddress = addr ? Schema.encodeSync(Address)(addr) : null
                   }

                    if (data.addresses !== undefined) {
                        updateData.addresses = data.addresses.map(a => Schema.encodeSync(Address)(a))
                    }

                    await docRef.update(updateData)
                    
                    const updated = await docRef.get()
                    if (!updated.exists) {
                         throw new CustomerNotFound({ message: `Customer ${id} not found after update` })
                    }
                    return CustomerFromFirestore(updated.id, updated.data())
                },
                catch: (error) => {
                    if (error instanceof CustomerNotFound) return error
                    return new CustomerError({ message: "Failed to update customer", cause: error })
                }
            })
    })

export const FirebaseCustomerRepositoryLive = Layer.succeed(
    CustomerRepository,
    createCustomerRepository
)
