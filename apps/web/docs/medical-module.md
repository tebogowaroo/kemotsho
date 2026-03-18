# Medical Practice  Module: Architectural Analysis & Feature Specification

## 1. Executive Summary
The **Medical Practice App** is a specialized B2B2C  platform designed for South African medical professionals. It handles the full lifecycle of a medical practice: from patient intake and clinical record-keeping to complex billing, medical aid claims (using ICD-10/GEMS tariffs), and a patient-facing portal.

**Core Value Proposition:**
- **Automated Complexity:** Handles complex medical tariff codes (ICD-10, NAPPI).
- **Compliance:** Enforces data isolation and audit trails suitable for healthcare.
- **Revenue Management:** Manages split-billing (Patient vs. Medical Aid liability).

## 2. Architectural Blueprint

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Database:** Firebase Firestore (NoSQL).
- **Auth:** Firebase Auth .
- **Architecture Pattern:** Onion Architecture / Domain-Driven Design (DDD) ,functionaly using Effect.ts.

### Modular Structure (Bounded Contexts)
The system is already architected into distinct modules called **Bounded Contexts**. These align perfectly with your goal of adding this as a "switchable module" in your main application.

| Bounded Context | Responsibility | Key Features |
| :--- | :--- | :--- |
| **TenantManagement** | SaaS Admin | Practice onboarding, tiered subscriptions, domain management. |
| **ClinicalRecords** | EMR (Electronic Medical Records) | Patient history, allergies, medications, diagnosis. |
| **SchedulingAccess** | Bookings | Real-time availability, slot management, appointment types. |
| **RevenueCycle** | Financials | Invoicing, medical aid claims, tariff lookups, payments. |
| **PatientIdentity** | CRM | Patient profiles, dependent management, demographics. |
| **ContentManagement** | CMS | Practice website builder, blog posts. |
| **Interoperability** | Standards | ICD-10 / NAPPI code dictionaries and validation. |

---

## 3. Detailed Feature Specifications

### 3.1. Clinical Module (`ClinicalRecords`)
This module replaces physical patient files. It is strictly internal (doctor/admin facing).

*   **Medical History Tracking:**
    *   **Conditions:** Chronic and acute condition tracking.
    *   **Medications:** Current and past prescriptions.
    *   **Allergies:** Critical alert system for drug/food allergies.
    *   **Surgeries:** History of procedures.
*   **Clinical Encounters:**
    *   SOAP Notes (Subjective, Objective, Assessment, Plan).
    *   Digital attachment storage (X-rays, PDFs).

### 3.2. Revenue & Billing Module (`RevenueCycle`)
The most complex module, handling the financial compliance specific to medical practices.

*   **Tariff Management:**
    *   Integration with **GEMS** (Government Employees Medical Scheme) tariffs.
    *   Lookup engine for **ICD-10** (diagnosis) and **NAPPI** (pharmaceutical) codes.
*   **Invoicing Engine:**
    *   **Split Billing:** Automatically splits a bill into "Medical Aid Portion" (claimed) and "Patient Portion" (co-payment).
    *   **Status Workflow:** Draft -> Sent -> Partial -> Paid / Claimed.
*   **Claims Processing:**
    *   Generation of EDI (Electronic Data Interchange) compatible claim data.
    *   Rejection handling and resubmission workflows.

### 3.3. Scheduling Module (`SchedulingAccess`)
Manages the calendar for practitioners.

*   **Slot Generation:** Automated creation of available slots based on practitioner shifts.
*   **Booking Rules:** Duration varies by appointment type (e.g., "Consultation" = 15m, "Procedure" = 45m).
*   **Double-booking prevention:** Strict concurrency checks.

### 3.4. Patient Portal
A white-labeled frontend for patients to interact with the practice.

*   **Self-Service:** Book and cancel appointments.
*   **Financials:** View invoices and download statements.
*   **History:** View own medical history (read-only).
*   **Profile:** Manage contact details and medical aid info.

---

## 4. Integration Strategy: "The Medical Module"

To integrate this into your existing Page Builder/Ecommerce application, treat the **Medical Practice** as a high-tier feature module.

### Phase 1: Context Porting
Move the `src/BoundedContexts` folders directly into your monorepo. These are written in pure TypeScript with no UI dependencies, making them highly portable.

1.  **Copy** `src/BoundedContexts/ClinicalRecords` -> `your-app/modules/medical/clinical`
2.  **Copy** `src/BoundedContexts/RevenueCycle` -> `your-app/modules/medical/revenue`
3.  **Copy** `src/BoundedContexts/SchedulingAccess` -> `your-app/modules/medical/scheduling`

### Phase 2: Feature Toggling
In your main application's "Module Switcher":

```typescript
// Example config in your main app
const medicalModuleConfig = {
  enabled: client.hasFeature('MEDICAL_PRACTICE'),
  features: {
    telehealth: client.tier === 'ENTERPRISE',
    medicalAidBilling: client.region === 'ZA' // Only relevant for SA
  }
}