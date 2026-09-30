import { motion } from 'framer-motion';
import PublicFooter from '@/components/PublicFooter';
import PublicHeader from '@/components/PublicHeader';
import {
  AboutSection,
  AuthUnified,
  FeatureCards,
  JourneySection,
  MobileAppSection,
  Preloader,
  StatsStrip,
  SupportCTA,
} from '@/components/landing';
import { Container, PictureImage } from '@/components/ui';

function HomePage() {
  return (
    <div className="landing-page">
      <Preloader />
      <PublicHeader />

      <main>
        {/* 1. Hero: the single focus of the page. Copy plus visual only. */}
        <section id="inicio" className="hero-section">
          <Container size="xl" fluid>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hero-grid"
            >
              <div className="hero-copy min-w-0">
                <span className="eyebrow inline-block mb-4">Acompañamiento especializado</span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                  Hábitos, acompañamiento y atención psicológica en un solo lugar
                </h1>
                <p className="text-white/70 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Kitsunova combina seguimiento de hábitos, asistencia automatizada, chat con
                  psicólogos y agenda de citas para acompañar cada etapa del proceso.
                </p>

                <div className="hero-actions">
                  <a href="#registro" className="hero-cta hero-cta--primary">
                    Crear mi cuenta
                  </a>
                  <a href="#como-funciona" className="hero-cta hero-cta--ghost">
                    Ver cómo funciona
                  </a>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="hero-visual min-w-0"
              >
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative max-w-lg mx-auto"
                >
                  <PictureImage
                    src="/brand/zorro-r.png"
                    alt="Zorro Kitsunova"
                    width={1024}
                    height={1024}
                    loading="eager"
                    fetchPriority="high"
                    className="w-full h-auto drop-shadow-[0_0_30px_rgba(78,122,255,0.45)]"
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </Container>
        </section>

        {/* 2. Stats band */}
        <StatsStrip />

        {/* 3. About */}
        <AboutSection />

        {/* 4. How it works */}
        <JourneySection />

        {/* 5. Features */}
        <FeatureCards
          id="solucion"
          title="Hábitos con apoyo real, no solo automatización"
          subtitle="Kitsunova está pensada para personas que quieren construir mejores hábitos con una guía clara, asistencia automatizada y la opción de hablar con psychologists o agendar citas cuando haga falta."
          variant="feature"
        />

        {/* 6. Benefits */}
        <FeatureCards
          id="beneficios"
          title="Un sistema pensado para hábitos, acompañamiento y atención psicológica"
          variant="benefit"
        />

        {/* 7. Mobile app */}
        <MobileAppSection />

        {/* 8. Final CTA + signup */}
        <SupportCTA />

        <section id="registro" className="signup-section">
          <Container size="md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto mb-10"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                Empieza hoy tu proceso de hábitos
              </h2>
              <p className="text-white/70 text-lg leading-relaxed">
                Crea tu cuenta y da el primer paso con acompañamiento especializado.
              </p>
            </motion.div>

            <div className="max-w-xl mx-auto">
              <AuthUnified mode="register" showModeToggle />
            </div>
          </Container>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default HomePage;
