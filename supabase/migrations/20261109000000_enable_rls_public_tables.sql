-- Closes the Supabase Data API (PostgREST) to the application tables.
--
-- The application reaches the database only through Prisma, which connects as
-- a role that bypasses RLS, so enabling RLS without policies changes nothing for
-- it. Without RLS, the publishable (anon) key can read these tables over
-- /rest/v1: verified against the production project, where the "User" table
-- answered an anonymous request.
--
-- Additive and reversible: it neither drops nor alters data.
-- Rollback: ALTER TABLE "<name>" DISABLE ROW LEVEL SECURITY; and re-GRANT.

ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AvailabilitySlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Habit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MessageRead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationPreference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PatientReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PsyPatient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PsyReferral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PsychologistProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workshop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkshopEnrollment" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "Appointment" FROM anon, authenticated;
REVOKE ALL ON TABLE "AvailabilitySlot" FROM anon, authenticated;
REVOKE ALL ON TABLE "Conversation" FROM anon, authenticated;
REVOKE ALL ON TABLE "ConversationMember" FROM anon, authenticated;
REVOKE ALL ON TABLE "Habit" FROM anon, authenticated;
REVOKE ALL ON TABLE "Message" FROM anon, authenticated;
REVOKE ALL ON TABLE "MessageRead" FROM anon, authenticated;
REVOKE ALL ON TABLE "Notification" FROM anon, authenticated;
REVOKE ALL ON TABLE "NotificationPreference" FROM anon, authenticated;
REVOKE ALL ON TABLE "PatientReport" FROM anon, authenticated;
REVOKE ALL ON TABLE "Profile" FROM anon, authenticated;
REVOKE ALL ON TABLE "PsyPatient" FROM anon, authenticated;
REVOKE ALL ON TABLE "PsyReferral" FROM anon, authenticated;
REVOKE ALL ON TABLE "PsychologistProfile" FROM anon, authenticated;
REVOKE ALL ON TABLE "Resource" FROM anon, authenticated;
REVOKE ALL ON TABLE "Review" FROM anon, authenticated;
REVOKE ALL ON TABLE "Session" FROM anon, authenticated;
REVOKE ALL ON TABLE "User" FROM anon, authenticated;
REVOKE ALL ON TABLE "Workshop" FROM anon, authenticated;
REVOKE ALL ON TABLE "WorkshopEnrollment" FROM anon, authenticated;
