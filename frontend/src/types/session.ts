export type SessionProfile = {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
};

export type SessionUser = {
  id: string;
  email: string;
  role: string;
  status?: string;
  profile?: SessionProfile | null;
};
