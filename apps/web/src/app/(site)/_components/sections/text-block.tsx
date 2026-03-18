import { TextBlockSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"

type TextBlockData = Schema.Schema.Type<typeof TextBlockSection>["data"]

// Helper to safely unwrap Option-like objects after JSON serialization
const getVal = <T,>(opt: any): T | null => {
    if (!opt) return null
    if (opt._tag === "Some") return opt.value
    if (opt._tag === "None") return null
    if (typeof opt === 'object' && opt !== null) return null
    return opt
}

export function TextBlock({ data }: { data: TextBlockData }) {
    const title = getVal<string>(data.title)
    
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
             <div className="container px-4 md:px-6 mx-auto">
                 <div className={`max-w-3xl ${data.centered ? 'mx-auto text-center' : ''}`}>
                     {title && (
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">
                             {title}
                         </h2>
                     )}
                     <div 
                        className={`prose prose-lg dark:prose-invert max-w-none ${data.centered ? 'mx-auto' : ''}`}
                        dangerouslySetInnerHTML={{ __html: data.body }} 
                     />
                 </div>
             </div>
        </section>
    )
}
