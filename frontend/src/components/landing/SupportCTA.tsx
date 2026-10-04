import { motion } from 'framer-motion';
import { Card, Grid, Container, Section, Flex, Badge } from '@/components/ui';
import { landingSupportCards } from '@/content/siteContent';

export function SupportCTA() {
  return (
    <Section id="contacto" padding="lg" background="neu" divider="none" className="relative overflow-hidden">
      <Container size="lg">
        <Grid cols={2} gap="lg" className="items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Badge variant="label" color="accent" size="sm" className="mb-4 inline-block">
              Acompañamiento
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              Una plataforma para hábitos, pero con salida real hacia atención profesional
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Primero automatizamos lo que se puede automatizar. Cuando el caso lo requiera, el
              usuario tiene una vía clara hacia psicólogos, chats y citas.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Grid cols={1} gap="lg">
              {landingSupportCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                >
                  <Card variant="panel" hover className="group">
                    <Flex gap="md" className="group-hover:gap-5 transition-gap duration-300">
                      <Badge
                        variant="stepSm"
                        color="accent"
                        number={index + 1}
                        className="flex-shrink-0 self-start"
                      />
                      <div>
                        <h3 className="text-lg font-bold mb-2 text-white group-hover:text-accent-2 transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-white/60 leading-relaxed">
                          {card.text}
                        </p>
                      </div>
                    </Flex>
                  </Card>
                </motion.div>
              ))}
            </Grid>
          </motion.div>
        </Grid>
      </Container>
    </Section>
  );
}