'use server';

import { authorize } from '@/lib/auth/guard';
import { listWorkshops, createWorkshop, type WorkshopInput } from '@/services/psy/workshops.service';

export async function getWorkshopsAction(query: Record<string, unknown>) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return listWorkshops(session.id, query);
}

export async function createWorkshopAction(input: WorkshopInput) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return createWorkshop(session.id, input);
}
