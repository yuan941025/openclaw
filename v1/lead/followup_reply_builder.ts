export function buildFollowupReplyPack(message) {
  return {
    type: "followup_reply",
    message:
      "太好了，我先幫你收斂需求。你目前比較想先解決內容產出、報價流程，還是客戶追蹤？",
    source_message: message
  };
}
