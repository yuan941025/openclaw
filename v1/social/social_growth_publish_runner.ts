import { generateLeadContent } from "../growth/growth_engine.ts";
import { publishDraft } from "./publish_live_adapters.ts";

function isLiveMode() {
  return process.env.OPENCLAW_SOCIAL_LIVE === "1";
}

async function main() {
  const platform = "x";

  const content = generateLeadContent();

  console.log("=== GENERATED CONTENT ===");
  console.log(content.full_text);

  const draft = {
    platform,
    text: content.full_text
  };

  const result = await publishDraft(draft);

  console.log("=== PUBLISH RESULT ===");
  console.log(JSON.stringify({
    mode: isLiveMode() ? "live" : "dry_run",
    platform,
    result
  }, null, 2));
}

main().catch(console.error);
