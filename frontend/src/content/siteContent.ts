export type RegisterRole = 'USER' | 'PSYCHOLOGIST';

export const landingFeatureCards = [
  {
    image: '/brand/lista.png',
    title: 'Hábitos guiados',
    text: 'Crea rutinas, recibe sugerencias automáticas y sigue tu avance diario con claridad.'
  },
  {
    image: '/brand/zorro-c.png',
    title: 'Chat con psicólogos',
    text: 'Cuando necesites apoyo humano, conversa con profesionales desde una misma plataforma.'
  },
  {
    image: '/brand/evolucion.png',
    title: 'Citas y seguimiento',
    text: 'Agenda sesiones, revisa tu progreso y continúa tu proceso con acompañamiento real.'
  }
] as const;

export const landingBenefitCards = [
  {
    image: '/brand/isotipo.png',
    title: 'Acompañamiento emocional',
    text: 'Tu avance no depende solo de la automatización: también cuenta el apoyo humano cuando haga falta.'
  },
  {
    image: '/brand/zorro-r.png',
    title: 'Rutinas inteligentes',
    text: 'Recibe recordatorios, seguimiento y metas ajustadas a tu comportamiento y objetivos.'
  },
  {
    image: '/brand/zorro-c.png',
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
