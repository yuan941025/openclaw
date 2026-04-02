export function buildSocialLeadPack(goal, offer, audience, platforms) {
  return {
    goal,
    platforms,
    posts: platforms.map(p => ({
      platform: p,
      full_text: "AI 自動化測試發文（龍蝦系統）"
    }))
  };
}
