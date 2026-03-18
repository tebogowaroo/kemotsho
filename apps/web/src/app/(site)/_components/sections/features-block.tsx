"use client"

import { Schema } from "effect"
import { FeaturesSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { cn } from "@kemotsho/core/lib/utils"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Option } from "effect"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type FeaturesData = Schema.Schema.Type<typeof FeaturesSection>["data"]

export function FeaturesBlock({ data }: { data: FeaturesData }) {
    if (!data.items || data.items.length === 0) return null

    return (
        <section className="w-full py-16 md:py-24 lg:py-32 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                     <div className="space-y-2 max-w-[800px]">
                         {(data.title && (Option.isOption(data.title) ? Option.getOrNull(data.title) : data.title)) && (
                             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                {(Option.isOption(data.title) ? Option.getOrNull(data.title) : data.title) as string}
                             </h2>
                         )}
                         {(data.subtitle && (Option.isOption(data.subtitle) ? Option.getOrNull(data.subtitle) : data.subtitle)) && (
                             <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                 {(Option.isOption(data.subtitle) ? Option.getOrNull(data.subtitle) : data.subtitle) as string}
                             </p>
                         )}
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.items.map((item, index) => (
                        <div 
                            key={index}
                            className="group relative overflow-hidden rounded-xl border bg-background/50 p-6 sm:p-8 backdrop-blur-[2px] transition-all hover:bg-background/80 hover:shadow-lg hover:border-primary/20"
                        >
                            {/* Gradient Border Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <div className="relative z-10 flex flex-col h-full">
                                {item.iconPath && (Option.isOption(item.iconPath) ? Option.getOrNull(item.iconPath) : item.iconPath) ? (
                                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={(Option.isOption(item.iconPath) ? Option.getOrNull(item.iconPath) : item.iconPath) as string} alt="" className="h-6 w-6 object-contain" />
                                    </div>
                                ) : (
                                    // Default Icon if none provided
                                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                        <div className="h-4 w-4 rounded-full bg-current" />
                                    </div>
                                )}

                                <h3 className="mb-2 text-xl font-bold tracking-tight">{item.title}</h3>
                                <div className="text-muted-foreground flex-1 mb-4 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {item.description || ""}
                                    </ReactMarkdown>
                                </div>

                                {((item.linkUrl && (Option.isOption(item.linkUrl) ? Option.getOrNull(item.linkUrl) : item.linkUrl)) && (item.linkText && (Option.isOption(item.linkText) ? Option.getOrNull(item.linkText) : item.linkText))) && (
                                    <Link 
                                        href={(Option.isOption(item.linkUrl) ? Option.getOrNull(item.linkUrl) : item.linkUrl) as string}
                                        className="inline-flex items-center text-sm font-medium text-primary hover:underline underline-offset-4 group-hover:translate-x-1 transition-transform"
                                    >
                                        {(Option.isOption(item.linkText) ? Option.getOrNull(item.linkText) : item.linkText) as string}
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
