import { sendTelegramMessage } from './telegram_outbound_bridge.ts';
import { ingestTelegramReply } from './telegram_reply_intake.ts';

function buildReply(replyType:string){
  if(replyType === 'quote_request'){
    return '可以，先給你一個初步報價方向👇\n\n基礎 AI 內容服務 / 報價流程整理\n初步方案：約 NT,000 ~ NT,000\n\n如果你願意，我可以幫你細化成一份完整可執行方案。';
  }

  if(replyType === 'interest'){
    return '太好了，我可以先幫你整理一個最小可行方案，讓你快速知道怎麼開始。你目前比較想優先解決哪一塊？';
  }

  if(replyType === 'rejection'){
    return '了解，那先不打擾你，之後如果有需要再找我就可以。';
  }

  return '收到，我這邊可以再幫你整理更精準的方案。';
}

async function main(){
  const first = await sendTelegramMessage({
    message_text: '你好，我這邊可協助 AI 內容服務 / 報價流程整理，你有興趣了解嗎？'
  });

  const reply = await ingestTelegramReply();
  const type = reply?.telegram_reply_intake?.reply_type || 'unknown';

  const autoReply = buildReply(type);

  const second = await sendTelegramMessage({
    message_text: autoReply
  });

  console.log('=== AUTO REPLY ===');
  console.log(JSON.stringify({
    reply_type: type,
    auto_reply: autoReply
  }, null, 2));
}

main();
