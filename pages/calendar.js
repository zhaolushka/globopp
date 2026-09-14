import Head from 'next/head';
import { useEffect, useState } from 'react';

function getDemoUserId() {
  if (typeof window === 'undefined') return 'demo-user';
  let id = localStorage.getItem('demoUserId');
  if (!id) {
    id = 'demo-user';
    localStorage.setItem('demoUserId', id);
  }
  return id;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function CalendarPage() {
  const [userId, setUserId] = useState(null);
  const [events, setEvents] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', event_date: '', event_time: '', category: 'Personal', description: '', link: '' });

  useEffect(() => {
    const id = getDemoUserId();
    setUserId(id);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/calendar?user_id=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((data) => setEvents(data || []))
      .catch(() => setEvents([]));
  }, [userId]);

  function reload() {
    if (!userId) return;
    fetch(`/api/calendar?user_id=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((data) => setEvents(data || []));
  }

  function prevMonth() {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    setViewDate(d);
  }
  function nextMonth() {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    setViewDate(d);
  }
  function goToday() {
    setViewDate(new Date());
  }

  function openAdd() {
    setForm({ title: '', event_date: '', event_time: '', category: 'Personal', description: '', link: '' });
    setShowModal(true);
  }

  async function submitForm(e) {
    e.preventDefault();
    const payload = { ...form };
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowModal(false);
      reload();
    } else {
      alert('Ошибка при добавлении');
    }
  }

  function eventsForDay(date) {
    const key = date.toISOString().slice(0, 10);
    return events.filter((ev) => ev.event_date === key || ev.event_date === (new Date(ev.event_date)).toISOString().slice(0,10));
  }

  // Build calendar grid
  const first = startOfMonth(viewDate);
  const last = endOfMonth(viewDate);
  const startWeekDay = (first.getDay() + 6) % 7; // Monday=0
  const days = [];
  for (let i = 0; i < startWeekDay; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
  while (days.length % 7 !== 0) days.push(null);

  const upcoming = events.slice().sort((a,b)=> new Date(a.event_date) - new Date(b.event_date)).slice(0,6);

  return (
    <>
      <Head>
        <title>My Calendar — Global Opportunities</title>
      </Head>

      <div className="site">
        <nav className="navbar">
          <a href="/" className="logo"><span className="logo-mark">G</span><span>Global Opportunities</span></a>
          <div className="nav-links">
            <a href="/">Explore</a>
            <a href="/calendar">Calendar</a>
            <a href="/profile">Profile</a>
          </div>
        </nav>

        <main className="container">
          <div className="page-header">
            <h1>My Calendar</h1>
            <p>Keep track of deadlines, applications and everything you need to remember.</p>

            <div className="page-actions">
              <button className="primary-button" onClick={openAdd}>+ Add activity</button>
            </div>
          </div>

          <div className="calendar-controls">
            <button onClick={prevMonth} aria-label="Previous">←</button>
            <div className="month-label">{viewDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}</div>
            <button onClick={nextMonth} aria-label="Next">→</button>
            <button onClick={goToday}>Today</button>
          </div>

          <div className="calendar-grid-wrap">
            <aside className="sidebar-upcoming">
              <h3>Upcoming</h3>
              {upcoming.length === 0 ? <p>No upcoming events</p> : (
                <ul>
                  {upcoming.map((ev) => (
                    <li key={ev.id}>
                      <strong>{ev.title}</strong>
                      <div className="muted">{ev.event_date}{ev.event_time ? ' • ' + ev.event_time : ''}</div>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <section className="calendar-grid">
              <div className="weekdays">
                <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
              </div>

              <div className="days">
                {days.map((d, idx) => (
                  <div key={idx} className={`day ${d && d.getMonth() !== viewDate.getMonth() ? 'muted' : ''}`}>
                    {d ? (
                      <div>
                        <div className="date-number">{d.getDate()}</div>
                        <div className="events-list">
                          {eventsForDay(d).map((ev) => (
                            <div key={ev.id} className={`event ${ev.category ? ev.category.toLowerCase() : ''}`}>
                              <div className="event-title">{ev.title}</div>
                              <div className="event-meta">{ev.category || ''}{ev.event_time ? ' • ' + ev.event_time : ''}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>

        {showModal && (
          <div className="modal-backdrop">
            <div className="modal">
              <h3>Add activity</h3>
              <form onSubmit={submitForm}>
                <label>Activity title</label>
                <input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required />

                <label>Date</label>
                <input type="date" value={form.event_date} onChange={(e)=>setForm({...form, event_date:e.target.value})} required />

                <label>Time (optional)</label>
                <input type="time" value={form.event_time} onChange={(e)=>setForm({...form, event_time:e.target.value})} />

                <label>Category</label>
                <select value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})}>
                  <option>Personal</option>
                  <option>Study</option>
                  <option>Deadline</option>
                  <option>Exam</option>
                  <option>Competition</option>
                  <option>Application</option>
                  <option>Other</option>
                </select>

                <label>Description</label>
                <textarea value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />

                <label>Link (optional)</label>
                <input value={form.link} onChange={(e)=>setForm({...form, link:e.target.value})} />

                <div className="modal-actions">
                  <button type="button" onClick={()=>setShowModal(false)}>Cancel</button>
                  <button type="submit" className="primary-button">Add activity</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        .container{max-width:1100px;margin:40px auto;padding:0 20px}
        .page-header{display:flex;align-items:center;justify-content:space-between}
        .calendar-controls{display:flex;gap:12px;align-items:center;margin:16px 0}
        .calendar-grid-wrap{display:flex;gap:20px}
        .sidebar-upcoming{width:260px;background:#fff;border-radius:12px;padding:16px}
        .calendar-grid{flex:1}
        .weekdays{display:grid;grid-template-columns:repeat(7,1fr);background:transparent;margin-bottom:6px}
        .weekdays div{padding:8px 6px;font-weight:600;font-size:12px}
        .days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
        .day{min-height:100px;background:#fff;border-radius:8px;padding:8px}
        .date-number{font-weight:600;margin-bottom:6px}
        .events-list{display:flex;flex-direction:column;gap:6px}
        .event{padding:6px;border-radius:6px;background:#f6f4ff;font-size:13px}
        .event.personal{background:#f0f0f0}
        .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center}
        .modal{background:#fff;padding:20px;border-radius:10px;width:420px}
        .modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
        .primary-button{background:#6b21a8;color:#fff;padding:8px 12px;border-radius:8px;border:none}
      `}</style>
    </>
  );
}
