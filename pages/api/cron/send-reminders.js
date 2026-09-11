import { getSupabaseAdmin } from '../../../lib/supabase';
import { sendTelegramMessage } from '../../../lib/telegram';

function isAuthorized(req) {
  // Vercel Cron сам подставляет этот заголовок из переменной окружения CRON_SECRET.
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  // Резервный вариант — ручной запуск с ?secret=... (например, для теста в браузере).
  if (process.env.CRON_SECRET && req.query.secret === process.env.CRON_SECRET) {
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabaseAdmin();

  const { data: activities, error: actErr } = await supabase
    .from('activities')
    .select('*')
    .eq('reminder_sent', false);

  if (actErr) return res.status(500).json({ error: actErr.message });

  const { data: subscribers, error: subErr } = await supabase
    .from('subscribers')
    .select('telegram_chat_id');

  if (subErr) return res.status(500).json({ error: subErr.message });

  const now = Date.now();
  let sentFor = [];

  for (const activity of activities) {
    const deadlineMs = new Date(activity.deadline).getTime();
    const remindAtMs = deadlineMs - activity.remind_days_before * 24 * 60 * 60 * 1000;

    // Пора напомнить: время напоминания уже наступило, но дедлайн ещё не прошёл.
    if (now >= remindAtMs && now < deadlineMs) {
      const deadlineStr = new Date(activity.deadline).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
      const text =
        `⏰ <b>${activity.title}</b>\n` +
        (activity.description ? `${activity.description}\n\n` : '\n') +
        `Дедлайн: ${deadlineStr}`;

      for (const sub of subscribers) {
        await sendTelegramMessage(sub.telegram_chat_id, text);
      }

      await supabase.from('activities').update({ reminder_sent: true }).eq('id', activity.id);
      sentFor.push(activity.title);
    }
  }

  return res.status(200).json({ ok: true, remindersSent: sentFor, subscriberCount: subscribers.length });
}
