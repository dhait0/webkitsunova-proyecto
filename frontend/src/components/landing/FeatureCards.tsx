import { motion } from 'framer-motion';
import { Card, CardImage, Grid, Container, Section, Badge } from '@/components/ui';
import { landingFeatureCards } from '@/content/siteContent';

interface FeatureCardsProps {
  title?: string;
  subtitle?: string;
  variant?: 'feature' | 'benefit';
}

export function FeatureCards({ title, subtitle, variant = 'feature' }: FeatureCardsProps) {
  const cards = landingFeatureCards;

  return (
    <Section padding="lg" background="none" divider="none" className="relative">
      <Container size="lg">
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            {title && (
              <Badge variant="label" color="accent" size="sm" className="mb-4 inline-block">
                {variant === 'feature' ? 'Características' : 'Beneficios'}
              </Badge>
            )}
            {title && (
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-white/70 text-lg leading-relaxed">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        <Grid cols={3} gap="lg" stagger={0.15}>
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -6, scale: 1.01, transition: { duration: 0.2 } }}
            >
              <Card variant={variant} hover className="h-full">
                <CardImage src={card.image} alt={card.title} ratio="4/3" radius="xl" className="mb-5" />
                <h3 className="text-xl font-bold mb-3 text-white text-center">{card.title}</h3>
                <p className="text-white/60 leading-relaxed text-center">{card.text}</p>
              </Card>
            </motion.div>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}