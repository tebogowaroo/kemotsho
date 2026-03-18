
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
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY missing in .env.local");
    process.exit(1);
}

if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();

// Helper to get random int
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to get past date
const randomDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - randomInt(0, daysAgo));
    return date;
}

const PRODUCTS = [
    { id: "prod_1", title: "Classic T-Shirt", price: 25000 }, // R250
    { id: "prod_2", title: "Denim Jeans", price: 80000 }, // R800
    { id: "prod_3", title: "Sneakers", price: 120000 }, // R1200
    { id: "prod_4", title: "Baseball Cap", price: 15000 }, // R150
    { id: "prod_5", title: "Hoodie", price: 45000 }, // R450
]

const CUSTOMERS = [
    { name: "John Doe", email: "john@example.com" },
    { name: "Jane Smith", email: "jane@example.com" },
    { name: "Bob Johnson", email: "bob@example.com" },
    { name: "Alice Brown", email: "alice@example.com" },
]

async function seedAnalytics() {
    console.log("🌱 Seeding Analytics Data...");

    const batch = db.batch();
    const ordersCol = db.collection("orders");

    // Create 30 historical orders
    for (let i = 0; i < 30; i++) {
        const docRef = ordersCol.doc();
        const date = randomDate(30);
        const customer = CUSTOMERS[randomInt(0, CUSTOMERS.length - 1)];

        if (!customer) continue;
        
        // Random Items
        const numItems = randomInt(1, 3);
        const items = [];
        let subtotal = 0;

        for (let j = 0; j < numItems; j++) {
            const product = PRODUCTS[randomInt(0, PRODUCTS.length - 1)];
            if (!product) continue;

            const qty = randomInt(1, 2);
            const total = product.price * qty;
            
            items.push({
                productId: product.id,
                title: product.title,
                quantity: qty,
                priceAtPurchase: product.price,
                total: total,
                sku: `SKU-${product.id}`,
                // Minimal OrderLineItem fields
            });
            subtotal += total;
        }

        const shipping = subtotal > 100000 ? 0 : 10000;
        const total = subtotal + shipping;

        const [firstName, lastName] = customer.name.split(" ");
        
        batch.set(docRef, {
            orderNumber: 1000 + i,
            customerId: "seed_customer",
            customerEmail: customer.email,
            items: items,
            
            currency: "ZAR",
            subtotal: subtotal,
            shippingCost: shipping,
            tax: 0,
            total: total,
            
            shippingAddress: {
                firstName,
                lastName,
                line1: "123 Seed Street",
                city: "Cape Town",
                postalCode: "8000",
                country: "ZA",
                phone: "0721234567",
                email: customer.email
            },
            
            // Critical for Analytics
            status: Math.random() > 0.3 ? "delivered" : "processing", // 70% delivered, 30% processing
            createdAt: Timestamp.fromDate(date),
            updatedAt: Timestamp.fromDate(date)
        });
    }

    await batch.commit();
    console.log("✅ Successfully seeded 30 orders.");
}

seedAnalytics().catch(console.error);
