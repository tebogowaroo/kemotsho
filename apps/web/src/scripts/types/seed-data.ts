// src/scripts/types/seed-data.ts

// These types match the Tabs defined in docs/CONTENT_IMPORT_SPEC.md

export type CsvBoolean = "TRUE" | "FALSE" | "true" | "false" | boolean;

export interface ContentInventoryRow {
    kind: "blog" | "news" | "circular" | "service" | "product" | "profile";
    title: string;
    slug?: string;
    excerpt?: string;
    body: string; // Markdown
    status: "published" | "draft" | "review" | "archived";
    featured_image?: string; // Filename
    seo_title?: string;
    seo_desc?: string;
    tags?: string; // Comma separated
}

export interface PageValuesRow {
    page_slug: string;
    block_title: string;
    block_desc?: string;
    item_title: string;
    item_desc: string;
}

export interface ContactMasterRow {
    page_slug: string;
    section_title: string;
    main_email: string;
    main_phone: string;
    branch_name?: string;
    branch_address?: string;
    branch_map_url?: string;
    show_form: CsvBoolean;
}

export interface PageHeroRow {
    page_slug: string;
    title: string;
    subtitle?: string;
    background_image?: string;
}

export interface SeedData {
    content_inventory: ContentInventoryRow[];
    page_values: PageValuesRow[];
    contact_master: ContactMasterRow[];
    page_heroes: PageHeroRow[];
}
