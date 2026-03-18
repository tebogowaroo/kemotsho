import { Schema } from "effect"

export class MfaChallange extends Schema.Class<MfaChallange>("MfaChallange")({
    userId: Schema.String,
    code: Schema.String,
    expiresAt: Schema.Number, // Timestamp
    failedAttempts: Schema.Number,
}) { }

// We will store this in a private sub-collection or root collection "auth_mfa"
// NOT in the public user document for security.

export const MfaVerificationInput = Schema.Struct({
    userId: Schema.String,
    code: Schema.String
})
