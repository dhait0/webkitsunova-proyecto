export type RegisterRole = 'USER' | 'PSYCHOLOGIST';

/**
 * Landing sections in reading order. The header anchors and the section ids in
 * HomePage both derive from this list, so a link can never point at a missing
 * anchor again.
 */
export const siteNavigation = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'nosotros', label: 'Sobre nosotros' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'solucion', label: 'Solución' },
  { id: 'app', label: 'App' },
] as const;

export const aboutSection = {
  badge: 'Quiénes somos',
  title: 'Kitsunova acompaña el cambio de hábitos con tecnología y profesionales',
  lead: 'Somos una plataforma de acompañamiento que combina seguimiento automatizado y apoyo psicológico en un mismo proceso, para que la persona no tenga que decidir sola cuándo necesita ayuda.',
  points: [
    {
      title: 'Para quién es',
      text: 'Personas que quieren construir hábitos sostenibles con una guía clara y sin quedar atrapadas en la automatización.'
    },
    {
      title: 'Qué resolvemos',
      text: 'La duda de saber cuándo insistir con el hábito y cuándo pedir ayuda profesional, y el vacío entre una app y una consulta.'
    },
    {
      title: 'Cómo lo hacemos',
      text: 'Una ruta por etapas: seguimiento diario, asistencia automatizada y escalamiento a chat o cita con psicólogos.'
    }
  ]
} as const;

export const landingFeatureCards = [
  {
    image: '/brand/lista.png',
    imageWidth: 800,
    imageHeight: 533,
    title: 'Hábitos guiados',
    text: 'Crea rutinas, recibe sugerencias automáticas y sigue tu avance diario con claridad.'
  },
  {
    image: '/brand/zorro-c.png',
    imageWidth: 800,
    imageHeight: 533,
    title: 'Chat con psicólogos',
    text: 'Cuando necesites apoyo humano, conversa con profesionales desde una misma plataforma.'
  },
  {
    image: '/brand/evolucion.png',
    imageWidth: 800,
    imageHeight: 533,
    title: 'Citas y seguimiento',
    text: 'Agenda sesiones, revisa tu progreso y continúa tu proceso con acompañamiento real.'
  }
] as const;

export const landingBenefitCards = [
  {
    image: '/brand/isotipo.png',
    imageWidth: 300,
    imageHeight: 280,
    title: 'Acompañamiento emocional',
    text: 'Tu avance no depende solo de la automatización: también cuenta el apoyo humano cuando haga falta.'
  },
  {
    image: '/brand/zorro-r.png',
    imageWidth: 1024,
    imageHeight: 1024,
    title: 'Rutinas inteligentes',
    text: 'Recibe recordatorios, seguimiento y metas ajustadas a tu comportamiento y objetivos.'
  },
  {
    image: '/brand/zorro-c.png',
    imageWidth: 800,
    imageHeight: 533,
    title: 'Atención integral',
    text: 'Hábitos, chat y citas con psicólogos en un solo lugar, sin perder el foco del proceso.'
  }
] as const;

export const landingStats = [
  { label: 'Seguimiento', value: '24/7', detail: 'Rutinas automáticas y recordatorios' },
  { label: 'Acompañamiento', value: 'Chat', detail: 'Con psicólogos cuando haga falta' },
  { label: 'Agenda', value: 'Citas', detail: 'Sesiones desde el mismo flujo' }
] as const;

export const landingJourneySteps = [
  {
    number: '01',
    title: 'Observa tu rutina',
    text: 'La app detecta patrones, organiza hábitos y te muestra tu progreso con claridad.'
  },
  {
    number: '02',
    title: 'Recibe guía',
    text: 'La asistencia automatizada propone ajustes, recordatorios y pequeños objetivos.'
  },
  {
    number: '03',
    title: 'Escala a apoyo humano',
    text: 'Si necesitas más ayuda, entras al chat con psicólogos o agendas una cita.'
  }
] as const;

export const landingSupportCards = [
  {
    title: 'Seguimiento inteligente',
    text: 'Paneles de hábitos, progreso y alertas para que el usuario no pierda contexto.'
  },
  {
    title: 'Atención escalable',
    text: 'Desde automatización básica hasta soporte psicológico, sin saltos de experiencia.'
  }
] as const;

export const dashboardSidebarItems = [
  { label: 'Inicio', code: 'IN', to: '/dashboard', end: true },
  { label: 'Hábitos', code: 'HB', to: '/dashboard/habitos' },
  { label: 'Chats', code: 'CH', to: '/dashboard/chats' },
  { label: 'Citas', code: 'CT', to: '/dashboard/citas' },
  { label: 'Psicólogos', code: 'PS', to: '/dashboard/psicologos' }
] as const;

/** Sidebar of the psychologist area (Mockups Psy 0/15/18). */
export const psySidebarItems = [
  { label: 'Inicio', code: 'IN', to: '/psy', end: true },
  { label: 'Talleres', code: 'TA', to: '/psy/talleres' },
  { label: 'Recursos', code: 'RE', to: '/psy/recursos' },
  { label: 'Mensajes', code: 'ME', to: '/psy/mensajes' },
  { label: 'Configuración', code: 'CO', to: '/psy/configuracion' }
] as const;

/** Secondary links reachable from the psychologist dashboard (Mockups Psy 0/1). */
export const psySecondaryItems = [
  { label: 'Pacientes', code: 'PA', to: '/psy/pacientes' },
  { label: 'Sesiones de hoy', code: 'HO', to: '/psy/sesiones/hoy' },
  { label: 'Próximas sesiones', code: 'PR', to: '/psy/sesiones' },
  { label: 'Derivaciones', code: 'DE', to: '/psy/derivaciones' },
  { label: 'Notificaciones', code: 'NO', to: '/psy/notificaciones' },
  { label: 'Mi perfil profesional', code: 'MF', to: '/psy/perfil' }
] as const;

export const psyFocusAreaLabels: Record<string, string> = {
  ANXIETY: 'Ansiedad',
  DEPRESSION: 'Depresión',
  STRESS: 'Estrés',
  PRODUCTIVITY: 'Productividad',
  MINDFULNESS: 'Mindfulness',
  SELF_ESTEEM: 'Autoestima',
  TRAUMA_PTSD: 'Trauma y PTSD',
  COUPLES: 'Terapia de pareja',
  FAMILY: 'Terapia familiar',
  EATING_DISORDERS: 'Trastornos alimentarios',
  ADDICTION: 'Adicciones',
  SLEEP: 'Sueño',
  OTHER: 'Otra'
};

export const psyResourceTypeLabels: Record<string, string> = {
  ARTICLE: 'Artículo',
  PDF: 'PDF',
  EXERCISE: 'Ejercicio',
  VIDEO: 'Video'
};

export const psyAppointmentStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Realizada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió'
};

export const psyContentStatusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente de aprobación',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado'
};

export const psyWeekdayLabels: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo'
};

export const dashboardQuickActions = [
  {
    title: 'Revisar hábitos',
    text: 'Mira el estado de tus rutinas y marca lo que ya completaste.',
    to: '/dashboard/habitos'
  },
  {
    title: 'Abrir chat',
    text: 'Retoma conversaciones activas con tu equipo de apoyo.',
    to: '/dashboard/chats'
  },
  {
    title: 'Gestionar citas',
    text: 'Consulta la agenda y reserva una sesión cuando el caso lo requiera.',
    to: '/dashboard/citas'
  }
] as const;

export const dashboardHabitRows = [
  {
    label: 'Sueño',
    detail: 'Bloquea pantallas antes de dormir y completa tu rutina nocturna.',
    progress: 82,
    status: 'Estable'
  },
  {
    label: 'Movimiento',
    detail: 'Camina 20 minutos y registra pausas activas durante el día.',
    progress: 64,
    status: 'En curso'
  },
  {
    label: 'Respiración',
    detail: 'Usa la herramienta de pausa guiada cuando suba el nivel de estrés.',
    progress: 91,
    status: 'Muy bien'
  }
] as const;

export const dashboardChatThreads = [
  {
    name: 'Dra. Laura Gómez',
    role: 'Psicóloga clínica',
    lastMessage: 'Revisé tu seguimiento de esta semana. Sigue así y te propongo un ajuste.',
    status: 'Responde hoy'
  },
  {
    name: 'Equipo de hábitos',
    role: 'Asistencia automatizada',
    lastMessage: 'Tu alerta de mañana está lista y el siguiente hábito quedó priorizado.',
    status: 'Automático'
  },
  {
    name: 'Dr. Andrés Prieto',
    role: 'Psicólogo de apoyo',
    lastMessage: 'Podemos agendar un espacio breve si quieres profundizar en la mañana.',
    status: 'Disponible'
  }
] as const;

export const dashboardAppointmentCards = [
  {
    label: 'Próxima cita',
    title: 'Jueves 16:00',
    text: 'Sesión de seguimiento para revisar sueño, foco y carga emocional.',
    status: 'Confirmada'
  },
  {
    label: 'Reserva rápida',
    title: 'Consulta disponible',
    text: 'Agenda una conversación cuando el acompañamiento automatizado no sea suficiente.',
    status: '24/7'
  }
] as const;

export const dashboardPsychologistCards = [
  {
    name: 'Dra. Laura Gómez',
    specialty: 'Ansiedad y hábitos',
    mode: 'Videollamada y chat',
    availability: 'Hoy 15:00 - 19:00'
  },
  {
    name: 'Dr. Andrés Prieto',
    specialty: 'Acompañamiento conductual',
    mode: 'Sesiones breves',
    availability: 'Mañana 09:00 - 13:00'
  },
  {
    name: 'Dra. Sofía Herrera',
    specialty: 'Sueño y regulación emocional',
    mode: 'Online',
    availability: 'Miércoles y viernes'
  }
] as const;

export const dashboardStatusItems = [
  { label: 'Rutina', value: '78%', progress: 78 },
  { label: 'Enfoque', value: '64%', progress: 64 },
  { label: 'Sueño', value: '82%', progress: 82 },
  { label: 'Ánimo', value: '91%', progress: 91 }
] as const;

export const dashboardActivityItems = [
  {
    title: 'Revisión de hábitos',
    text: 'Hoy registraste 4 acciones completadas y 1 pendiente.'
  },
  {
    title: 'Conversación pendiente',
    text: 'Un psicólogo respondió tu mensaje y espera continuidad.'
  },
  {
    title: 'Próxima cita',
    text: 'Tienes una sesión agendada para el jueves a las 16:00.'
  }
] as const;

export const dashboardFocusItems = [
  {
    title: 'Prioridad del día',
    text: 'Reducir procrastinación en la franja de la mañana.'
  },
  {
    title: 'Siguiente acción',
    text: 'Abrir el chat y confirmar el seguimiento semanal.'
  }
] as const;
