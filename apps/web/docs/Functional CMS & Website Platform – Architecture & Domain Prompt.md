\# Functional CMS & Website Platform – Architecture & Domain Prompt    
\*\*Next.js App Router · Effect.ts · Firebase · Firestore · Functional DDD\*\*

\---

\#\# 1\. Purpose of the Application

Build a \*\*reusable, white-label website & CMS platform\*\* (similar in spirit to WordPress or modern headless CMSs) that allows:

\- Public websites for companies and organizations  
\- Admin panels for managing all website content  
\- Role-based access control  
\- Content updates without redeploying the app  
\- Rapid onboarding of new clients via spreadsheet-based data seeding

Firestore is the \*\*single source of truth\*\* for all content and configuration.

\---

\#\# 2\. Core Architectural Principles (Non-Negotiable)

\#\#\# 2.1 Functional DDD  
\- Business rules live in the \*\*domain layer\*\*  
\- UI renders decisions already made  
\- No domain logic in components  
\- Use \*\*Effect.ts\*\* to model workflows, validation, and errors

\#\#\# 2.2 Server-Only Data Access  
\- ❌ Firebase Client SDK is forbidden  
\- ✅ Firebase Admin SDK only  
\- All Firestore & Storage access via \*\*Next.js Server Actions\*\*  
\- Domain rules enforced before persistence

\#\#\# 2.3 Firebase Authentication  
\- Firebase Auth is the only auth provider  
\- User roles stored in:  
  \- Firestore \`users\` collection (domain source of truth)  
  \- Firebase Auth custom claims (fast authorization)  
\- Middleware protects all \`/admin/\*\*\` routes using auth claims

\#\#\# 2.4 UI Consistency & Reuse  
\- Use \*\*shadcn/ui\*\* as base primitives  
\- Wrap shadcn components into \*\*platform atoms\*\*  
\- Create custom semantic atoms:  
  \- Message (error/info/success/warning)  
  \- EmptyState  
  \- PermissionNotice  
  \- InlineFeedback  
\- UI must be themeable via CSS variables

\---

\#\# 3\. High-Level Domain Decomposition (Bounded Contexts)

Identity & Access Context  
 Content Management Context (CORE)  
 Page Composition Context  
 Company Information Context  
 Navigation & Footer Context  
 Media Context  
 Analytics & Audit Context

`---`

`## 4. Firestore Collections (System of Record)`

/content\_items → all reusable content  
 /pages → page compositions (home, about, etc.)  
 /company\_profile → vision, mission, values, about us  
 /contacts → head office & regional addresses  
 /navigation → header/footer menus  
 /site\_settings → social links, global config  
 /users → users & roles

`No page-specific content duplication is allowed.`

`---`

`## 5. Core Aggregate: ContentItem`

`### 5.1 Content Philosophy`

`- Blog, News, Circular, Service, Product, Profile are **not separate entities**`  
`- They are **kinds of the same aggregate**`  
`- Differences are enforced via **domain policies + type refinement**`

`---`

`## 6. Domain Types (Conceptual)`

```` ```ts ````  
`type ContentKind =`  
  `| "blog"`  
  `| "news"`  
  `| "circular"`  
  `| "service"`  
  `| "product"`  
  `| "profile"`

`ContentItem {`  
  `id: ContentId`  
  `kind: ContentKind`  
  `slug: Slug`

  `title: Title`  
  `excerpt?: Excerpt`  
  `body: MarkdownContent`

  `media?: {`  
    `featured?: ImageRef`  
    `thumbnail?: ImageRef`  
    `gallery?: ImageRef[]`  
  `}`

  `seo?: SeoMetadata`

  `lifecycle: {`  
    `status: "draft" | "review" | "published" | "archived"`  
    `publishedAt?: Date`  
    `scheduledAt?: Date`  
    `expiresAt?: Date`  
  `}`

  `access: {`  
    `visibility: "public" | "restricted"`  
    `roles?: UserRole[]`  
  `}`

  `taxonomy?: {`  
    `categories?: string[]`  
    `tags?: string[]`  
  `}`

  `audit: {`  
    `createdBy: UserId`  
    `updatedBy?: UserId`  
    `createdAt: Date`  
    `updatedAt: Date`  
  `}`  
`}`

---

## **7\. @effect/schema – Domain Validation Layer**

### **7.1 Value Objects**

`import * as S from "@effect/schema/Schema"`

`export const Title = S.string.pipe(`  
  `S.minLength(3),`  
  `S.maxLength(120)`  
`)`

`export const Slug = S.string.pipe(`  
  `S.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)`  
`)`

`export const MarkdownContent = S.string.pipe(`  
  `S.minLength(1)`  
`)`

---

### **7.2 ImageRef**

`export const ImageRef = S.struct({`  
  `storagePath: S.string,`  
  `altText: S.string,`  
  `width: S.optional(S.number),`  
  `height: S.optional(S.number)`  
`})`

---

### **7.3 Base Persisted Schema (Loose – Firestore Friendly)**

`export const PersistedContentItemSchema = S.struct({`  
  `kind: S.string,`  
  `slug: S.optional(S.string),`  
  `title: S.optional(S.string),`  
  `excerpt: S.optional(S.string),`  
  `body: S.optional(S.string),`  
  `media: S.optional(S.struct({`  
    `featured: S.optional(ImageRef),`  
    `thumbnail: S.optional(ImageRef)`  
  `})),`  
  `lifecycle: S.struct({`  
    `status: S.string`  
  `})`  
`})`

This schema allows **drafts and incomplete data**.

---

### **7.4 Refined Domain Schemas (Strict)**

#### **Blog (Featured Image Required)**

`export const BlogSchema = S.struct({`  
  `kind: S.literal("blog"),`  
  `title: Title,`  
  `slug: Slug,`  
  `body: MarkdownContent,`  
  `media: S.struct({`  
    `featured: ImageRef`  
  `})`  
`})`

#### **Circular (Restricted & No SEO)**

`export const CircularSchema = S.struct({`  
  `kind: S.literal("circular"),`  
  `title: Title,`  
  `body: MarkdownContent,`  
  `access: S.struct({`  
    `visibility: S.literal("restricted"),`  
    `roles: S.array(S.string).pipe(S.minItems(1))`  
  `})`  
`})`

These schemas are applied **only when publishing**, not when drafting.

---

## **8\. Page Composition Model**

Pages do not store content — they **reference content**.

`/pages/home`

`{`  
  `"slug": "/",`  
  `"sections": [`  
    `{ "type": "hero", "ref": "home-hero" },`  
    `{ "type": "visionMissionValues" },`  
    `{ "type": "aboutUs" },`  
    `{ "type": "contentList", "kind": "service", "limit": 3, "cta": "/services" },`  
    `{ "type": "contentList", "kind": "blog", "limit": 3, "cta": "/blog" },`  
    `{ "type": "contentList", "kind": "product", "limit": 3, "cta": "/products" },`  
    `{ "type": "contentList", "kind": "profile", "limit": 4 },`  
    `{ "type": "contactBlock" }`  
  `]`  
`}`

---

## **9\. Company Information Domain**

`/company_profile/main`

`{`  
  `"vision": { "title": "Vision", "description": "..." },`  
  `"mission": { "title": "Mission", "description": "..." },`  
  `"values": { "title": "Values", "description": "..." },`  
  `"aboutUs": {`  
    `"title": "About Us",`  
    `"body": { "format": "markdown", "value": "..." }`  
  `}`  
`}`

---

## **10\. Contacts Domain**

`/contacts/{id}`

`{`  
  `"region": "Gauteng",`  
  `"address": "123 Main Road",`  
  `"postalCode": "0001",`  
  `"phone": "+27...",`  
  `"email": "info@company.co.za",`  
  `"isHeadOffice": true`  
`}`

---

## **11\. Spreadsheet → Firestore Seeding**

* Each collection maps to a spreadsheet

* CSV upload handled via server action

* Validate rows using @effect/schema

* Reject invalid rows with detailed error reports

* Enables rapid onboarding of new clients

---

## **12\. Caching Strategy**

* Public pages: cached with ISR & tags

* Admin pages: minimal or no caching

* Cache invalidation via `revalidateTag()` on mutations

* Firestore reads minimized

---

## **13\. Non-Negotiable Anti-Patterns**

❌ Firestore client SDK  
 ❌ Page-specific content duplication  
 ❌ Business logic in UI  
 ❌ Role checks in UI for security  
 ❌ Hardcoded layouts  
 ❌ Multiple collections for the same content concept

---

## **14\. End Goal**

A platform that:

* Treats Firestore as the source of truth

* Enforces business rules centrally

* Is fully data-driven

* Is easy to rebrand

* Scales across many client websites

* Enables rapid delivery with minimal custom code

---

## **Guiding Mental Model**

Content is data  
 Pages are composition  
 UI is projection  
 Domain is law  
 Firestore is truth

