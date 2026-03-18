# Prompt: Implement ICD-10 Code Search Integration

**Context:**
I need to add ICD-10 diagnosis code search functionality to a medical appointment/consultation feature. The codebase already contains a robust, cached search implementation using Algolia.

**Task:**
Please assist me in integrating the existing ICD-10 search functionality into my frontend component using the established patterns in the codebase.

---

## 1. Tech Stack & Prerequisites
*   **Search Engine:** [Algolia](https://www.algolia.com/) (v5 SDK).
*   **Backend:** Next.js Server Actions with `unstable_cache`.
*   **Environment Variables Required:**
    *   `ALGOLIA_APP_ID`: Your Algolia Application ID.
    *   `ALGOLIA_ADMIN_API_KEY`: Admin API key (Server-side only).
    *   `ALGOLIA_INDEX_ICD10`: Name of the index (e.g., `ICD-10_MIT_2014_CSV_01-Jan-2014`).

## 2. existing Architecture
You do NOT need to implement the search logic from scratch. Use the following existing files:

### A. Core Search Logic (Do not modify)
*   **Implementation:** `app/lib/search/algolia.ts`
    *   Contains `_rawIcdSearchAlgolia`: Direct call to Algolia using Admin SDK.
    *   Configures searchable attributes (`code`, `shortDesc`, `fullDesc`) and typo tolerance.

### B. Server Action (Use this)
*   **Action Path:** `app/lib/actions/search.actions.ts`
*   **Function:** `searchIcdCodesServer(query: string, limit?: number)`
*   **Behavior:**
    *   Wraps the raw Algolia call.
    *   Implements Next.js caching (tagged with `icd-search`) to reduce API costs.
    *   Returns `Promise<IcdHit[]>`.

**Type Definitions:**
```typescript
type IcdHit = {
  objectID: string;
  code: string;
  shortDesc?: string;
  fullDesc?: string;
  chapter?: { number?: string | null; description?: string | null };
};
```

## 3. Integration Plan

### Step 1: Frontend Component
Create a search component (e.g., `IcdSearchInput.tsx`) that generally follows this pattern:
1.  **Input:** A text input or Combobox (Shadcn UI recommended).
2.  **State:** Manage `inputValue` (user typing) and `results` (array of `IcdHit`).
3.  **Debounce:** Debounce the input (e.g., 300ms) before calling the server action.
4.  **Server Call:**
    ```typescript
    // Inside your client component
    import { searchIcdCodesServer } from '@/app/lib/actions/search.actions';

    // ... inside useEffect or event handler
    const results = await searchIcdCodesServer(debouncedQuery);
    setResults(results);
    ```

### Step 2: Display & Selection
*   **Display:** Show the `code` and `shortDesc` in the dropdown/list.
*   **Selection:** When a user clicks a result, pass the full `IcdHit` object back to the parent form (e.g., `onSelect(hit)`).

## 4. Work Instructions for You (The Agent)

Using the details above, please help me integrate this:

1.  **Create/Update the UI Component:** Write a React Client Component that uses `searchIcdCodesServer`.
2.  **Handle Loading States:** Ensure there is a visual indicator while searching.
3.  **Form Integration:** Show how to store the selected ICD code (e.g., `J// filepath: ICD_CODES_INTEGRATION_PROMPT.md
# Prompt: Implement ICD-10 Code Search Integration

**Context:**
I need to add ICD-10 diagnosis code search functionality to a medical appointment/consultation feature. The codebase already contains a robust, cached search implementation using Algolia.

**Task:**
Please assist me in integrating the existing ICD-10 search functionality into my frontend component using the established patterns in the codebase.

---

## 1. Tech Stack & Prerequisites
*   **Search Engine:** [Algolia](https://www.algolia.com/) (v5 SDK).
*   **Backend:** Next.js Server Actions with `unstable_cache`.
*   **Environment Variables Required:**
    *   `ALGOLIA_APP_ID`: Your Algolia Application ID.
    *   `ALGOLIA_ADMIN_API_KEY`: Admin API key (Server-side only).
    *   `ALGOLIA_INDEX_ICD10`: Name of the index (e.g., `ICD-10_MIT_2014_CSV_01-Jan-2014`).

## 2. existing Architecture
You do NOT need to implement the search logic from scratch. Use the following existing files:

### A. Core Search Logic (Do not modify)
*   **Implementation:** `app/lib/search/algolia.ts`
    *   Contains `_rawIcdSearchAlgolia`: Direct call to Algolia using Admin SDK.
    *   Configures searchable attributes (`code`, `shortDesc`, `fullDesc`) and typo tolerance.

### B. Server Action (Use this)
*   **Action Path:** `app/lib/actions/search.actions.ts`
*   **Function:** `searchIcdCodesServer(query: string, limit?: number)`
*   **Behavior:**
    *   Wraps the raw Algolia call.
    *   Implements Next.js caching (tagged with `icd-search`) to reduce API costs.
    *   Returns `Promise<IcdHit[]>`.

**Type Definitions:**
```typescript
type IcdHit = {
  objectID: string;
  code: string;
  shortDesc?: string;
  fullDesc?: string;
  chapter?: { number?: string | null; description?: string | null };
};
```

## 3. Integration Plan

### Step 1: Frontend Component
Create a search component (e.g., `IcdSearchInput.tsx`) that generally follows this pattern:
1.  **Input:** A text input or Combobox (Shadcn UI recommended).
2.  **State:** Manage `inputValue` (user typing) and `results` (array of `IcdHit`).
3.  **Debounce:** Debounce the input (e.g., 300ms) before calling the server action.
4.  **Server Call:**
    ```typescript
    // Inside your client component
    import { searchIcdCodesServer } from '@/app/lib/actions/search.actions';

    // ... inside useEffect or event handler
    const results = await searchIcdCodesServer(debouncedQuery);
    setResults(results);
    ```

### Step 2: Display & Selection
*   **Display:** Show the `code` and `shortDesc` in the dropdown/list.
*   **Selection:** When a user clicks a result, pass the full `IcdHit` object back to the parent form (e.g., `onSelect(hit)`).

## 4. Work Instructions for You (The Agent)

Using the details above, please help me integrate this:

1.  **Create/Update the UI Component:** Write a React Client Component that uses `searchIcdCodesServer`.
2.  **Handle Loading States:** Ensure there is a visual indicator while searching.
3.  **Form Integration:** Show how to store the selected ICD code (e.g., `J