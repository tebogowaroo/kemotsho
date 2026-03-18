import { Schema } from "effect"

export class TenantConfig extends Schema.Class<TenantConfig>("TenantConfig")({
  id: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  tagline: Schema.optional(Schema.String),
  
  theme: Schema.Struct({
    primary: Schema.String, // Hex code
    primaryForeground: Schema.optional(Schema.String),
    secondary: Schema.optional(Schema.String),
    accent: Schema.optional(Schema.String),
    background: Schema.optional(Schema.String),
    foreground: Schema.optional(Schema.String),
    radius: Schema.String,
    fontHeading: Schema.String, // FontName from config/fonts
    fontBody: Schema.String, // FontName from config/fonts
    borderWidth: Schema.String,
    shadows: Schema.Literal("none", "soft", "medium", "hard"),
  }),
  
  features: Schema.Struct({
    blog: Schema.Boolean,
    testimonials: Schema.Boolean,
    newsletter: Schema.Boolean,
    commerce: Schema.Boolean,
    medical: Schema.Boolean,
  }),

  assets: Schema.Struct({
    logoUrl: Schema.optional(Schema.String),
    faviconUrl: Schema.optional(Schema.String),
  }),

  contact: Schema.Struct({
    email: Schema.optional(Schema.String),
    phone: Schema.optional(Schema.String),
    address: Schema.optional(Schema.String),
  }),

  social: Schema.Struct({
    twitter: Schema.optional(Schema.String),
    facebook: Schema.optional(Schema.String),
    instagram: Schema.optional(Schema.String),
    linkedin: Schema.optional(Schema.String),
    youtube: Schema.optional(Schema.String),
  }),

  store: Schema.Struct({
      currency: Schema.String,
      locale: Schema.String
  }),

  tax: Schema.Struct({
      enabled: Schema.Boolean,
      rate: Schema.Number,        // e.g. 15 (percentage)
      inclusive: Schema.Boolean,   // true = prices already include VAT (SA standard)
      label: Schema.String,        // "VAT" or "Tax" or "GST"
  }),

  layout: Schema.Union(
    Schema.Literal("standard"),
    Schema.Literal("sidebar")
  )
}) {}

export const getTenantConfig = (): TenantConfig => {
  return new TenantConfig({
    id: process.env.NEXT_PUBLIC_TENANT_ID || "default",
    name: process.env.NEXT_PUBLIC_APP_NAME || "Waroo Base",
    description: process.env.NEXT_PUBLIC_BRAND_DESCRIPTION,
    tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE,

    theme: {
      primary: process.env.NEXT_PUBLIC_THEME_PRIMARY || "#0f172a",
      primaryForeground: process.env.NEXT_PUBLIC_THEME_PRIMARY_FOREGROUND,
      secondary: process.env.NEXT_PUBLIC_THEME_SECONDARY,
      accent: process.env.NEXT_PUBLIC_THEME_ACCENT,
      background: process.env.NEXT_PUBLIC_THEME_BACKGROUND,
      foreground: process.env.NEXT_PUBLIC_THEME_FOREGROUND,
      radius: process.env.NEXT_PUBLIC_THEME_RADIUS || "0.5rem",
      fontHeading: process.env.NEXT_PUBLIC_FONT_HEADING || "inter",
      fontBody: process.env.NEXT_PUBLIC_FONT_BODY || "inter",
      borderWidth: process.env.NEXT_PUBLIC_THEME_BORDER_WIDTH || "1px",
      shadows: (process.env.NEXT_PUBLIC_THEME_SHADOWS as "none" | "soft" | "medium" | "hard") || "soft",
    },
    
    features: {
        blog: process.env.NEXT_PUBLIC_ENABLE_BLOG === "true",
        testimonials: process.env.NEXT_PUBLIC_ENABLE_TESTIMONIALS === "true",
        newsletter: process.env.NEXT_PUBLIC_ENABLE_NEWSLETTER === "true",
        commerce: process.env.NEXT_PUBLIC_ENABLE_COMMERCE === "true",
        medical: process.env.NEXT_PUBLIC_ENABLE_MEDICAL_PRACTICE === "true", // Enabled for development
    },

    assets: {
      logoUrl: process.env.NEXT_PUBLIC_LOGO_URL,
      faviconUrl: process.env.NEXT_PUBLIC_FAVICON_URL,
    },

    contact: {
      email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
      phone: process.env.NEXT_PUBLIC_CONTACT_PHONE,
      address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS,
    },

    social: {
      twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || process.env.NEXT_PUBLIC_SOCIAL_AGX,
      facebook: process.env.NEXT_PUBLIC_SOCIAL_MSG,
      instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
      linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN,
      youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE,
    },

    store: {
        currency: process.env.NEXT_PUBLIC_STORE_CURRENCY || "ZAR",
        locale: process.env.NEXT_PUBLIC_STORE_LOCALE || "en-ZA",
    },

    tax: {
        enabled: (process.env.NEXT_PUBLIC_TAX_ENABLED || "false").trim() === "true",
        rate: parseFloat(process.env.NEXT_PUBLIC_TAX_RATE || "15"),
        inclusive: (process.env.NEXT_PUBLIC_TAX_INCLUSIVE || "true").trim() !== "false", // default true for SA
        label: process.env.NEXT_PUBLIC_TAX_LABEL || "VAT",
    },

    layout: (process.env.NEXT_PUBLIC_LAYOUT_STYLE as "standard" | "sidebar") || "standard",
  })
}
