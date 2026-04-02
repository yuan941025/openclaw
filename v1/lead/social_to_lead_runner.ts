import { getDefaultLeadGoal } from "../social/social_config.ts";
import { buildSocialLeadPack } from "../social/social_builder.ts";
import { publishDraft } from "../social/publish_live_adapters.ts";
import { runLeadFlow } from "./lead_flow_runner.ts";

function isLiveMode() {
  return process.env.OPENCLAW_SOCIAL_LIVE === "1";
}

async function main() {
  const goal = process.argv[2] || getDefaultLeadGoal();
  const platformArg = (process.argv[3] || "x").toLowerCase();
  const inboundMessage = process.argv[4] || "報價多少？";

  const allowed = ["x", "linkedin"];
  const platform = allowed.includes(platformArg) ? platformArg : "x";

  const pack = buildSocialLeadPack(
    goal,
    "AI 內容服務 / 報價流程整理",
    "中小企業",
    [platform]
  );

  console.log("=== SOCIAL LEAD PACK ===");
  console.log(JSON.stringify(pack, null, 2));

  const draft = {
    platform,
    text: pack.posts[0].full_text
  };

  console.log("=== SOCIAL DRAFT ===");
  console.log(JSON.stringify(draft, null, 2));

  const publish_result = await publishDraft(draft);

  console.log("=== SOCIAL PUBLISH RESULT ===");
  console.log(JSON.stringify({
    mode: isLiveMode() ? "live" : "dry_run",
    platform,
    publish_result
  }, null, 2));

  const lead_flow = runLeadFlow("social_inbound", platform, inboundMessage);

  console.log("=== LEAD FLOW RESULT ===");
  console.log(JSON.stringify(lead_flow, null, 2));
}

main().catch((error) => {
  console.error("=== ERROR ===");
  console.error(error);
  process.exit(1);
});
