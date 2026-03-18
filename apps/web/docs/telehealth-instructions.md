# Prompt: Implement Daily.co Telehealth Integration for Appointments

**Context:**
 I need to add telehealth (video call) functionality to appointment booking system. I have a reference implementation from another project that uses Daily.co.

**Task:**
Please assist me in integrating telehealth functionality into the  appointment system using the following technical specification and architectural patterns derived from the reference codebase.

---

## 1. Tech Stack & Prerequisites
*   **Provider:** [Daily.co](https://www.daily.co/) (Video & Audio API).
*   **Backend:** TypeScript (Node.js/Next.js Server Actions).
*   **Database:** Firestore 
*   **Environment Variables Required:**
    *   `DAILY_API_KEY`: Private API key from Daily.co dashboard.
    *   `DAILY_DOMAIN`: (Optional) Your custom Daily domain (e.g., `https://your-domain.daily.co`). If not provided, defaults to the account domain.

## 2. Core Architecture
The integration relies on a dedicated service class and server actions. It does NOT use a persistent room for every practitioner; instead, it dynamically creates a unique room for each appointment or reuses an existing one if valid.

### A. Data Model Changes
The `Appointment` entity/table needs these additional fields:
*   `isOnline` (boolean): Flag to distinguish virtual vs. in-person.
*   `dailyRoomName` (string): Unique identifier for the room (e.g., `telehealth-{appointmentId}`).
*   `dailyRoomUrl` (string): The base URL for the room.
*   `dailyToken` (string): A short-lived, secure access token for the participant.

### B. Service Layer (`DailyCoService`)
Implement a service class that wraps the Daily.co REST API.
*   **Base URL:** `https://api.daily.co/v1`. Please use Effect.ts best practic in a  functional way
*   **Key Methods:**
    1.  `createRoom(appointmentId, appointmentDetails)`:
        *   Generates a room name (e.g., `telehealth-${appointmentId}`).
        *   Sets room configuration (start/end times, privacy).
        *   Sends `POST /rooms` to Daily.co.
    2.  `createMeetingToken(roomName, userId)`:
        *   Generates a token with specific permissions (screen share, etc.).
        *   Sets expiration (`exp`) usually to 24 hours or appointment duration + buffer.
        *   Sends `POST /meeting-tokens` to Daily.co.
    3.  `deleteRoom(roomName)`:
        *   Cleanup method (optional but good for hygiene).

### C. Server Action / Business Logic
Create a controller or server action (e.g., `createDailyToken`) that is called when an appointment is booked or viewed.

**Workflow:**
1.  **Validation:** Check if `appointment.isOnline` is true.
2.  **Idempotency:** Check if the appointment already has `dailyRoomName` and `dailyToken`.
    *   If yes, verify validity via `getRoomInfo`. If valid, return existing details.
    *   If no (or expired), proceed to creation.
3.  **Room Creation:** Call `DailyCoService.createRoom`.
4.  **Persistence:** Update the Appointment record in the database with `dailyRoomName`, `dailyRoomUrl`, and `dailyToken`.
5.  **Return:** Return the `roomUrl` and `token` to the client.

## 3. Integration Points

### Incorporating into Booking Flow
When a user (patient or admin) successfully creates an appointment:
1.  If the Service/Appointment Type is "Telehealth/Online", trigger the setup immediately (background job or direct await depending on latency preference).
2.  Ideally, generate the room *lazily* or just after confirmation to ensure the link exists for emails/notifications.

**Example Logic:**
```typescript
if (newAppointment.isOnline) {
    const dailyResult = await createDailyToken(newAppointment.id);
    // Send email with dailyResult.joinUrl
}
```

### Generating the Join Link
The reference implementation constructs the link dynamically on the client or server.
**Format:**
```javascript
const joinUrl = `${appointment.dailyRoomUrl}?t=${appointment.dailyToken}`;
```
*Note: The token is appended as a query parameter `t`.*

## 4. Work Instructions for You (The Agent)

Using the details above, please help me implement this in my codebase:

1.  **Define the Type/Interface updates** for my `Appointment` model.
2.  **Create the `DailyCoService` class** interacting with the Daily.co API using `fetch`.
3.  **Create the integration function** that ties the booking event to the room creation.
4.  **Show me the frontend snippet** to render the "Join Video Call" button.

Let's start with Step 1// filepath: TELEHEALTH_INTEGRATION_PROMPT.md
# Prompt: Implement Daily.co Telehealth Integration for Appointments

**Context:**
I I need to add telehealth (video call) functionality to appointment booking system. I have a reference implementation from another project that uses Daily.co.

**Task:**
Please assist me in integrating telehealth functionality into my appointment system using the following technical specification and architectural patterns derived from the reference codebase.

---

## 1. Tech Stack & Prerequisites
*   **Provider:** [Daily.co](https://www.daily.co/) (Video & Audio API).
*   **Backend:** TypeScript (Node.js/Next.js Server Actions).
*   **Database:** Firestore.
*   **Environment Variables Required:**
    *   `DAILY_API_KEY`: Private API key from Daily.co dashboard.
    *   `DAILY_DOMAIN`: (Optional) Your custom Daily domain (e.g., `https://your-domain.daily.co`). If not provided, defaults to the account domain.

## 2. Core Architecture
The integration relies on a dedicated service  and server actions. It does NOT use a persistent room for every practitioner; instead, it dynamically creates a unique room for each appointment or reuses an existing one if valid.

### A. Data Model Changes
The `Appointment` entity/table needs these additional fields:
*   `isOnline` (boolean): Flag to distinguish virtual vs. in-person.
*   `dailyRoomName` (string): Unique identifier for the room (e.g., `telehealth-{appointmentId}`).
*   `dailyRoomUrl` (string): The base URL for the room.
*   `dailyToken` (string): A short-lived, secure access token for the participant.

### B. Service Layer (`DailyCoService`)
Implement a service  that wraps the Daily.co REST API. Please use Effect.ts best practic in a  functional way
*   **Base URL:** `https://api.daily.co/v1`
*   **Key Methods:**
    1.  `createRoom(appointmentId, appointmentDetails)`:
        *   Generates a room name (e.g., `telehealth-${appointmentId}`).
        *   Sets room configuration (start/end times, privacy).
        *   Sends `POST /rooms` to Daily.co.
    2.  `createMeetingToken(roomName, userId)`:
        *   Generates a token with specific permissions (screen share, etc.).
        *   Sets expiration (`exp`) usually to 24 hours or appointment duration + buffer.
        *   Sends `POST /meeting-tokens` to Daily.co.
    3.  `deleteRoom(roomName)`:
        *   Cleanup method (optional but good for hygiene).

### C. Server Action / Business Logic
Create a controller or server action (e.g., `createDailyToken`) that is called when an appointment is booked or viewed.

**Workflow:**
1.  **Validation:** Check if `appointment.isOnline` is true.
2.  **Idempotency:** Check if the appointment already has `dailyRoomName` and `dailyToken`.
    *   If yes, verify validity via `getRoomInfo`. If valid, return existing details.
    *   If no (or expired), proceed to creation.
3.  **Room Creation:** Call `DailyCoService.createRoom`.
4.  **Persistence:** Update the Appointment record in the database with `dailyRoomName`, `dailyRoomUrl`, and `dailyToken`.
5.  **Return:** Return the `roomUrl` and `token` to the client.

## 3. Integration Points

### Incorporating into Booking Flow
When a user (patient or admin) successfully creates an appointment:
1.  If the Service/Appointment Type is "Telehealth/Online", trigger the setup immediately (background job or direct await depending on latency preference).
2.  Ideally, generate the room *lazily* or just after confirmation to ensure the link exists for emails/notifications.

**Example Logic:**
```typescript
if (newAppointment.isOnline) {
    const dailyResult = await createDailyToken(newAppointment.id);
    // Send email with dailyResult.joinUrl
}
```

### Generating the Join Link
The reference implementation constructs the link dynamically on the client or server.
**Format:**
```javascript
const joinUrl = `${appointment.dailyRoomUrl}?t=${appointment.dailyToken}`;
```
*Note: The token is appended as a query parameter `t`.*

## 4. Work Instructions for You (The Agent)

Using the details above, please help me implement this in my codebase:

1.  **Define the Type/Interface updates** for my `Appointment` model.
2.  **Create the `DailyCoService` class** interacting with the Daily.co API using `fetch`.
3.  **Create the integration function** that ties the booking event to the room creation.
4.  **Show me the frontend snippet** to render the "Join Video Call" button.

Let's start with Step 1