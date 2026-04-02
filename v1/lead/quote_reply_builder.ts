export function buildQuoteReplyPack(message) {
  return {
    type: "quote_reply",
    message:
      "可以，先給你一個初步報價方向👇\n\n" +
      "基礎 AI 內容服務 / 報價流程整理\n" +
      "初步方案：約 NT$8,000 ~ NT$15,000\n\n" +
      "如果你願意，我可以幫你細化成一份完整可執行方案。",
    source_message: message
  };
}
