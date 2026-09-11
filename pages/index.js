import Head from 'next/head';
import Link from 'next/link';
import { getSupabaseClient } from '../lib/supabase';

export async function getServerSideProps() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('deadline', { ascending: true });

  return {
    props: {
      activities: error ? [] : data,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || '',
    },
  };
}

function formatDeadline(deadline) {
  const d = new Date(deadline);
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function urgencyClass(deadline) {
  const diffMs = new Date(deadline).getTime() - Date.now();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 0) return '';
  if (diffHours < 24) return 'urgent';
  if (diffHours < 24 * 3) return 'soon';
  return '';
}

// Emoji range used as "bullet markers" people naturally type before
// a Дата / Формат / Цена / Ссылка segment (📅 👤 💰 🔗 📌 🎓 🌍 etc).
const EMOJI_BULLET = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u2B00-\u2BFF]/u;

function splitDescription(text) {
  if (!text) return { intro: '', items: [] };
  const parts = text
    .split(new RegExp(`(?=${EMOJI_BULLET.source})`, 'gu'))
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return { intro: text.trim(), items: [] };
  }
  const startsWithEmoji = EMOJI_BULLET.test(parts[0][0] || '');
  return {
    intro: startsWithEmoji ? '' : parts[0],
    items: startsWithEmoji ? parts : parts.slice(1),
  };
}

function linkify(text) {
  const chunks = text.split(/(https?:\/\/[^\s]+)/g);
  return chunks.map((chunk, i) =>
    /^https?:\/\//.test(chunk) ? (
      <a key={i} href={chunk} target="_blank" rel="noreferrer" className="desc-link">
        {chunk.length > 42 ? `${chunk.slice(0, 39)}…` : chunk}
      </a>
    ) : (
      <span key={i}>{chunk}</span>
    )
  );
}

function ActivityDescription({ text }) {
  const { intro, items } = splitDescription(text);
  return (
    <div className="card-desc">
      {intro && <p>{linkify(intro)}</p>}
      {items.length > 0 && (
        <ul className="desc-list">
          {items.map((item, i) => (
            <li key={i}>{linkify(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Home({ activities, botUsername }) {
  const upcoming = activities.filter(
    (a) => new Date(a.deadline).getTime() >= Date.now() - 1000 * 60 * 60 * 24
  );

  return (
    <div className="container">
      <Head>
        <title>Активности и дедлайны</title>
      </Head>

      <div className="header">
        <h1>Активности и дедлайны</h1>
        {botUsername && (
          <a
            className="tg-button"
            href={`https://t.me/${botUsername}?start=join`}
            target="_blank"
            rel="noreferrer"
          >
            Подключить уведомления в Telegram
          </a>
        )}
      </div>

      {upcoming.length === 0 && (
        <div className="empty">Активностей пока нет — загляните позже.</div>
      )}

      {upcoming.map((a) => (
        <div className={`card ${urgencyClass(a.deadline)}`} key={a.id}>
          <div className="card-top">
            <h3>{a.title}</h3>
            <span className="deadline-badge">до {formatDeadline(a.deadline)}</span>
          </div>
          {a.description && <ActivityDescription text={a.description} />}
        </div>
      ))}

      <Link href="/admin" className="admin-link">
        Управление активностями
      </Link>
    </div>
  );
}