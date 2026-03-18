import { TabsBlockSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/atoms/tabs"
import { getPublicUrlAction } from "@/app/actions/media"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export async function TabsBlock({ data }: { data: typeof TabsBlockSection.Type["data"] }) {
    if (!data.tabs || data.tabs.length === 0) return null
    
    // Pre-fetch all media URLs for tabs in parallel
    const tabsWithImages = await Promise.all(
        data.tabs.map(async (tab) => {
            let mediaUrl = null
            if (tab.imagePath) {
                 const result = await getPublicUrlAction(tab.imagePath)
                 if (result.success && result.url) {
                     mediaUrl = result.url
                 }
            }
            return {
                ...tab,
                mediaUrl
            }
        })
    )

    return (
        <section className="py-16 md:py-24 bg-white relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                {(data.title || data.subtitle) && (
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        {data.title && (
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl shadow-sm pb-1">{data.title}</h2>
                        )}
                        {data.subtitle && (
                            <p className="mt-4 text-lg text-slate-600">
                                {data.subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Tabs Area */}
                <div className="max-w-6xl mx-auto">
                    <Tabs defaultValue={`tab-0`} className="w-full">
                        <div className="flex justify-center mb-12">
                            <TabsList className="bg-slate-100 p-1 rounded-xl">
                                {tabsWithImages.map((tab, idx) => (
                                    <TabsTrigger
                                        key={idx}
                                        value={`tab-${idx}`}
                                        className="text-base sm:text-lg px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
                                    >
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {tabsWithImages.map((tab, idx) => (
                            <TabsContent key={idx} value={`tab-${idx}`} className="mt-0">
                                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${idx % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                                    
                                    {/* Text Content */}
                                    <div className={`${idx % 2 !== 0 ? 'lg:order-2' : ''} space-y-6`}>
                                        <div className="prose prose-slate prose-lg max-w-none">
                                            <div className="text-slate-600 leading-relaxed">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {tab.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                        
                                        {tab.callToActionLabel && tab.callToActionUrl && (
                                            <div className="pt-4">
                                                <Link 
                                                    href={tab.callToActionUrl}
                                                    className="inline-flex h-11 items-center justify-center rounded-md bg-slate-900 px-8 text-sm font-medium text-slate-50 transition-colors hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    {tab.callToActionLabel}
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Image Content */}
                                    <div className={`${idx % 2 !== 0 ? 'lg:order-1' : ''}`}>
                                        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-100 aspect-[4/3]">
                                            {tab.mediaUrl ? (
                                                <img src={tab.mediaUrl} alt={tab.label} className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>
        </section>
    )
}