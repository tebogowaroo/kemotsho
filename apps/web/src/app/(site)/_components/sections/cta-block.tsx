import { Schema } from "effect"
import { CtaBlockSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { getPublicUrlAction } from "@/app/actions/media"
import Link from "next/link"
import { Button } from "@kemotsho/core/ui/button"

type CtaBlockData = Schema.Schema.Type<typeof CtaBlockSection>["data"]

// Helper to safely unwrap Option-like objects after JSON serialization
const getVal = <T,>(opt: any): T | null => {
    if (!opt) return null
    if (opt._tag === "Some") return opt.value
    if (opt._tag === "None") return null
    if (typeof opt === 'object' && opt !== null) return null
    return opt
}

export async function CtaBlock({ data }: { data: CtaBlockData }) {
    const body = getVal<string>(data.body)
    const buttonColor = data.buttonColor || "#10b981" // Emerald green default fallback
    
    // Configurable Theme styling
    const theme = data.theme || "dark"
    const isDark = theme === "dark"
    const textClass = isDark ? "text-slate-50" : "text-slate-900"
    const bodyTextClass = isDark ? "text-slate-300" : "text-slate-600"
    
    // Background handling
    let imageUrl: string | null = null
    const backgroundId = getVal<string>(data.backgroundId)
    if (backgroundId) {
         const result = await getPublicUrlAction(backgroundId)
         if (result.success && result.url) {
             imageUrl = result.url
         }
    }

    // Default gradient fallbacks based on theme
    const defaultGradient = isDark 
        ? "linear-gradient(to bottom right, #0f172a, #020617)" 
        : "linear-gradient(to bottom right, #ffffff, #f1f5f9)"
        
    const customGradient = (data.gradientStart && data.gradientEnd)
        ? `linear-gradient(to bottom right, ${data.gradientStart}, ${data.gradientEnd})`
        : null

    const backgroundStyle = imageUrl 
        ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { backgroundImage: customGradient || defaultGradient }
    
    return (
        <section 
            className={`relative w-full py-24 md:py-32 overflow-hidden ${textClass}`}
            style={backgroundStyle}
        >
            {/* Image overlay purely to ensure text legibility if an image is provided */}
            {imageUrl && (
                <div className={`absolute inset-0 z-0 ${isDark ? "bg-slate-950/80" : "bg-white/80"}`} />
            )}

            {/* Soft Glowing Gradient Blurs (Only showing if no image is used, to keep it clean) */}
            {!imageUrl && (
                <>
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
                </>
            )}
            
            <div className="container relative z-10 px-4 md:px-6 mx-auto flex flex-col items-center text-center">
                <div className="max-w-[800px] space-y-6">
                    <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-sans`}>
                        {data.title || "Let's Talk Tech."}
                    </h2>
                    
                    {body && (
                        <p className={`text-lg md:text-xl font-light leading-relaxed max-w-[650px] mx-auto ${bodyTextClass}`}>
                            {body}
                        </p>
                    )}
                    
                    {(data.ctaLabel && data.ctaLink) && (
                        <div className="pt-6">
                            <Button 
                                asChild 
                                size="lg" 
                                className="h-14 px-8 text-base font-semibold shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:scale-105 transition-all duration-300 border-0"
                                style={{ 
                                    backgroundColor: buttonColor,
                                    color: "#ffffff"
                                }}
                            >
                                <Link href={data.ctaLink}>
                                    {data.ctaLabel}
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
