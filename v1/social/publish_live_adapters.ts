export async function publishDraft(draft) {
  return {
    ok: true,
    platform: draft.platform,
    status: "ready",
    mode: process.env.OPENCLAW_SOCIAL_LIVE === "1" ? "live" : "dry_run",
    notes: []
  };
}
