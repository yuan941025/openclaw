import readline from 'node:readline';

function classify(t:string){
  const s=(t||'').toLowerCase();
  if(/interest|有興趣/.test(s)) return 'interest';
  if(/quote|報價|多少/.test(s)) return 'quote_request';
  if(/no thanks|不用了/.test(s)) return 'rejection';
  if(/\?/.test(s)) return 'question';
  return 'unknown';
}

export async function ingestTelegramReply(){
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve=>{
    rl.question('客戶回覆：', (input)=>{
      rl.close();
      resolve({
        telegram_reply_intake:{
          reply_id:'local_1',
          source_channel:'local',
          source_user_id:'you',
          message_text:input,
          reply_type:classify(input)
        },
        reply_intake_summary:[
          'local_reply_received'
        ]
      });
    });
  });
}
