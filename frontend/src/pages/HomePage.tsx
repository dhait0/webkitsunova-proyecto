import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';
import PublicFooter from '@/components/PublicFooter';
import PublicHeader from '@/components/PublicHeader';
import {
  landingBenefitCards,
  landingFeatureCards,
  landingJourneySteps,
  landingStats,
  landingSupportCards
} from '@/content/siteContent';

type RegisterState = {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
};

function HomePage() {
  const [form, setForm] = useState<RegisterState>({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');

    if (form.password !== form.confirmPassword) {
      setStatus('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      await apiFetch<{ success: boolean }>('/auth/register', {
        method: 'POST',
        body: {
          email: form.email,
          password: form.password,
          username: form.username || undefined
        }
      });

      setStatus('Cuenta creada. Ahora puedes entrar con tus credenciales.');
      setForm({
        email: '',
        password: '',
        confirmPassword: '',
        username: ''
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-page">
      <PublicHeader />

      <main>
        <section className="main-container" id="registro">
          <section className="left-section">
            <span className="eyebrow">Acompañamiento especializado</span>
            <h1>Crea tu cuenta y empieza un proceso de hábitos con apoyo profesional.</h1>
            <p className="section-copy">
              Kitsunova combina seguimiento de hábitos, asistencia automatizada, chat con
              psicólogos y agenda de citas para acompañar cada etapa del proceso.
            </p>

            <div className="hero-metrics">
              {landingStats.map((item) => (
                <article key={item.label} className="metric-card reveal">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </article>
              ))}
            </div>

            <form className="login-box register-box" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="field full">
                  <span>Correo electrónico</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="field">
                  <span>Nombre de usuario</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(event) => setForm({ ...form, username: event.target.value })}
                    placeholder="tu_usuario"
                    autoComplete="username"
                  />
                </label>

                <label className="field password-field">
                  <span>Contraseña</span>
                  <div className="password-box">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </label>

                <label className="field password-field">
                  <span>Confirmar contraseña</span>
                  <div className="password-box">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(event) =>
                        setForm({ ...form, confirmPassword: event.target.value })
                      }
                      placeholder="Repite la contraseña"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                    >
                      {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </label>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>

              {status ? <p className="feedback">{status}</p> : null}

              <div className="divider">
                <span />
                <p>O</p>
                <span />
              </div>

              <div className="social-stack">
                <button className="social-btn" type="button" disabled title="Próximamente">
                  Google (próximamente)
                </button>
                <button className="social-btn" type="button" disabled title="Próximamente">
                  Apple (próximamente)
                </button>
              </div>
            </form>
          </section>

          <section className="right-section">
            <img src="/brand/zorro-r.png" alt="Zorro Kitsunova" className="hero-image" />
            <div className="hero-text">
              <h1>
                Hábitos, chat y citas <span>en un solo lugar</span>
              </h1>
              <p>
                Evoluciona con seguimiento automático y apoyo humano cuando necesites ir más allá
                de la automatización.
              </p>
            </div>

            <div className="panel-stack">
              {landingSupportCards.map((card, index) => (
                <article key={card.title} className="floating-panel reveal" style={{ animationDelay: `${index * 100}ms` }}>
                  <span>{card.title}</span>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="stats-strip">
          {landingStats.map((item) => (
            <article key={item.label} className="strip-item reveal">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </article>
          ))}
        </section>

        <section id="como-funciona" className="journey-section">
          <div className="journey-intro">
            <span className="eyebrow">Flujo</span>
            <h2>Del hábito automático al apoyo humano, sin fricción</h2>
            <p>
              La experiencia se mueve por etapas para que el usuario no se pierda entre opciones
              ni se sienta obligado a escalar antes de tiempo.
            </p>
          </div>

          <div className="journey-grid">
            {landingJourneySteps.map((step, index) => (
              <article key={step.number} className="journey-card reveal" style={{ animationDelay: `${index * 100}ms` }}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="solucion" className="info-section">
          <div className="info-box">
            <h2>Hábitos con apoyo real, no solo automatización</h2>
            <p>
              Kitsunova está pensada para personas que quieren construir mejores hábitos con una
              guía clara, asistencia automatizada y la opción de hablar con psicólogos o agendar
              citas cuando haga falta.
            </p>
          </div>

          <div className="cards-container">
            {landingFeatureCards.map((feature) => (
              <article key={feature.title} className="feature-card">
                <div className="card-image">
                  <img src={feature.image} alt={feature.title} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="beneficios" className="benefits-section">
          <div className="benefits-title">
            <h2>Un sistema pensado para hábitos, acompañamiento y atención psicológica</h2>
          </div>

          <div className="benefits-cards">
            {landingBenefitCards.map((benefit) => (
              <article key={benefit.title} className="benefit-card">
                <div className="benefit-image">
                  <img src={benefit.image} alt={benefit.title} />
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="support-cta">
          <div className="support-copy">
            <span className="eyebrow">Acompañamiento</span>
            <h2>Una plataforma para hábitos, pero con salida real hacia atención profesional</h2>
            <p>
              Primero automatizamos lo que se puede automatizar. Cuando el caso lo requiera, el
              usuario tiene una vía clara hacia psicólogos, chats y citas.
            </p>
          </div>

          <div className="support-list">
            {landingSupportCards.map((card) => (
              <article key={card.title} className="support-card">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="app" className="mobile-app-section">
          <div className="mobile-app-title">
            <h2>Tu progreso, tu chat y tus citas siempre accesibles</h2>
          </div>

          <div className="mobile-app-content">
            <div className="phones-image">
              <img src="/brand/celulares.png" alt="App Kitsunova en móviles" />
            </div>
            <div className="mobile-app-text">
              <p>
                Kitsunova te acompaña a donde vayas: registra hábitos, recibe asistencia
                automatizada, conversa con psicólogos y agenda citas desde una misma experiencia.
              </p>
            </div>

            <div className="store-buttons">
              <button className="store-btn" type="button" disabled title="Próximamente">
                Google Play (próximamente)
              </button>
              <button className="store-btn" type="button" disabled title="Próximamente">
                App Store (próximamente)
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default HomePage;
