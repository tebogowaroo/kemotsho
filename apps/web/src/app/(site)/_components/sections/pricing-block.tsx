"use client"

import { Button } from "@/shared/ui/atoms/button"
import { Check } from "lucide-react"
import Link from "next/link"
import { Schema } from "effect"
import { PricingSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Option } from "effect"

type PricingData = Schema.Schema.Type<typeof PricingSection>["data"]

export function PricingBlock({ data }: { data: PricingData }) {
    if (!data.plans || data.plans.length === 0) return null

    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                     <div className="space-y-2">
                         {Option.getOrNull(data.title) && (
                             <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{Option.getOrNull(data.title)}</h2>
                         )}
                         {Option.getOrNull(data.subtitle) && (
                             <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                 {Option.getOrNull(data.subtitle)}
                             </p>
                         )}
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {data.plans.map((plan, index) => (
                        <div 
                            key={index}
                            className={`
                                relative flex flex-col p-6 rounded-2xl bg-card border
                                ${plan.isPopular ? 'border-primary shadow-lg scale-105 z-10' : 'border-border shadow-sm'}
                            `}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wide">
                                    Recommended
                                </div>
                            )}

                            <div className="mb-5 space-y-2">
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold">{plan.price}</span>
                                    {Option.getOrNull(plan.frequency) && (
                                        <span className="text-muted-foreground font-medium">{Option.getOrNull(plan.frequency)}</span>
                                    )}
                                </div>
                                {Option.getOrNull(plan.description) && (
                                    <p className="text-sm text-muted-foreground">{Option.getOrNull(plan.description)}</p>
                                )}
                            </div>
                            
                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button 
                                asChild 
                                className="w-full font-semibold" 
                                intent={plan.isPopular ? "primary" : "outline"}
                                size="lg"
                            >
                                <Link href={plan.ctaLink}>{plan.ctaLabel}</Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
