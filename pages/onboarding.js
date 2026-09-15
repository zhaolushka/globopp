import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '../lib/supabase';

const QUESTIONS = [
  {
    id: 1,
    text: 'Чем тебе больше всего нравится заниматься в свободное время?',
    options: [
      { text: 'Писать код, разбираться в технологиях и алгоритмах', track: 'IT' },
      { text: 'Рисовать, создавать визуал, монтировать видео', track: 'Design' },
      { text: 'Придумывать стартапы, организовывать мероприятия, продажи', track: 'Business' },
      { text: 'Учить иностранные языки, писать тексты, исследовать возможности', track: 'Scholarships' },
    ],
  },
  {
    id: 2,
    text: 'Какой результат через 3 месяца обрадует тебя сильнее всего?',
    options: [
      { text: 'Собственный готовый сайт, бот или приложение', track: 'IT' },
      { text: 'Классное оформленное портфолио с дизайн-проектами', track: 'Design' },
      { text: 'Участие в кейс-чемпионате или защита бизнес-плана', track: 'Business' },
      { text: 'Отправленный пакет документов на зарубежный грант или обмен', track: 'Scholarships' },
    ],
  },
  {
    id: 3,
    text: 'В каких активностях тебе интереснее участвовать?',
    options: [
      { text: 'Хакатоны и олимпиады по программированию', track: 'IT' },
      { text: 'Конкурсы дизайна, анимации или арт-проектов', track: 'Design' },
      { text: 'Кейс-чемпионаты и акселераторы бизнес-идей', track: 'Business' },
      { text: 'Дебаты, олимпиады по английскому, эссе на гранты', track: 'Scholarships' },
    ],
  },
  {
    id: 4,
    text: 'Какой формат учебы тебе ближе?',
    options: [
      { text: 'Практические задачи с немедленным результатом в коде', track: 'IT' },
      { text: 'Разбор визуала, Figma и развитие насмотренности', track: 'Design' },
      { text: 'Командная работа, анализ рынка и презентации', track: 'Business' },
      { text: 'Чтение литературы, написание эссе и подготовка к языковым тестам', track: 'Scholarships' },
    ],
  },
  {
    id: 5,
    text: 'Какую суперсилу ты хочешь развить в первую очередь?',
    options: [
      { text: 'Техническую грамотность и навыки разработки', track: 'IT' },
      { text: 'Креативное мышление и UI/UX дизайн', track: 'Design' },
      { text: 'Лидерство, переговоры и управление проектами', track: 'Business' },
      { text: 'Международный нетворкинг и академическое письмо', track: 'Scholarships' },
    ],
  },
];

const PLANS_TEMPLATES = {
  IT: [
    { month: 1, title: 'База и основы программирования', desc: 'Пройти основы веб-разработки (HTML, CSS, JS). Завести и настроить аккаунт GitHub.' },
    { month: 1, title: 'Первый мини-проект', desc: 'Создать первый сайт или Telegram-бота и загрузить исходный код в свой GitHub.' },
    { month: 2, title: 'Работа с базами данных и API', desc: 'Изучить запросы к API и научиться подключать базу данных Supabase.' },
    { month: 2, title: 'Pet-проект в портфолио', desc: 'Разработать полноценное Fullstack-приложение и задеплоить его на Vercel.' },
    { month: 3, title: 'Хакатон или олимпиада', desc: 'Собрать команду и подать заявку на ближайший студенческий хакатон.' },
    { month: 3, title: 'Оформление CV и портфолио', desc: 'Красиво оформить свои проекты, составить резюме и подготовиться к стажировкам.' },
  ],
  Design: [
    { month: 1, title: 'Основы Figma и UI/UX', desc: 'Освоить Auto-layout, компоненты и дизайн-системы в Figma.' },
    { month: 1, title: 'Копирование лучших практик', desc: 'Сделать редизайн 2 экранов популярных мобильных приложений для насмотренности.' },
    { month: 2, title: 'UX-исследование и прототип', desc: 'Сформулировать проблему пользователей и создать интерактивный кликабельный прототип.' },
    { month: 2, title: 'Упаковка кейса в Behance/Dribbble', desc: 'Оформить кейс с красивыми мокапами и описанием логики экранов.' },
    { month: 3, title: 'Участие в дизайн-конкурсе', desc: 'Подать проект на конкурс или поучаствовать в хакатоне в роли UI/UX дизайнера.' },
    { month: 3, title: 'Сайт-портфолио', desc: 'Собрать персональный сайт-портфолио и подготовить отклики на первые заказы.' },
  ],
  Business: [
    { month: 1, title: 'Основы продуктового мышления', desc: 'Изучить Customer Development, Lean Canvas и методики анализа конкурентов.' },
    { month: 1, title: 'Поиск проблемы и интервью', desc: 'Провести 5 интервью с потенциальными клиентами и сформулировать бизнес-гипотезу.' },
    { month: 2, title: 'MVP без кода (No-code)', desc: 'Собрать рабочий прототип продукта с помощью No-code инструментов и протестировать спрос.' },
    { month: 2, title: 'Финансовая модель и питч-дек', desc: 'Посчитать базовую экономику проекта и подготовить презентацию для менторов.' },
    { month: 3, title: 'Участие в кейс-чемпионате', desc: 'Подать заявку на студенческий кейс-чемпионат или стартап-акселератор.' },
    { month: 3, title: 'Финальный питч', desc: 'Выступить с презентацией проекта перед жюри или инвесторами.' },
  ],
  Scholarships: [
    { month: 1, title: 'Выбор целевых программ', desc: 'Выбрать 3 подходящие международные программы (UGRAD, стипендии, обмен) и выписать дедлайны.' },
    { month: 1, title: 'План подготовки к языку', desc: 'Начать регулярную подготовку к языковым тестам (IELTS/TOEFL или Duolingo).' },
    { month: 2, title: 'Мотивационное письмо', desc: 'Написать первый черновик сильного мотивационного эссе (Personal Statement).' },
    { month: 2, title: 'Рекомендации и портфолио', desc: 'Договориться с преподавателями о рекомендательных письмах и собрать список активностей.' },
    { month: 3, title: 'Финальная вычитка документов', desc: 'Проверить весь пакет документов по чек-листу требований программы.' },
    { month: 3, title: 'Подача заявки до дедлайна', desc: 'Отправить заявку на портале программы за несколько дней до окончания срока.' },
  ],
};

export default function Onboarding() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState(null);
  const [fullName, setFullName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
      }
    });
  }, []);

  function handleSelectOption(questionId, track) {
    setAnswers({ ...answers, [questionId]: track });
  }

  async function finishTest() {
    setLoading(true);

    const counts = { IT: 0, Design: 0, Business: 0, Scholarships: 0 };
    Object.values(answers).forEach((track) => {
      if (counts[track] !== undefined) counts[track]++;
    });

    let bestTrack = 'IT';
    let max = -1;
    for (const [t, c] of Object.entries(counts)) {
      if (c > max) {
        max = c;
        bestTrack = t;
      }
    }

    // Сохраняем данные профиля
    await supabase.from('student_profiles').upsert({
      id: userId,
      full_name: fullName,
      group_name: groupName,
      track: bestTrack,
      quiz_completed: true,
    });

    // Создаем задачи 3-месячного плана
    const templateTasks = PLANS_TEMPLATES[bestTrack] || PLANS_TEMPLATES.IT;
    const planRecords = templateTasks.map((task) => ({
      user_id: userId,
      month_number: task.month,
      title: task.title,
      description: task.desc,
      is_completed: false,
    }));

    await supabase.from('student_plans').insert(planRecords);

    router.push('/dashboard');
  }

  return (
    <div className="onboard-container">
      <Head>
        <title>Определение направления — Онбординг</title>
      </Head>

      <div className="card">
        {step === 1 ? (
          <div>
            <h2>Давай знакомиться! 👋</h2>
            <p className="sub">Заполни данные о себе перед началом тестирования.</p>

            <label>Твое Имя и Фамилия</label>
            <input
              placeholder="Например: Алишер Ерланов"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <label>Твоя группа или класс</label>
            <input
              placeholder="Например: ИТ-21 или 11-А"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <button
              disabled={!fullName.trim() || !groupName.trim()}
              className="next-btn"
              onClick={() => setStep(2)}
            >
              Перейти к тесту →
            </button>
          </div>
        ) : (
          <div>
            <h2>Тест на определение направления 🎯</h2>
            <p className="sub">Ответь на 5 вопросов, чтобы мы собрали твой персональный план.</p>

            {QUESTIONS.map((q, idx) => (
              <div key={q.id} className="question-box">
                <div className="q-title">{idx + 1}. {q.text}</div>
                <div className="options-grid">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`opt-btn ${answers[q.id] === opt.track ? 'active' : ''}`}
                      onClick={() => handleSelectOption(q.id, opt.track)}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              disabled={Object.keys(answers).length < QUESTIONS.length || loading}
              className="finish-btn"
              onClick={finishTest}
            >
              {loading ? 'Генерируем твой план...' : 'Завершить и построить 3-месячный план 🚀'}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .onboard-container {
          min-height: 100vh;
          background: #f7f7f4;
          padding: 40px 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .card {
          width: 100%;
          max-width: 680px;
          background: #fff;
          padding: 34px;
          border-radius: 20px;
          border: 1px solid #e5e5e0;
        }
        h2 { margin: 0 0 8px; font-size: 24px; }
        .sub { margin: 0 0 24px; color: #777; font-size: 14px; }
        label { display: block; font-size: 12px; font-weight: 600; color: #555; margin-bottom: 6px; }
        input {
          width: 100%;
          padding: 12px;
          margin-bottom: 16px;
          border: 1px solid #deded9;
          border-radius: 10px;
          box-sizing: border-box;
          outline: none;
        }
        .next-btn, .finish-btn {
          width: 100%;
          padding: 13px;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          font-size: 15px;
          margin-top: 15px;
        }
        .next-btn:disabled, .finish-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .question-box {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eee;
        }
        .q-title {
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 12px;
        }
        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .opt-btn {
          text-align: left;
          padding: 12px 14px;
          border: 1px solid #e5e5e0;
          background: #fafaf8;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        .opt-btn:hover {
          border-color: #6b5cff;
        }
        .opt-btn.active {
          background: #f0edff;
          border-color: #6b5cff;
          color: #6b5cff;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}