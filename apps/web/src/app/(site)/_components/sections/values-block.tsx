import { ValuesBlockSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type ValuesBlockData = Schema.Schema.Type<typeof ValuesBlockSection>["data"]

// Helper to safely unwrap Option-like objects after JSON serialization
const getVal = <T,>(opt: any): T | null => {
    if (!opt) return null
    if (opt._tag === "Some") return opt.value
    if (opt._tag === "None") return null
    if (typeof opt === 'object' && opt !== null) return null
    return opt
}

export function ValuesBlock({ data }: { data: ValuesBlockData }) {
    const title = getVal<string>(data.title)
    const description = getVal<string>(data.description)
    
    // Ensure items is an array (serialization safety)
    const items = Array.isArray(data.items) ? data.items : []

    return (
        <section className="w-full py-16 md:py-24 lg:py-32 bg-muted/30">
             <div className="container px-4 md:px-6 mx-auto">
                 <div className="text-center mb-16 max-w-2xl mx-auto">
                    {title && (
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                           {title}
                        </h2>
                    )}
                    {description && (
                        <p className="mt-4 text-muted-foreground text-lg">
                            {description}
                        </p>
                    )}
                 </div>
                 
                 <div className="grid md:grid-cols-3 gap-8 mx-auto">
                     {items.map((item, idx) => (
                         <div 
                           key={idx} 
                           className="bg-background p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border h-full flex flex-col"
                         >
                            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                            <div className="text-muted-foreground leading-relaxed flex-1 prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {item.description || ""}
                                </ReactMarkdown>
                            </div>
                         </div>
                     ))}
                 </div>
             </div>
        </section>
    )
}
