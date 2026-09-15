import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '../lib/supabase';

export default function Login() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Регистрация нового ученика
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        // Создаем начальную запись в профилях
        if (data?.user) {
          await supabase.from('student_profiles').upsert({ id: data.user.id });
        }
        router.push('/onboarding');
      } else {
        // Вход существующего ученика
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        // Проверяем, пройден ли тест
        const { data: profile } = await supabase
          .from('student_profiles')
          .select('quiz_completed')
          .eq('id', data.user.id)
          .single();

        if (profile && profile.quiz_completed) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    } catch (err) {
      setError(err.message || 'Произошла ошибка при входе');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <Head>
        <title>{isRegister ? 'Регистрация' : 'Вход'} — Личный кабинет</title>
      </Head>

      <div className="login-card">
        <h2>{isRegister ? 'Регистрация ученика' : 'Вход в аккаунт'}</h2>
        <p className="subtitle">
          {isRegister
            ? 'Создайте аккаунт, пройдите тест и получите личный 3-месячный план.'
            : 'Войдите, чтобы отслеживать свой прогресс.'}
        </p>

        {error && <div className="error-badge">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Пароль</label>
          <input
            type="password"
            placeholder="Минимум 6 символов"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Секунду...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <div className="toggle-box">
          {isRegister ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?'}{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            {isRegister ? 'Войти' : 'Создать аккаунт'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7f7f4;
          padding: 20px;
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          padding: 34px;
          border-radius: 20px;
          border: 1px solid #e5e5e0;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        }
        h2 {
          margin: 0 0 6px;
          font-size: 24px;
        }
        .subtitle {
          margin: 0 0 20px;
          color: #777;
          font-size: 13px;
          line-height: 1.5;
        }
        label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #555;
          margin-bottom: 6px;
        }
        input {
          width: 100%;
          padding: 12px;
          margin-bottom: 14px;
          border: 1px solid #deded9;
          border-radius: 10px;
          outline: none;
          box-sizing: border-box;
        }
        input:focus {
          border-color: #6b5cff;
        }
        .submit-btn {
          width: 100%;
          padding: 12px;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 6px;
        }
        .submit-btn:hover {
          background: #333;
        }
        .toggle-box {
          margin-top: 20px;
          text-align: center;
          font-size: 13px;
          color: #666;
        }
        .link-btn {
          background: none;
          border: none;
          color: #6b5cff;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }
        .error-badge {
          background: #ffebe8;
          color: #e14d4d;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          margin-bottom: 14px;
        }
      `}</style>
    </div>
  );
}