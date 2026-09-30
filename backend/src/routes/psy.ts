import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  getPsychologistContext,
  requireApprovedPsychologist,
} from '../middleware/requireApprovedPsychologist.js';
import {
  getDashboard,
  getPatientDetail,
  listPatients,
} from '../services/psy/dashboard.service.js';
import {
  AppointmentConflictError,
  createAppointment,
  createPatientReport,
  getAppointment,
  listAppointments,
  saveAppointmentNote,
  updateAppointmentStatus,
} from '../services/psy/appointments.service.js';
import {
  createWorkshop,
  deleteWorkshop,
  getWorkshop,
  listWorkshopEnrollments,
  listWorkshops,
  updateWorkshop,
} from '../services/psy/workshops.service.js';
import {
  createResource,
  deleteResource,
  getResource,
  listResources,
  updateResource,
} from '../services/psy/resources.service.js';
import {
  getProfessionalProfile,
  replaceAvailability,
  updateProfessionalProfile,
} from '../services/psy/profile.service.js';
import {
  blockConversation,
  createGroupConversation,
  listConversations,
  listMessages,
  sendMessage,
  startDirectConversation,
} from '../services/psy/messaging.service.js';
import {
  getPreferences,
  listNotifications,
  markAllRead,
  markRead,
  updatePreferences,
} from '../services/psy/notifications.service.js';
import {
  createReferral,
  listColleagues,
  listReferrals,
  respondToReferral,
} from '../services/psy/referrals.service.js';

const psyRouter = Router();

const FOCUS_AREAS = [
  'ANXIETY',
  'DEPRESSION',
  'STRESS',
  'PRODUCTIVITY',
  'MINDFULNESS',
  'SELF_ESTEEM',
  'TRAUMA_PTSD',
  'COUPLES',
  'FAMILY',
  'EATING_DISORDERS',
  'ADDICTION',
  'SLEEP',
  'OTHER',
] as const;

const RESOURCE_TYPES = ['ARTICLE', 'PDF', 'EXERCISE', 'VIDEO'] as const;

const hhmmToMinutes = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)')
  .transform((value) => {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  });

const profileSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().max(30).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  birthDate: z.coerce.date().nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  specialties: z.array(z.string().min(1).max(60)).max(12).optional(),
  sessionPrice: z.number().int().min(0).max(100_000_000).nullable().optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  isAcceptingNew: z.boolean().optional(),
});

const availabilitySchema = z.object({
  slots: z
    .array(
      z.object({
        weekday: z.number().int().min(1).max(7),
        start: hhmmToMinutes,
        end: hhmmToMinutes,
        enabled: z.boolean(),
      }),
    )
    .max(7),
});

const workshopSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(4000),
  coverUrl: z.string().url().nullable().optional(),
  focusArea: z.enum(FOCUS_AREAS),
  startsAt: z.coerce.date(),
  durationHours: z.number().min(0.5).max(24),
  capacity: z.number().int().min(1).max(1000),
  priceCents: z.number().int().min(0).max(100_000_000),
  currency: z.string().length(3).toUpperCase().optional(),
});

const workshopPatchSchema = workshopSchema.partial();

const resourceSchema = z.object({
  type: z.enum(RESOURCE_TYPES),
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(4000),
  coverUrl: z.string().url().nullable().optional(),
  fileUrl: z.string().url().nullable().optional(),
  fileName: z.string().max(200).nullable().optional(),
  readingMins: z.number().int().min(1).max(6000).nullable().optional(),
  focusArea: z.enum(FOCUS_AREAS).nullable().optional(),
});

const resourcePatchSchema = resourceSchema.partial();

const appointmentSchema = z.object({
  patientUserId: z.string().min(1),
  type: z.enum(['FIRST_SESSION', 'FOLLOW_UP', 'URGENT']),
  startsAt: z.coerce.date(),
  durationMinutes: z.number().int().min(15).max(480),
  reason: z.string().max(500).nullable().optional(),
  patientNote: z.string().max(2000).nullable().optional(),
});

const appointmentStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  cancelReason: z.string().max(500).nullable().optional(),
});

const appointmentNoteSchema = z.object({ psyNote: z.string().max(4000) });

const patientReportSchema = z.object({
  patientUserId: z.string().min(1),
  appointmentId: z.string().nullable().optional(),
  summary: z.string().min(3).max(4000),
  moodScore: z.number().int().min(1).max(10).nullable().optional(),
});

const messageSchema = z.object({
  body: z.string().min(1).max(4000),
  attachmentUrl: z.string().url().nullable().optional(),
  attachmentName: z.string().max(200).nullable().optional(),
});

const groupSchema = z.object({
  title: z.string().min(1).max(120),
  participantIds: z.array(z.string().min(1)).min(1).max(50),
});

const directSchema = z.object({ participantId: z.string().min(1) });

const preferencesSchema = z.object({
  newAppointments: z.boolean().optional(),
  newMessages: z.boolean().optional(),
  patientReports: z.boolean().optional(),
  moodAlerts: z.boolean().optional(),
  platformNews: z.boolean().optional(),
});

const referralSchema = z.object({
  toPsychologistId: z.string().min(1),
  patientUserId: z.string().min(1),
  note: z.string().max(1000).nullable().optional(),
});

const referralResponseSchema = z.object({ status: z.enum(['ACCEPTED', 'DECLINED']) });

psyRouter.use(requireAuth);
psyRouter.use(requireRole('PSYCHOLOGIST'));
psyRouter.use(requireApprovedPsychologist());

// --- Dashboard -------------------------------------------------------------

psyRouter.get('/dashboard', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    return res.json(await getDashboard(userId));
  } catch (error) {
    return next(error);
  }
});

// --- Professional profile --------------------------------------------------

psyRouter.get('/profile', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    return res.json(await getProfessionalProfile(userId));
  } catch (error) {
    return next(error);
  }
});

psyRouter.patch('/profile', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = profileSchema.parse(req.body);
    const result = await updateProfessionalProfile(userId, payload);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

psyRouter.put('/profile/availability', async (req, res, next) => {
  try {
    const { profileId } = getPsychologistContext(res);
    const payload = availabilitySchema.parse(req.body);
    const slots = await replaceAvailability(
      profileId,
      payload.slots.map((slot) => ({
        weekday: slot.weekday,
        startMinutes: slot.start,
        endMinutes: slot.end,
        enabled: slot.enabled,
      })),
    );

    return res.json({ success: true, slots });
  } catch (error) {
    return next(error);
  }
});

// --- Patients --------------------------------------------------------------

psyRouter.get('/patients', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    return res.json(await listPatients(userId, req.query as Record<string, unknown>));
  } catch (error) {
    return next(error);
  }
});

psyRouter.get('/patients/:userId', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const result = await getPatientDetail(userId, req.params.userId);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

psyRouter.post('/patients/reports', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = patientReportSchema.parse(req.body);
    const report = await createPatientReport(userId, payload);

    return res.status(201).json({
      success: true,
      report: {
        id: report.id,
        patientUserId: report.patientUserId,
        appointmentId: report.appointmentId,
        summary: report.summary,
        moodScore: report.moodScore,
        createdAt: report.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return res.status(409).json({ success: false, message: error.message });
    }

    return next(error);
  }
});

// --- Appointments ----------------------------------------------------------

psyRouter.get('/appointments', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    return res.json(await listAppointments(userId, req.query as Record<string, unknown>));
  } catch (error) {
    return next(error);
  }
});

psyRouter.get('/appointments/:id', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const result = await getAppointment(userId, req.params.id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Sesión no encontrada' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

psyRouter.post('/appointments', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = appointmentSchema.parse(req.body);
    const appointment = await createAppointment(userId, payload);

    return res.status(201).json({
      success: true,
      appointment: {
        id: appointment.id,
        patientUserId: appointment.patientUserId,
        startsAt: appointment.startsAt.toISOString(),
        endsAt: appointment.endsAt.toISOString(),
        type: appointment.type,
        status: appointment.status,
        reason: appointment.reason,
      },
    });
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return res.status(409).json({ success: false, message: error.message });
    }

    return next(error);
  }
});

psyRouter.patch('/appointments/:id/status', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = appointmentStatusSchema.parse(req.body);
    const appointment = await updateAppointmentStatus(
      userId,
      req.params.id,
      payload.status,
      payload.cancelReason,
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Sesión no encontrada' });
    }

    return res.json({
      success: true,
      message: 'Estado de la sesión actualizado',
      appointment: { id: appointment.id, status: appointment.status },
    });
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return res.status(409).json({ success: false, message: error.message });
    }

    return next(error);
  }
});

psyRouter.patch('/appointments/:id/note', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = appointmentNoteSchema.parse(req.body);
    const appointment = await saveAppointmentNote(userId, req.params.id, payload.psyNote);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Sesión no encontrada' });
    }

    return res.json({ success: true, message: 'Nota guardada' });
  } catch (error) {
    return next(error);
  }
});

// --- Workshops -------------------------------------------------------------

psyRouter.get('/workshops', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    return res.json(await listWorkshops(userId, req.query as Record<string, unknown>));
  } catch (error) {
    return next(error);
  }
});

psyRouter.post('/workshops', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = workshopSchema.parse(req.body);
    return res.status(201).json(await createWorkshop(userId, payload));
  } catch (error) {
    return next(error);
  }
});

psyRouter.get('/workshops/:id', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const result = await getWorkshop(userId, req.params.id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Taller no encontrado' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

psyRouter.patch('/workshops/:id', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = workshopPatchSchema.parse(req.body);
    const result = await updateWorkshop(userId, req.params.id, payload);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Taller no encontrado' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

psyRouter.delete('/workshops/:id', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const deleted = await deleteWorkshop(userId, req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Taller no encontrado' });
    }

    return res.json({ success: true, message: 'Taller eliminado' });
  } catch (error) {
    return next(error);
  }
});

psyRouter.get('/workshops/:id/enrollments', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const result = await listWorkshopEnrollments(userId, req.params.id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Taller no encontrado' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

// --- Resources -------------------------------------------------------------

psyRouter.get('/resources', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    return res.json(await listResources(userId, req.query as Record<string, unknown>));
  } catch (error) {
    return next(error);
  }
});

psyRouter.post('/resources', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = resourceSchema.parse(req.body);
    return res.status(201).json(await createResource(userId, payload));
  } catch (error) {
    return next(error);
  }
});

psyRouter.get('/resources/:id', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const result = await getResource(userId, req.params.id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

psyRouter.patch('/resources/:id', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = resourcePatchSchema.parse(req.body);
    const result = await updateResource(userId, req.params.id, payload);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

psyRouter.delete('/resources/:id', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const deleted = await deleteResource(userId, req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
    }

    return res.json({ success: true, message: 'Recurso eliminado' });
  } catch (error) {
    return next(error);
  }
});

// --- Messaging -------------------------------------------------------------

psyRouter.get('/conversations', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    return res.json(await listConversations(userId, req.query as Record<string, unknown>));
  } catch (error) {
    return next(error);
  }
});

psyRouter.post('/conversations', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = groupSchema.parse(req.body);
    const conversation = await createGroupConversation(userId, payload.title, payload.participantIds);

    return res.status(201).json({ success: true, conversation: { id: conversation.id } });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return next(error);
  }
});

psyRouter.post('/conversations/direct', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = directSchema.parse(req.body);
    const conversation = await startDirectConversation(userId, payload.participantId);

    return res.status(201).json({ success: true, conversation: { id: conversation.id } });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return next(error);
  }
});

psyRouter.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const result = await listMessages(userId, req.params.id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Conversación no encontrada' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

psyRouter.post('/conversations/:id/messages', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = messageSchema.parse(req.body);
    const result = await sendMessage(userId, req.params.id, payload);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Conversación no encontrada' });
    }

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return next(error);
  }
});

psyRouter.post('/conversations/:id/block', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const blocked = await blockConversation(userId, req.params.id);

    if (!blocked) {
      return res.status(404).json({ success: false, message: 'Conversación no encontrada' });
    }

    return res.json({ success: true, message: 'Conversación bloqueada' });
  } catch (error) {
    return next(error);
  }
});

// --- Notifications and preferences ----------------------------------------

psyRouter.get('/notifications', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    return res.json(await listNotifications(userId, req.query as Record<string, unknown>));
  } catch (error) {
    return next(error);
  }
});

psyRouter.post('/notifications/read-all', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    return res.json(await markAllRead(userId));
  } catch (error) {
    return next(error);
  }
});

psyRouter.post('/notifications/:id/read', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const read = await markRead(userId, req.params.id);

    if (!read) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }

    return res.json({ success: true, message: 'Notificación marcada como leída' });
  } catch (error) {
    return next(error);
  }
});

psyRouter.get('/preferences', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    return res.json(await getPreferences(userId));
  } catch (error) {
    return next(error);
  }
});

psyRouter.patch('/preferences', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = preferencesSchema.parse(req.body);
    return res.json(await updatePreferences(userId, payload));
  } catch (error) {
    return next(error);
  }
});

// --- Referrals (decision D3) ----------------------------------------------

psyRouter.get('/colleagues', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    return res.json(await listColleagues(userId));
  } catch (error) {
    return next(error);
  }
});

psyRouter.get('/referrals', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    return res.json(await listReferrals(userId, req.query as Record<string, unknown>));
  } catch (error) {
    return next(error);
  }
});

psyRouter.post('/referrals', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = referralSchema.parse(req.body);
    const result = await createReferral(userId, payload);

    if (result.duplicate) {
      return res.status(409).json({ success: false, message: 'Ya existe una derivación pendiente' });
    }

    return res.status(201).json({
      success: true,
      referral: { id: result.referral.id, status: result.referral.status },
      message: 'Derivación enviada. El paciente debe aceptarla.',
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return next(error);
  }
});

psyRouter.patch('/referrals/:id', async (req, res, next) => {
  try {
    const { userId } = getPsychologistContext(res);
    const payload = referralResponseSchema.parse(req.body);
    const referral = await respondToReferral(userId, req.params.id, payload.status);

    if (!referral) {
      return res.status(404).json({ success: false, message: 'Derivación no encontrada' });
    }

    return res.json({ success: true, message: 'Derivación respondida' });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(409).json({ success: false, message: error.message });
    }

    return next(error);
  }
});

export default psyRouter;
