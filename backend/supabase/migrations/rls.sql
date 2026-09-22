-- RLS: User
DROP POLICY IF EXISTS "Users can read own user" ON "User";
DROP POLICY IF EXISTS "Users can update own user" ON "User";
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own user"
  ON "User" FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own user"
  ON "User" FOR UPDATE
  USING (auth.uid()::text = id);

-- RLS: Profile
DROP POLICY IF EXISTS "Users can read own profile" ON "Profile";
DROP POLICY IF EXISTS "Users can update own profile" ON "Profile";
DROP POLICY IF EXISTS "Users can insert own profile" ON "Profile";
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON "Profile" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can update own profile"
  ON "Profile" FOR UPDATE
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own profile"
  ON "Profile" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- RLS: PsychologistProfile
DROP POLICY IF EXISTS "Psychologists can read own profile" ON "PsychologistProfile";
DROP POLICY IF EXISTS "Psychologists can update own profile" ON "PsychologistProfile";
ALTER TABLE "PsychologistProfile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychologists can read own profile"
  ON "PsychologistProfile" FOR SELECT
  USING (auth.uid()::text = (SELECT "userId" FROM "Profile" WHERE id = "profileId"));

CREATE POLICY "Psychologists can update own profile"
  ON "PsychologistProfile" FOR UPDATE
  USING (auth.uid()::text = (SELECT "userId" FROM "Profile" WHERE id = "profileId"));

-- RLS: Session
DROP POLICY IF EXISTS "Users can read own sessions" ON "Session";
DROP POLICY IF EXISTS "Users can insert own sessions" ON "Session";
DROP POLICY IF EXISTS "Users can delete own sessions" ON "Session";
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON "Session" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own sessions"
  ON "Session" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own sessions"
  ON "Session" FOR DELETE
  USING (auth.uid()::text = "userId");
