import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { FirebaseCustomerRepositoryLive } from "@kemotsho/module-commerce/customers/infrastructure/FirebaseCustomerRepository"
import { CustomerRepository } from "@kemotsho/module-commerce/customers/domain/Customer"
import { getCurrentUser } from "@kemotsho/core/lib/auth"
import { Effect } from "effect"
import { ProfileForm } from "./_components/profile-form"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
    const program = Effect.gen(function* (_) {
        const user = yield* _(getCurrentUser)
        const repo = yield* _(CustomerRepository)
        const customer = yield* _(repo.getByUserId(user.uid))
        return customer
    })

    const runnable = program.pipe(
        Effect.provide(FirebaseCustomerRepositoryLive)
    )

    const result = await AppRuntime.runPromiseExit(runnable)

    if (result._tag === "Failure") {
        redirect("/login?next=/account/profile")
    }

    const customer = result.value
    const plainCustomer = {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone._tag === "Some" ? customer.phone.value : ""
    }

    return (
        <div className="container max-w-2xl py-10">
            <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
            <ProfileForm initialData={plainCustomer} />
        </div>
    )
}
