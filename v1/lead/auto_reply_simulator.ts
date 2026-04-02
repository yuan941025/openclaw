import { runLeadFlow } from "../lead/lead_flow_runner.ts";

async function main() {
  const message = "我想了解報價";

  const result = runLeadFlow("social", "x", message);

  if (result.reply_pack) {
    console.log("=== AUTO REPLY ===");
    console.log(result.reply_pack.message);
  } else {
    console.log("NO REPLY");
  }
}

main();
