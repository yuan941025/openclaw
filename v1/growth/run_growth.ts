import { generateLeadContent } from "./growth_engine.ts";

const content = generateLeadContent();

console.log("=== LEAD CONTENT ===");
console.log(content.full_text);
