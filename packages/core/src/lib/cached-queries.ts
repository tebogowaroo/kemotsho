import { unstable_cache } from "next/cache"
import { AppRuntime } from "@kemotsho/core/lib/runtime"
import { getPageBySlug } from "@kemotsho/platform-cms/pages/application/GetPage"
import { listPages } from "@kemotsho/platform-cms/pages/application/ListPages"
import { Page, PageSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Slug, ContentItem } from "@kemotsho/platform-cms/content/domain/Content"
import { getContentBySlug } from "@kemotsho/platform-cms/content/application/GetContent"
import { Schema } from "effect"
import { Effect, Exit, Option } from "effect"

// Helper to serialize deserialized Page objects back to plain JSON for caching
// We need this because unstable_cache stores the result as JSON strings
const serializePage = (page: Page) => {
    return JSON.parse(JSON.stringify(page))
}

export const getCachedPageBySlug = async (slugString: string) => {
    // We cache based on the slug string
    const fn = unstable_cache(
        async (s: string) => {
            try {
            // 1. Validate Slug
            // We re-validate here because the cache key is a raw string
            const validSlugResult = Schema.decodeUnknown(Slug)(s)
            const validSlug = await AppRuntime.runPromiseExit(validSlugResult)
            
            if (Exit.isFailure(validSlug)) {
                return null
            }
            
            // 2. Fetch from Domain
            const program = getPageBySlug(validSlug.value)
            const result = await AppRuntime.runPromiseExit(program)
            
            if (Exit.isFailure(result)) {
                return null
            }

            // 3. Serialize for Cache
            // We use Schema.encode to ensure we strip any internal Effect types before JSON.stringify
            // Actually, simply JSON.stringify works for most, but `Option` needs care if not handled.
            // Our Page schema uses OptionFromNullOr, which encodes to null/value.
            const encoded = await AppRuntime.runPromise(Schema.encode(Page)(result.value))
            return encoded
            } catch (e) {
                console.warn("Cache fetch failed natively during build:", e)
                return null
            }
        },
        ['page-by-slug'], 
        { 
            tags: [`page-${slugString}`, 'pages'],
            revalidate: 3600 // Revalidate every hour just in case, but rely on tags primarily
        }
    )

    return fn(slugString)
}

export const getCachedContentBySlug = async (slugString: string) => {
    const fn = unstable_cache(
        async (s: string) => {
            try {
            // 1. Validate Slug
            const validSlugResult = Schema.decodeUnknown(Slug)(s)
            const validSlug = await AppRuntime.runPromiseExit(validSlugResult)
            
            if (Exit.isFailure(validSlug)) {
                return null
            }
            
            // 2. Fetch from Domain
            const program = getContentBySlug(validSlug.value)
            const result = await AppRuntime.runPromiseExit(program)
            
            if (Exit.isFailure(result)) {
                return null
            }

            // 3. Serialize for Cache
            const encoded = await AppRuntime.runPromise(Schema.encode(ContentItem)(result.value))
            return encoded
            } catch (e) {
                console.warn("Cache fetch failed natively during build:", e)
                return null
            }
        },
        ['content-by-slug'],
        {
            tags: [`content-${slugString}`, 'content'],
            revalidate: 3600
        }
    )

    return fn(slugString)
}

export const getCachedAllPages = unstable_cache(
    async () => {
        try {
        const program = listPages()
        const result = await AppRuntime.runPromiseExit(program)

        if (Exit.isFailure(result)) {
            return []
        }

        const encoded = await AppRuntime.runPromise(Schema.encode(Schema.Array(Page))(result.value))
        return encoded
        } catch(e) {
            console.warn("Cache fetch failed natively during build:", e)
            return []
        }
    },
    ['all-pages'],
    {
        tags: ['pages'],
        revalidate: 3600
    }
)
