
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Initialize Firebase
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
    : null;

if (!serviceAccount) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY missing");
    process.exit(1);
}

if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function debugQuery() {
    console.log("🔍 Debugging Analytics Query...");
    
    const days = 30;
    const now = new Date();
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - days);

    const ordersRef = db.collection("orders");
    
    console.log(`Querying orders since ${pastDate.toISOString()} (Filtering status in-memory)`);

    const snapshot = await ordersRef
        .where("createdAt", ">=", pastDate)
        .orderBy("createdAt", "asc")
        .get();

    console.log(`Found ${snapshot.size} total orders in date range.`);

    if (snapshot.empty) {
        console.log("⚠️ No orders found.");
        return;
    }

    // Filter in memory
    const validOrders = snapshot.docs.filter(d => ["processing", "shipped", "delivered"].includes(d.data().status));
    console.log(`Found ${validOrders.length} valid orders (processing/shipped/delivered).`);

    let sampleDate = "";
    if (validOrders.length > 0) {
        validOrders.slice(0, 3).forEach(doc => {
            const d = doc.data();
            console.log(`- Order ${d.orderNumber}: Total=${d.total}, Status=${d.status}, Date=${d.createdAt.toDate().toISOString()}`);
            sampleDate = d.createdAt.toDate().toISOString().split('T')[0];
        });
    }

    // Validating grouping
    const salesMap: Record<string, number> = {};
    // Init keys
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toISOString().split('T')[0];
        if (key) salesMap[key] = 0;
    }

    console.log("Checking Date Matching...");
    
    // Check if grouping works
    let matchedCount = 0;
    validOrders.forEach(doc => {
        const data = doc.data();
        const date = data.createdAt.toDate().toISOString().split('T')[0];
        if (salesMap[date] !== undefined) {
            salesMap[date] += data.total;
            matchedCount++;
        }
    });
    
    console.log(`Matched ${matchedCount}/${snapshot.size} orders to map keys.`);
    
    const result = Object.entries(salesMap)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));

    console.log("Final Data Sample:", result.slice(-3));
}

debugQuery().catch(console.error);
