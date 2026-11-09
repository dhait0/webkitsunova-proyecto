-- Habit tracking: a weekly goal per habit and one row per day a habit was done.
--
-- Additive. Existing habits keep every column; they get the default goal of 7
-- days per week and start with no logged days (history cannot be invented).
-- Rollback: DROP TABLE "HabitLog"; ALTER TABLE "Habit" DROP COLUMN "targetPerWeek";

ALTER TABLE "Habit" ADD COLUMN "targetPerWeek" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_targetPerWeek_check" CHECK ("targetPerWeek" BETWEEN 1 AND 7);

-- CreateTable
CREATE TABLE "HabitLog" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitLog_pkey" PRIMARY KEY ("id")
);

-- One completion per habit and day, enforced by the database.
CREATE UNIQUE INDEX "HabitLog_habitId_date_key" ON "HabitLog"("habitId", "date");
CREATE INDEX "HabitLog_userId_date_idx" ON "HabitLog"("userId", "date");

ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE;
ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Same policy as every other public table: closed to the Data API, reached
-- only through Prisma (see 20261109000000_enable_rls_public_tables.sql).
ALTER TABLE "HabitLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "HabitLog" FROM anon, authenticated;
