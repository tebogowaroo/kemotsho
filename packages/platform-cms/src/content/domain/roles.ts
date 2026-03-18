import { Schema } from "effect"

export const CMSRole = Schema.Literal(
  // Staff
  "cms:manager",    // Site structure, SEO, User permissions
  "cms:publisher",  // Can publish to Live
  "cms:editor",     // Can edit any content
  "cms:author",     // Can edit own content

  // End User
  "cms:subscriber"  // Newsletter, Comments, Premium Content
)

export type CMSRole = Schema.Schema.Type<typeof CMSRole>
