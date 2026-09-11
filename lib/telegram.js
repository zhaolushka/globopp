function apiUrl(method) {
  return `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;
}

export async function sendTelegramMessage(chatId, text) {
  const res = await fetch(apiUrl('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  return res.json();
}

// Регистрирует URL, на который Telegram будет слать обновления (сообщения боту).
// Вызывается один раз вручную после деплоя (см. README).
export async function setTelegramWebhook(url) {
  const res = await fetch(apiUrl('setWebhook'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return res.json();
}
