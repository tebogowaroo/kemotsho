
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { FieldValue } from "firebase-admin/firestore"

// --- Configuration ---
const SEED_DIR = path.join(process.cwd(), "seed-data/tariffs")
const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY
const COLLECTION_NAME = "tariff_codes"

let db: FirebaseFirestore.Firestore;

if (!GEMINI_API_KEY) {
    console.error("❌ GOOGLE_AI_API_KEY is missing from environment.")
    process.exit(1)
}

// --- Embeddings Helper ---
async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "models/gemini-embedding-001",
                    content: { parts: [{ text }] },
                    outputDimensionality: 768
                })
            }
        )
        
        if (!response.ok) {
            // Rate limit handling could go here (429)
            return null
        }

        const data = await response.json()
        return data.embedding.values
    } catch (error) {
        return null
    }
}

// --- Parsers ---

interface TariffItem {
    code: string
    description: string
    priceCents: number
    specialtyCode?: string
    specialtyName?: string
}

function cleanPrice(raw: string): number | null {
    if (!raw) return null
    // Remove R, spaces, commas (thousands), but keep dot
    // GEMS often uses comma for thousands "1,200.00"
    const cleaned = raw.replace(/[R\s,]/g, "") 
    if (!/^\d+(\.\d+)?$/.test(cleaned)) return null
    return Math.round(parseFloat(cleaned) * 100)
}

// Type A: Standard CSV "Code,Desc,Price" (ignoring header fluff)
function parseStandardLine(line: string): TariffItem | null {
    // Regex for basic CSV line: "1234","Desc","12.00" OR 1234,Desc,12.00
    // Simple split by comma, but description might contain comma... relying on simple split for MVP
    const parts = line.split(",")

    if (parts.length < 3) return null

    // Heuristic: First col is Code (digits), Last col is Price
    const code = parts[0]!.trim().replace(/^"|"$/g, '')
    const priceRaw = parts[parts.length - 1]!.trim().replace(/^"|"$/g, '')
    
    // Check if code is numeric/alphanumeric (3-6 chars)
    if (!/^[A-Za-z0-9]{3,6}$/.test(code)) return null

    const price = cleanPrice(priceRaw)
    if (price === null) return null

    // Description is the middle
    const desc = parts.slice(1, parts.length - 1).join(" ").replace(/^"|"$/g, '').trim()
    if (desc.length < 3) return null

    return { code, description: desc, priceCents: price }
}

// Type B: Matrix Parser
// Returns ARRAY of items because one row = multiple specialties
function parseMatrixRow(line: string, specialtyMap: Map<number, {code: string, name: string}>): TariffItem[] {
    const parts = line.split(",") // Assuming simple CSV. Complex CSV needs library.
    if (parts.length < 3) return []

    const code = parts[0]!.trim().replace(/^"|"$/g, '')
    // 0190 is Consult. 
    if (!/^[A-Za-z0-9]{3,6}$/.test(code)) return []
    
    const desc = parts[1]!.trim().replace(/^"|"$/g, '')
    const items: TariffItem[] = []

    // Loop through mapped columns
    specialtyMap.forEach((spec, colIndex) => {
        if (colIndex < parts.length) {
            const price = cleanPrice(parts[colIndex]!.trim().replace(/^"|"$/g, ''))
            if (price !== null) {
                items.push({
                    code, 
                    description: desc,
                    priceCents: price,
                    specialtyCode: spec.code,
                    specialtyName: spec.name
                })
            }
        }
    })

    return items
}

// Detect Matrix Columns from Header Lines
// Looks for line containing "010 - Anaesthesiologists" etc.
function detectSpecialtyColumns(lines: string[]): Map<number, {code: string, name: string}> {
    const map = new Map<number, {code: string, name: string}>()
    
    for (const line of lines) {
        if (line.includes(" - ")) {
            const parts = line.split(",")
            parts.forEach((part, index) => {
                const match = part.match(/(\d{3})\s-\s(.+)/) // "010 - Anaesthesiologists"
                if (match) {
                    map.set(index, {
                        code: match[1]!,
                        name: match[2]!.trim().replace(/^"|"$/g, '')
                    })
                }
            })
            if (map.size > 0) return map // Found the header row
        }
    }
    return map
}


// --- Processor ---

async function processFile(filePath: string, source: string, defaultCategory: string) {
    console.log(`\n📄 Processing ${defaultCategory} (${path.basename(filePath)})...`)
    
    const content = fs.readFileSync(filePath, "utf-8")
    const lines = content.split(/\r?\n/)
    
    // Detect Format
    // Check first 20 lines for multiple "Tariff Value" headers or Matrix patterns
    const isMatrix = lines.slice(0, 20).some(l => (l.match(/Tariff Value/g) || []).length > 1)
    
    let specialtyMap = new Map<number, {code: string, name: string}>()
    if (isMatrix) {
        console.log("   -> Detected Matrix Format (Multi-Specialty)")
        specialtyMap = detectSpecialtyColumns(lines.slice(0, 20))
        console.log(`   -> Found ${specialtyMap.size} specialties in columns`)
    }

    let successCount = 0
    const batchSize = 10
    
    for (let i = 0; i < lines.length; i += batchSize) {
        const chunk = lines.slice(i, i + batchSize)
        
        await Promise.all(chunk.map(async (line) => {
            let items: TariffItem[] = []

            if (isMatrix && specialtyMap.size > 0) {
                items = parseMatrixRow(line, specialtyMap)
            } else {
                const item = parseStandardLine(line)
                if (item) items.push(item)
            }

            if (items.length === 0) return

            for (const item of items) {
                const specialty = item.specialtyName || defaultCategory
                // Uniqueness: Source + SpecialtyCode/Name + Code
                // e.g. GEMS_General_0190
                const docId = `${source}_${item.specialtyCode || defaultCategory}_${item.code}`.replace(/\s/g, '_')
                
                // Embedding Context
                const searchContext = `${specialty} Tariff ${item.code}: ${item.description}`
                const vector = await generateEmbedding(searchContext)
                
                if (vector) {
                     await db.collection(COLLECTION_NAME).doc(docId).set({
                        code: item.code,
                        description: item.description,
                        priceCents: item.priceCents,
                        source: source,
                        category: specialty,
                        specialtyCode: item.specialtyCode || null,
                        embedding_field: FieldValue.vector(vector),
                        search_text: searchContext
                    })
                    successCount++
                    process.stdout.write(".")
                }
            }
        }))
        
        await new Promise(r => setTimeout(r, 200)) // Rate limit niceness
    }
    
    console.log(`\n✅ Finished ${defaultCategory}: ${successCount} items.`)
}

async function walk(dir: string) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
            await walk(fullPath)
        } else if (file.endsWith(".csv")) {
            const parentDir = path.basename(path.dirname(fullPath)) // "GEMS"
            // Default category from filename e.g. "Psychology_V1" -> "Psychology"
            const category = path.basename(file).split("_")[1] || "General" 
            await processFile(fullPath, parentDir, category)
        }
    }
}

async function main() {
    console.log("🚀 Starting Robust Tariff Seeder...")

    // Dynamic import to ensure .env.local is loaded before firebase-admin initializes
    const adminConfig = await import("./firebase-admin")
    db = adminConfig.db
    
    if (!fs.existsSync(SEED_DIR)) {
        console.error("No seed directory found")
        return
    }
    await walk(SEED_DIR)
}

main().catch(console.error)
