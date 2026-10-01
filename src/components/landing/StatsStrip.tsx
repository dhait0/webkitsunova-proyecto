import { motion } from 'framer-motion';
import { Card, Badge, Grid, Container, Flex, Section } from '@/components/ui';
import { landingStats } from '@/content/siteContent';

export function StatsStrip() {
  return (
    <Section padding="md" background="none" divider="none" reveal={false} className="relative">
      <Container size="lg">
        <Grid cols={3} gap="md" stagger={0.1}>
          {landingStats.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
            >
              <Card variant="metric" hover className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent-2/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <Badge variant="label" color="accent" size="sm" className="mb-3">
                    {item.label}
                  </Badge>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: index * 0.1 + 0.2 }}
                    className="text-4xl sm:text-5xl font-extrabold text-gradient mb-2"
                  >
                    {item.value}
                  </motion.div>
                  <p className="text-white/60 text-sm leading-relaxed">{item.detail}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}