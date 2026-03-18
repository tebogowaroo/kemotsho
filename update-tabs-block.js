const fs = require('fs');
const path = 'apps/web/src/app/(site)/_components/sections/tabs-block.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('import { MediaImage } from "@/components/providers/media-provider"', 'import { getPublicUrlAction } from "@/app/actions/media"');

// We have to convert TabsBlock to async and resolve images.
// Actually, it's a Server Component, so we can await things inside!
const replacer = `export async function TabsBlock({ data }: { data: typeof TabsBlockSection.Type["data"] }) {
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
    )`

content = content.replace(/export function TabsBlock[\s\S]*?if \(!data\.tabs \|\| data\.tabs\.length === 0\) return null/g, replacer);

// Now change `data.tabs.map` inside the render to `tabsWithImages.map`
content = content.replace(/data\.tabs\.map\(\(tab, idx\)/g, 'tabsWithImages.map((tab, idx)');

// Change the rendering
const imgRenderRegex = /<MediaImage[\s\S]*?path=\{tab\.imagePath\}[\s\S]*?alt=\{tab\.label\}[\s\S]*?className="object-cover w-full h-full"[\s\S]*?\/>/g;
content = content.replace(imgRenderRegex, `<img src={tab.mediaUrl} alt={tab.label} className="object-cover w-full h-full" />`);
// It also should check tab.mediaUrl instead of tab.imagePath for render condition?
content = content.replace(/\{tab\.imagePath \?/g, '{tab.mediaUrl ?');

fs.writeFileSync(path, content);
