'use server';

import { getSessionUser } from '@/lib/auth/guard';
import { listPatients } from '@/services/psy/dashboard.service';

export async function getPatientsAction(query: Record<string, unknown>) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return listPatients(session.id, query);
}
