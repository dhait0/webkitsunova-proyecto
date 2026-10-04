import { motion } from 'framer-motion';
import { Card, CardImage, Button, Container, Section, Flex, Badge } from '@/components/ui';

export function MobileAppSection() {
  return (
    <Section id="app" padding="xl" background="none" divider="none" className="relative">
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="label" color="accent" size="sm" className="mb-4 inline-block">
            App Móvil
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
            Tu progreso, tu chat y tus citas siempre accesibles
          </h2>
        </motion.div>

        <Flex direction="col" gap="xl" className="items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-4xl"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <CardImage
                src="/brand/celulares.png"
                alt="App Kitsunova en móviles"
                ratio="16/9"
                radius="2xl"
                width={1600}
                height={1493}
                className="w-full shadow-2xl"
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-2xl"
          >
            <Card variant="auth" className="w-full text-center">
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                Kitsunova te acompaña a donde vayas: registra hábitos, recibe asistencia
                automatizada, conversa con psicólogos y agenda citas desde una misma experiencia.
              </p>
              <Flex direction="col" gap="md" className="items-center">
                <Button
                  variant="social"
                  size="lg"
                  fullWidth
                  disabled
                  leftIcon={<svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12.54 5.53c-.55-.55-1.29-.85-2.04-.85-.75 0-1.49.3-2.04.85l-2.79 2.79c-.75.75-.75 1.96 0 2.71l4.59 4.59c.75.75 1.96.75 2.71 0l2.79-2.79c.75-.75.75-1.96 0-2.71l-4.59-4.59zm-4.38 10.55l-1.79 1.79c-.75.75-.75 1.96 0 2.71l2.79 2.79c.75.75 1.96.75 2.71 0l1.79-1.79c.75-.75.75-1.96 0-2.71l-2.79-2.79c-.75-.75-1.96-.75-2.71 0zM17.5 5.5l-2.5 2.5c-.5.5-.5 1.3 0 1.8l3.5 3.5c.5.5 1.3.5 1.8 0l2.5-2.5c.5-.5.5-1.3 0-1.8l-3.5-3.5c-.5-.5-1.3-.5-1.8 0z"/></svg>}
                >
                  Google Play (próximamente)
                </Button>
                <Button
                  variant="social"
                  size="lg"
                  fullWidth
                  disabled
                  title="Próximamente"
                  leftIcon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c.98-.98.98-2.57 0-3.55-.97-.98-2.56-.98-3.54 0l-.71.71c.63.63 1.47.95 2.34.95.91 0 1.77-.35 2.4-.95.63-.63.94-1.47.94-2.34s-.32-1.71-.94-2.34c-.64-.64-1.5-.95-2.41-.95-.86 0-1.7.31-2.33.94l-.71-.71c1.05-1.06 2.76-1.06 3.82 0 .99.97.99 2.56 0 3.54-.53.53-1.23.85-1.97.85-.74 0-1.45-.32-1.98-.85L17.05 20.28zM12 3.5c3.59 0 6.5 2.91 6.5 6.5s-2.91 6.5-6.5 6.5-6.5-2.91-6.5-6.5 2.91-6.5 6.5-6.5zm0 11c2.49 0 4.5-2.01 4.5-4.5S14.49 5.5 12 5.5 7.5 7.51 7.5 10s2.01 4.5 4.5 4.5z"/></svg>}
                >
                  App Store (próximamente)
                </Button>
              </Flex>
            </Card>
          </motion.div>
        </Flex>
      </Container>
    </Section>
  );
}