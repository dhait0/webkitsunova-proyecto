import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveDemoTarget } from './demo-target';

const REF = 'abcdefghij0123456789';
const OTHER = 'zzzzzzzzzz9999999999';
const saved = { ...process.env };

function setEnv(values: Record<string, string | undefined>) {
  for (const key of [
    'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY',
    'DATABASE_URL', 'DEMO_REMOTE_PROJECT_REF', 'DEMO_REMOTE_CONFIRM', 'NODE_ENV',
  ]) delete process.env[key];
  Object.assign(process.env, values);
}

const localEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:55421',
  SUPABASE_SECRET_KEY: 'key',
  DATABASE_URL: 'postgresql://postgres:pw@127.0.0.1:55422/postgres',
};

const remoteEnv = {
  NEXT_PUBLIC_SUPABASE_URL: `https://${REF}.supabase.co`,
  SUPABASE_SECRET_KEY: 'key',
  DATABASE_URL: `postgres://postgres.${REF}:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  DEMO_REMOTE_PROJECT_REF: REF,
  DEMO_REMOTE_CONFIRM: `REPLACE-DEMO-DATA-${REF}`,
};

beforeEach(() => setEnv({}));
afterEach(() => {
  process.env = { ...saved };
});

describe('resolveDemoTarget — local', () => {
  it('accepts a fully local stack without any confirmation', () => {
    setEnv(localEnv);
    expect(resolveDemoTarget({ allowRemote: false })).toMatchObject({ remote: false, projectRef: null });
  });

  it('refuses a half-local setup (local API, remote database)', () => {
    setEnv({ ...localEnv, DATABASE_URL: remoteEnv.DATABASE_URL });
    expect(() => resolveDemoTarget({ allowRemote: true })).toThrow(/DEMO_REMOTE_PROJECT_REF|must both be local/);
    expect(() => resolveDemoTarget({ allowRemote: false })).toThrow('must both be local');
  });

  it('refuses NODE_ENV=production and missing variables', () => {
    setEnv({ ...localEnv, NODE_ENV: 'production' });
    expect(() => resolveDemoTarget({ allowRemote: false })).toThrow('NODE_ENV=production');
    setEnv({});
    expect(() => resolveDemoTarget({ allowRemote: false })).toThrow('Missing');
  });
});

describe('resolveDemoTarget — remote', () => {
  it('never reaches a remote project unless the caller allows it, whatever the environment says', () => {
    setEnv(remoteEnv);
    expect(() => resolveDemoTarget({ allowRemote: false })).toThrow('must both be local');
  });

  it('accepts a remote project only with ref, matching URLs and the exact confirmation', () => {
    setEnv(remoteEnv);
    expect(resolveDemoTarget({ allowRemote: true })).toMatchObject({ remote: true, projectRef: REF });
  });

  it('accepts the direct database host as well as the pooler user', () => {
    setEnv({ ...remoteEnv, DATABASE_URL: `postgresql://postgres:pw@db.${REF}.supabase.co:5432/postgres` });
    expect(resolveDemoTarget({ allowRemote: true }).remote).toBe(true);
  });

  it('refuses without the project ref or with a malformed one', () => {
    setEnv({ ...remoteEnv, DEMO_REMOTE_PROJECT_REF: undefined });
    expect(() => resolveDemoTarget({ allowRemote: true })).toThrow('DEMO_REMOTE_PROJECT_REF');
    setEnv({ ...remoteEnv, DEMO_REMOTE_PROJECT_REF: 'short' });
    expect(() => resolveDemoTarget({ allowRemote: true })).toThrow('DEMO_REMOTE_PROJECT_REF');
  });

  it('refuses when the API or the database belong to a different project', () => {
    setEnv({ ...remoteEnv, NEXT_PUBLIC_SUPABASE_URL: `https://${OTHER}.supabase.co` });
    expect(() => resolveDemoTarget({ allowRemote: true })).toThrow('API URL does not belong');

    setEnv({ ...remoteEnv, DATABASE_URL: `postgres://postgres.${OTHER}:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres` });
    expect(() => resolveDemoTarget({ allowRemote: true })).toThrow('DATABASE_URL does not belong');
  });

  it('refuses a missing or wrong confirmation phrase', () => {
    setEnv({ ...remoteEnv, DEMO_REMOTE_CONFIRM: undefined });
    expect(() => resolveDemoTarget({ allowRemote: true })).toThrow('DEMO_REMOTE_CONFIRM');
    setEnv({ ...remoteEnv, DEMO_REMOTE_CONFIRM: `REPLACE-DEMO-DATA-${OTHER}` });
    expect(() => resolveDemoTarget({ allowRemote: true })).toThrow('DEMO_REMOTE_CONFIRM');
  });
});
