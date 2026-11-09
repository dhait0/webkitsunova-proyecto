-- Remembers that an administrator rejected a psychologist's application, so the
-- admin list can tell "rejected" from "pending" and the psychologist can be told.
-- Additive: existing rows keep NULL (never rejected). Rollback: DROP COLUMN.
ALTER TABLE "PsychologistProfile" ADD COLUMN "rejectedAt" TIMESTAMP(3);
