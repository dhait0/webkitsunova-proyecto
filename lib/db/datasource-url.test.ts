import { describe, expect, it } from 'vitest';
import { withPoolerFlags } from './datasource-url';

const pooler = 'postgres://postgres.abc:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

describe('withPoolerFlags', () => {
  it('adds pgbouncer=true to a transaction-pooler URL that lacks it', () => {
    const result = withPoolerFlags(`${pooler}?sslmode=require`);
    expect(new URL(result!).searchParams.get('pgbouncer')).toBe('true');
    expect(new URL(result!).searchParams.get('sslmode')).toBe('require');
  });

  it('adds it to a URL without any query string', () => {
    expect(new URL(withPoolerFlags(pooler)!).searchParams.get('pgbouncer')).toBe('true');
  });

  it('leaves an explicit pgbouncer setting untouched', () => {
    const url = `${pooler}?pgbouncer=true&sslmode=require`;
    expect(withPoolerFlags(url)).toBe(url);
    const off = `${pooler}?pgbouncer=false`;
    expect(withPoolerFlags(off)).toBe(off);
  });

  it('does not touch the session pooler (5432) or a direct connection', () => {
    const session = 'postgres://postgres.abc:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres';
    const direct = 'postgres://postgres:secret@db.abc.supabase.co:5432/postgres';
    expect(withPoolerFlags(session)).toBe(session);
    expect(withPoolerFlags(direct)).toBe(direct);
  });

  it('does not touch a local database', () => {
    const local = 'postgresql://postgres:postgres@127.0.0.1:55422/postgres';
    expect(withPoolerFlags(local)).toBe(local);
  });

  it('passes through empty and malformed values', () => {
    expect(withPoolerFlags(undefined)).toBeUndefined();
    expect(withPoolerFlags('not a url')).toBe('not a url');
  });
});
