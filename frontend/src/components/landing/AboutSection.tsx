import { motion } from 'framer-motion';
import { Card, Badge, Grid, Container, Section, PictureImage } from '@/components/ui';
import { aboutSection, landingSupportCards } from '@/content/siteContent';

export function AboutSection() {
  return (
    <Section id="nosotros" padding="lg" background="none" divider="none" className="relative">
      <Container size="lg">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="min-w-0"
          >
            <Badge variant="label" color="accent" size="sm" className="mb-4 inline-block">
              {aboutSection.badge}
            </Badge>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
              {aboutSection.title}
            </h2>

            <p className="text-white/70 text-lg leading-relaxed mb-10">{aboutSection.lead}</p>

            <div className="space-y-4">
              {aboutSection.points.map((point, index) => (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                >
                  <Card variant="panel" className="p-5">
                    <h3 className="text-lg font-bold text-white mb-2">{point.title}</h3>
                    <p className="text-white/65 leading-relaxed">{point.text}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="min-w-0"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="max-w-md mx-auto"
            >
              <PictureImage
                src="/brand/isotipo.png"
                alt="Isotipo de Kitsunova"
                width={300}
                height={280}
                className="w-full h-auto object-contain drop-shadow-[0_18px_38px_rgba(0,0,0,0.45)]"
              />
            </motion.div>

            <Grid cols={1} gap="sm" className="mt-8 space-y-3">
              {landingSupportCards.map((card) => (
                <Card key={card.title} variant="panel" className="p-4">
                  <h4 className="font-bold text-white mb-1">{card.title}</h4>
                  <p className="text-white/60 text-sm leading-relaxed">{card.text}</p>
                </Card>
              ))}
            </Grid>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
