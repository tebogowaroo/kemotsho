# Medical Practice Domain Models & Entities

## 1. Overview
The core business logic is encapsulated within **Bounded Contexts**, adhering to strict DDD principles.
- **Aggregates**: Transaction boundaries (e.g., `Patient`, `Invoice`). All state changes must go through these roots.
- **Entities**: Objects with identity (e.g., `Appointment`, `BookingSlot`).
- **Value Objects**: Immutable attributes (e.g., `EmailAddress`, `Money`, `Slug`).

---

## 2. Context: Clinical Records
Responsible for the patient's Electronic Medical Record (EMR). It tracks medical history, excluding appointment scheduling or billing.

### 2.1. Aggregate: `Condition`
Represents a medical diagnosis or issue associated with a patient.
*   **Properties:**
    *   `id`: Unique Identifier
    *   `patientId`: Reference to Patient Aggregate
    *   `name`: Human-readable name (e.g., "Type 2 Diabetes")
    *   `icd10`: Standard ICD-10 code (e.g., "E11.9")
    *   `status`: `'active' | 'resolved' | 'chronic'`
    *   `severity`: (Optional) Severity level
    *   `diagnosedDate`: Date of initial diagnosis
    *   `resolvedDate`: (Optional) Date when condition ended
*   **Key Behaviors:**
    *   `markResolved(date: Date)`: Transitions status to 'resolved'.
    *   `updateSeverity(level: string)`: Updates clinical severity.

### 2.2. Other Entities
*   **`Allergy`**: Tracks drug/food sensitivities (Critical for safety).
*   **`Medication`**: Tracks prescriptions and active meds.
*   **`Surgery`**: Historical record of procedures.

---

## 3. Context: Revenue Cycle
Handles the financial "lifecycle" of the practice: from invoicing to medical aid claims and payments.

### 3.1. Aggregate: `Invoice`
The central financial document representing services rendered.
*   **Properties:**
    *   `invoiceNumber`: Sequential, human-readable ID (e.g., INV-001)
    *   `status`: `Draft | Sent | Paid | Partial | Overdue`
    *   `billingType`: `'private'` (Cash) or `'medical_aid'` (Insurance)
    *   `amounts`:
        *   `totalAmount`: Gross Cost
        *   `patientLiability`: Portion the patient pays
        *   `medicalAidLiability`: Portion asserted to insurance
    *   `items`: List of `InvoiceItem` entities (Procedures/Accessibles)
*   **Invariants:**
    *   `totalAmount` must equal the sum of all items + tax.
    *   Paid amount cannot exceed total amount.
    *   Cannot add items to a finalized/sent invoice.
*   **Key Relationships:**
    *   Has many `InvoiceItem`s.
    *   Has many `Payment`s.
    *   Related to one `Patient`.

### 3.2. Aggregate: `Claim`
Represents an EDI (Electronic Data Interchange) claim sent to a medical aid switcher.
*   **Properties:**
    *   `claimNumber`: External reference ID.
    *   `status`: `Submitted | Acknowledged | Rejected | Paid`
    *   `rejectionReason`: Codes returned by the switch if failed.

---

## 4. Context: Scheduling Access
Manages the practitioner's calendar, availability, and bookings.

### 4.1. Aggregate: `Appointment`
A specific time slot reserved for a patient.
*   **Properties:**
    *   `status`: `Scheduled | Confirmed | Checked In | Cancelled | No-Show`
    *   `times`: `startTime`, `endTime`, `date`
    *   `type`: `isOnline` (Telehealth) vs In-Person
    *   `paymentStatus`: Tracks if the consultation fee is settled.
*   **Invariants:**
    *   Start time must be before end time.
    *   Cannot complete a cancelled appointment.
    *   Online appointments must have a valid video link.
    
### 4.2. Entity: `BookingSlot`
An available block of time that *can* be booked. It is generated based on the practitioner's shift rules.

---

## 5. Context: Patient Identity
The "CRM" of the system. Manages demographics and legal identity.

### 5.1. Aggregate: `Patient`
The root entity for a person receiving care.
*   **Properties:**
    *   `identity`: `firstName`, `lastName`, `dateOfBirth`, `gender`
    *   `contact`: `email` (Value Object), `phone` (Value Object)
    *   `medicalAidDetails`:
        *   `provider`: Scheme Name (e.g., Discovery)
        *   `memberNumber`: Policy ID
        *   `dependantCode`: Specific beneficiary ID (e.g., 00)
    *   `consent`: List of signed usage consents (POPIA/GDPR).
    *   `medicalSummary`: cached summary of critical info (allergies count, etc).
*   **Invariants:**
    *   Date of birth cannot be in the future.
    *   Minors must have an `EmergencyContact`.

---

## 6. Context: Tenant Management
Manages the SaaS multi-tenancy.

### 6.1. Aggregate: `Tenant`
Represents a Medical Practice (The customer).
*   **Properties:**
    *   `slug`: Unique identifier for the practice URL (e.g., `dr-smith.saas.com`).
    *   `domain`: Custom domain (Value Object).
    *   `subscription`: Tracks Plan ID (`Basic`, `Pro`) and status (`Active`, `PastDue`).
    *   `status`: `Active | Suspended | Trial`.
*   **Invariants:**
    *   Slug must be globally unique.
    *   Owner email must be# Medical Practice Domain Models & Entities

## 1. Overview
The core business logic is encapsulated within **Bounded Contexts**, adhering to strict DDD principles.
- **Aggregates**: Transaction boundaries (e.g., `Patient`, `Invoice`). All state changes must go through these roots.
- **Entities**: Objects with identity (e.g., `Appointment`, `BookingSlot`).
- **Value Objects**: Immutable attributes (e.g., `EmailAddress`, `Money`, `Slug`).

---

## 2. Context: Clinical Records
Responsible for the patient's Electronic Medical Record (EMR). It tracks medical history, excluding appointment scheduling or billing.

### 2.1. Aggregate: `Condition`
Represents a medical diagnosis or issue associated with a patient.
*   **Properties:**
    *   `id`: Unique Identifier
    *   `patientId`: Reference to Patient Aggregate
    *   `name`: Human-readable name (e.g., "Type 2 Diabetes")
    *   `icd10`: Standard ICD-10 code (e.g., "E11.9")
    *   `status`: `'active' | 'resolved' | 'chronic'`
    *   `severity`: (Optional) Severity level
    *   `diagnosedDate`: Date of initial diagnosis
    *   `resolvedDate`: (Optional) Date when condition ended
*   **Key Behaviors:**
    *   `markResolved(date: Date)`: Transitions status to 'resolved'.
    *   `updateSeverity(level: string)`: Updates clinical severity.

### 2.2. Other Entities
*   **`Allergy`**: Tracks drug/food sensitivities (Critical for safety).
*   **`Medication`**: Tracks prescriptions and active meds.
*   **`Surgery`**: Historical record of procedures.

---

## 3. Context: Revenue Cycle
Handles the financial "lifecycle" of the practice: from invoicing to medical aid claims and payments.

### 3.1. Aggregate: `Invoice`
The central financial document representing services rendered.
*   **Properties:**
    *   `invoiceNumber`: Sequential, human-readable ID (e.g., INV-001)
    *   `status`: `Draft | Sent | Paid | Partial | Overdue`
    *   `billingType`: `'private'` (Cash) or `'medical_aid'` (Insurance)
    *   `amounts`:
        *   `totalAmount`: Gross Cost
        *   `patientLiability`: Portion the patient pays
        *   `medicalAidLiability`: Portion asserted to insurance
    *   `items`: List of `InvoiceItem` entities (Procedures/Accessibles)
*   **Invariants:**
    *   `totalAmount` must equal the sum of all items + tax.
    *   Paid amount cannot exceed total amount.
    *   Cannot add items to a finalized/sent invoice.
*   **Key Relationships:**
    *   Has many `InvoiceItem`s.
    *   Has many `Payment`s.
    *   Related to one `Patient`.

### 3.2. Aggregate: `Claim`
Represents an EDI (Electronic Data Interchange) claim sent to a medical aid switcher.
*   **Properties:**
    *   `claimNumber`: External reference ID.
    *   `status`: `Submitted | Acknowledged | Rejected | Paid`
    *   `rejectionReason`: Codes returned by the switch if failed.

---

## 4. Context: Scheduling Access
Manages the practitioner's calendar, availability, and bookings.

### 4.1. Aggregate: `Appointment`
A specific time slot reserved for a patient.
*   **Properties:**
    *   `status`: `Scheduled | Confirmed | Checked In | Cancelled | No-Show`
    *   `times`: `startTime`, `endTime`, `date`
    *   `type`: `isOnline` (Telehealth) vs In-Person
    *   `paymentStatus`: Tracks if the consultation fee is settled.
*   **Invariants:**
    *   Start time must be before end time.
    *   Cannot complete a cancelled appointment.
    *   Online appointments must have a valid video link.
    
### 4.2. Entity: `BookingSlot`
An available block of time that *can* be booked. It is generated based on the practitioner's shift rules.

---

## 5. Context: Patient Identity
The "CRM" of the system. Manages demographics and legal identity.

### 5.1. Aggregate: `Patient`
The root entity for a person receiving care.
*   **Properties:**
    *   `identity`: `firstName`, `lastName`, `dateOfBirth`, `gender`
    *   `contact`: `email` (Value Object), `phone` (Value Object)
    *   `medicalAidDetails`:
        *   `provider`: Scheme Name (e.g., Discovery)
        *   `memberNumber`: Policy ID
        *   `dependantCode`: Specific beneficiary ID (e.g., 00)
    *   `consent`: List of signed usage consents (POPIA/GDPR).
    *   `medicalSummary`: cached summary of critical info (allergies count, etc).
*   **Invariants:**
    *   Date of birth cannot be in the future.
    *   Minors must have an `EmergencyContact`.

---

## 6. Context: Tenant Management
Manages the SaaS multi-tenancy.

### 6.1. Aggregate: `Tenant`
Represents a Medical Practice (The customer).
*   **Properties:**
    *   `slug`: Unique identifier for the practice URL (e.g., `dr-smith.saas.com`).
    *   `domain`: Custom domain (Value Object).
    *   `subscription`: Tracks Plan ID (`Basic`, `Pro`) and status (`Active`, `PastDue`).
    *   `status`: `Active | Suspended | Trial`.
*   **Invariants:**
    *   Slug must be globally unique.
    *   Owner email must be