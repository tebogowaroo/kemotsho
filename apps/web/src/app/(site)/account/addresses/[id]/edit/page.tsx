
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { FirebaseCustomerRepositoryLive } from "@kemotsho/module-commerce/customers/infrastructure/FirebaseCustomerRepository"
import { CustomerRepository, Customer } from "@kemotsho/module-commerce/customers/domain/Customer"
import { getCurrentUser } from "@kemotsho/core/lib/auth"
import { Effect } from "effect"
import { Schema } from "effect"
import { redirect, notFound } from "next/navigation"
import { AddressForm } from "@/app/(site)/account/addresses/_components/address-form"
import { Address } from "@kemotsho/module-commerce/orders/domain/Address"

interface EditAddressPageProps {
    params: Promise<{ id: string }>
}

export default async function EditAddressPage({ params }: EditAddressPageProps) {
    const { id } = await params

    const program = Effect.gen(function* (_) {
        const user = yield* _(getCurrentUser)
        const repo = yield* _(CustomerRepository)
        const customer = yield* _(repo.getByUserId(user.uid))
        
        // Find the address
        const address = customer.addresses?.find(a => a.id === id)
        
        if (!address) {
            return yield* _(Effect.fail("Address not found"))
        }

        // Encode just the address for the client form
        return yield* _(Schema.encode(Address)(address))
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseCustomerRepositoryLive)
    )

    const result = await AppRuntime.runPromiseExit(runnable)

    if (result._tag === "Failure") {
        if (result.cause.toString().includes("Address not found")) {
            notFound()
        }
        return <div>Error loading address</div>
    }

    const address = result.value
    const formInitialData = {
        ...address,
        company: address.company ?? undefined,
        line2: address.line2 ?? undefined,
        state: address.state ?? undefined,
        email: address.email ?? undefined
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
             <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Edit Address</h2>
                <p className="text-muted-foreground">
                    Update your shipping or billing details.
                </p>
            </div>
            <AddressForm initialData={formInitialData} />
        </div>
    )
}
