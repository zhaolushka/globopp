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
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    id: null,
    title: '',
    description: '',
    deadline: '',
    remind_days_before: 1,
  });

  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem('admin_password');
    if (saved) {
      setPassword(saved);
      tryLoad(saved);
    }
  }, []);

  async function tryLoad(pwd) {
    setError('');
    const res = await fetch('/api/activities', {
      headers: { 'x-admin-password': pwd },
    });
    if (res.status === 401) {
      setError('Неверный пароль');
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setActivities(data);
    setAuthed(true);
    localStorage.setItem('admin_password', pwd);
  }

  function resetForm() {
    setForm({ id: null, title: '', description: '', deadline: '', remind_days_before: 1 });
  }

  async function submitForm(e) {
    e.preventDefault();
    setError('');
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch('/api/activities', {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({
        ...form,
        deadline: new Date(form.deadline).toISOString(),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Ошибка сохранения');
      return;
    }
    resetForm();
    tryLoad(password);
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
    tryLoad(password);
  }

  function editActivity(a) {
    setForm({
      id: a.id,
      title: a.title,
      description: a.description || '',
      deadline: toLocalInputValue(a.deadline),
      remind_days_before: a.remind_days_before,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!authed) {
    return (
      <div className="container">
        <Head>
          <title>Админка</title>
        </Head>
        <h1>Вход в админку</h1>
        <div className="admin-box">
          {error && <div className="error">{error}</div>}
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tryLoad(password)}
          />
          <button onClick={() => tryLoad(password)}>Войти</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Head>
        <title>Админка — активности</title>
      </Head>
      <h1>Управление активностями</h1>

      <form className="admin-box" onSubmit={submitForm}>
        {error && <div className="error">{error}</div>}
        <label>Название</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <label>Описание</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="row">
          <div>
            <label>Дедлайн</label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Напомнить за сколько дней</label>
            <input
              type="number"
              min="0"
              value={form.remind_days_before}
              onChange={(e) =>
                setForm({ ...form, remind_days_before: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <button type="submit">{form.id ? 'Сохранить изменения' : 'Добавить активность'}</button>
        {form.id && (
          <button type="button" className="ghost" style={{ marginLeft: 10 }} onClick={resetForm}>
            Отмена
          </button>
        )}
      </form>

      <div className="admin-box">
        {activities.length === 0 && <p>Активностей пока нет.</p>}
        {activities.map((a) => (
          <div className="admin-item" key={a.id}>
            <div>
              <strong>{a.title}</strong>
              <div style={{ fontSize: 13, color: '#777' }}>
                {new Date(a.deadline).toLocaleString('ru-RU')} · напоминание{' '}
                {a.reminder_sent ? 'отправлено' : 'ещё не отправлено'}
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
    </div>
  );
}
