import { useEffect, useState } from 'react';
import Head from 'next/head';

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('activities'); // 'activities' | 'resources'
  const [error, setError] = useState('');

  // Состояния для активностей
  const [activities, setActivities] = useState([]);
  const [actForm, setActForm] = useState({
    id: null,
    title: '',
    description: '',
    deadline: '',
    remind_days_before: 1,
  });

  // Состояния для ресурсов
  const [resources, setResources] = useState([]);
  const [resForm, setResForm] = useState({
    id: null,
    title: '',
    description: '',
    type: 'курс',
    track: 'IT',
    link: '',
  });

  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem('admin_password');
    if (saved) {
      setPassword(saved);
      tryLoadAll(saved);
    }
  }, []);

  async function tryLoadAll(pwd) {
    setError('');
    const [actRes, resRes] = await Promise.all([
      fetch('/api/activities', { headers: { 'x-admin-password': pwd } }),
      fetch('/api/resources', { headers: { 'x-admin-password': pwd } }),
    ]);

    if (actRes.status === 401 || resRes.status === 401) {
      setError('Неверный пароль');
      setAuthed(false);
      return;
    }

    const acts = await actRes.json();
    const resc = await resRes.json();

    setActivities(Array.isArray(acts) ? acts : []);
    setResources(Array.isArray(resc) ? resc : []);
    setAuthed(true);
    localStorage.setItem('admin_password', pwd);
  }

  // --- Методы для активностей ---
  function resetActForm() {
    setActForm({ id: null, title: '', description: '', deadline: '', remind_days_before: 1 });
  }

  async function submitActForm(e) {
    e.preventDefault();
    setError('');
    const method = actForm.id ? 'PUT' : 'POST';
    const res = await fetch('/api/activities', {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({
        ...actForm,
        deadline: new Date(actForm.deadline).toISOString(),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Ошибка сохранения активности');
      return;
    }
    resetActForm();
    tryLoadAll(password);
  }

  async function deleteActivity(id) {
    if (!confirm('Удалить активность?')) return;
    await fetch('/api/activities', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ id }),
    });
    tryLoadAll(password);
  }

  function editActivity(a) {
    setActForm({
      id: a.id,
      title: a.title,
      description: a.description || '',
      deadline: toLocalInputValue(a.deadline),
      remind_days_before: a.remind_days_before,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Методы для ресурсов ---
  function resetResForm() {
    setResForm({ id: null, title: '', description: '', type: 'курс', track: 'IT', link: '' });
  }

  async function submitResForm(e) {
    e.preventDefault();
    setError('');
    const method = resForm.id ? 'PUT' : 'POST';
    const res = await fetch('/api/resources', {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify(resForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Ошибка сохранения ресурса');
      return;
    }
    resetResForm();
    tryLoadAll(password);
  }

  async function deleteResource(id) {
    if (!confirm('Удалить ресурс?')) return;
    await fetch('/api/resources', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ id }),
    });
    tryLoadAll(password);
  }

  function editResource(r) {
    setResForm({
      id: r.id,
      title: r.title,
      description: r.description || '',
      type: r.type || 'курс',
      track: r.track || 'IT',
      link: r.link || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!authed) {
    return (
      <div className="container" style={{ maxWidth: 450, margin: '60px auto', padding: '0 20px' }}>
        <Head>
          <title>Вход в админку</title>
        </Head>
        <h1>Вход в админку</h1>
        <div className="admin-box">
          {error && <div className="error">{error}</div>}
          <label>Пароль администратора</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tryLoadAll(password)}
          />
          <button style={{ width: '100%' }} onClick={() => tryLoadAll(password)}>
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 860, margin: '40px auto', padding: '0 20px' }}>
      <Head>
        <title>Панель управления</title>
      </Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Панель управления</h1>
        <button
          className="ghost"
          onClick={() => {
            localStorage.removeItem('admin_password');
            setAuthed(false);
          }}
        >
          Выйти
        </button>
      </div>

      {/* Вкладки переключения разделов */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 25 }}>
        <button
          type="button"
          onClick={() => setTab('activities')}
          style={{
            background: tab === 'activities' ? '#111111' : '#f0f0ed',
            color: tab === 'activities' ? '#fff' : '#444',
          }}
        >
          ⏰ Дедлайны и активности ({activities.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('resources')}
          style={{
            background: tab === 'resources' ? '#111111' : '#f0f0ed',
            color: tab === 'resources' ? '#fff' : '#444',
          }}
        >
          📚 Ресурсы для планов ({resources.length})
        </button>
      </div>

      {error && <div className="admin-box error">{error}</div>}

      {/* ================= РАЗДЕЛ 1: АКТИВНОСТИ ================= */}
      {tab === 'activities' && (
        <>
          <form className="admin-box" onSubmit={submitActForm}>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>
              {actForm.id ? 'Редактировать активность' : 'Добавить новую активность'}
            </h2>
            <label>Название</label>
            <input
              value={actForm.title}
              onChange={(e) => setActForm({ ...actForm, title: e.target.value })}
              placeholder="Например: Подача на стипендию Global UGRAD"
              required
            />
            <label>Описание / Ссылки</label>
            <textarea
              value={actForm.description}
              onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
              placeholder="Подробности, требования и ссылки..."
            />
            <div className="row">
              <div>
                <label>Дедлайн</label>
                <input
                  type="datetime-local"
                  value={actForm.deadline}
                  onChange={(e) => setActForm({ ...actForm, deadline: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Напомнить за сколько дней</label>
                <input
                  type="number"
                  min="0"
                  value={actForm.remind_days_before}
                  onChange={(e) =>
                    setActForm({ ...actForm, remind_days_before: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="submit">{actForm.id ? 'Сохранить изменения' : 'Добавить активность'}</button>
              {actForm.id && (
                <button type="button" className="ghost" style={{ marginLeft: 10 }} onClick={resetActForm}>
                  Отмена
                </button>
              )}
            </div>
          </form>

          <div className="admin-box">
            <h3 style={{ marginTop: 0 }}>Все дедлайны</h3>
            {activities.length === 0 && <p style={{ color: '#888' }}>Активностей пока нет.</p>}
            {activities.map((a) => (
              <div className="admin-item" key={a.id}>
                <div>
                  <strong>{a.title}</strong>
                  <div style={{ fontSize: 13, color: '#777', marginTop: 3 }}>
                    Дедлайн: {new Date(a.deadline).toLocaleString('ru-RU')} · Напоминание:{' '}
                    {a.reminder_sent ? 'отправлено' : 'в очереди'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="ghost" onClick={() => editActivity(a)}>
                    Изменить
                  </button>
                  <button className="danger" onClick={() => deleteActivity(a.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ================= РАЗДЕЛ 2: РЕСУРСЫ ДЛЯ ПЛАНОВ ================= */}
      {tab === 'resources' && (
        <>
          <form className="admin-box" onSubmit={submitResForm}>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>
              {resForm.id ? 'Редактировать ресурс' : 'Добавить обучающий ресурс'}
            </h2>
            <div className="row">
              <div>
                <label>Название курса / олимпиады</label>
                <input
                  value={resForm.title}
                  onChange={(e) => setResForm({ ...resForm, title: e.target.value })}
                  placeholder="Например: CS50, Республиканская олимпиада"
                  required
                />
              </div>
              <div>
                <label>Направление (Трек)</label>
                <input
                  value={resForm.track}
                  onChange={(e) => setResForm({ ...resForm, track: e.target.value })}
                  placeholder="IT, Дизайн, Экономика, Языки"
                  required
                />
              </div>
            </div>

            <div className="row">
              <div>
                <label>Тип материала</label>
                <select
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    marginBottom: 12,
                    borderRadius: 11,
                    border: '1px solid #deded9',
                    background: '#fafaf8',
                  }}
                  value={resForm.type}
                  onChange={(e) => setResForm({ ...resForm, type: e.target.value })}
                >
                  <option value="курс">Курс / Обучение</option>
                  <option value="олимпиада">Олимпиада / Хакатон</option>
                  <option value="тренинг">Тренинг / Воркшоп</option>
                  <option value="стажировка">Стажировка / Программа</option>
                </select>
              </div>
              <div>
                <label>Ссылка (URL)</label>
                <input
                  value={resForm.link}
                  onChange={(e) => setResForm({ ...resForm, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <label>Описание</label>
            <textarea
              value={resForm.description}
              onChange={(e) => setResForm({ ...resForm, description: e.target.value })}
              placeholder="Кому подходит, чему учит, сколько времени занимает..."
            />

            <div style={{ marginTop: 10 }}>
              <button type="submit">{resForm.id ? 'Сохранить ресурс' : 'Добавить в базу'}</button>
              {resForm.id && (
                <button type="button" className="ghost" style={{ marginLeft: 10 }} onClick={resetResForm}>
                  Отмена
                </button>
              )}
            </div>
          </form>

          <div className="admin-box">
            <h3 style={{ marginTop: 0 }}>Список учебных ресурсов</h3>
            {resources.length === 0 && <p style={{ color: '#888' }}>База ресурсов пуста.</p>}
            {resources.map((r) => (
              <div className="admin-item" key={r.id}>
                <div>
                  <strong>{r.title}</strong>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: '#f0edff',
                      color: '#6b5cff',
                      fontWeight: 600,
                    }}
                  >
                    {r.track}
                  </span>
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: '#eee',
                      color: '#555',
                    }}
                  >
                    {r.type}
                  </span>
                  {r.link && (
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      <a href={r.link} target="_blank" rel="noreferrer" style={{ color: '#6b5cff' }}>
                        {r.link}
                      </a>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="ghost" onClick={() => editResource(r)}>
                    Изменить
                  </button>
                  <button className="danger" onClick={() => deleteResource(r.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}