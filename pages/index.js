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
          {a.description && <p>{a.description}</p>}
        </div>
      ))}

      <Link href="/admin" className="admin-link">
        Управление активностями
      </Link>
    </div>
  );
}
