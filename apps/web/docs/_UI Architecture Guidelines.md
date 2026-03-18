\# UI Architecture Guidelines    
\*\*Atomic Design \+ shadcn/ui \+ Functional UI Principles\*\*

\#\# Purpose

Define a strict, scalable UI architecture that:

\- Uses \*\*shadcn/ui as the base primitive layer\*\*  
\- Introduces \*\*custom platform atoms\*\* for semantic UI (errors, banners, states)  
\- Enforces \*\*consistent UI language\*\* across the entire application  
\- Maximizes \*\*code reuse\*\*  
\- Makes \*\*theming and brand customization trivial\*\*  
\- Keeps UI \*\*stateless, functional, and domain-agnostic\*\*

This system must support:  
\- Admin panels  
\- Public websites  
\- Multi-brand white-label customization  
\- Long-term maintainability

\---

\#\# Core Principles (Non-Negotiable)

\#\#\# 1\. shadcn/ui Is the Foundation, Not the Design System

\- shadcn/ui components are \*\*low-level primitives\*\*  
\- They MUST be wrapped by platform atoms  
\- Feature code MUST NOT import shadcn/ui directly

❌ Forbidden:  
\`\`\`ts  
import { Button } from "@/components/ui/button"

✅ Allowed:

`import { Button } from "@/shared/ui/atoms/button"`

---

### **2\. Atoms Are Semantic, Not Structural**

Atoms represent **meaning**, not HTML elements.

Examples of valid atoms:

* `Button`

* `Input`

* `Message`

* `EmptyState`

* `PermissionNotice`

Examples of invalid atoms:

* `Div`

* `Flex`

* `Box`

---

### **3\. UI Is Stateless and Logic-Free**

UI components MUST:

* Accept all state via props

* Contain no business logic

* Contain no Effect logic

* Contain no permission checks

* Contain no validation rules

UI renders **decisions already made** elsewhere.

---

### **4\. One Visual Language Across the Entire App**

If two screens express the same idea, they MUST:

* Use the same atom

* Look the same

* Behave the same

This is how consistency is enforced.

---

## **Layered UI Architecture**

`shadcn/ui primitives`  
   `↓`  
`platform atoms (wrapped)`  
   `↓`  
`molecules (composition)`  
   `↓`  
`feature components`  
   `↓`  
`pages & layouts`

---

## **Directory Structure**

`src/shared/ui/`  
  `atoms/`  
    `button.tsx`  
    `input.tsx`  
    `textarea.tsx`  
    `message.tsx`  
    `empty-state.tsx`  
    `badge.tsx`  
    `permission-notice.tsx`  
    `loading-indicator.tsx`

  `molecules/`  
    `form-field.tsx`  
    `error-summary.tsx`  
    `page-notice.tsx`  
    `markdown-editor.tsx`  
    `confirm-dialog.tsx`

  `layouts/`  
    `admin-shell.tsx`  
    `public-shell.tsx`

---

## **shadcn Wrapping Rules**

All shadcn components MUST be wrapped.

### **Example: Button Atom**

`// atoms/button.tsx`  
`import { Button as ShadcnButton } from "@/components/ui/button"`  
`import { cn } from "@/lib/utils"`

`type ButtonProps = React.ComponentProps<typeof ShadcnButton> & {`  
  `intent?: "primary" | "danger" | "ghost"`  
`}`

`export function Button({ intent = "primary", className, ...props }: ButtonProps) {`  
  `return (`  
    `<ShadcnButton`  
      `{...props}`  
      `className={cn(`  
        `intent === "danger" && "bg-destructive text-destructive-foreground",`  
        `intent === "ghost" && "bg-transparent",`  
        `className`  
      `)}`  
    `/>`  
  `)`  
`}`

---

## **Custom Semantic Atoms (Required)**

The following atoms MUST exist and be reused everywhere.

### **1\. Message (Error / Info / Warning / Success)**

`type MessageVariant = "error" | "info" | "success" | "warning"`

`<Message`  
  `variant="error"`  
  `title="Permission denied"`  
  `description="You do not have access to publish content."`  
`/>`

Used for:

* Server action failures

* Permission errors

* System notices

---

### **2\. EmptyState**

`<EmptyState`  
  `title="No posts yet"`  
  `description="Create your first post to get started."`  
  `action={<Button>Create post</Button>}`  
`/>`

Used when:

* Lists are empty

* Filters return no results

* User has no data

---

### **3\. PermissionNotice**

`<PermissionNotice`  
  `title="Restricted area"`  
  `description="You need editor access to manage this content."`  
`/>`

Used when:

* User is authenticated but not authorized

---

### **4\. InlineFeedback**

`<InlineFeedback variant="error">`  
  `Title is required`  
`</InlineFeedback>`

Used for:

* Form field validation

* Inline warnings

---

## **Molecules (Composition Rules)**

Molecules:

* Compose atoms

* May contain light layout logic

* MUST NOT introduce business rules

Example: FormField

`<FormField label="Title" error={error}>`  
  `<Input />`  
`</FormField>`

---

## **Theming & Brand Customization**

### **1\. All Colors Use Tailwind Tokens**

❌ Forbidden:

`bg-red-500`

✅ Required:

`bg-destructive`  
`text-muted-foreground`

---

### **2\. Theme via CSS Variables**

All brands override:

`:root {`  
  `--primary: ...`  
  `--destructive: ...`  
`}`

No component code changes allowed for branding.

---

## **Accessibility Requirements**

* Use semantic roles (`role="alert"`, `aria-live`)

* Never hide errors from screen readers

* All atoms must be keyboard-accessible

---

## **Anti-Patterns (Strictly Forbidden)**

❌ Feature components importing shadcn directly  
 ❌ Inline error UI duplicated across pages  
 ❌ Conditional business logic inside UI  
 ❌ Hardcoded colors  
 ❌ “One-off” UI for the same concept

---

## **Mental Model (Always Remember)**

shadcn/ui \= parts  
 platform atoms \= language  
 features \= sentences

---

## **Goal**

A UI system that:

* Feels identical across the entire app

* Is trivial to rebrand

* Is easy to reason about

* Never leaks business logic

* Scales across clients and teams

If a UI decision is repeated more than once —  
 **it must become an atom.**

