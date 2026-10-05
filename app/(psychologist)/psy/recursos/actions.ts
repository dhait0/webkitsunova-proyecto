'use server';

import { getSessionUser } from '@/lib/auth/guard';
import { listResources, createResource, type ResourceInput } from '@/services/psy/resources.service';

export async function getResourcesAction(query: Record<string, unknown>) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return listResources(session.id, query);
}

export async function createResourceAction(input: ResourceInput) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return createResource(session.id, input);
}
