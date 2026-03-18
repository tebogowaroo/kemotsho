import { HtmlSection } from "@kemotsho/platform-cms/pages/domain/Page"
import { Schema } from "effect"

type HtmlData = Schema.Schema.Type<typeof HtmlSection>["data"]

export function HtmlBlock({ data }: { data: HtmlData }) {
    return (
        <section className="w-full" dangerouslySetInnerHTML={{ __html: data.html }} />
    )
}
