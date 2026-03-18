import dotenv from "dotenv";
import path from "path";
// Load .env.local explicitly
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import fs from "fs";
import { parse } from "csv-parse/sync";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { type SeedData, type ContentInventoryRow, type PageValuesRow, type ContactMasterRow, type PageHeroRow } from "./types/seed-data";
// Use relative imports if possible or mapped paths if using ts-node/tsx. 
// For scripts, straight node execution usually prefers relative paths or explicit transpilation.
// We will assume `tsx` execution.

// ------------------------------------------------------------------
// 1. Firebase Initialization (Standalone Script Context)
// ------------------------------------------------------------------
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
    : null;

if (!serviceAccount && !process.env.FIREBASE_PROJECT_ID) {
    if(!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
         console.log("DEBUG: Env Var FIREBASE_SERVICE_ACCOUNT_KEY is undefined");
    }
    console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT_KEY or Project ID configuration.");
    process.exit(1);
}

const app = getApps().length === 0 ? initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
    projectId: process.env.FIREBASE_PROJECT_ID,
} as any) : getApps()[0];

if (!app) {
    throw new Error("Failed to initialize Firebase App")
}

const db = getFirestore(app);

// ------------------------------------------------------------------
// 2. Helpers
// ------------------------------------------------------------------
const SEED_DIR = path.join(process.cwd(), "seed-data");

function readCsv<T>(filename: string): T[] {
    const filePath = path.join(SEED_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Warning: ${filename} not found. Skipping.`);
        return [];
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return parse(content, {
        columns: true,
        skip_empty_lines: true,
        delimiter: "|" // Using pipe delimiter as per spec
    });
}

function cleanSlug(slug: string): string {
    if (!slug.startsWith("/")) return `/${slug}`;
    return slug;
}

// ------------------------------------------------------------------
// 3. Processors
// ------------------------------------------------------------------

async function seedContentInventory(rows: ContentInventoryRow[]) {
    console.log(`\n📦 Seeding Content Inventory (${rows.length} items)...`);
    const batch = db.batch();
    
    for (const row of rows) {
        // Generate Content ID (auto-id for new, deterministic based on slug if needed)
        // We'll use random IDs for simplicity but could slugify the title.
        const ref = db.collection("content").doc();
        
        const data = {
            kind: row.kind,
            title: row.title,
            slug: row.slug || cleanSlug(row.title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")),
            excerpt: row.excerpt || "",
            body: row.body || "",
            status: row.status || "published",
            media: {
                featured: row.featured_image ? {
                    storagePath: row.featured_image, // Assumption: Already uploaded or path valid
                    altText: row.title
                } : null
            },
            seo: {
                title: row.seo_title || row.title,
                description: row.seo_desc || row.excerpt || "",
                keywords: row.tags ? row.tags.split(",").map(s => s.trim()) : []
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        batch.set(ref, data);
    }
    await batch.commit();
    console.log("✅ Content Inventory seeded.");
}

async function seedPageValues(rows: PageValuesRow[]) {
    console.log(`\n💎 Seeding Page Values (${rows.length} items)...`);
    
    // Group by Page Slug + Block Title
    const groups: Record<string, PageValuesRow[]> = {};
    for (const row of rows) {
        const key = `${row.page_slug}::${row.block_title}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
    }

    // Since pages contain SECTIONS, we need to update/create the page document
    // and append/update the sections array.
    // For simplicity, we will query the page by slug, create if strictly necessary, or update.
    
    for (const [key, items] of Object.entries(groups)) {
        const [pageSlug, blockTitle] = key.split("::");
        if (!pageSlug) continue;
        
        // Construct the Section Object
        const sectionId = `values-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const section = {
            type: "valuesBlock",
            uniqueId: sectionId,
            data: {
                title: blockTitle,
                description: items[0]?.block_desc || null,
                items: items.map(i => ({
                    title: i.item_title,
                    description: i.item_desc
                }))
            }
        };

        await addSectionToPage(pageSlug, section);
    }
}

async function seedContactMaster(rows: ContactMasterRow[]) {
    console.log(`\n📞 Seeding Contact info (${rows.length} items)...`);
    // Group by Page Slug
    const groups: Record<string, ContactMasterRow[]> = {};
    
    for (const row of rows) {
        if (!groups[row.page_slug]) groups[row.page_slug] = [];
        groups[row.page_slug]!.push(row);
    }

    for (const [pageSlug, items] of Object.entries(groups)) {
        const master = items[0]; // Main info from first row
        if (!master) continue;
        
        const branches = items
            .filter(i => i.branch_name) // Only rows with actual branches
            .map(i => ({
                name: i.branch_name!,
                email: null, // Spreadsheet simplified
                phone: null, // Spreadsheet simplified
                address: i.branch_address || null,
                schedules: null,
                mapUrl: i.branch_map_url || null
            }));

        const section = {
            type: "contact",
            uniqueId: `contact-${Date.now()}`,
            data: {
                title: master.section_title,
                subtitle: null,
                email: master.main_email,
                phone: master.main_phone,
                address: null, // Could add main address col if needed
                schedules: null,
                showForm: String(master.show_form).toLowerCase() === "true",
                branches: branches.length > 0 ? branches : undefined
            }
        };

        await addSectionToPage(pageSlug, section);
    }
}

async function seedPageHeroes(rows: PageHeroRow[]) {
    console.log(`\n🦸 Seeding Page Hereos (${rows.length} items)...`);
    
    for (const row of rows) {
        const section = {
            type: "hero",
            uniqueId: `hero-${Date.now()}`,
            data: {
                title: row.title,
                subtitle: row.subtitle || null,
                backgroundId: null // We'd need to resolve media ID here if we had it
            }
        };
        await addSectionToPage(row.page_slug, section);
    }
}


// Shared Helper: Add Section to Page
async function addSectionToPage(slug: string, section: any) {
    // 1. Find Page
    const snap = await db.collection("pages").where("slug", "==", slug).limit(1).get();
    
    if (snap.empty) {
        // Create new Page
        const newRef = db.collection("pages").doc();
        await newRef.set({
            slug: slug,
            title: `Page ${slug}`, // Placeholder title
            isHome: slug === "/",
            sections: [section],
            seo: { title: null, description: null },
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`   + Created Page '${slug}' with section '${section.type}'`);
    } else {
        // Update valid page
        const doc = snap.docs[0];
        if (!doc) return; 
        const data = doc.data();
        const sections = data.sections || [];
        
        // Primitive dedup: Remove existing section of same type? Or append?
        // Let's append, but maybe check if Hero already exists to avoid duplicates.
        if (section.type === 'hero' && sections.some((s: any) => s.type === 'hero')) {
             // Replace hero
             const idx = sections.findIndex((s: any) => s.type === 'hero');
             sections[idx] = section;
             console.log(`   ~ Updated Hero on '${slug}'`);
        } else {
            sections.push(section);
            console.log(`   + Added '${section.type}' to '${slug}'`);
        }
        
        await doc.ref.update({ sections });
    }
}

// ------------------------------------------------------------------
// 4. Main Execution
// ------------------------------------------------------------------

async function main() {
    console.log("🚀 Starting Seeding Process...");
    
    const contentRows = readCsv<ContentInventoryRow>("Content_Inventory.csv");
    const valuesRows = readCsv<PageValuesRow>("Page_Values.csv");
    const contactRows = readCsv<ContactMasterRow>("Contact_Master.csv");
    const heroRows = readCsv<PageHeroRow>("Page_Heroes.csv");

    if (contentRows.length) await seedContentInventory(contentRows);
    if (valuesRows.length) await seedPageValues(valuesRows);
    if (contactRows.length) await seedContactMaster(contactRows);
    if (heroRows.length) await seedPageHeroes(heroRows);

    console.log("\n✨ Seeding Complete!");
}

main().catch(console.error);
