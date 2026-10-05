export type RegisterRole = 'USER' | 'PSYCHOLOGIST';

export const fieldNav = [
  { id: 'proceso', label: 'El proceso' },
  { id: 'recorrido', label: 'El recorrido' },
  { id: 'acompanante', label: 'El acompañante' },
  { id: 'que-obtienes', label: 'Qué obtienes' },
  { id: 'app', label: 'La app' }
] as const;

export const fieldCover = {
  title: 'Hábitos que se registran, y una persona cuando dejan de bastar',
  lede: 'Kitsunova anota lo que haces cada día, te devuelve lo que ve en esa anotación y abre la puerta a un psicólogo en el momento en que la automatización deja de servir. El acompañamiento es el proceso completo, no una función suelta.',
  primaryAction: 'Crear mi cuenta',
  secondaryAction: 'Ver un ejemplo de registro'
} as const;

export const fieldEntryPage = {
  stamp: 'Ejemplo de una entrada',
  title: 'Un proceso se lee como una bitácora, no como una barra',
  lede: 'Así ve Kitsunova un proceso en curso. La automatización escribe la primera línea y solo marca el cambio cuando hace falta una persona.',
  rows: [
    {
      date: '12 mar',
      stage: 'Registro',
      note: 'Anota tres hábitos nuevos y los horarios en que se caen. Todavía no necesita a nadie.',
      escalated: false
    },
    {
      date: '26 mar',
      stage: 'Registro',
      note: 'El patrón se repite: el mismo hábito se cae los martes. Kitsunova propone un ajuste y lo deja abierto para que la persona decida.',
      escalated: false
    },
    {
      date: '09 abr',
      stage: 'Escalamiento',
      note: 'La anotación dice que esto ya no se resuelve solo. La ruta cambia y aparece un psicólogo.',
      escalated: true
    }
  ],
  escalation: 'Persona disponible el 09 abr',
  footnote:
    'Entrada de ejemplo. No son datos de una persona real: sirven para mostrar cómo se lee el proceso.'
} as const;

export const fieldStages = [
  {
    title: 'Se anota',
    text: 'Registras lo que haces y la hora en que lo haces. Sin puntajes y sin metas de rachas.'
  },
  {
    title: 'Se devuelve',
    text: 'La asistencia automatizada te muestra el patrón y propone un ajuste. La decisión sigue siendo tuya.'
  },
  {
    title: 'Se escala',
    text: 'Cuando el registro muestra que solo no alcanza, el chat con un psicólogo y la cita quedan a un paso.'
  }
] as const;

export const fieldCompanion = {
  title: 'El zorro crece con lo que aprendes, no con lo que coleccionas',
  lede: 'Las nueve colas son el registro de cuánto has entendido de tu propio proceso, no un premio por marcar casillas. Una cola aparece cuando una revisión se cierra de verdad, y ninguna se gana por racha.',
  tailsCut: 3,
  tailsTotal: 9
} as const;

export const fieldIndexRows = [
  {
    title: 'Hábitos con guía',
    text: 'Crea rutinas y recibe sugerencias automáticas que se ajustan a lo que registras.'
  },
  {
    title: 'Chat con psicólogos',
    text: 'Conversa con profesionales desde la misma cuenta cuando quieras escalar.'
  },
  {
    title: 'Citas y seguimiento',
    text: 'Agenda sesiones y revisa tu proceso por etapas, no por rachas.'
  },
  {
    title: 'Sesiones documentadas',
    text: 'Cada consulta queda anotada en tu registro, para que no tengas que repetir lo mismo.'
  }
] as const;

export const fieldApp = {
  title: 'Te acompaña donde estés',
  lede: 'La idea de la aplicación móvil sigue viva en el proyecto. Todavía no hay app publicada, y preferimos decírtelo a prometer una descarga que no existe.'
} as const;

export const fieldFooter = {
  promise: 'Hábitos, acompañamiento y atención psicológica en el mismo proceso.',
  quickLinks: [
    { label: 'El proceso', href: '#proceso' },
    { label: 'El recorrido', href: '#recorrido' },
    { label: 'El acompañante', href: '#acompanante' },
    { label: 'Qué obtienes', href: '#que-obtienes' },
    { label: 'La app', href: '#app' }
  ],
  areas: [{ label: 'Iniciar sesión', href: '/login' }]
} as const;

export const loginPage = {
  backLabel: 'Ir al inicio',
  headline: 'Accede a tus hábitos y a tu red de apoyo',
  lede:
    'Entra para revisar tu progreso, seguir tus rutinas, chatear con psicólogos y agendar citas desde una sola cuenta.',
  highlights: [
    { strong: 'Seguimiento', text: 'Rutinas y hábitos activos' },
    { strong: 'Chat', text: 'Contacta apoyo profesional' },
    { strong: 'Citas', text: 'Escala cuando sea necesario' }
  ],
  heroTitle: 'Hábitos, chat y citas',
  heroSpan: 'cuando lo necesites',
  heroCopy:
    'Sigue tu proceso con seguimiento automatizado y apoyo profesional disponible en el momento adecuado.',
  panels: [
    {
      label: 'Qué obtienes',
      text: 'Un acceso limpio a tu progreso, conversaciones y agenda profesional.'
    },
    {
      label: 'Cuándo escalar',
      text: 'Si el hábito necesita intervención humana, el sistema te dirige a un psicólogo.'
    }
  ]
} as const;

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
