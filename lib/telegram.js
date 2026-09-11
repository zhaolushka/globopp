function apiUrl(method) {
  return "https://api.telegram.org/bot" + process.env.TELEGRAM_BOT_TOKEN + "/" + method;
}

export async function sendTelegramMessage(chatId, text) {
  const res = await fetch(apiUrl("sendMessage"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });

  return res.json();
}

export async function setTelegramWebhook(url) {
  const res = await fetch(apiUrl("setWebhook"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: url
    })
  });

  return res.json();
}