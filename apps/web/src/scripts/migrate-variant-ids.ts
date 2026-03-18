
import { db } from "./firebase-admin-script"
import { randomUUID } from "crypto"

async function migrate() {
    console.log("Starting Variant ID Migration...")
    
    const snapshot = await db.collection("products").get()
    
    let updatedCount = 0
    let totalProducts = 0
    
    for (const doc of snapshot.docs) {
        totalProducts++
        const data = doc.data()
        
        // Check if variants exist and need IDs
        if (data.variantOverrides && Array.isArray(data.variantOverrides)) {
            let needsUpdate = false
            const updatedVariants = data.variantOverrides.map((v: any) => {
                if (!v.id) {
                    needsUpdate = true
                    return {
                        ...v,
                        id: randomUUID()
                    }
                }
                return v
            })
            
            if (needsUpdate) {
                console.log(`Updating product ${doc.id} with new variant IDs`)
                await doc.ref.update({
                    variantOverrides: updatedVariants,
                    updatedAt: new Date()
                })
                updatedCount++
            }
        }
    }
    
    console.log(`Migration Complete. Scanned ${totalProducts} products. Updated ${updatedCount}.`)
    process.exit(0)
}

migrate().catch(console.error)
