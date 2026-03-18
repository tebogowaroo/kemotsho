
import { Effect, Layer } from "effect"
// Correct import path
import { PaymentGateway, PaymentInitialization, PaymentError, WebhookVerificationError, PaymentEvent } from "../../domain/PaymentGateway"
import crypto from 'crypto'

export interface PayFastConfig {
    merchantId: string
    merchantKey: string
    passPhrase?: string
    env: "sandbox" | "production"
}

// Correct Order as per PayFast Custom Integration Docs
const PAYFAST_FORM_FIELDS = [
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "notify_url",
    "name_first",
    "name_last",
    "email_address",
    "cell_number",
    "m_payment_id",
    "amount",
    "item_name",
    "item_description",
    "custom_int1",
    "custom_int2",
    "custom_int3",
    "custom_int4",
    "custom_int5",
    "custom_str1",
    "custom_str2",
    "custom_str3",
    "custom_str4",
    "custom_str5",
    "email_confirmation",
    "confirmation_address",
    "payment_method"
]

const generateSignature = (data: Record<string, string>, passPhrase?: string): string => {
    let pfOutput = ""
    
    // Iterate over the PRE-DEFINED ordered list, not object keys
    for (const key of PAYFAST_FORM_FIELDS) {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
            const val = data[key]?.trim() || ""
            pfOutput += `${key}=${encodeURIComponent(val).replace(/%20/g, "+")}&`
        }
    }

    pfOutput = pfOutput.slice(0, -1) // Remove trailing &

    if (passPhrase) {
        pfOutput += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, "+")}`
    }

    console.log("[PayFast] String to Hash:", pfOutput)
    return crypto.createHash('md5').update(pfOutput).digest('hex')
}

/**
 * Validates the signature of an incoming PayFast Webhook/ITN.
 * According to docs, we must preserve the order of fields as received, 
 * or specifically, iterate the POST data components.
 * Note: Next.js 'body' object might not preserve the exact raw order from the HTTP stream perfectly 
 * if filtered through body parsers, but usually standard iteration matches PayFast's PHP implementation.
 */
const validateResponseSignature = (data: Record<string, string>, signature: string, passPhrase?: string): boolean => {
    let pfOutput = ""
    // For ITN, we use the keys AS RECEIVED (excluding signature)
    // We should not sort them or force specific order, just take them as they came in the payload
    // However, to be safe against random JS object ordering, usually PayFast sends them in specific order.
    // Let's try to mimic the PHP loop `foreach($pfData...)`
    
    for (const key of Object.keys(data)) {
        if (key === "signature") continue
        
        // PayFast usually sends empty strings for unused fields, we must include them if they were sent?
        // The PHP docs exapmple: `if( $key !== 'signature' ) ...` does NOT check for empty values for ITN validation
        // UNLIKE the Request generation which `if($val !== '')`.
        // WAIT: Step 4 code shows: `$pfData[$key] = stripslashes( $val ); ... $pfParamString .= $key ...`
        // It does NOT filter empty values. It includes everything sent.
        
        const val = data[key]
        pfOutput += `${key}=${encodeURIComponent(val ?? "").replace(/%20/g, "+")}&`
    }

    pfOutput = pfOutput.slice(0, -1) // Remove trailing &

    if (passPhrase) {
        pfOutput += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, "+")}`
    }
    
    const calculated = crypto.createHash('md5').update(pfOutput).digest('hex')
    
    // Log for debugging
    if (calculated !== signature) {
        console.log("[PayFast] Webhook Signature Mismatch")
        console.log("Receive String:", pfOutput)
        console.log("Calculated:", calculated)
        console.log("Expected:", signature)
    }

    return calculated === signature
}

export const createPayFastGateway = (config: PayFastConfig) => 
    PaymentGateway.of({
        createSession: (params) => Effect.gen(function* () {
            
            // 1. Prepare PayFast Data
            // Note: amounts must be in Rands (decimal), not cents.
            const amountInRands = (params.amount / 100).toFixed(2)

            const data: Record<string, string> = {
                merchant_id: config.merchantId,
                merchant_key: config.merchantKey,
                return_url: params.returnUrl,
                cancel_url: params.cancelUrl,
                notify_url: params.notifyUrl,
                amount: amountInRands,
                item_name: params.description,
                m_payment_id: params.orderId, 
                // Optional
                name_first: params.nameFirst || "",
                name_last: params.nameLast || "",
                email_address: params.email || ""
            }

            // Remove empty fields to ensure signature match
            Object.keys(data).forEach(key => {
                 if (data[key] === undefined || data[key] === null || data[key] === "") {
                     delete data[key]
                 }
            })

            // Debugging: Log payload to see exactly what is being signed
            console.log("[PayFast] Generating Signature for:", JSON.stringify(data, null, 2))
            
            // 2. Sign
            // Ensure passphrase is trimmed if it exists
            const safePassPhrase = config.passPhrase && config.passPhrase.trim() !== "" ? config.passPhrase.trim() : undefined
            const signature = generateSignature(data, safePassPhrase)
            data.signature = signature

            const baseUrl = config.env === "sandbox" 
                ? "https://sandbox.payfast.co.za/eng/process"
                : "https://www.payfast.co.za/eng/process"

            // 3. Return Form Post
            return {
                kind: "form-post",
                url: baseUrl,
                data: data
            }
        }),

        verifyWebhook: (headers, body) => Effect.gen(function* () {
            const data = body as Record<string, any>
            const signature = data.signature

            if (!signature) {
                 return yield* Effect.fail(new WebhookVerificationError({ message: "Missing signature" }))
            }
            
            // 1. Verify Signature
            const { signature: _, ...rest } = data
            // PayFast POSTs data back. We need to reconstruct the string EXACTLY as they did.
            // Usually Request body from Next.js is already parsed. We need to be careful with types.
            // We assume 'rest' contains string values.
            const validationData: Record<string, string> = {}
            for(const k in rest) {
                validationData[k] = String(rest[k])
            }

            const checkParam = (param: string) => {
                 if (config.env === "sandbox" && param === "127.0.0.1") return true // Localhost checks often fail IP check
                 // In production, we should check if the IP is valid PayFast IP range
                 return true
            }

            const calculatedSignature = generateSignature(validationData, config.passPhrase)

            // For ITN, we really should use the specialized validator because generateSignature
            // enforces the Request Order (PAYFAST_FORM_FIELDS) which lacks pf_payment_id etc.
            // But we already implemented separate logic? No, let's switch to the new function.
            const isValid = validateResponseSignature(validationData, signature, config.passPhrase)

            if (!isValid) {
                 return yield* Effect.fail(new WebhookVerificationError({ message: "Invalid signature" }))
            }

            // 2. Map to Event
            const status = data.payment_status === "COMPLETE" ? "paid" : "failed"
            
            return {
                transactionId: data.pf_payment_id,
                orderId: data.m_payment_id,
                status: status,
                providerRawData: data
            }
        })
    })

export const PayFastGatewayLive = (config: PayFastConfig) => 
    Layer.succeed(PaymentGateway, createPayFastGateway(config))
