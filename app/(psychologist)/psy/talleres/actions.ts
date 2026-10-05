'use server';

import { getSessionUser } from '@/lib/auth/guard';
import { listWorkshops, createWorkshop, type WorkshopInput } from '@/services/psy/workshops.service';

export async function getWorkshopsAction(query: Record<string, unknown>) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return listWorkshops(session.id, query);
}

export async function createWorkshopAction(input: WorkshopInput) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return createWorkshop(session.id, input);
}
