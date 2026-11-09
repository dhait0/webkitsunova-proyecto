/**
 * Supabase's transaction pooler (port 6543) reuses server connections between
 * transactions, so Prisma's prepared statements vanish between its own
 * queries and fail with `prepared statement "sN" does not exist` (SQLSTATE
 * 26000). Prisma avoids them when the URL carries `pgbouncer=true`.
 *
 * A deployment that forgets that flag turns every page that runs parallel
 * queries (the user dashboard runs five) into a Server Components render
 * error, which production shows as React error #441. Adding the flag when it
 * is missing makes the client correct whatever the environment variable holds.
 */
export function withPoolerFlags(url: string | undefined): string | undefined {
  if (!url) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const isTransactionPooler =
    parsed.hostname.endsWith('.pooler.supabase.com') && parsed.port === '6543';

  if (!isTransactionPooler || parsed.searchParams.has('pgbouncer')) {
    return url;
  }

  parsed.searchParams.set('pgbouncer', 'true');
  return parsed.toString();
}
