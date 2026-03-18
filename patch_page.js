const fs = require('fs');
const file = 'apps/web/src/app/(site)/[[...slug]]/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /export async function generateMetadata\(\{ params \}: \{ params: Promise<\{ slug\?: string\[\] \}> \}\): Promise<Metadata> \{/,
    `export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {\n    try {`
);

code = code.replace(
    /        return \{\n            title: metadata\.title,\n            description: metadata\.description,\n            openGraph\n        \}\n    \}\n\n    return {\n        title: page\.title,\n        description: page\.description\n    }\n\}/,
    `        return {\n            title: metadata.title,\n            description: metadata.description,\n            openGraph\n        }\n    }\n\n    return {\n        title: page.title,\n        description: page.description\n    }\n    } catch (error) {\n        console.warn("Generating metadata failed safely during build.", error);\n        return { title: "Page Not Found" };\n    }\n}`
);

code = code.replace(
    /export default async function PublicPage\(\{ \n    params,\n    searchParams \n\}: \{ \n    params: Promise<\{ slug\?: string\[\] \}>\n    searchParams: Promise<\{ \[key: string\]: string \| string\[\] \| undefined \}>\n\}\) \{/,
    `export default async function PublicPage({ params, searchParams }: { params: Promise<{ slug?: string[] }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {\n    try {`
);

code = code.replace(
    /    \}\n\n    return <PageRenderer page=\{page\} searchParams=\{resolvedSearchParams\} slug=\{path\} \/>\n\}/,
    `    }\n\n    return <PageRenderer page={page} searchParams={resolvedSearchParams} slug={path} />\n    } catch (error) {\n        console.warn("PublicPage failed safely during build.", error);\n        return <div>Temporarily Unavailable</div>\n    }\n}`
);

fs.writeFileSync(file, code);
