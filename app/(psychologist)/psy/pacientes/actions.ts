'use server';

import { authorize } from '@/lib/auth/guard';
import { listPatients } from '@/services/psy/dashboard.service';

export async function getPatientsAction(query: Record<string, unknown>) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return listPatients(session.id, query);
}
