
import { NextResponse } from "next/server"
import { db } from "@kemotsho/core/infra/firebase/admin"
import { randomUUID } from "crypto"

// Force Next.js to skip static build execution
export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const customersSnapshot = await db.collection("customers").get()
        let fixedCount = 0
        let totalCustomers = 0
        const updates = []

        for (const doc of customersSnapshot.docs) {
            totalCustomers++
            const data = doc.data()
            const addresses = data.addresses || []
            let needsUpdate = false
            
            const fixedAddresses = addresses.map((addr: any) => {
                if (!addr.id) {
                    needsUpdate = true
                    fixedCount++
                    return { ...addr, id: randomUUID() }
                }
                return addr
            })

            // Fix defaults as well if they are missing IDs or match unrelated (though standard is separate obj in Firestore usually)
            // But usually we just update the array.
            // Wait, if the defaults are stored as objects, they also need IDs matching the array.
            // If we generated an ID for an address in the array, we must ensure the default equivalent gets the SAME ID.
            
            // This is tricky. Often defaults are just pointers or copies.
            // If they are copies, we can just assign a new ID to the default too, but it should ideally match the array one.
            // Matching by content? (Line1 + Zip)
            
            let defaultShipping = data.defaultShippingAddress
            let defaultBilling = data.defaultBillingAddress

            if (needsUpdate) {
                // Try to sync IDs for defaults
                if (defaultShipping && !defaultShipping.id) {
                    const match = fixedAddresses.find((a: any) => 
                        a.line1 === defaultShipping.line1 && a.postalCode === defaultShipping.postalCode
                    )
                    if (match) defaultShipping = match
                }
                if (defaultBilling && !defaultBilling.id) {
                    const match = fixedAddresses.find((a: any) => 
                        a.line1 === defaultBilling.line1 && a.postalCode === defaultBilling.postalCode
                    )
                    if (match) defaultBilling = match
                }
                
                updates.push(doc.ref.update({
                    addresses: fixedAddresses,
                    defaultShippingAddress: defaultShipping || null,
                    defaultBillingAddress: defaultBilling || null
                }))
            }
        }

        await Promise.all(updates)

        return NextResponse.json({
            status: "success",
            message: "Addresses fixed",
            customersScanned: totalCustomers,
            addressesFixed: fixedCount
        })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
