import { getSupabaseAdmin } from '../../lib/supabase';
import { sendTelegramMessage } from '../../lib/telegram';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const update = req.body;
  const message = update.message;

  // Отвечаем Telegram сразу же (200), чтобы он не повторял запрос,
  // даже если дальше что-то пойдёт не так.
  res.status(200).json({ ok: true });

  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const username = message.from?.username || null;
  const text = message.text.trim();

  if (text.startsWith('/start')) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('subscribers')
      .upsert(
        { telegram_chat_id: chatId, telegram_username: username },
        { onConflict: 'telegram_chat_id' }
      );

    if (error) {
      console.error('Ошибка подписки:', error);
      return;
    }

    await sendTelegramMessage(
      chatId,
      '✅ Готово! Теперь ты будешь получать уведомления о дедлайнах и активностях.\n\nЧтобы отписаться, напиши /stop.'
    );
    return;
  }

  if (text.startsWith('/stop')) {
    const supabase = getSupabaseAdmin();
    await supabase.from('subscribers').delete().eq('telegram_chat_id', chatId);
    await sendTelegramMessage(chatId, 'Ты отписался от уведомлений. Если передумаешь — напиши /start.');
    return;
  }

  // На любое другое сообщение — короткая подсказка
  await sendTelegramMessage(
    chatId,
    'Я присылаю напоминания о дедлайнах. Команды: /start — подписаться, /stop — отписаться.'
  );
}
