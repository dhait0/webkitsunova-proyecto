-- RLS: User
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own user"
  ON "User" FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own user"
  ON "User" FOR UPDATE
  USING (auth.uid() = id);

-- RLS: Profile
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON "Profile" FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON "Profile" FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON "Profile" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS: PsychologistProfile
ALTER TABLE "PsychologistProfile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychologists can read own profile"
  ON "PsychologistProfile" FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM Profile WHERE id = profile_id));

CREATE POLICY "Psychologists can update own profile"
  ON "PsychologistProfile" FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM Profile WHERE id = profile_id));

-- RLS: Session
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON "Session" FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON "Session" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON "Session" FOR DELETE
  USING (auth.uid() = user_id);
