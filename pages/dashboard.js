import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '../lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: prof } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!prof || !prof.quiz_completed) {
      router.push('/onboarding');
      return;
    }
    setProfile(prof);

    const { data: userPlans } = await supabase
      .from('student_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    setPlans(userPlans || []);
    setLoading(false);
  }

  async function toggleComplete(planId, currentStatus) {
    setPlans(plans.map((p) => (p.id === planId ? { ...p, is_completed: !currentStatus } : p)));

    await supabase
      .from('student_plans')
      .update({ is_completed: !currentStatus })
      .eq('id', planId);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const completedCount = plans.filter((p) => p.is_completed).length;
  const progressPercent = plans.length > 0 ? Math.round((completedCount / plans.length) * 100) : 0;
  const monthPlans = plans.filter((p) => p.month_number === currentMonth);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px 0', fontSize: 16 }}>Загружаем твой профиль...</div>;
  }

  return (
    <div className="dash-container">
      <Head>
        <title>Личный кабинет — Мой 3-месячный план</title>
      </Head>

      <nav className="top-nav">
        <div className="brand">🎯 Твой трек: <span>{profile?.track}</span></div>
        <button onClick={handleLogout} className="logout-btn">Выйти</button>
      </nav>

      <div className="profile-card">
        <div>
          <h1>Привет, {profile?.full_name}! 👋</h1>
          <p className="group-meta">Группа: {profile?.group_name} · Направление: {profile?.track}</p>
        </div>

        <div className="progress-box">
          <div className="progress-labels">
            <span>Прогресс плана</span>
            <strong>{progressPercent}% ({completedCount} из {plans.length})</strong>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="month-tabs">
        <button
          className={currentMonth === 1 ? 'tab active' : 'tab'}
          onClick={() => setCurrentMonth(1)}
        >
          Месяц 1: Фундамент & База
        </button>
        <button
          className={currentMonth === 2 ? 'tab active' : 'tab'}
          onClick={() => setCurrentMonth(2)}
        >
          Месяц 2: Практика & Портфолио
        </button>
        <button
          className={currentMonth === 3 ? 'tab active' : 'tab'}
          onClick={() => setCurrentMonth(3)}
        >
          Месяц 3: Результат & Дедлайны
        </button>
      </div>

      <div className="tasks-list">
        {monthPlans.length === 0 && <p style={{ color: '#888' }}>В этом месяце задач пока нет.</p>}
        {monthPlans.map((task) => (
          <div
            key={task.id}
            className={`task-item ${task.is_completed ? 'done' : ''}`}
            onClick={() => toggleComplete(task.id, task.is_completed)}
          >
            <input
              type="checkbox"
              checked={task.is_completed}
              onChange={() => {}}
              className="checkbox"
            />
            <div className="task-content">
              <strong>{task.title}</strong>
              <p>{task.description}</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .dash-container {
          max-width: 860px;
          margin: 0 auto;
          padding: 30px 20px 80px;
          font-family: inherit;
        }
        .top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        .brand { font-weight: 700; font-size: 14px; }
        .brand span { color: #6b5cff; }
        .logout-btn {
          background: transparent;
          border: 1px solid #ddd;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
        }
        .profile-card {
          background: #fff;
          padding: 28px;
          border-radius: 20px;
          border: 1px solid #e5e5e0;
          margin-bottom: 25px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        h1 { margin: 0; font-size: 26px; }
        .group-meta { margin: 6px 0 0; color: #777; font-size: 14px; }
        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .bar-track {
          width: 100%;
          height: 10px;
          background: #eee;
          border-radius: 999px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          background: #6b5cff;
          transition: width 0.3s ease;
        }
        .month-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .tab {
          flex: 1;
          min-width: 160px;
          padding: 12px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
        }
        .tab.active {
          background: #111;
          color: #fff;
          border-color: #111;
        }
        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .task-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: #fff;
          padding: 18px;
          border-radius: 14px;
          border: 1px solid #e5e5e0;
          cursor: pointer;
          transition: all 0.2s;
        }
        .task-item:hover {
          border-color: #6b5cff;
        }
        .task-item.done {
          background: #fafafa;
          opacity: 0.7;
        }
        .task-item.done strong {
          text-decoration: line-through;
        }
        .checkbox {
          width: 18px;
          height: 18px;
          margin-top: 3px;
          cursor: pointer;
        }
        .task-content strong {
          display: block;
          font-size: 15px;
          margin-bottom: 4px;
        }
        .task-content p {
          margin: 0;
          color: #666;
          font-size: 13px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}