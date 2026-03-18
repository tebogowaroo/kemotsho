
require('dotenv').config({ path: '.env.local' });

const inclusive = process.env.NEXT_PUBLIC_TAX_INCLUSIVE !== "false";
console.log(`Raw: '${process.env.NEXT_PUBLIC_TAX_INCLUSIVE}'`);
console.log(`Parsed inclusive: ${inclusive}`);
