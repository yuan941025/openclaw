export function sendAutoReply(platform: string, message: string) {
  console.log("=== SENDING REPLY ===");
  console.log({ platform, message });

  // TODO: 之後接 X / Telegram / IG API
  return {
    ok: true,
    platform,
    status: "sent_simulated"
  };
}
