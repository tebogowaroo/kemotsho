"use server"

import { Resend } from "resend"
import { Effect, Exit, Cause } from "effect"
import { Schema } from "effect"
import { AppRuntime } from "@kemotsho/core/lib/runtime"

// 1. Define Schema for validation
const ContactFormSchema = Schema.Struct({
    name: Schema.String.pipe(Schema.minLength(1)),
    email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
    subject: Schema.String.pipe(Schema.minLength(1)),
    message: Schema.String.pipe(Schema.minLength(10)),
    token: Schema.String // reCAPTCHA token
})

// 2. Define Errors
class RecaptchaError extends Error {
    readonly _tag = "RecaptchaError"
}
class EmailError extends Error {
    readonly _tag = "EmailError" 
}

// 3. Helper to verify ReCaptcha
const verifyRecaptcha = (token: string) => 
    Effect.tryPromise({
        try: async () => {
            const secret = process.env.RECAPTCHA_SECRET_KEY
            if (!secret) return true // Dev mode bypass if key missing

            const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `secret=${secret}&response=${token}`
            })
            
            const data = await response.json()
            if (!data.success) {
                throw new Error("Invalid captcha")
            }
            return true
        },
        catch: (e) => new RecaptchaError(e instanceof Error ? e.message : "Captcha validation failed")
    })

// 4. Helper to send Email
const sendEmail = (data: Schema.Schema.Type<typeof ContactFormSchema>) =>
    Effect.tryPromise({
        try: async () => {
             const key = process.env.RESEND_API_KEY
             if (!key) {
                 console.log("Mock Email Sent:", data)
                 return
             }

             const resend = new Resend(key)
             
             // Configurable From/To details
             const fromEmail = process.env.NEXT_PUBLIC_FROM_EMAIL || "onboarding@resend.dev"
             const toEmail = process.env.NEXT_PUBLIC_EMAIL_TO || "onboarding@resend.dev"
             
             await resend.emails.send({
                 from: `Website Contact <${fromEmail}>`,
                 to: toEmail,
                 replyTo: data.email,
                 subject: `New Contact: ${data.subject}`,
                 html: `
                    <h1>New Contact Form Submission</h1>
                    <p><strong>Name:</strong> ${data.name}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Subject:</strong> ${data.subject}</p>
                    <hr />
                    <p><strong>Message:</strong></p>
                    <p>${data.message.replace(/\n/g, '<br/>')}</p>
                 `
             })
        },
        catch: (e) => new EmailError(e instanceof Error ? e.message : "Failed to send email")
    })

// 5. Main Action
export async function submitContactForm(input: unknown) {
    const program = Effect.gen(function*(_) {
        // value contains { name, email, ... }
        const data = yield* _(Schema.decodeUnknown(ContactFormSchema)(input))
        
        yield* _(verifyRecaptcha(data.token))
        yield* _(sendEmail(data))
        
        return { success: true }
    })

    const result = await AppRuntime.runPromiseExit(program)

    if (Exit.isSuccess(result)) {
        return { success: true }
    }

    const failure = Cause.failureOption(result.cause)
    if (failure._tag === "Some") {
        const error = failure.value
        if (error._tag === "RecaptchaError") {
             return { success: false, error: "Captcha failed. Please try again." }
        }
        if (error._tag === "ParseError") {
             return { success: false, error: "Invalid form data." }
        }
        return { success: false, error: "Something went wrong. Please try again later." }
    }

    return { success: false, error: "Unexpected error" }
}
