import { runLeadFlow } from "../lead/lead_flow_runner.ts";
import { sendAutoReply } from "../social/reply_sender.ts";

async function main() {
  const message = "我想了解報價";

  const result = runLeadFlow("social", "x", message);

  if (result.reply_pack) {
    const sendResult = sendAutoReply("x", result.reply_pack.message);

    console.log("=== FINAL RESULT ===");
    console.log(sendResult);
  } else {
    console.log("NO REPLY");
  }
}

main();
