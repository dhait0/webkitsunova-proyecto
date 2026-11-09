/**
 * Decides which Supabase project a demo script may touch.
 *
 * Default: the Supabase API and the database must both resolve to this machine.
 * A remote project is accepted only when the caller allows it AND every one of
 * these holds, so a stray environment can never reach production by accident:
 *   - DEMO_REMOTE_PROJECT_REF names the project,
 *   - the API URL and DATABASE_URL both belong to that same project,
 *   - DEMO_REMOTE_CONFIRM equals "REPLACE-DEMO-DATA-<ref>".
 */
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

export type DemoTarget = {
  supabaseUrl: string;
  serviceKey: string;
  remote: boolean;
  projectRef: string | null;
};

function parse(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/** Project ref of `<ref>.supabase.co`, or null. */
function apiRef(url: URL): string | null {
  const match = /^([a-z0-9]{20})\.supabase\.co$/.exec(url.hostname);
  return match ? match[1] : null;
}

/** The ref appears in the pooler user (`postgres.<ref>`) or the direct host (`db.<ref>.supabase.co`). */
function databaseBelongsTo(databaseUrl: string, ref: string): boolean {
  const url = parse(databaseUrl);
  if (!url) return false;
  return decodeURIComponent(url.username).endsWith(`.${ref}`) || url.hostname === `db.${ref}.supabase.co`;
}

export function resolveDemoTarget(options: { allowRemote: boolean }): DemoTarget {
  const env = process.env;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? '';
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY ?? '';
  const databaseUrl = env.DATABASE_URL ?? '';

  if (!supabaseUrl || !serviceKey || !databaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL, the service key or DATABASE_URL.');
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to run with NODE_ENV=production.');
  }

  const api = parse(supabaseUrl);
  const db = parse(databaseUrl);
  if (!api || !db) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and DATABASE_URL must be valid URLs.');
  }

  if (LOCAL_HOSTS.has(api.hostname) && LOCAL_HOSTS.has(db.hostname)) {
    return { supabaseUrl, serviceKey, remote: false, projectRef: null };
  }

  if (!options.allowRemote) {
    throw new Error(
      `Refusing: API host "${api.hostname}" and database host "${db.hostname}" must both be local.`,
    );
  }

  const ref = env.DEMO_REMOTE_PROJECT_REF ?? '';
  if (!/^[a-z0-9]{20}$/.test(ref)) {
    throw new Error('Remote target requires DEMO_REMOTE_PROJECT_REF (the 20-character project ref).');
  }
  if (apiRef(api) !== ref) {
    throw new Error('The Supabase API URL does not belong to DEMO_REMOTE_PROJECT_REF.');
  }
  if (!databaseBelongsTo(databaseUrl, ref)) {
    throw new Error('DATABASE_URL does not belong to DEMO_REMOTE_PROJECT_REF.');
  }
  if (env.DEMO_REMOTE_CONFIRM !== `REPLACE-DEMO-DATA-${ref}`) {
    throw new Error(`Remote target requires DEMO_REMOTE_CONFIRM=REPLACE-DEMO-DATA-${ref}.`);
  }

  return { supabaseUrl, serviceKey, remote: true, projectRef: ref };
}
