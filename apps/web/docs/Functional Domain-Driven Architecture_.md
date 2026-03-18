Functional Domain-Driven Architecture:  
A Comprehensive Paradigm for Next.js  
Applications using Effect.ts  
1\. Introduction: The Convergence of Functional  
Programming and Domain-Driven Design  
The contemporary landscape of web application architecture is witnessing a significant  
paradigmatic shift. For nearly two decades, the principles of Domain-Driven Design (DDD),  
originally codified by Eric Evans, have been predominantly implemented through  
Object-Oriented Programming (OOP) constructs. This tradition relies heavily on class  
hierarchies, stateful encapsulation, and reflection-based dependency injection  
containers—patterns deeply rooted in Java and C\# ecosystems.1 However, as TypeScript  
matures into the lingua franca of the web, a growing dissonance has emerged between these  
heavy OOP structures and the dynamic, functional nature of the JavaScript runtime.  
Developers transitioning to functional programming (FP) while working within the Next.js  
framework often face an intellectual chasm. The stateless, request-response lifecycle of  
React Server Components (RSC) clashes with the stateful service containers typical of OOP  
frameworks like NestJS. Into this gap enters Effect.ts, a library that provides a robust  
standard library for typed functional programming in TypeScript. It offers primitives for  
managing side effects, concurrency, and error handling that align with the mathematical  
precision of FP while addressing the practical needs of modern web development.2  
This report provides an exhaustive analysis of how to structure Next.js applications to best  
suit complex business domains using Effect.ts. It posits that a "Functional DDD"  
approach—where behavior is separated from data, and side effects are managed as  
first-class values—offers a superior model for scalability and maintainability than traditional  
OOP adaptations. We will explore the structural, tactical, and strategic patterns necessary to  
implement this architecture, providing a definitive guide for engineering teams aiming to  
leverage the full power of TypeScript's type system.  
1.1 The Theoretical Foundation: Algebraic Effects in Domain Modeling  
To understand the recommended structure, one must first appreciate the shift in modeling  
philosophy. In classical DDD, the "Rich Domain Model" combines data and behavior within a  
class (an Entity). The entity manages its own state and invariants. In Functional DDD using  
Effect.ts, we adhere to the principle of segregation of data and behavior.1  
●​ Data is Immutable: Entities and Value Objects are modeled as immutable datastructures (Schemas) rather than classes. They represent the state of the system at a  
specific point in time.  
●​ Behavior is Effectful: Business logic is implemented as pure functions that accept data  
and return an Effect. An Effect\<Success, Error, Requirements\> is a description of a  
program, not the execution itself. It explicitly encodes three dimensions of the operation  
into the type signature:  
1.​ Success (A): The value produced if the operation succeeds (e.g., a User object).  
2.​ Error (E): The specific ways the operation can fail (e.g., UserNotFound,  
DatabaseConnectionError).  
3.​ Requirements (R): The environmental dependencies needed to execute the logic  
(e.g., Database, EmailService).5  
This shift eliminates the "hidden side effects" problem prevalent in OOP, where a method  
signature save(user: User): Promise\<void\> hides the fact that it might throw a database  
exception or require a specific connection pool. By making these explicit, Effect.ts enforces  
architectural boundaries at the compiler level.  
1.2 The Next.js App Router Context  
The integration of this paradigm into Next.js requires careful consideration of the framework's  
architecture. Next.js 13+ introduces the App Router, which fundamentally changes data  
fetching and execution contexts.  
●​ React Server Components (RSC): These components run exclusively on the server.  
They are ideal entry points for Effect runtimes but require strict serialization boundaries  
when passing data to the client.7  
●​ Server Actions: These serve as the primary mutation mechanism, replacing traditional  
REST API controllers. They function as the "Interface Adapter" layer in Clean Architecture,  
invoking domain logic and returning serializable results.8  
●​ Statelessness vs. Context: While HTTP is stateless, complex domains require "scoped"  
context (database transactions, user sessions). Effect's FiberRef and Layer systems  
provide a mechanism to carry this context through the call stack without prop-drilling,  
mirroring the "Request Scope" dependency injection found in backend frameworks but  
with compile-time safety.10  
2\. Strategic Project Structure: The Feature-Sliced  
Monolith  
The organization of a codebase is the first line of defense against entropy. While "Package by  
Layer" (separating controllers, services, repositories into global folders) is common, the  
analysis strongly supports a Feature-First (or "Screaming Architecture") approach for DDD in  
Next.js. This structure ensures that the directory layout reflects the business domain ratherthan technical implementation details.12  
2.1 The High-Level Directory Layout  
The following directory structure is optimized for Next.js with Effect.ts, strictly separating the  
framework coupling (Presentation Layer) from the core domain logic.  
/​  
├── app/  
\# PRESENTATION LAYER (Next.js specific)​  
│ ├── (marketing)/  
\# Route Group for static content​  
│ ├── (platform)/  
\# Route Group for application logic​  
│ │ ├── dashboard/​  
│ │ │ ├── page.tsx  
\# Server Component (View)​  
│ │ │ ├── \_components/  
\# Client Components (Interactivity)​  
│ │ │ └── actions.ts  
\# Server Actions (Controllers)​  
│ │ └── layout.tsx​  
│ └── api/  
\# Route Handlers (Webhooks/External APIs)​  
│​  
├── src/  
\# CORE APPLICATION (Framework Agnostic)​  
│ ├── Main.ts  
\# Runtime Entry Point​  
│ │ ​  
│ ├── domain/  
\# SHARED KERNEL & CROSS-CUTTING CONCERNS​  
│ │ ├── errors/  
\# Global Domain Errors​  
│ │ ├── ids.ts  
\# Branded Type definitions​  
│ │ └── types.ts  
\# Shared Schemas​  
│ │​  
│ ├── modules/  
\# BOUNDED CONTEXTS (Vertical Slices)​  
│ │ ├── identity/  
\# e.g., Authentication/Authorization​  
│ │ │ ├── domain/  
\# Pure Domain Logic (Zero Dependencies)​  
│ │ │ │ ├── User.ts  
\# Entity Schema​  
│ │ │ │ └── UserRepository.ts \# Interface Definition (Tag)​  
│ │ │ ├── application/  
\# Use Cases / Application Services​  
│ │ │ │ ├── RegisterUser.ts​  
│ │ │ │ └── LoginUser.ts​  
│ │ │ └── infrastructure/ \# Implementation Adapters​  
│ │ │  
└── DrizzleUserRepository.ts​  
│ │ │​  
│ │ └── billing/  
\# e.g., Payments/Subscriptions​  
│ │  
├── domain/​  
│ │  
├── application/​│ │  
└── infrastructure/​  
│ │​  
│ └── infra/  
\# GLOBAL INFRASTRUCTURE​  
│  
├── database/​  
│  
│ ├── schema.ts  
\# Drizzle/SQL Schema​  
│  
│ ├── client.ts  
\# Database Connection Layer​  
│  
│ └── migrations/​  
│  
├── email/  
\# Email Service Implementation​  
│  
└── config/  
\# Environment Variable Parsing​  
│​  
├── drizzle/  
\# SQL Migration Files​  
├── drizzle.config.ts​  
├── next.config.ts​  
└── tsconfig.json​  
2.2 Layer Responsibilities and Dependency Rules  
Adhering to the Dependency Rule is critical: source code dependencies can only point  
inward. Nothing in an inner circle can know anything at all about something in an outer circle.14  
2.2.1 The Domain Layer (src/modules/\*/domain)  
This is the heart of the software. It must depend on nothing but the Effect library itself. It  
contains the standard definitions of the business.  
●​ Role: Defines what the system is (Entities) and what it can do (Interfaces/Errors).  
●​ Contents: Effect Schemas, Branded Types for IDs, Tagged Errors, and Service Interfaces  
(Context.Tag).  
●​ Constraint: No imports from drizzle-orm, next, or react.  
2.2.2 The Application Layer (src/modules/\*/application)  
This layer contains the application-specific business rules. It orchestrates the domain objects  
to perform specific user tasks.  
●​ Role: Defines the "Use Cases" or "Workflows" of the application.  
●​ Contents: Functions that return Effects. These functions compose domain services to  
achieve a goal (e.g., "Register User" involves validating input, checking uniqueness,  
hashing password, saving to repo).  
●​ Dependency Injection: It declares dependencies (e.g., yield\* UserRepository) but does  
not instantiate them.  
2.2.3 The Infrastructure Layer (src/modules/\*/infrastructure)  
This layer adapts the application to the outside world.  
●​ Role: Provides concrete implementations for the interfaces defined in the Domain layer.●​ Contents: Drizzle repositories, Stripe API clients, Redis caches.  
●​ Mechanism: Exports Layer objects that satisfy the Context.Tag requirements of the  
Application layer.6  
2.2.4 The Presentation Layer (app/)  
This is the delivery mechanism.  
●​ Role: Handles HTTP requests, renders UI, and captures user input.  
●​ Contents: Next.js Pages, Layouts, Server Actions, and Client Components.  
●​ Interaction: It constructs the runtime (or uses a global one) and executes the  
Application Layer's effects.  
3\. Domain Modeling with Effect Schema  
In a functional environment, the class-based modeling of DDD is replaced by schema-based  
modeling. @effect/schema is a powerful tool that unifies runtime validation, static type  
generation, and data transformation, serving as the single source of truth for the Ubiquitous  
Language.1  
3.1 Entities and Branded Types (Identity)  
A core tenet of DDD is that Entities are defined by their identity. Primitive obsession (using  
string for everything) allows for dangerous bugs where a UserId is accidentally passed to a  
function expecting an OrderId. Effect.ts solves this with Branded Types.  
TypeScript  
// src/modules/billing/domain/Order.ts​  
import { Schema } from "@effect/schema"​  
​  
// 1\. Define Identity: A nominal type that is distinct from string​  
export const OrderId \= Schema.String.pipe(Schema.brand("OrderId"))​  
// TypeScript Type: string & Brand\<"OrderId"\>​  
export type OrderId \= Schema.Schema.Type\<typeof OrderId\>​  
​  
export const CustomerId \= Schema.String.pipe(Schema.brand("CustomerId"))​  
export type CustomerId \= Schema.Schema.Type\<typeof CustomerId\>​  
​  
// 2\. Define Entity Structure​  
export const Order \= Schema.Struct({​  
id: OrderId,​customerId: CustomerId,​  
amount: Schema.Number.pipe(Schema.positive()),​  
status: Schema.Literal("PENDING", "PAID", "SHIPPED"),​  
createdAt: Schema.Date​  
})​  
​  
export type Order \= Schema.Schema.Type\<typeof Order\>​  
Architectural Insight: By using Schema.brand, we enforce domain integrity at the compile  
time. A function cancelOrder(id: OrderId) will structurally reject a string or a CustomerId. This  
eliminates an entire class of bugs common in untyped JS backends.1  
3.2 Value Objects and Refinements  
Value Objects are immutable and defined by their attributes. Effect Schema allows us to  
embed business invariants (validation rules) directly into the type definition using refinements.  
TypeScript  
// src/modules/shared/Email.ts​  
import { Schema } from "@effect/schema"​  
​  
export const Email \= Schema.String.pipe(​  
Schema.pattern(/^\[^\\s@\]+@\[^\\s@\]+\\.\[^\\s@\]+$/), // Regex validation​  
Schema.brand("Email")​  
)​  
export type Email \= Schema.Schema.Type\<typeof Email\>​  
When data enters the system (e.g., from a form), we use  
Schema.decodeUnknown(Email)(input). If it succeeds, we have a guarantee that the data  
satisfies all business rules. This aligns with the "Parse, don't validate" philosophy, ensuring  
that invalid data cannot exist deep within the domain logic.17  
3.3 Modeling Domain Errors  
In FP, errors are values, not exceptions. We use Data.TaggedError to define domain-specific  
failure modes. This allows us to handle errors exhaustively using pattern matching.TypeScript  
// src/modules/billing/domain/errors.ts​  
import { Data } from "effect"​  
​  
export class InsufficientFunds extends Data.TaggedError("InsufficientFunds")\<{​  
readonly currentBalance: number​  
readonly attemptedAmount: number​  
}\> {}​  
​  
export class OrderNotFound extends Data.TaggedError("OrderNotFound")\<{​  
readonly orderId: string​  
}\> {}​  
By defining errors as data, we decouple the failure reason from the mechanism of failure. The  
InsufficientFunds error can be serialized and sent to the client, logged, or used to trigger a  
retry policy, all without the performance cost and unpredictability of try/catch blocks.5  
4\. Orchestrating Business Logic: The Application  
Service  
The Application Layer is where we define the "verbs" of our system. In Effect.ts, a service is  
best represented as a Context Tag, which acts as an abstract interface.  
4.1 Defining the Service Interface  
Instead of an abstract class, we define a Tag that describes the shape of the service.  
TypeScript  
// src/modules/billing/domain/PaymentGateway.ts​  
import { Context, Effect } from "effect"​  
import { OrderId } from "./Order"​  
import { InsufficientFunds, PaymentSystemError } from "./errors"​  
​  
export class PaymentGateway extends Context.Tag("PaymentGateway")\<​  
PaymentGateway,​  
{​readonly charge: (​  
amount: number,​  
orderId: OrderId​  
) \=\> Effect.Effect\<void, InsufficientFunds | PaymentSystemError\>​  
}​  
\>() {}​  
Comparison: This is functionally equivalent to interface IPaymentGateway in OOP. However,  
Context.Tag is a runtime value that allows Effect's dependency injection system to locate the  
implementation at runtime.6  
4.2 The Use Case (Workflow)  
We compose these services into high-level workflows using Effect.gen. This syntax mimics  
async/await but constructs a lazy effect graph.  
TypeScript  
// src/modules/billing/application/ProcessPayment.ts​  
import { Effect } from "effect"​  
import { PaymentGateway } from "../domain/PaymentGateway"​  
import { OrderRepository } from "../domain/OrderRepository"​  
import { OrderId } from "../domain/Order"​  
​  
export const ProcessPayment \= (orderId: OrderId, amount: number) \=\>​  
Effect.gen(function\* (\_) {​  
// Dependency Injection: Request the services​  
const payment \= yield\* \_(PaymentGateway)​  
const repo \= yield\* \_(OrderRepository)​  
​  
// Domain Logic: Fetch Order​  
const order \= yield\* \_(repo.findById(orderId))​  
​  
// Business Rule: Check status​  
if (order.status \=== "PAID") {​  
return yield\* \_(Effect.log("Order already paid"))​  
}​  
​  
// Infrastructure: Charge card​  
yield\* \_(payment.charge(amount, orderId))​​  
// Infrastructure: Update Order​  
const updatedOrder \= {...order, status: "PAID" }​  
yield\* \_(repo.save(updatedOrder))​  
​  
return updatedOrder​  
})​  
The return type of ProcessPayment is automatically inferred as:  
Effect\<Order, OrderNotFound | InsufficientFunds | PaymentSystemError | DatabaseError,  
PaymentGateway | OrderRepository\>  
This signature tells us exactly what the operation does, what can go wrong, and what it needs  
to run. This transparency is the "killer feature" of Effect in a DDD context.3  
5\. Infrastructure: Layers and Drizzle Integration  
The Infrastructure layer implements the interfaces defined in the domain. We use Layers to  
construct these services. A Layer describes how to create a service, including its initialization  
(opening connections) and destruction (closing connections).  
5.1 The Database Layer with Drizzle  
Drizzle ORM is widely recommended for its type safety, but it requires a bridge to work with  
Effect's resource management.  
TypeScript  
// src/infra/database/LiveDatabase.ts​  
import { Layer, Config, Effect } from "effect"​  
import { drizzle } from "drizzle-orm/node-postgres"​  
import { Pool } from "pg"​  
import { Database } from "./DatabaseService" // The Tag​  
​  
export const DatabaseLive \= Layer.effect(​  
Database,​  
Effect.gen(function\* (\_) {​  
const connectionString \= yield\* \_(Config.string("DATABASE\_URL"))​  
​  
// Resource Management: Automatically closes pool on shutdown​  
const pool \= yield\* \_(​Effect.acquireRelease(​  
Effect.sync(() \=\> new Pool({ connectionString })),​  
(p) \=\> Effect.promise(() \=\> p.end())​  
)​  
)​  
​  
return drizzle(pool)​  
})​  
)​  
This pattern ensures that we never leave dangling database connections, a common issue in  
serverless environments or during hot-reloads.21  
5.2 Repository Implementation  
We implement the OrderRepository tag by providing a layer that depends on the Database  
service.  
TypeScript  
// src/modules/billing/infrastructure/PostgresOrderRepository.ts​  
import { Layer, Effect } from "effect"​  
import { OrderRepository } from "../domain/OrderRepository"​  
import { Database } from "@/src/infra/database/DatabaseService"​  
import { orders } from "@/src/infra/database/schema"​  
import { eq } from "drizzle-orm"​  
​  
const make \= Effect.gen(function\* (\_) {​  
const db \= yield\* \_(Database)​  
​  
return {​  
findById: (id) \=\>​  
Effect.tryPromise({​  
try: () \=\> db.select().from(orders).where(eq(orders.id, id)),​  
catch: (error) \=\> new DatabaseError({ cause: error })​  
}).pipe(​  
Effect.map((rows) \=\> Option.fromNullable(rows))​  
),​  
​  
save: (order) \=\> ​Effect.tryPromise({​  
try: () \=\> db.insert(orders).values(order),​  
catch: (error) \=\> new DatabaseError({ cause: error })​  
})​  
}​  
})​  
​  
export const PostgresOrderRepositoryLive \= Layer.effect(OrderRepository, make)​  
5.3 Assembling the Dependency Graph  
We combine all our infrastructure layers into a single AppLayer.  
TypeScript  
// src/MainLayer.ts​  
import { Layer } from "effect"​  
import { DatabaseLive } from "./infra/database/LiveDatabase"​  
import { PostgresOrderRepositoryLive } from  
"./modules/billing/infrastructure/PostgresOrderRepository"​  
import { StripePaymentGatewayLive } from "./modules/billing/infrastructure/StripePaymentGateway"​  
​  
export const MainLayer \= Layer.mergeAll(​  
PostgresOrderRepositoryLive,​  
StripePaymentGatewayLive​  
).pipe(​  
Layer.provide(DatabaseLive),​  
Layer.provide(ConfigLive)​  
)​  
Effect memoizes layers, so even if multiple repositories depend on DatabaseLive, the  
database pool is initialized only once.19  
6\. The Hard Problem: Per-Request Scope and  
Transactions  
In monolithic frameworks like NestJS, "Request Scoped" beans allow sharing a transaction  
instance across a request. In Effect, we handle this using FiberRef or by leveraging the  
Effect.scoped primitive to manage the lifetime of a transaction.6.1 The Transactional Boundary  
To implement a Unit of Work where multiple repository calls share a database transaction, we  
cannot simply use the global Database service. We need to create a Transaction  
Middleware.  
The strategy involves defining a function that takes an Effect, starts a Drizzle transaction, and  
provides a new instance of the Database service (backed by the transaction) to that Effect.  
TypeScript  
// src/infra/database/Transaction.ts​  
import { Effect, Layer } from "effect"​  
import { Database } from "./DatabaseService"​  
​  
export const runInTransaction \= \<A, E, R\>(​  
program: Effect.Effect\<A, E, R\>​  
) \=\>​  
Effect.gen(function\* (\_) {​  
const db \= yield\* \_(Database) // The global pool​  
​  
return yield\* \_(​  
Effect.tryPromise(async () \=\> {​  
// Drizzle's transaction API​  
return await db.transaction(async (tx) \=\> {​  
// Create a Layer representing the Transactional DB​  
const TxLayer \= Layer.succeed(Database, tx as any)​  
​  
// Inject the transaction client into the program​  
// This replaces the global pool with the tx client​  
// for the scope of 'program'​  
return await Effect.runPromise(​  
program.pipe(Effect.provide(TxLayer))​  
)​  
})​  
})​  
)​  
})​  
Mechanism: When ProcessPayment runs inside runInTransaction, its call to OrderRepositoryasks for Database. Instead of getting the global pool, it gets the TxLayer we just injected.  
Thus, all queries run inside the transaction automatically. If the program fails (returns a Left),  
Drizzle's transaction will rollback.23  
7\. Next.js Integration: Server Actions and Runtimes  
Next.js Server Actions serve as the entry point for mutations. They must handle the  
serialization boundary between the client (JSON) and the server (Effect types).  
7.1 The Managed Runtime  
We cannot initialize our MainLayer (connecting to DB, etc.) on every request. We need a global  
runtime instance.  
TypeScript  
// src/lib/Runtime.ts​  
import { ManagedRuntime } from "effect"​  
import { MainLayer } from "../MainLayer"​  
​  
// This initializes the application once​  
export const AppRuntime \= ManagedRuntime.make(MainLayer)​  
7.2 The Server Action Wrapper  
Effect types (Option, Either, Exit) are not serializable by React. We must unwrap them into a  
plain object structure (Result Pattern) before returning to the client.  
TypeScript  
// src/lib/action.ts​  
import { Effect, Exit } from "effect"​  
import { AppRuntime } from "./Runtime"​  
​  
type ActionResult\<T\> \= ​  
​  
| { success: true; data: T }​  
| { success: false; error: string; details?: any }​​  
export async function runServerAction\<A, E\>(​  
effect: Effect.Effect\<A, E, any\>​  
): Promise\<ActionResult\<A\>\> {​  
const result \= await AppRuntime.runPromiseExit(effect)​  
​  
if (Exit.isSuccess(result)) {​  
return { success: true, data: result.value }​  
} else {​  
// Handle specific domain errors here​  
const failure \= result.cause.failureOrCause​  
return { ​  
success: false, ​  
error: "Action Failed", ​  
details: failure ​  
}​  
}​  
}​  
7.3 Usage in a Server Action  
TypeScript  
// app/actions.ts​  
"use server"​  
​  
import { ProcessPayment } from "@/src/modules/billing/application/ProcessPayment"​  
import { runServerAction } from "@/src/lib/action"​  
import { OrderId } from "@/src/modules/billing/domain/Order"​  
​  
export async function payOrder(formData: FormData) {​  
const id \= OrderId.make(formData.get("orderId") as string)​  
const amount \= Number(formData.get("amount"))​  
​  
// Compose the workflow​  
const program \= ProcessPayment(id, amount)​  
​  
// Execute​  
return runServerAction(program)​  
}​This pattern keeps the Server Action file extremely thin, delegating all logic to the  
Domain/Application layers.9  
8\. Form Handling and Validation  
Integrating Effect's schema validation with frontend forms (like react-hook-form and  
useActionState) requires mapping Schema errors to the UI.  
8.1 Schema to UI Errors  
Effect Schema produces detailed, tree-structured errors. UI libraries expect a flat list of field  
paths. ArrayFormatter is the bridge.  
TypeScript  
// src/lib/errors.ts​  
import { ArrayFormatter } from "@effect/schema"​  
import { ParseResult } from "effect"​  
​  
export function mapValidationErrors(error: ParseResult.ParseError) {​  
const issues \= ArrayFormatter.formatErrorSync(error)​  
return issues.reduce((acc, issue) \=\> {​  
const path \= issue.path.join(".")​  
acc\[path\] \= issue.message​  
return acc​  
}, {} as Record\<string, string\>)​  
}​  
This allows you to return validation errors from a Server Action and display them directly on  
the specific input fields in your Client Components.26  
9\. Testing Strategy  
One of the primary benefits of this architecture is the ease of testing. Because all  
dependencies are explicit in the Requirements type, we can easily swap them for mocks.  
9.1 Unit Testing with Test Layers  
We can test the ProcessPayment workflow without a database.TypeScript  
// tests/ProcessPayment.test.ts​  
import { it, expect } from "vitest"​  
import { Effect, Layer } from "effect"​  
import { ProcessPayment } from "@/src/modules/billing/application/ProcessPayment"​  
import { PaymentGateway } from "@/src/modules/billing/domain/PaymentGateway"​  
​  
it("should fail if payment is declined", async () \=\> {​  
// Create a Mock Layer​  
const PaymentMock \= Layer.succeed(PaymentGateway, {​  
charge: () \=\> Effect.fail(new PaymentSystemError())​  
})​  
​  
// Provide the mock​  
const program \= ProcessPayment("order-1", 100).pipe(​  
Effect.provide(PaymentMock),​  
Effect.provide(OrderRepoMock) // Assuming this is also mocked​  
)​  
​  
const result \= await Effect.runPromiseExit(program)​  
​  
expect(result.\_tag).toBe("Failure")​  
})​  
This testing style is faster and less brittle than dependency injection containers that require  
specialized testing modules (like Test.createTestingModule in NestJS).27  
10\. Observability and Maintenance  
A robust DDD implementation requires visibility into the domain's behavior. Effect.ts has  
built-in support for OpenTelemetry.  
●​ Tracing: By wrapping operations in Effect.withSpan("operation\_name"), you  
automatically generate traces. When running in Next.js, these traces can be exported to  
services like Jaeger or Datadog to visualize the entire request lifecycle, including  
database queries and external API calls.  
●​ Logging: Effect's Logger service allows for structured logging. Because it is a service,  
you can easily swap the logger implementation (e.g., from console.log to a JSON logger)  
via Layers without changing the domain code.1111. Conclusion  
Structuring a Next.js project with Effect.ts and Domain-Driven Design represents a  
sophisticated evolution of backend architecture. By moving away from class-based OOP  
patterns and embracing functional primitives, teams can achieve a higher degree of type  
safety, testability, and resilience.  
Summary of Recommendations:  
1.​ Adopt Feature-First Structure: Organize code by business domain (modules/billing,  
modules/identity) rather than technical role.  
2.​ Use Schema as Truth: Replace DTO classes and manual validation logic with  
@effect/schema to drive both runtime validation and static typing.  
3.​ Strict Layering: Enforce the Dependency Rule. Domain layers must not import Next.js or  
Drizzle specific code. Use Context.Tag to define interfaces.  
4.​ Managed Runtime: Use a global ManagedRuntime to handle connection pools, but  
leverage scoped providers for per-request transactions and tracing.  
5.​ Errors as Values: Eliminate throw from your business logic. Return Either or Exit types  
and handle them explicitly at the Server Action boundary.  
While the learning curve for Effect.ts is steeper than standard Promises, the payoff is a  
codebase that is rigorously checked by the compiler, virtually eliminating runtime type errors  
and unhandled exceptions. This architecture transforms the Next.js backend from a simple set  
of route handlers into a robust, enterprise-grade domain host.  
Table 1: Comparison of OOP DDD (NestJS) vs. Functional DDD (Effect.ts)  
FeatureOOP DDD (NestJS)Functional DDD  
(Effect.ts)  
Domain ModelMutable Classes with  
MethodsImmutable Data (Schema)  
\+ Pure Functions  
IdentityPrimitive types or Value  
Object wrappersBranded Types (Nominal  
Typing)  
Dependency InjectionRuntime Container  
(Reflection/Decorators)Type-level Requirements  
(Context, Layer)  
Error HandlingExceptions (try/catch)Errors as Values (Either,Exit)  
AsynchronyPromiseEffect (Lazy, Interruptible)  
ValidationDecorators  
(class-validator)Schemas (@effect/schema)  
TestingMocking Containers / Jest  
MocksLayer Replacement / Test  
Layers  
Works cited  
1.​ Domain Driven Design and functional programming (with Effect) | by ..., accessed  
on January 9, 2026,  
https://medium.com/@setni/domain-driven-design-and-functional-programming  
\-with-effect-440686b51d5e  
2.​ Effect – The best way to build robust apps in TypeScript, accessed on January 9,  
2026, https://effect.website/  
3.​ Breaking Down Effect TS : Part 1 \- DEV Community, accessed on January 9, 2026,  
https://dev.to/modgil\_23/breaking-down-effect-ts-part-1-2e0i  
4.​ opinions about Effect-TS, do you recommend using it? when to use it ..., accessed  
on January 9, 2026,  
https://www.reddit.com/r/typescript/comments/16w3iwn/opinions\_about\_effectts  
\_do\_you\_recommend\_using\_it/  
5.​ Next-level type safety with Effect: an intro \- aleksandra.codes, accessed on  
January 9, 2026, https://www.aleksandra.codes/effect-intro  
6.​ Managing Layers | Effect Documentation, accessed on January 9, 2026,  
https://effect.website/docs/requirements-management/layers/  
7.​ Getting Started: Server and Client Components \- Next.js, accessed on January 9,  
2026, https://nextjs.org/docs/app/getting-started/server-and-client-components  
8.​ Server Actions and Mutations \- Data Fetching \- Next.js, accessed on January 9,  
2026,  
https://nextjs.org/docs/13/app/building-your-application/data-fetching/server-acti  
ons-and-mutations  
9.​ The simplest example to understand Server Actions in Next.js, accessed on  
January 9, 2026, https://scastiel.dev/simplest-example-server-actions-nextjs  
10.​Per-Request Database Transactions with NestJS and TypeORM, accessed on  
January 9, 2026,  
https://aaronboman.com/programming/2020/05/15/per-request-database-transa  
ctions-with-nestjs-and-typeorm/  
11.​ Introduction to Runtime | Effect Documentation, accessed on January 9, 2026,  
https://effect.website/docs/runtime/  
12.​Vertical Slicing & Clean Architecture: A Practical Guide for Elysia ..., accessed onJanuary 9, 2026,  
https://gist.github.com/RezaOwliaei/477ed74fc77aa5df2a854789538dd79d  
13.​mcrovero/effect-nextjs: Typed helpers for building Next.js ... \- GitHub, accessed  
on January 9, 2026, https://github.com/mcrovero/effect-nextjs  
14.​Implementing Clean Architecture with TypeScript \- DEV Community, accessed on  
January 9, 2026,  
https://dev.to/dvorlandi/implementing-clean-architecture-with-typescript-3jpc  
15.​A TypeScript Stab at Clean Architecture \- freeCodeCamp, accessed on January  
9, 2026,  
https://www.freecodecamp.org/news/a-typescript-stab-at-clean-architecture-b5  
1fbb16a304/  
16.​TS+ Post-Mortem | Effect Documentation, accessed on January 9, 2026,  
https://effect.website/blog/ts-plus-postmortem/  
17.​Introduction to Effect Schema | Effect Documentation, accessed on January 9,  
2026, https://effect.website/docs/schema/introduction/  
18.​Next.js Server Actions Error Handling: A Production-Ready Guide, accessed on  
January 9, 2026,  
https://medium.com/@pawantripathi648/next-js-server-actions-error-handling-t  
he-pattern-i-wish-i-knew-earlier-e717f28f2f75  
19.​Services & Layers \- Effect Solutions, accessed on January 9, 2026,  
https://www.effect.solutions/services-and-layers  
20.​A gentle introduction to Effect TS, accessed on January 9, 2026,  
https://blog.mavnn.co.uk/2024/09/16/intro\_to\_effect\_ts.html  
21.​The Data-Access-Pattern first approach with Drizzle \- Medium, accessed on  
January 9, 2026,  
https://medium.com/drizzle-stories/the-data-access-pattern-first-approach-with  
\-drizzle-bca035bbdc63  
22.​Postgres database with Effect and Drizzle \- typeonce.dev, accessed on January 9,  
2026,  
https://www.typeonce.dev/course/paddle-payments-full-stack-typescript-app/se  
rver-implementation/postgres-database-with-effect-and-drizzle  
23.​Atomic Repositories in Clean Architecture and TypeScript, accessed on January  
9, 2026,  
https://blog.sentry.io/atomic-repositories-in-clean-architecture-and-typescript/  
24.​Transactions with DDD and Repository Pattern in TypeScript \- Medium, accessed  
on January 9, 2026,  
https://medium.com/@joaojbs199/transactions-with-ddd-and-repository-pattern  
\-in-typescript-a-guide-to-good-implementation-part-2-da0af3e10901  
25.​Refactored my entire NextJS backend to Effect.ts ... \- Reddit, accessed on  
January 9, 2026,  
https://www.reddit.com/r/nextjs/comments/1owjujl/refactored\_my\_entire\_nextjs\_b  
ackend\_to\_effectts/  
26.​Error Formatters | Effect Documentation, accessed on January 9, 2026,  
https://effect.website/docs/schema/error-formatters/  
27.​Layer.ts \- effect, accessed on January 9, 2026,https://effect-ts.github.io/effect/effect/Layer.ts.html  
28.​Unit Testing Next.js Server Action and RevalidatePath with Vitest ..., accessed on  
January 9, 2026, https://www.youtube.com/watch?v=YZz7aTJHprA  
