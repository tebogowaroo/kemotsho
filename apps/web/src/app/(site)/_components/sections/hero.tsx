import { HeroSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { getPublicUrlAction } from "@/app/actions/media"
import { Schema } from "effect"
import { Option } from "effect"
import { Button } from "@kemotsho/core/ui/button"
import Link from "next/link"

type HeroData = Schema.Schema.Type<typeof HeroSection>["data"]

// Helper to safely unwrap Option-like objects after JSON serialization
const getVal = <T,>(opt: any): T | null => {
    if (!opt) return null
    if (opt._tag === "Some") return opt.value
    if (opt._tag === "None") return null
    if (typeof opt === 'object' && opt !== null) return null
    return opt 
}

export async function Hero({ data }: { data: HeroData }) {
    let imageUrl: string | null = null
    
    const backgroundId = getVal<string>(data.backgroundId)
    if (backgroundId) {
         const result = await getPublicUrlAction(backgroundId)
         if (result.success && result.url) {
             imageUrl = result.url
         }
    }

    const position = data.textPosition || "center"
    const alignClass = {
        left: "items-start text-left",
        center: "items-center text-center",
        right: "items-end text-right"
    }[position] ?? "items-center text-center"

    const ctaLabel = getVal<string>(data.ctaLabel)
    const ctaLink = getVal<string>(data.ctaLink)
    const textColor = getVal<string>(data.textColor)
    const ctaColor = getVal<string>(data.ctaColor)
    const textMaxWidth = getVal<number>(data.textMaxWidth)
    
    return (
        <section className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center py-24 md:py-32 lg:py-40 overflow-hidden bg-muted">
             {/* Background Image */}
             {imageUrl && (
                 <div className="absolute inset-0 z-0">
                    <img 
                        src={imageUrl} 
                        alt="Hero background" 
                        className="w-full h-full object-cover"
                    />
                    <div 
                        className="absolute inset-0 bg-black" 
                        style={{ opacity: (getVal<number>(data.overlayOpacity) ?? 50) / 100 }}
                    />
                 </div>
             )}

             <div className="container relative z-10 px-4 md:px-6 mx-auto">
                <div className={`flex flex-col space-y-4 ${alignClass}`}>
                    <div 
                        className="space-y-2 w-full"
                        style={textMaxWidth ? { maxWidth: `${textMaxWidth}px` } : undefined}
                    >
                        {getVal<string>(data.title) && (
                            <h1 
                                className={`text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none ${!textColor && imageUrl ? 'text-white' : ''}`}
                                style={textColor ? { color: textColor } : undefined}
                            >
                               {getVal<string>(data.title)}
                            </h1>
                        )}
                        {getVal<string>(data.subtitle) && (
                            <p 
                                className={`md:text-xl ${!textColor ? (imageUrl ? 'text-gray-200' : 'text-gray-500') : ''} ${!textMaxWidth ? 'max-w-[700px]' : ''} ${position === 'center' && !textMaxWidth ? 'mx-auto' : ''}`}
                                style={textColor ? { color: textColor } : undefined}
                            >
                                {getVal<string>(data.subtitle)}
                            </p>
                         )}
                    </div>
                    {(ctaLabel && ctaLink) && (
                        <div className="pt-4">
                            <Button 
                                asChild 
                                size="lg" 
                                variant={!ctaColor && imageUrl ? "default" : (ctaColor ? "default" : "outline")}
                                style={ctaColor ? { backgroundColor: ctaColor, borderColor: ctaColor, padding: "10px 20px" } : undefined}
                            >
                                <Link href={ctaLink}>{ctaLabel}</Link>
                            </Button>
                        </div>
                    )}
                </div>
             </div>
        </section>
    )
}
