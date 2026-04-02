import { getDefaultLeadGoal } from "./social_config.ts";
import { buildSocialLeadPack } from "./social_builder.ts";
import { publishDraft } from "./publish_live_adapters.ts";

function isLiveMode() {
  return process.env.OPENCLAW_SOCIAL_LIVE === "1";
}

async function main() {
  const goal = process.argv[2] || getDefaultLeadGoal();
  const platformArg = (process.argv[3] || "x").toLowerCase();
  const directText = process.argv[4] || "";

  const allowed = ["x", "linkedin"];
  const platform = allowed.includes(platformArg) ? platformArg : "x";

  const pack = buildSocialLeadPack(
    goal,
    "AI 內容服務 / 報價流程整理",
    "中小企業",
    [platform]
  );

  console.log("=== SINGLE PLATFORM PUBLISH PACK ===");
  console.log(JSON.stringify(pack, null, 2));

  const draft = {
    platform,
    text: directText || pack.posts[0].full_text
  };

  console.log("=== SINGLE PLATFORM DRAFT ===");
  console.log(JSON.stringify(draft, null, 2));

  const result = await publishDraft(draft);

  console.log("=== SINGLE PLATFORM PUBLISH RESULT ===");
  console.log(JSON.stringify({
    mode: isLiveMode() ? "live" : "dry_run",
    platform,
    result
  }, null, 2));
}

main().catch((error) => {
  console.error("=== ERROR ===");
  console.error(error);
  process.exit(1);
});
