import { motion } from 'framer-motion';
import PublicFooter from '@/components/PublicFooter';
import PublicHeader from '@/components/PublicHeader';
import { AuthUnified, StatsStrip, JourneySection, FeatureCards, SupportCTA, MobileAppSection } from '@/components/landing';
import { landingSupportCards } from '@/content/siteContent';

function HomePage() {
  return (
    <div className="landing-page">
      <PublicHeader />

      <main>
        {/* Hero Section con AuthUnified */}
        <section id="inicio" className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="container max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
            >
              {/* Left: Copy */}
              <div className="text-center lg:text-left order-2 lg:order-1">
                <span className="eyebrow inline-block mb-4">Acompañamiento especializado</span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                  Crea tu cuenta y empieza un proceso de hábitos con apoyo profesional.
                </h1>
                <p className="text-white/70 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                  Kitsunova combina seguimiento de hábitos, asistencia automatizada, chat con
                  psicólogos y agenda de citas para acompañar cada etapa del proceso.
                </p>

                {/* AuthUnified integrado en el hero */}
                <AuthUnified mode="register" showModeToggle />
              </div>

              {/* Right: Visual */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="order-1 lg:order-2 relative"
              >
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative max-w-lg mx-auto"
                >
                  <img
                    src="/brand/zorro-r.png"
                    alt="Zorro Kitsunova"
                    className="w-full drop-shadow-[0_0_30px_rgba(78,122,255,0.45)]"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-8 text-center lg:text-left"
                >
                  <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3">
                    Hábitos, chat y citas <span className="text-accent-2">en un solo lugar</span>
                  </h2>
                  <p className="text-white/70 text-lg leading-relaxed">
                    Evoluciona con seguimiento automático y apoyo humano cuando necesites ir más allá
                    de la automatización.
                  </p>
                </motion.div>

                {/* Floating panels */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="mt-6 space-y-3"
                >
                  {landingSupportCards.map((card, index) => (
                    <motion.article
                      key={card.title}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ x: 4, transition: { duration: 0.2 } }}
                      className="neu-card p-4"
                    >
                      <div className="flex gap-3">
                        <span className="neu-badge-step min-w-[40px] min-h-[40px] text-base rounded-lg flex-shrink-0 flex items-center justify-center font-mono font-bold text-accent-2 shadow-neu-inset">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-accent-2 transition-colors">
                            {card.title}
                          </h4>
                          <p className="text-white/60 text-sm leading-relaxed mt-1">
                            {card.text}
                          </p>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Strip */}
        <StatsStrip />

        {/* Journey Section */}
        <JourneySection />

        {/* Feature Cards */}
        <FeatureCards
          title="Hábitos con apoyo real, no solo automatización"
          subtitle="Kitsunova está pensada para personas que quieren construir mejores hábitos con una guía clara, asistencia automatizada y la opción de hablar con psicólogos o agendar citas cuando haga falta."
          variant="feature"
        />

        {/* Benefits Section */}
        <FeatureCards
          title="Un sistema pensado para hábitos, acompañamiento y atención psicológica"
          variant="benefit"
        />

        {/* Support CTA */}
        <SupportCTA />

        {/* Mobile App Section */}
        <MobileAppSection />
      </main>

      <PublicFooter />
    </div>
  );
}

export default HomePage;