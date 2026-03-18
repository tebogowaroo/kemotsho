# Project Architecture & Coding Guidelines

You are working on a **Functional Domain-Driven Design (DDD)** project using **Next.js App Router**, **Effect.ts**, and **Firebase**.

## 1. Core Principles (Non-Negotiable)
- **Functional Programming**: Use `Effect.ts` for all business logic. Avoid `try/catch` or throwing errors. Use `Effect.gen` and `yield*`.
- **Server-Only Security**: NEVER use the Firebase Client SDK. All data access must go through **Server Actions** using the `firebase-admin` SDK.
- **Strict Layering**:
  - `src/domain`: Pure TypeScript. NO imports from `react`, `next`, or `infrastructure`.
  - `src/application`: Orchestrates domain logic. Returns `Effect`.
  - `src/infrastructure`: Implements interfaces (Repositories, Services).
  - `app/`: Presentation layer only. Calls Server Actions.
- **Feature-Sliced Structure**: Code is organized by feature (e.g., `src/modules/billing`), NOT by type (e.g., `src/controllers`).

## 2. Effect.ts Patterns
- **Errors**: Define errors as `Data.TaggedError` classes in the domain.
- **Schemas**: Use `@effect/schema` for all Entities and Value Objects. Use `Schema.brand` for IDs (e.g., `UserId`).
- **Dependency Injection**: Use `Context.Tag` for services.

## 3. UI Guidelines (Shadcn + Atoms)
- **Platform Atoms**: NEVER import from `@/components/ui` directly in features. Always use strict wrapper wrappers in `@/shared/ui/atoms`.
- **Logic-Free UI**: Components must not contain business logic or permissions checks. They strictly render props.
- **Consistency**: Use existing atoms (`Message`, `EmptyState`, `InlineFeedback`) instead of determining new UI.

## 4. Authentication
- **Dual Support**: User roles exist in BOTH Firestore (`users` collection) and Firebase Auth (Custom Claims).
- **Middleware**: Protects `/admin` routes using Custom Claims.

## 5. Mental Model
- **Content is Data**: Firestore is the single source of truth.
- **UI is Projection**: The UI just renders decisions made in the Domain layer.
