const fs = require('fs');
const file = 'apps/web/src/app/(site)/[[...slug]]/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/export default async function PublicPage\(\{ params \}: Props\) \{/, `export default async function PublicPage({ params }: Props) {
    try {`);

code = code.replace(/return \(\s*<div className="flex flex-col min-h-screen">[\s\S]*?<\/div>\s*\)\s*\}/, (match) => {
    return match.replace(/}$/, `} catch (error) {
        // Safe Build-time fallback
        console.warn("PublicPage failed safely during build.", error);
        return <div>Temporarily Unavailable</div>
    }
}`);
});

code = code.replace(/export async function generateMetadata\(\{\s*params\s*\}: Props, parent: ResolvingMetadata\): Promise<Metadata> \{/, `export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
    try {`);

code = code.replace(/return \{\s*title: metadata\.title,\s*description: metadata\.description,\s*openGraph\s*\}\s*\}/, (match) => {
    return match.replace(/}$/, `} catch (error) {
        console.warn("Generating metadata failed safely during build.", error);
        return { title: "Page Not Found" };
    }
}`);
});

fs.writeFileSync(file, code);
