const fs = require('fs');
const file = './packages/core/src/lib/cached-queries.ts';
let code = fs.readFileSync(file, 'utf8');

// The instruction wants us to wrap the unstable_cache inner callbacks with try/catch.
// It looks like they have Exit.isFailure, but it could still throw before that if Firebase proxy fails unpredictably, or other native throws occur.

code = code.replace(/async\s*\(s:\s*string\)\s*=>\s*\{/, "async (s: string) => {\n            try {");
code = code.replace(/return encoded\n        \},\n        \['page-by-slug'\]/, "return encoded\n            } catch (e) {\n                console.warn(\"Cache fetch failed natively during build:\", e)\n                return null\n            }\n        },\n        ['page-by-slug']");

code = code.replace(/async\s*\(s:\s*string\)\s*=>\s*\{\s*\/\/\ 1\.\ Validate\ Slug/g, "async (s: string) => {\n            try {\n            // 1. Validate Slug");
code = code.replace(/return encoded\n        \},\n        \['content-by-slug'\]/, "return encoded\n            } catch (e) {\n                console.warn(\"Cache fetch failed natively during build:\", e)\n                return null\n            }\n        },\n        ['content-by-slug']");

code = code.replace(/async\s*\(\)\s*=>\s*\{/, "async () => {\n        try {");
code = code.replace(/return encoded\n    \},\n    \['all-pages'\]/, "return encoded\n        } catch(e) {\n            console.warn(\"Cache fetch failed natively during build:\", e)\n            return []\n        }\n    },\n    ['all-pages']");

fs.writeFileSync(file, code);
