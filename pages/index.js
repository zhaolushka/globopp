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

function getDaysLeft(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDeadline = new Date(
    deadlineDate.getFullYear(),
    deadlineDate.getMonth(),
    deadlineDate.getDate()
  );

  return Math.round((startOfDeadline - startOfToday) / (1000 * 60 * 60 * 24));
}

function getCategory(activity) {
  const text = `${activity.title || ''} ${activity.description || ''}`.toLowerCase();

  if (
    text.includes('олимпиад') ||
    text.includes('олимпиада') ||
    text.includes('competition')
  ) {
    return 'Olympiad';
  }

  if (
    text.includes('hackathon') ||
    text.includes('хакатон')
  ) {
    return 'Hackathon';
  }

  if (
    text.includes('volunteer') ||
    text.includes('волонт')
  ) {
    return 'Volunteering';
  }

  if (
    text.includes('scholarship') ||
    text.includes('стипенд') ||
    text.includes('грант')
  ) {
    return 'Scholarship';
  }

  if (
    text.includes('course') ||
    text.includes('курс')
  ) {
    return 'Course';
  }

  return 'Program';
}

function CategoryIcon({ type }) {
  const icons = {
    Olympiad: (
      <svg viewBox="0 0 24 24">
        <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4" />
      </svg>
    ),

    Hackathon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m8 9 3 3-3 3M13 15h3" />
      </svg>
    ),

    Volunteering: (
      <svg viewBox="0 0 24 24">
        <path d="M12 20S4 15.5 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.5 12 20 12 20Z" />
        <path d="M12 10v5M9.5 12.5h5" />
      </svg>
    ),

    Scholarship: (
      <svg viewBox="0 0 24 24">
        <path d="m3 9 9-5 9 5-9 5-9-5Z" />
        <path d="M7 11v5c2 2 8 2 10 0v-5M21 9v6" />
      </svg>
    ),

    Program: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17" />
        <path d="M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5S14.5 18.5 12 20.5C9.5 18.5 8.5 15.5 8.5 12S9.5 6 12 3.5Z" />
      </svg>
    ),

    Course: (
      <svg viewBox="0 0 24 24">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M8 7h7M8 10h5" />
      </svg>
    ),

    Opportunity: (
      <svg viewBox="0 0 24 24">
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
      </svg>
    ),
  };

  return (
    <span className="category-icon">
      {icons[type] || icons.Opportunity}
    </span>
  );
}

function splitDescription(text) {
  if (!text) {
    return {
      intro: '',
      items: [],
    };
  }

  const parts = text
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return {
      intro: text.trim(),
      items: [],
    };
  }

  return {
    intro: parts[0],
    items: parts.slice(1),
  };
}

function linkify(text) {
  const chunks = text.split(/(https?:\/\/[^\s]+)/g);

  return chunks.map((chunk, index) =>
    /^https?:\/\//.test(chunk) ? (
      <a
        key={index}
        href={chunk}
        target="_blank"
        rel="noreferrer"
        className="desc-link"
      >
        {chunk.length > 42 ? `${chunk.slice(0, 39)}…` : chunk}
      </a>
    ) : (
      <span key={index}>{chunk}</span>
    )
  );
}

function ActivityDescription({ text }) {
  const { intro, items } = splitDescription(text);

  return (
    <div className="card-description">
      {intro && <p>{linkify(intro)}</p>}

      {items.length > 0 && (
        <ul>
          {items.map((item, index) => (
            <li key={index}>{linkify(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Home({ activities, botUsername }) {
  const upcoming = activities.filter(
    (activity) =>
      new Date(activity.deadline).getTime() >=
      Date.now() - 1000 * 60 * 60 * 24
  );

  return (
    <>
      <Head>
        <title>Global Opportunities</title>
        <meta
          name="description"
          content="Olympiads, hackathons, scholarships, programs and other opportunities for students."
        />
      </Head>

      <div className="site">

        {/* NAVBAR */}

        <nav className="navbar">
          <Link href="/" className="logo">
            <span className="logo-mark">G</span>
            <span>Global Opportunities</span>
          </Link>

          <div className="nav-links">
            <a href="#opportunities">Explore</a>
            <a href="#categories">Categories</a>
            <a href="#guides">Guides</a>

            {/* Кнопка Личного кабинета */}
            <Link
              href="/login"
              style={{
                padding: '8px 15px',
                borderRadius: '999px',
                background: '#f0edff',
                color: '#6b5cff',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Личный кабинет 🎯
            </Link>

            {botUsername && (
              <a
                href={`https://t.me/${botUsername}?start=join`}
                target="_blank"
                rel="noreferrer"
                className="nav-telegram"
              >
                Telegram
              </a>
            )}
          </div>
        </nav>

        {/* HERO */}

        <main>

          <section className="hero">

            <div className="hero-content">

              <div className="hero-label">
                <span className="hero-dot"></span>
                Opportunities for students
              </div>

              <h1>
                Find something
                <br />
                <span>worth applying for.</span>
              </h1>

              <p>
                Пройди короткий тест, определи свое направление и получи пошаговый 3-месячный план развития со всеми дедлайнами и конкурсами.
              </p>

              <div className="hero-buttons">
                <Link href="/login" className="primary-button">
                  Пройти тест и составить план →
                </Link>

                <a href="#opportunities" className="secondary-button">
                  Все возможности
                </a>
              </div>

            </div>

            <div className="hero-visual">

              <div className="floating-card card-one">
                <CategoryIcon type="Olympiad" />
                <div>
                  <strong>Olympiads</strong>
                  <span>Challenge yourself</span>
                </div>
              </div>

              <div className="floating-card card-two">
                <CategoryIcon type="Hackathon" />
                <div>
                  <strong>Hackathons</strong>
                  <span>Build something</span>
                </div>
              </div>

              <div className="floating-card card-three">
                <CategoryIcon type="Scholarship" />
                <div>
                  <strong>Scholarships</strong>
                  <span>Fund your future</span>
                </div>
              </div>

              <div className="hero-circle">
                <CategoryIcon type="Opportunity" />
              </div>

            </div>

          </section>

          {/* CATEGORIES */}

          <section className="section" id="categories">

            <div className="section-heading">
              <div>
                <span className="eyebrow">EXPLORE</span>
                <h2>What are you looking for?</h2>
              </div>

              <p>
                Find opportunities that match your interests
                and goals.
              </p>
            </div>

            <div className="categories-grid">

              <a
                href="#opportunities"
                className="category-card purple"
              >
                <CategoryIcon type="Olympiad" />
                <strong>Olympiads</strong>
                <small>Test your skills</small>
              </a>

              <a
                href="#opportunities"
                className="category-card blue"
              >
                <CategoryIcon type="Hackathon" />
                <strong>Hackathons</strong>
                <small>Build something</small>
              </a>

              <a
                href="#opportunities"
                className="category-card green"
              >
                <CategoryIcon type="Volunteering" />
                <strong>Volunteering</strong>
                <small>Make an impact</small>
              </a>

              <a
                href="#opportunities"
                className="category-card yellow"
              >
                <CategoryIcon type="Scholarship" />
                <strong>Scholarships</strong>
                <small>Fund your future</small>
              </a>

              <a
                href="#opportunities"
                className="category-card pink"
              >
                <CategoryIcon type="Program" />
                <strong>Programs</strong>
                <small>Go beyond borders</small>
              </a>

              <a
                href="#opportunities"
                className="category-card orange"
              >
                <CategoryIcon type="Course" />
                <strong>Courses</strong>
                <small>Keep learning</small>
              </a>

            </div>

          </section>

          {/* OPPORTUNITIES */}

          <section className="section opportunities" id="opportunities">

            <div className="section-heading">
              <div>
                <span className="eyebrow">LATEST</span>
                <h2>Upcoming opportunities</h2>
              </div>

              <p>
                Don't miss the next deadline.
              </p>
            </div>

            {upcoming.length === 0 ? (

              <div className="empty">
                <div className="empty-icon">
                  <CategoryIcon type="Opportunity" />
                </div>

                <h3>No opportunities yet</h3>

                <p>
                  New opportunities will appear here soon.
                </p>
              </div>

            ) : (

              <div className="opportunities-list">

                {upcoming.map((activity) => {

                  const category = getCategory(activity);
                  const daysLeft = getDaysLeft(activity.deadline);

                  return (
                    <article
                      className="opportunity-card"
                      key={activity.id}
                    >

                      <div className="opportunity-icon">
                        <CategoryIcon type={category} />
                      </div>

                      <div className="opportunity-content">

                        <div className="opportunity-top">

                          <span className="category-badge">
                            <CategoryIcon type={category} />
                            {category}
                          </span>

                          <span
                            className={
                              daysLeft <= 3
                                ? 'deadline urgent'
                                : 'deadline'
                            }
                          >
                            {daysLeft < 0
                              ? 'Deadline passed'
                              : daysLeft === 0
                              ? 'Today'
                              : `${daysLeft} days left`}
                          </span>

                        </div>

                        <h3>{activity.title}</h3>

                        {activity.description && (
                          <ActivityDescription
                            text={activity.description}
                          />
                        )}

                        <div className="opportunity-bottom">

                          <span>
                            Deadline: {formatDeadline(activity.deadline)}
                          </span>

                        </div>

                      </div>

                    </article>
                  );
                })}

              </div>

            )}

          </section>

          {/* TELEGRAM */}

          {botUsername && (
            <section className="telegram-section">

              <div className="telegram-icon">
                <svg viewBox="0 0 24 24">
                  <path d="m21 4-3 16-6-5-3 3-1-6-5-2 18-6Z" />
                  <path d="m9 15 9-8-11 6" />
                </svg>
              </div>

              <div className="telegram-content">

                <span className="eyebrow">
                  NEVER MISS A DEADLINE
                </span>

                <h2>
                  Get opportunities
                  <br />
                  straight to Telegram.
                </h2>

                <p>
                  Subscribe to receive reminders about upcoming
                  deadlines and new opportunities.
                </p>

              </div>

              <a
                href={`https://t.me/${botUsername}?start=join`}
                target="_blank"
                rel="noreferrer"
                className="telegram-button"
              >
                Connect Telegram
              </a>

            </section>
          )}

          {/* GUIDES */}

          <section className="section guides" id="guides">

            <div className="section-heading">

              <div>
                <span className="eyebrow">LEARN</span>
                <h2>Guides for students</h2>
              </div>

              <p>
                Simple tips to help you apply with confidence.
              </p>

            </div>

            <div className="guides-grid">

              <div className="guide-card">

                <div className="guide-number">01</div>

                <CategoryIcon type="Course" />

                <h3>How to find opportunities</h3>

                <p>
                  Learn how to find programs, competitions
                  and scholarships that fit your goals.
                </p>

                <span className="guide-link">
                  Coming soon →
                </span>

              </div>

              <div className="guide-card">

                <div className="guide-number">02</div>

                <CategoryIcon type="Scholarship" />

                <h3>How to apply</h3>

                <p>
                  Understand applications, documents,
                  deadlines and common mistakes.
                </p>

                <span className="guide-link">
                  Coming soon →
                </span>

              </div>

              <div className="guide-card">

                <div className="guide-number">03</div>

                <CategoryIcon type="Program" />

                <h3>Build your profile</h3>

                <p>
                  Create a stronger portfolio and make
                  your applications stand out.
                </p>

                <span className="guide-link">
                  Coming soon →
                </span>

              </div>

            </div>

          </section>

        </main>

        {/* FOOTER */}

        <footer className="footer">

          <div className="footer-logo">
            <span className="logo-mark">G</span>
            <span>Global Opportunities</span>
          </div>

          <p>
            Find opportunities. Build your future.
          </p>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Link href="/login" className="admin-link">
              Личный кабинет
            </Link>
            <Link href="/admin" className="admin-link">
              Admin
            </Link>
          </div>

        </footer>

      </div>
    </>
  );
}