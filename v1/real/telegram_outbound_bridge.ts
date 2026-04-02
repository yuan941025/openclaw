export async function sendTelegramMessage(input:any){
  const message_text = input?.message_text || '';
  console.log('=== 龍蝦發送 ===');
  console.log(message_text);
  return {
    outbound_bridge_result:{
      channel:'local',
      target_id:'you',
      message_text,
      send_status:'sent'
    },
    outbound_bridge_summary:[
      'message_sent_local'
    ]
  };
}
