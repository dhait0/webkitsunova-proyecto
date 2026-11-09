'use server';

import { authorize } from '@/lib/auth/guard';
import { listResources, createResource, type ResourceInput } from '@/services/psy/resources.service';

export async function getResourcesAction(query: Record<string, unknown>) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return listResources(session.id, query);
}

export async function createResourceAction(input: ResourceInput) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return createResource(session.id, input);
}
