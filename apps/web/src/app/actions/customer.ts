"use server"

import { Address } from "@kemotsho/module-commerce/orders/domain/Address"
import { revalidatePath } from "next/cache"
import { Effect, Option } from "effect"
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { FirebaseCustomerRepositoryLive } from "@kemotsho/module-commerce/customers/infrastructure/FirebaseCustomerRepository"
import { CustomerRepository } from "@kemotsho/module-commerce/customers/domain/Customer"
import { getCurrentUser } from "@kemotsho/core/lib/auth"
import { Schema } from "effect"

const UpdateProfileSchema = Schema.Struct({
    firstName: Schema.String,
    lastName: Schema.String,
    phone: Schema.String,
    email: Schema.String
})

export async function updateProfileAction(input: unknown) {
    const program = Effect.gen(function* (_) {
        const user = yield* _(getCurrentUser)
        const repo = yield* _(CustomerRepository)
        
        const params = yield* _(Schema.decodeUnknown(UpdateProfileSchema)(input))
        
        const customer = yield* _(repo.getByUserId(user.uid))
        
        yield* _(repo.update(customer.id, {
            ...customer,
            firstName: params.firstName,
            lastName: params.lastName,
            phone: Option.some(params.phone),
            email: params.email
        }))

        return "Profile updated"
    })

     const runnable = program.pipe(
        Effect.provide(FirebaseCustomerRepositoryLive)
    )

    return AppRuntime.runPromiseExit(runnable).then(exit => {
        if (exit._tag === "Success") {
            return { success: true }
        } else {
             console.error("Profile Update Failed", exit.cause)
             return { success: false, error: "Failed to update profile", details: String(exit.cause) }
        }
    })
}

export async function addAddressAction(input: unknown) {
    const program = Effect.gen(function* (_) {
        const user = yield* _(getCurrentUser)
        const repo = yield* _(CustomerRepository)
        
        // Remove id from input if present, ensuring we generate a new one
        const { id, ...addressData } = yield* _(Schema.decodeUnknown(Address)(input))

        const customer = yield* _(repo.getByUserId(user.uid))
        
        const newAddress: Address = {
            ...addressData,
            id: crypto.randomUUID()
        }
        
        yield* _(repo.update(customer.id, {
            addresses: [...(customer.addresses || []), newAddress]
        }))

        revalidatePath("/account/addresses")
        return "Address added"
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseCustomerRepositoryLive)
    )

    return AppRuntime.runPromiseExit(runnable).then(exit => {
         if (exit._tag === "Success") {
            return { success: true }
        } else {
             console.error("Address Add Failed", exit.cause)
             return { success: false, error: "Failed to add address" }
        }
    })
}

export async function updateAddressAction(input: unknown) {
    const program = Effect.gen(function* (_) {
        const user = yield* _(getCurrentUser)
        const repo = yield* _(CustomerRepository)
        const addressToUpdate = yield* _(Schema.decodeUnknown(Address)(input))

        if (!addressToUpdate.id) {
            return yield* _(Effect.fail("Address ID is required for update"))
        }

        const customer = yield* _(repo.getByUserId(user.uid))
        
        const updatedAddresses = (customer.addresses || []).map(addr => 
            addr.id === addressToUpdate.id ? { ...addr, ...addressToUpdate } : addr
        )

        // Handle default address updates if the modified address was a default one
        let defaultShipping = Option.getOrNull(customer.defaultShippingAddress)
        let defaultBilling = Option.getOrNull(customer.defaultBillingAddress)

        if (defaultShipping?.id === addressToUpdate.id) {
             defaultShipping = { ...defaultShipping, ...addressToUpdate }
        }
        if (defaultBilling?.id === addressToUpdate.id) {
             defaultBilling = { ...defaultBilling, ...addressToUpdate }
        }
        
        yield* _(repo.update(customer.id, {
            addresses: updatedAddresses,
            defaultShippingAddress: Option.fromNullable(defaultShipping),
            defaultBillingAddress: Option.fromNullable(defaultBilling)
        }))

        revalidatePath("/account/addresses")
        return "Address updated"
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseCustomerRepositoryLive)
    )

    return AppRuntime.runPromiseExit(runnable).then(exit => {
         if (exit._tag === "Success") {
            return { success: true }
        } else {
             console.error("Address Update Failed", exit.cause)
             return { success: false, error: "Failed to update address" }
        }
    })
}

export async function deleteAddressAction(addressId: string) {
    const program = Effect.gen(function* (_) {
        const user = yield* _(getCurrentUser)
        const repo = yield* _(CustomerRepository)
        const customer = yield* _(repo.getByUserId(user.uid))

        const updatedAddresses = (customer.addresses || []).filter(a => a.id !== addressId)

        // Reset defaults if deleted
        let defaultShipping = Option.getOrNull(customer.defaultShippingAddress)
        let defaultBilling = Option.getOrNull(customer.defaultBillingAddress)

        if (defaultShipping?.id === addressId) defaultShipping = null
        if (defaultBilling?.id === addressId) defaultBilling = null

        yield* _(repo.update(customer.id, {
            addresses: updatedAddresses,
            defaultShippingAddress: Option.fromNullable(defaultShipping),
            defaultBillingAddress: Option.fromNullable(defaultBilling)
        }))

        revalidatePath("/account/addresses")
        return "Address deleted"
    })
    
    // Boilerplate runner...
     const runnable = program.pipe(Effect.provide(FirebaseCustomerRepositoryLive))
    return AppRuntime.runPromiseExit(runnable).then(exit => {
        if (exit._tag === "Success") return { success: true }
         console.error("Delete Address Failed", exit.cause)
        return { success: false, error: "Failed to delete" }
    })
}

export async function setDefaultAddressAction(addressId: string, type: "shipping" | "billing") {
    const program = Effect.gen(function* (_) {
        const user = yield* _(getCurrentUser)
        const repo = yield* _(CustomerRepository)
        const customer = yield* _(repo.getByUserId(user.uid))

        const address = customer.addresses.find(a => a.id === addressId)
        if (!address) return yield* _(Effect.fail("Address not found"))

        const updateData: any = {}
        if (type === "shipping") {
            updateData.defaultShippingAddress = Option.some(address)
        } else {
            updateData.defaultBillingAddress = Option.some(address)
        }

        yield* _(repo.update(customer.id, updateData))
        revalidatePath("/account/addresses")
        return "Default set"
    })

    const runnable = program.pipe(Effect.provide(FirebaseCustomerRepositoryLive))
    return AppRuntime.runPromiseExit(runnable).then(exit => {
        if (exit._tag === "Success") return { success: true }
         console.error("Set Default Failed", exit.cause)
        return { success: false, error: "Failed to set default" }
    })
}
