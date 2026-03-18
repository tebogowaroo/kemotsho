
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { FirebaseCustomerRepositoryLive } from "@kemotsho/module-commerce/customers/infrastructure/FirebaseCustomerRepository"
import { CustomerRepository, Customer } from "@kemotsho/module-commerce/customers/domain/Customer"
import { getCurrentUser } from "@kemotsho/core/lib/auth"
import { Effect } from "effect"
import { Schema } from "effect"
import { redirect } from "next/navigation"
import { Button } from "@kemotsho/core/ui/button"
import Link from "next/link"
import { AddressCard } from "@/app/(site)/account/addresses/_components/address-card"

export default async function AddressesPage() {
    const program = Effect.gen(function* (_) {
        const user = yield* _(getCurrentUser)
        const repo = yield* _(CustomerRepository)
        const customer = yield* _(repo.getByUserId(user.uid))
        // Encode to plain JSON for client components to iterate
        return yield* _(Schema.encode(Customer)(customer))
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseCustomerRepositoryLive)
    )

    const result = await AppRuntime.runPromiseExit(runnable)

    if (result._tag === "Failure") {
        return <div>Error loading profile</div>
    }

    const customer = result.value
    const addresses = customer.addresses || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Address Book</h2>
                    <p className="text-muted-foreground">
                        Manage your shipping and billing addresses.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/account/addresses/new">Add Address</Link>
                </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
                {addresses.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">No addresses found. Add one to get started.</p>
                )}
                {addresses.map((addr) => (
                    <AddressCard 
                        key={addr.id} 
                        address={addr}
                        isDefaultShipping={customer.defaultShippingAddress?.id === addr.id}
                        isDefaultBilling={customer.defaultBillingAddress?.id === addr.id}
                    />
                ))}
            </div>
        </div>
    )
}
