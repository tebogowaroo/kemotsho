\# Authentication, Authorization & Data Access Architecture    
\*\*Firebase Auth \+ Functional DDD \+ Next.js App Router\*\*

\#\# Purpose

Define a strict authentication, authorization, and data-access model that:

\- Uses \*\*Firebase Authentication\*\* as the single identity provider  
\- Stores \*\*user roles in both Firestore and Firebase Auth custom claims\*\*  
\- Protects \*\*all admin routes via middleware\*\*  
\- Enforces \*\*business rules exclusively on the server\*\*  
\- Prevents \*\*any direct client access to Firestore or Firebase Storage\*\*  
\- Improves performance via \*\*server-side caching\*\*  
\- Aligns with \*\*Functional DDD and Effect.ts principles\*\*

\---

\#\# Core Security Principles (Non-Negotiable)

\#\#\# 1\. Firebase Auth Is the Only Authentication Mechanism

\- All users MUST authenticate via Firebase Authentication  
\- No alternative auth systems are allowed  
\- Auth state MUST be verified on the server for every privileged operation

\---

\#\#\# 2\. Roles Exist in Two Places (Required)

User roles MUST be stored in:

1\. \*\*Firestore \`users\` collection\*\* (domain source of truth)  
2\. \*\*Firebase Auth custom claims\*\* (fast authorization \+ middleware)

This ensures:  
\- Fast edge authorization  
\- Domain-level validation  
\- Redundancy and consistency

\---

\#\# User Role Model

\#\#\# Firestore (\`users\` collection)

\`\`\`ts  
User {  
  id: string  
  email: string  
  roles: Array\<"admin" | "editor" | "contributor" | "moderator"\>  
  status: "active" | "suspended"  
  createdAt: Timestamp  
}

### **Firebase Auth Custom Claims**

`{`  
  `roles: ["admin", "editor"]`  
`}`

---

## **Role Synchronization Rules**

* Role updates MUST:

  1. Update Firestore

  2. Update Firebase Auth custom claims

* Role sync MUST happen in a **server action**

* Clients MUST NEVER set or modify roles

---

## **Middleware Authorization (Mandatory)**

### **Scope**

* ALL `/admin/**` routes MUST be protected by middleware

* Middleware MUST:

  * Verify Firebase ID token

  * Read custom claims

  * Enforce role-based access

### **Middleware Behavior**

`/admin → requires at least one admin role`  
`/admin/users → requires "admin"`  
`/admin/content → requires "editor" | "admin"`

### **Forbidden in Middleware**

❌ Firestore access  
 ❌ Business logic  
 ❌ Client SDK usage

Middleware MUST be:

* Fast

* Stateless

* Token-based only

---

## **Firestore & Cloud Storage Access Rules**

### **1\. Client SDK Usage Is Forbidden**

❌ Firebase client SDK  
 ❌ Direct reads from Firestore in the browser  
 ❌ Direct uploads to Firebase Storage from the client

---

### **2\. All Data Access Must Go Through Server Actions**

All Firestore and Storage operations MUST:

* Be executed in **Next.js server actions**

* Use **Firebase Admin SDK**

* Be wrapped in **Effect.ts workflows**

* Enforce domain rules before execution

Allowed operations:

* create

* read

* update

* delete

Only on the server.

---

## **Functional DDD Enforcement**

### **Correct Data Flow**

`UI`  
 `↓`  
`Server Action`  
 `↓`  
`Application Service (Effect)`  
 `↓`  
`Domain Rules`  
 `↓`  
`Repository (Firestore / Storage)`

### **Forbidden Shortcuts**

❌ UI → Firestore  
 ❌ UI → Storage  
 ❌ Server Action → Repository without domain validation

---

## **Example: Server Action Pattern**

`export const createPost = action(async (input) =>`  
  `Effect.gen(function* () {`  
    `const user = yield* CurrentUser`  
    `yield* RoleGuard("editor")`

    `const post = yield* Post.create(input)`  
    `yield* PostRepository.save(post)`

    `return post`  
  `})`  
`)`

---

## **Firestore Security Rules**

Firestore security rules MUST:

* Deny all client access by default

* Assume all access comes from Admin SDK

* Act as a final safety net, not business logic

`match /{document=**} {`  
  `allow read, write: if false;`  
`}`

---

## **Caching Strategy (Required)**

### **Goals**

* Improve page load performance

* Reduce Firestore reads

* Keep content fresh

* Work with Vercel serverless

---

### **Allowed Caching Layers**

#### **1\. Next.js Data Cache**

* Use `fetch(..., { cache: "force-cache" })`

* Use `revalidateTag()` and `revalidatePath()`

#### **2\. Route-Level Caching**

`export const revalidate = 60 // seconds`

#### **3\. Tag-Based Invalidation**

`fetch("/posts", { next: { tags: ["posts"] } })`

On content update:

`revalidateTag("posts")`

---

### **Caching Rules**

* Public content → aggressively cached

* Admin content → minimally cached or uncached

* Role-based content → cache per role where applicable

---

## **Storage Access Pattern**

* All file uploads MUST:

  * Go through server actions

  * Validate user role

  * Validate file type and size

  * Return signed URLs if needed

Clients never upload directly.

---

## **Audit & Traceability (Recommended)**

* Log all admin actions:

  * userId

  * role

  * action

  * entity

  * timestamp

Audit logging MUST occur on the server.

---

## **Anti-Patterns (Strictly Forbidden)**

❌ Firestore client SDK in UI  
 ❌ Client-side role checks for security  
 ❌ Middleware accessing Firestore  
 ❌ Bypassing domain logic in server actions  
 ❌ Hardcoding role logic in UI components

---

## **Mental Model (Always Remember)**

Firebase Auth \= identity  
 Firestore \= domain state  
 Custom claims \= fast authorization  
 Server actions \= enforcement layer

---

## **Goal**

A system that:

* Is secure by default

* Has zero trust in the client

* Enforces business rules centrally

* Scales across multiple client sites

* Remains compliant with Functional DDD principles

