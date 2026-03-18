
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const PRICES_DIR = path.join(process.cwd(), "seed-data/prices")
const SERVICE_ACCOUNT = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}")

// Init Firebase
if (getApps().length === 0) {
    initializeApp({ credential: cert(SERVICE_ACCOUNT) })
}
const db = getFirestore()

// Helper: Clean Price string to Integers (Cents)
function cleanPrice(raw: string): number {
    if (!raw) return 0
    // Remove 'R', spaces, commas, but keep dot
    const cleaned = raw.replace(/[R\s,]/g, "") 
    return Math.round(parseFloat(cleaned) * 100)
}

async function processPriceFile(filePath: string, schemeName: string) {
    console.log(`\n💰 Processing Prices for ${schemeName} (${path.basename(filePath)})...`)
    const content = fs.readFileSync(filePath, "utf-8")
    const lines = content.split(/\r?\n/)
    
    // Batch writes for speed
    const batchSize = 400
    let batch = db.batch()
    let count = 0
    let total = 0

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (!line) continue
        const parts = line.split(",") // Needs robust CSV parser for production
        if (parts.length < 3) continue

        // Assumption: Format is Code,Description,Price (similar to tariffs)
        const code = parts[0]!.trim().replace(/^"|"$/g, '')
        const priceRaw = parts[parts.length - 1]!.trim().replace(/^"|"$/g, '')
        
        // Skip invalid lines
        if (!/^[A-Za-z0-9]{3,6}$/.test(code)) continue
        const priceCents = cleanPrice(priceRaw)

        // ID Strict Format: SCHEME_CODE (e.g. DISCOVERY_0190)
        // We might need to handle specialties if schemes differ by specialty for same code
        const docId = `${schemeName}_${code}`.toUpperCase()
        
        const ref = db.collection("tariff_prices").doc(docId)
        batch.set(ref, {
            scheme: schemeName,
            code: code,
            priceCents: priceCents,
            updatedAt: new Date()
        })

        count++
        total++

        if (count >= batchSize) {
            await batch.commit()
            batch = db.batch()
            count = 0
            process.stdout.write(".")
        }
    }
    
    if (count > 0) await batch.commit()
    console.log(`\n✅ ${schemeName}: Updated ${total} prices.`)
}

async function main() {
    if (!fs.existsSync(PRICES_DIR)) {
        console.log(`Creating directory: ${PRICES_DIR}`)
        fs.mkdirSync(PRICES_DIR, { recursive: true })
    }

    const schemes = fs.readdirSync(PRICES_DIR)
    for (const scheme of schemes) {
        const schemePath = path.join(PRICES_DIR, scheme)
        if (fs.statSync(schemePath).isDirectory()) {
            // Process all CSVs in this scheme's folder
            const files = fs.readdirSync(schemePath).filter(f => f.endsWith('.csv'))
            for (const file of files) {
                await processPriceFile(path.join(schemePath, file), scheme)
            }
        }
    }
}

main().catch(console.error)
