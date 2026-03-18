# Content Import Spreadsheet Specification

This document defines the structure of the data collection spreadsheet designed to capture both dynamic business entities (Services, Team Members) and static page narratives (Mission, Contact Info).

## 1. Overview
The spreadsheet is designed with **4 Core Tabs**. Each tab maps to specific Domain Entities in the codebase.
Exporting these tabs to CSV/JSON allows for automated seeding of the Firestore database.

## 2. Spreadsheet Structure

### Tab 1: `Content_Inventory`
**Purpose**: captures all dynamic "List" items. This handles the "one-to-many" requirement (e.g. multiple Services, many Blog posts).

| Column Header | Data Type | Required | Valid Values / Notes |
|Data Field|String|Yes|Maps to `ContentKind`|
|`kind`|String|Yes|`service`, `product`, `blog`, `news`, `profile` (Team), `circular`|
|`title`|String|Yes|e.g., "Web Development", "Jane Doe"|
|`slug`|String|Optional|Auto-generated from title if blank. e.g. `/services/web-dev`|
|`excerpt`|String|No|Short summary for cards/previews|
|`body`|Markdown|Yes|Full content description|
|`status`|String|Yes|`published`, `draft` (Default: published)|
|`featured_image`|Path|No|Path to file in provided asset zip, e.g. `images/service-1.jpg`|
|`seo_title`|String|No|Overrides default title tag|
|`seo_desc`|String|No|Meta description|
|`tags`|String|No|Comma-separated tags|

**Mapping Logic**:
- Each row creates one document in the `content` collection.
- `kind` determines where it appears on the site (e.g. `kind=service` -> `/services` page).

---

### Tab 2: `Page_Values`
**Purpose**: Captures the "Mission, Vision, Values" block. Usually appears on the About page. 
**Structure**: Normalized (One row per Value item).

| Column Header | Data Type | Required | Notes |
|---|---|---|---|
|`page_slug`|String|Yes|e.g. `/about`. The page where this block lives.|
|`block_title`|String|Yes|e.g. "Our Core Values"|
|`block_desc`|String|No|Introductory text for the section|
|`item_title`|String|Yes|e.g. "Integrity"|
|`item_desc`|String|Yes|e.g. "We do the right thing."|

**Mapping Logic**:
- Rows with the same `page_slug` and `block_title` are grouped into a single `ValuesBlock` section on that Page.

---

### Tab 3: `Contact_Master`
**Purpose**: Configuration for Contact pages and Branch locations.

| Column Header | Data Type | Required | Notes |
|---|---|---|---|
|`page_slug`|String|Yes|e.g. `/contact`|
|`section_title`|String|Yes|e.g. "Get in touch"|
|`main_email`|String|Yes||
|`main_phone`|String|Yes||
|`branch_name`|String|No|If multiple rows exist for same `page_slug`, they are treated as list of branches.|
|`branch_address`|String|No||
|`branch_map_url`|URL|No||
|`show_form`|Boolean|Yes|TRUE to show the contact form|

**Mapping Logic**:
- Collapses multiple rows for the same `page_slug` into one `ContactSection`. The first row's "Main" fields are used for the primary contact info. All rows contribute their "Branch" fields to the `branches` array.

---

### Tab 4: `Page_Heroes`
**Purpose**: Defines the Hero (Top banner) text for every page.

| Column Header | Data Type | Required | Notes |
|---|---|---|---|
|`page_slug`|String|Yes|e.g. `/`, `/about`, `/contact`, `/services`|
|`title`|String|Yes|Main H1 of the page|
|`subtitle`|String|No|Subtext|
|`background_image`|Path|No|`images/home-hero.jpg`|

**Mapping Logic**:
- Finds or Creates the Page with `slug`.
- Updates/Creates the `HeroSection` of that page.

## 3. Data Processing Rules (For Developer)

When writing the seeding script:

1.  **Group by Slug**: For Tabs 2, 3, and 4, group rows by `page_slug` before processing.
2.  **Asset Resolution**: The `featured_image` and `background_image` columns expect filenames. The script should look in a local `./seed-assets/` folder and upload them to Firebase Storage to get the `storagePath`.
3.  **Idempotency**: Use `slug` as a stable identifier. If a Page/Content with that slug exists, update it; otherwise create it.

## 4. Example Usage

**Scenario**: Client has 2 Services and 3 Values.

**Tab 1 (Content_Inventory)**
| kind | title | body |
|---|---|---|
| service | Consulting | We offer expert advice... |
| service | Audit | We check your books... |

**Tab 2 (Page_Values)**
| page_slug | block_title | item_title | item_desc |
|---|---|---|---|
| /about | Our Values | Trust | We are trusted. |
| /about | Our Values | Speed | We are fast. |
| /about | Our Values | Quality | We do good work. |

This structure allows the "One Vision" vs "Many Services" distinction perfectly.

## Appendix A: How to Map (Copy) These Tables to Excel/Google Sheets

To create your seeding spreadsheet, follow these steps to copy the table structures defined above into your spreadsheet software.

### Method 1: Google Sheets (Recommended)
1. **Create a New Sheet**: Open a blank Google Sheet.
2. **Rename Tabs**: Create 4 tabs at the bottom named exactly: `Content_Inventory`, `Page_Values`, `Contact_Master`, `Page_Heroes`.
3. **Copy Header Row**:
   - Go to the table definition above (e.g., **Tab 1**).
   - Select just the text inside the header pipes (e.g., `kind | title | slug ...`).
   - *Do not copy the `|---|---|` separator row.*
4. **Paste & Split**:
   - Click cell **A1** in the corresponding tab.
   - Paste the values.
   - If they paste into one cell: Go to **Data > Split text to columns**.
   - Select **Separator: Custom** and enter `|` (pipe character).
5. **Clean Up**: Delete any empty columns that might appear at the start or end due to the outer pipes.

### Method 2: Excel (Text to Columns)
1. **Prepare Tabs**: specific tabs as described above.
2. **Copy Table**: Copy the table text from this document (including headers).
3. **Paste**: Paste into cell **A1**.
4. **Convert**:
   - Select column A.
   - Go to **Data -> Text to Columns**.
   - Choose **Delimited**.
   - Check **Other** and type `|`.
   - Click **Finish**.
5. **Format**: Bold the header row to make it clear where data entry starts.

### Method 3: Manual Entry (Safest)
For strict compliance, manual entry is often safest to ensure no hidden characters are copied.
1. Open your spreadsheet.
2. Create the 4 Tabs.
3. Manually type the **Column Headers** exactly as shown in the "Column Header" column of the specifications above.
   - *Note: Ensure valid values (like "service" or "blog") are used exactly as specified.*



