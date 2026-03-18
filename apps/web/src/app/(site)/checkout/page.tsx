import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { getCurrentUser } from "@kemotsho/core/lib/auth"
import { Effect, pipe } from "effect"
import { CheckoutForm } from "./checkout-form"
import { CustomerRepository, Customer } from "@kemotsho/module-commerce/customers/domain/Customer"
import { FirebaseCustomerRepositoryLive } from "@kemotsho/module-commerce/customers/infrastructure/FirebaseCustomerRepository"
import { Schema } from "effect"

export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  const userOption = await AppRuntime.runPromise(
    Effect.match(getCurrentUser, {
        onFailure: () => null,
        onSuccess: (u) => u
    })
  )

  let encodedCustomer = null
  if (userOption) {
      const customer = await AppRuntime.runPromise(
          pipe(
              Effect.gen(function* (_){
                 const repo = yield* _(CustomerRepository)
                 return yield* _(repo.getByUserId(userOption.uid))
              }),
              Effect.provide(FirebaseCustomerRepositoryLive),
              // Fail loudly during dev, but safe fallback for prod
              Effect.tapError(e => Effect.logError("Checkout Load Error:", e)),
              Effect.catchAll(() => Effect.succeed(null))
          )
      )
      
      if (customer) {
          encodedCustomer = Schema.encodeSync(Customer)(customer)
      }
  }

  return <CheckoutForm user={userOption} customer={encodedCustomer} />
}
