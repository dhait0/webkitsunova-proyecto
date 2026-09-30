import { motion } from 'framer-motion';
import { Card, Badge, Grid, Container, Section } from '@/components/ui';
import { landingJourneySteps } from '@/content/siteContent';

export function JourneySection() {
  return (
    <Section padding="lg" background="none" divider="none" className="relative">
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <Badge variant="label" color="accent" size="sm" className="mb-4 inline-block">
            Flujo
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
            Del hábito automático al apoyo humano, sin fricción
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            La experiencia se mueve por etapas para que el usuario no se pierda entre opciones
            ni se sienta obligado a escalar antes de tiempo.
          </p>
        </motion.div>

        <Grid cols={3} gap="lg" stagger={0.15}>
          {landingJourneySteps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Card variant="journey" hover className="h-full">
                <Badge
                  variant="step"
                  color="accent"
                  number={step.number}
                  className="mb-4 self-start"
                />
                <h3 className="text-xl font-bold mb-3 text-white">
                  {step.title}
                </h3>
                <p className="text-white/60 leading-relaxed flex-1">
                  {step.text}
                </p>
              </Card>
            </motion.div>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}