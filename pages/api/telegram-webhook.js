import { getSupabaseAdmin } from '../../lib/supabase';
import { sendTelegramMessage } from '../../lib/telegram';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const update = req.body;
  const message = update.message;

  if (!message || !message.text) {
    return res.status(200).json({ ok: true });
  }

  const chatId = message.chat.id;
  const username = message.from?.username || null;
  const text = message.text.trim();

  try {
    if (text.startsWith('/start')) {
      const supabase = getSupabaseAdmin();

      const { error } = await supabase
        .from('subscribers')
        .upsert(
          {
            telegram_chat_id: chatId,
            telegram_username: username
          },
          {
            onConflict: 'telegram_chat_id'
          }
        );

      if (error) {
        console.error('Ошибка подписки:', error);
        return res.status(500).json({ ok: false });
      }

      await sendTelegramMessage(
        chatId,
        '✅ Готово! Теперь ты будешь получать уведомления о дедлайнах и активностях.\n\nЧтобы отписаться, напиши /stop.'
      );

      return res.status(200).json({ ok: true });
    }

    if (text.startsWith('/stop')) {
      const supabase = getSupabaseAdmin();

      await supabase
        .from('subscribers')
        .delete()
        .eq('telegram_chat_id', chatId);

      await sendTelegramMessage(
        chatId,
        'Ты отписался от уведомлений. Если передумаешь — напиши /start.'
      );

      return res.status(200).json({ ok: true });
    }

    await sendTelegramMessage(
      chatId,
      'Я присылаю напоминания о дедлайнах. Команды: /start — подписаться, /stop — отписаться.'
    );

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ ok: false });
  }
}