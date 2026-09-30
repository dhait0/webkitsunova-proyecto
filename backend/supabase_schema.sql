-- === SCHEMA COMBINADO PARA SUPABASE SQL EDITOR ===
-- Ejecuta este SQL directamente en https://supabase.com/dashboard → SQL Editor
-- Incluye todas las migraciones de Prisma + políticas RLS

-- ===== MIGRACIÓN INICIAL (1726592000000_init) =====
CREATE TYPE "Role" AS ENUM ('USER', 'PSYCHOLOGIST', 'ADMIN');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "timezone" TEXT,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PsychologistProfile" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sessionPrice" INTEGER,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "patientsCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PsychologistProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");
CREATE UNIQUE INDEX "PsychologistProfile_profileId_key" ON "PsychologistProfile"("profileId");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsychologistProfile" ADD CONSTRAINT "PsychologistProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===== MIGRACIÓN PSY MODULE (20260930010000_psy_module) =====
CREATE TYPE "FocusArea" AS ENUM ('ANXIETY', 'DEPRESSION', 'STRESS', 'PRODUCTIVITY', 'MINDFULNESS', 'SELF_ESTEEM', 'TRAUMA_PTSD', 'COUPLES', 'FAMILY', 'EATING_DISORDERS', 'ADDICTION', 'SLEEP', 'OTHER');
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ResourceType" AS ENUM ('ARTICLE', 'PDF', 'EXERCISE', 'VIDEO');
CREATE TYPE "AppointmentType" AS ENUM ('FIRST_SESSION', 'FOLLOW_UP', 'URGENT');
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "PatientLinkStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

ALTER TABLE "PsychologistProfile" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "PsychologistProfile" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "PsychologistProfile" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'COP';
ALTER TABLE "PsychologistProfile" ADD COLUMN "isAcceptingNew" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PsychologistProfile" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PsyPatient" (
    "id" TEXT NOT NULL,
    "psychologistId" TEXT NOT NULL,
    "patientUserId" TEXT NOT NULL,
    "status" "PatientLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PsyPatient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "psychologistId" TEXT NOT NULL,
    "patientUserId" TEXT NOT NULL,
    "type" "AppointmentType" NOT NULL DEFAULT 'FOLLOW_UP',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "patientNote" TEXT,
    "psyNote" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "blockedByUserId" TEXT,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationMember" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Workshop" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverUrl" TEXT,
    "focusArea" "FocusArea" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "status" "ContentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkshopEnrollment" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkshopEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverUrl" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "readingMins" INTEGER,
    "focusArea" "FocusArea",
    "status" "ContentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientReport" (
    "id" TEXT NOT NULL,
    "psychologistId" TEXT NOT NULL,
    "patientUserId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "summary" TEXT NOT NULL,
    "moodScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PatientReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreference" (
    "userId" TEXT NOT NULL,
    "newAppointments" BOOLEAN NOT NULL DEFAULT true,
    "newMessages" BOOLEAN NOT NULL DEFAULT true,
    "patientReports" BOOLEAN NOT NULL DEFAULT true,
    "moodAlerts" BOOLEAN NOT NULL DEFAULT true,
    "platformNews" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "PsyReferral" (
    "id" TEXT NOT NULL,
    "fromPsychologistId" TEXT NOT NULL,
    "toPsychologistId" TEXT NOT NULL,
    "patientUserId" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    CONSTRAINT "PsyReferral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "psyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- Indices
CREATE INDEX "AvailabilitySlot_profileId_weekday_idx" ON "AvailabilitySlot"("profileId", "weekday");
CREATE INDEX "PsyPatient_patientUserId_status_idx" ON "PsyPatient"("patientUserId", "status");
CREATE INDEX "PsyPatient_psychologistId_status_idx" ON "PsyPatient"("psychologistId", "status");
CREATE UNIQUE INDEX "PsyPatient_psychologistId_patientUserId_key" ON "PsyPatient"("psychologistId", "patientUserId");
CREATE INDEX "Appointment_psychologistId_startsAt_idx" ON "Appointment"("psychologistId", "startsAt");
CREATE INDEX "Appointment_patientUserId_startsAt_idx" ON "Appointment"("patientUserId", "startsAt");
CREATE INDEX "Appointment_psychologistId_status_idx" ON "Appointment"("psychologistId", "status");
CREATE INDEX "ConversationMember_userId_lastReadAt_idx" ON "ConversationMember"("userId", "lastReadAt");
CREATE UNIQUE INDEX "ConversationMember_conversationId_userId_key" ON "ConversationMember"("conversationId", "userId");
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON "MessageRead"("messageId", "userId");
CREATE INDEX "Workshop_authorId_status_idx" ON "Workshop"("authorId", "status");
CREATE INDEX "Workshop_status_startsAt_idx" ON "Workshop"("status", "startsAt");
CREATE UNIQUE INDEX "WorkshopEnrollment_workshopId_userId_key" ON "WorkshopEnrollment"("workshopId", "userId");
CREATE INDEX "Resource_authorId_status_idx" ON "Resource"("authorId", "status");
CREATE INDEX "Resource_status_type_idx" ON "Resource"("status", "type");
CREATE INDEX "PatientReport_psychologistId_patientUserId_idx" ON "PatientReport"("psychologistId", "patientUserId");
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "PsyReferral_fromPsychologistId_status_idx" ON "PsyReferral"("fromPsychologistId", "status");
CREATE INDEX "PsyReferral_toPsychologistId_status_idx" ON "PsyReferral"("toPsychologistId", "status");
CREATE INDEX "PsyReferral_patientUserId_status_idx" ON "PsyReferral"("patientUserId", "status");
CREATE INDEX "Review_psyId_createdAt_idx" ON "Review"("psyId", "createdAt");
CREATE UNIQUE INDEX "Review_psyId_userId_key" ON "Review"("psyId", "userId");

-- Foreign Keys
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsyPatient" ADD CONSTRAINT "PsyPatient_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsyPatient" ADD CONSTRAINT "PsyPatient_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Workshop" ADD CONSTRAINT "Workshop_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkshopEnrollment" ADD CONSTRAINT "WorkshopEnrollment_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkshopEnrollment" ADD CONSTRAINT "WorkshopEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PatientReport" ADD CONSTRAINT "PatientReport_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PatientReport" ADD CONSTRAINT "PatientReport_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsyReferral" ADD CONSTRAINT "PsyReferral_fromPsychologistId_fkey" FOREIGN KEY ("fromPsychologistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsyReferral" ADD CONSTRAINT "PsyReferral_toPsychologistId_fkey" FOREIGN KEY ("toPsychologistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_psyId_fkey" FOREIGN KEY ("psyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===== RLS POLICIES =====
-- User
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own user" ON "User" FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own user" ON "User" FOR UPDATE USING (auth.uid()::text = id);

-- Profile
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON "Profile" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Users can update own profile" ON "Profile" FOR UPDATE USING (auth.uid()::text = "userId");
CREATE POLICY "Users can insert own profile" ON "Profile" FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- PsychologistProfile
ALTER TABLE "PsychologistProfile" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Psychologists can read own profile" ON "PsychologistProfile" FOR SELECT USING (auth.uid()::text = (SELECT "userId" FROM "Profile" WHERE id = "profileId"));
CREATE POLICY "Psychologists can update own profile" ON "PsychologistProfile" FOR UPDATE USING (auth.uid()::text = (SELECT "userId" FROM "Profile" WHERE id = "profileId"));

-- Session
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own sessions" ON "Session" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Users can insert own sessions" ON "Session" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Users can delete own sessions" ON "Session" FOR DELETE USING (auth.uid()::text = "userId");

-- ===== INSERT ADMIN USER SYNCHRONIZED WITH SUPABASE AUTH =====
-- ID real del usuario admin en Supabase Auth: 0cd92849-9588-4d4d-aec5-f5d66b8502fa
INSERT INTO "User" ("id", "email", "passwordHash", "role", "status", "createdAt", "updatedAt")
VALUES ('0cd92849-9588-4d4d-aec5-f5d66b8502fa', 'admin@kitsunova.local', '', 'ADMIN', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET
    "role" = 'ADMIN',
    "status" = 'ACTIVE';

INSERT INTO "Profile" ("id", "userId", "username", "firstName", "lastName", "createdAt", "updatedAt")
VALUES ('profile-0cd92849', '0cd92849-9588-4d4d-aec5-f5d66b8502fa', 'admin', 'Admin', 'Kitsunova', NOW(), NOW())
ON CONFLICT ("userId") DO NOTHING;
