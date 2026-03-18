import { Schema } from "effect"
import { makeId } from "@kemotsho/core/domain/ids"
import { Slug } from "@kemotsho/platform-cms/content/domain/Content"

/*
 * 1. Value Objects
 */
export const PageId = makeId("PageId")
export type PageId = Schema.Schema.Type<typeof PageId>

/*
 * 2. Section Component Definitions
 * These reference "Content Kinds" but don't hold the content themselves.
 */
export const HeroSection = Schema.Struct({
  type: Schema.Literal("hero"),
  uniqueId: Schema.String,
  data: Schema.Struct({
     title: Schema.OptionFromNullOr(Schema.String),
     subtitle: Schema.OptionFromNullOr(Schema.String),
     // Reference to a specific content item background?
     backgroundId: Schema.OptionFromNullOr(Schema.String),
     textPosition: Schema.optional(Schema.Literal("left", "center", "right")),
     textColor: Schema.optional(Schema.String),
     ctaLabel: Schema.optional(Schema.String),
     ctaLink: Schema.optional(Schema.String),
     ctaColor: Schema.optional(Schema.String),
     overlayOpacity: Schema.optional(Schema.Number),
     textMaxWidth: Schema.optional(Schema.Number)
  })
})

export const ContentListSection = Schema.Struct({
  type: Schema.Literal("contentList"),
  uniqueId: Schema.String,
  data: Schema.Struct({
      kind: Schema.Literal("blog", "news", "service", "product"),
      limit: Schema.Number,
      ctaLabel: Schema.OptionFromNullOr(Schema.String),
      ctaLink: Schema.OptionFromNullOr(Schema.String)
  })
})

export const HtmlSection = Schema.Struct({
    type: Schema.Literal("html"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        html: Schema.String
    })
})

export const ContactBranch = Schema.Struct({
    name: Schema.String,
    email: Schema.OptionFromNullOr(Schema.String),
    phone: Schema.OptionFromNullOr(Schema.String),
    address: Schema.OptionFromNullOr(Schema.String),
    schedules: Schema.OptionFromNullOr(Schema.String),
    mapUrl: Schema.OptionFromNullOr(Schema.String)
})

export const ContactSection = Schema.Struct({
    type: Schema.Literal("contact"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        title: Schema.OptionFromNullOr(Schema.String),
        subtitle: Schema.OptionFromNullOr(Schema.String),
        email: Schema.OptionFromNullOr(Schema.String),
        phone: Schema.OptionFromNullOr(Schema.String),
        address: Schema.OptionFromNullOr(Schema.String),
        schedules: Schema.OptionFromNullOr(Schema.String), // e.g. "Mon-Fri 9-5"
        showForm: Schema.optional(Schema.Boolean), // Optional, defaults to false if missing in logic
        branches: Schema.optional(Schema.Array(ContactBranch))
    })
})

export const TextBlockSection = Schema.Struct({
    type: Schema.Literal("textBlock"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        title: Schema.OptionFromNullOr(Schema.String),
        body: Schema.String,
        centered: Schema.Boolean
    })
})

export const ValuesBlockSection = Schema.Struct({
    type: Schema.Literal("valuesBlock"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        title: Schema.OptionFromNullOr(Schema.String),
        description: Schema.OptionFromNullOr(Schema.String),
        items: Schema.Array(Schema.Struct({
             title: Schema.String,
             description: Schema.String
        }))
    })
})

export const PageHeaderSection = Schema.Struct({
    type: Schema.Literal("pageHeader"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        title: Schema.OptionFromNullOr(Schema.String),
        subtitle: Schema.OptionFromNullOr(Schema.String),
        backgroundId: Schema.OptionFromNullOr(Schema.String),
        textPosition: Schema.optional(Schema.Literal("left", "center", "right")),
        textColor: Schema.optional(Schema.String),
        ctaLabel: Schema.optional(Schema.String),
        ctaLink: Schema.optional(Schema.String),
        ctaColor: Schema.optional(Schema.String),
        overlayOpacity: Schema.optional(Schema.Number),
        textMaxWidth: Schema.optional(Schema.Number)
    })
})

export const PaginatedContentListSection = Schema.Struct({
    type: Schema.Literal("paginatedContentList"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        kind: Schema.Literal("blog", "news", "service", "product"),
        limit: Schema.Number, // items per page
        baseUrl: Schema.OptionFromNullOr(Schema.String) // Override base URL if needed, usually filtered from context
    })
})

export const PricingSection = Schema.Struct({
    type: Schema.Literal("pricing"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        title: Schema.OptionFromNullOr(Schema.String),
        subtitle: Schema.OptionFromNullOr(Schema.String),
        plans: Schema.Array(Schema.Struct({
            name: Schema.String,
            price: Schema.String,
            frequency: Schema.OptionFromNullOr(Schema.String), // e.g. "/mo"
            description: Schema.OptionFromNullOr(Schema.String),
            features: Schema.Array(Schema.String),
            ctaLabel: Schema.String,
            ctaLink: Schema.String,
            isPopular: Schema.Boolean
        }))
    })
})

export const FeaturesSection = Schema.Struct({
    type: Schema.Literal("features"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        title: Schema.OptionFromNullOr(Schema.String),
        subtitle: Schema.OptionFromNullOr(Schema.String),
        items: Schema.Array(Schema.Struct({
            title: Schema.String,
            description: Schema.String,
            iconPath: Schema.OptionFromNullOr(Schema.String), // Path to uploaded icon/image
            linkUrl: Schema.OptionFromNullOr(Schema.String),
            linkText: Schema.OptionFromNullOr(Schema.String)
        }))
    })
})

export const FeaturedProductsHeroSection = Schema.Struct({
    type: Schema.Literal("featuredProductsHero"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        title: Schema.OptionFromNullOr(Schema.String),
        subtitle: Schema.optional(Schema.OptionFromNullOr(Schema.String)),
        productIds: Schema.Array(Schema.String)
    })
})

export const ProductListSection = Schema.Struct({
    type: Schema.Literal("productList"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        title: Schema.OptionFromNullOr(Schema.String),
        subtitle: Schema.OptionFromNullOr(Schema.String),
        showPrices: Schema.Boolean,
        showBuyButton: Schema.Boolean,
        showFilterBar: Schema.optional(Schema.Boolean),
        limit: Schema.Number
    })
})

export const PromoSection = Schema.Struct({
    type: Schema.Literal("promo"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        title: Schema.OptionFromNullOr(Schema.String),
        subtitle: Schema.OptionFromNullOr(Schema.String),
        backgroundId: Schema.OptionFromNullOr(Schema.String),
        ctaLabel: Schema.OptionFromNullOr(Schema.String),
        ctaLink: Schema.OptionFromNullOr(Schema.String),
        overlayOpacity: Schema.OptionFromNullOr(Schema.Number),
        textColor: Schema.OptionFromNullOr(Schema.String),
        height: Schema.OptionFromNullOr(Schema.Literal("auto", "screen")),
        
        // Scheduling & Visibility
        isActive: Schema.OptionFromNullOr(Schema.Boolean), // Manual Override
        validFrom: Schema.OptionFromNullOr(Schema.String), // ISO DateTime
        validUntil: Schema.OptionFromNullOr(Schema.String) // ISO DateTime
    })
})

// Union of all possible sections
export const CtaBlockSection = Schema.Struct({
    type: Schema.Literal("ctaBlock"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        title: Schema.String,
        body: Schema.OptionFromNullOr(Schema.String),
        ctaLabel: Schema.String,
        ctaLink: Schema.String,
        buttonColor: Schema.optional(Schema.String),
        theme: Schema.optional(Schema.Union(Schema.Literal("dark"), Schema.Literal("light"))),
        gradientStart: Schema.optional(Schema.String),
        gradientEnd: Schema.optional(Schema.String),
        backgroundId: Schema.optional(Schema.String)
    })
})

export const TabsBlockSection = Schema.Struct({
    type: Schema.Literal("tabsBlock"),
    uniqueId: Schema.String,
    data: Schema.Struct({
        title: Schema.optional(Schema.String),
        subtitle: Schema.optional(Schema.String),
        tabs: Schema.Array(Schema.Struct({
            label: Schema.String,
            content: Schema.String,
            imagePath: Schema.optional(Schema.String),
            callToActionLabel: Schema.optional(Schema.String),
            callToActionUrl: Schema.optional(Schema.String)
        }))
    })
})

export const PageSection = Schema.Union(
    HeroSection, 
    CtaBlockSection,
    ContentListSection, 
    PaginatedContentListSection,
    PricingSection,
    FeaturesSection,
    FeaturedProductsHeroSection,
    ProductListSection,
    PromoSection,
    HtmlSection, 
    ContactSection, 
    TextBlockSection, 
    ValuesBlockSection, 
    PageHeaderSection,
    TabsBlockSection
)
export type PageSection = Schema.Schema.Type<typeof PageSection>

/*
 * 3. Page Aggregate
 */
export const Page = Schema.Struct({
  id: PageId,
  slug: Slug, // e.g. "/" or "/about-us"
  title: Schema.String, // Internal title
  
  sections: Schema.Array(PageSection),
  
  seo: Schema.Struct({
      title: Schema.OptionFromNullOr(Schema.String),
      description: Schema.OptionFromNullOr(Schema.String)
  }),

  // Published status
  isPublished: Schema.Boolean,
  updatedAt: Schema.Date
})

export type Page = Schema.Schema.Type<typeof Page>
