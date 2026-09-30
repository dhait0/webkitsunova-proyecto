import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { buildPagination, parsePagination } from './shared.js';

export type ResourceFocusArea =
  | 'ANXIETY'
  | 'DEPRESSION'
  | 'STRESS'
  | 'PRODUCTIVITY'
  | 'MINDFULNESS'
  | 'SELF_ESTEEM'
  | 'TRAUMA_PTSD'
  | 'COUPLES'
  | 'FAMILY'
  | 'EATING_DISORDERS'
  | 'ADDICTION'
  | 'SLEEP'
  | 'OTHER';

export type ResourceInput = {
  type: 'ARTICLE' | 'PDF' | 'EXERCISE' | 'VIDEO';
  title: string;
  description: string;
  coverUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  readingMins?: number | null;
  focusArea?: ResourceFocusArea | null;
};

export const RESOURCE_TYPES = ['ARTICLE', 'PDF', 'EXERCISE', 'VIDEO'] as const;

const RESOURCE_INCLUDE = {
  author: { include: { profile: true } },
} satisfies Prisma.ResourceInclude;

function mapResource(resource: Prisma.ResourceGetPayload<{ include: typeof RESOURCE_INCLUDE }>) {
  return {
    id: resource.id,
    type: resource.type,
    title: resource.title,
    description: resource.description,
    coverUrl: resource.coverUrl,
    fileUrl: resource.fileUrl,
    fileName: resource.fileName,
    readingMins: resource.readingMins,
    focusArea: resource.focusArea,
    status: resource.status,
    rejectReason: resource.rejectReason,
    authorId: resource.authorId,
    authorName:
      `${resource.author.profile?.firstName ?? ''} ${resource.author.profile?.lastName ?? ''}`.trim() ||
      resource.author.email,
    createdAt: resource.createdAt.toISOString(),
  };
}

export async function listResources(authorId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const type = typeof query.type === 'string' ? query.type : '';
  const status = typeof query.status === 'string' ? query.status : '';

  const where: Prisma.ResourceWhereInput = {
    authorId,
    ...(RESOURCE_TYPES.includes(type as (typeof RESOURCE_TYPES)[number])
      ? { type: type as (typeof RESOURCE_TYPES)[number] }
      : {}),
    ...(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].includes(status)
      ? { status: status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' }
      : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [resources, total, totalCount, articleCount, pdfCount, videoCount] = await Promise.all([
    prisma.resource.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: RESOURCE_INCLUDE,
    }),
    prisma.resource.count({ where }),
    prisma.resource.count({ where: { authorId } }),
    prisma.resource.count({ where: { authorId, type: 'ARTICLE' } }),
    prisma.resource.count({ where: { authorId, type: 'PDF' } }),
    prisma.resource.count({ where: { authorId, type: 'VIDEO' } }),
  ]);

  return {
    success: true as const,
    resources: resources.map(mapResource),
    stats: {
      total: totalCount,
      articles: articleCount,
      pdfs: pdfCount,
      videos: videoCount,
    },
    pagination: buildPagination(page, limit, total),
  };
}

export async function getResource(authorId: string, id: string) {
  const resource = await prisma.resource.findFirst({
    where: { id, authorId },
    include: RESOURCE_INCLUDE,
  });

  if (!resource) {
    return null;
  }

  return { success: true as const, resource: mapResource(resource) };
}

export async function createResource(authorId: string, input: ResourceInput) {
  const resource = await prisma.resource.create({
    data: {
      authorId,
      type: input.type,
      title: input.title,
      description: input.description,
      coverUrl: input.coverUrl ?? null,
      fileUrl: input.fileUrl ?? null,
      fileName: input.fileName ?? null,
      readingMins: input.readingMins ?? null,
      focusArea: input.focusArea ?? null,
      status: 'PENDING',
    },
    include: RESOURCE_INCLUDE,
  });

  return { success: true as const, resource: mapResource(resource) };
}

export async function updateResource(authorId: string, id: string, input: Partial<ResourceInput>) {
  const existing = await prisma.resource.findFirst({ where: { id, authorId } });

  if (!existing) {
    return null;
  }

  if (existing.status === 'APPROVED' && (input.title || input.description || input.fileUrl)) {
    await prisma.resource.update({
      where: { id },
      data: { status: 'PENDING', rejectReason: null, reviewedAt: null, reviewedById: null },
    });
  }

  const resource = await prisma.resource.update({
    where: { id },
    data: {
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.coverUrl !== undefined ? { coverUrl: input.coverUrl } : {}),
      ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl } : {}),
      ...(input.fileName !== undefined ? { fileName: input.fileName } : {}),
      ...(input.readingMins !== undefined ? { readingMins: input.readingMins } : {}),
      ...(input.focusArea !== undefined ? { focusArea: input.focusArea } : {}),
    },
    include: RESOURCE_INCLUDE,
  });

  return { success: true as const, resource: mapResource(resource) };
}

export async function deleteResource(authorId: string, id: string) {
  const existing = await prisma.resource.findFirst({ where: { id, authorId }, select: { id: true } });

  if (!existing) {
    return false;
  }

  await prisma.resource.delete({ where: { id } });
  return true;
}
