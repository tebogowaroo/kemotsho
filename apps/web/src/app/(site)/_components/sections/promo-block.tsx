import { PromoSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { getPublicUrlAction } from "@/app/actions/media"
import { Schema } from "effect"
import { Button } from "@kemotsho/core/ui/button"
import Link from "next/link"

type PromoData = Schema.Schema.Type<typeof PromoSection>["data"]

const getVal = <T,>(opt: any): T | null => {
    if (!opt) return null
    if (opt._tag === "Some") return opt.value
    if (opt._tag === "None") return null
    if (typeof opt === 'object' && opt !== null) return null
    return opt 
}

export async function PromoBlock({ data }: { data: PromoData }) {
    // 1. Check Visibility Logic
    const isActive = getVal<boolean>(data.isActive) ?? true // Default to true if not set
    if (!isActive) return null

    const now = new Date()
    const validFrom = getVal<string>(data.validFrom)
    const validUntil = getVal<string>(data.validUntil)

    if (validFrom && new Date(validFrom) > now) return null
    if (validUntil && new Date(validUntil) < now) return null

    // 2. Fetch Data
    let imageUrl: string | null = null
    const backgroundId = getVal<string>(data.backgroundId)
    if (backgroundId) {
         const result = await getPublicUrlAction(backgroundId)
         if (result.success && result.url) {
             imageUrl = result.url
         }
    }

    const overlayOpacity = getVal<number>(data.overlayOpacity) ?? 60
    const textColor = getVal<string>(data.textColor) || "#ffffff"
    const isFullScreen = getVal<string>(data.height) === "screen"
    const link = getVal<string>(data.ctaLink)

    // 3. Render
    const content = (
        <section 
            className={`relative w-full flex flex-col justify-center items-center overflow-hidden bg-muted group cursor-pointer ${
                isFullScreen ? "min-h-screen py-24" : "py-32 md:py-40"
            }`}
        >
            {/* Background Image */}
            {imageUrl && (
                <div 
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed transition-transform duration-700 group-hover:scale-105" 
                    style={{ backgroundImage: `url(${imageUrl})` }}
                />
            )}
            
            {/* Overlay */}
            <div 
                className="absolute inset-0 z-10 bg-black transition-opacity duration-300"
                style={{ opacity: overlayOpacity / 100 }}
            />

            {/* Clickable Area Link Overlay */}
            {link && <Link href={link} className="absolute inset-0 z-20" aria-label={getVal<string>(data.title) || "Promo"} />}

            {/* Content */}
            <div className="container relative z-30 px-4 md:px-6 text-center pointer-events-none">
                 <div className="max-w-4xl mx-auto space-y-8">
                     {getVal<string>(data.title) && (
                         <h2 
                            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter"
                            style={{ color: textColor }}
                         >
                             {getVal<string>(data.title)}
                         </h2>
                     )}
                     
                     {getVal<string>(data.subtitle) && (
                         <p 
                            className="text-xl md:text-2xl font-light max-w-2xl mx-auto"
                            style={{ color: textColor, opacity: 0.9 }}
                         >
                             {getVal<string>(data.subtitle)}
                         </p>
                     )}

                     {getVal<string>(data.ctaLabel) && (
                         <div className="pt-6">
                             {/* Button is visually customizable but clicks pass through to the overlay link unless we want specific button behavior */}
                             <div className="pointer-events-auto inline-block"> 
                                 <Button 
                                    size="lg" 
                                    className="text-xl px-10 py-8 h-auto rounded-full hover:scale-105 transition-transform shadow-lg"
                                    style={{
                                        backgroundColor: textColor,
                                        color: "black" 
                                    }}
                                    asChild
                                 >
                                    {link ? <Link href={link}>{getVal<string>(data.ctaLabel)}</Link> : <span>{getVal<string>(data.ctaLabel)}</span>}
                                 </Button>
                             </div>
                         </div>
                     )}
                 </div>
            </div>
        </section>
    )

    return content
}
