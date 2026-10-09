import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { SUBJECT_SLUGS } from './data/subjects';

export const MODULE_SLUGS = [
  'basics',
  'agent',
  'teaching',
  'class-management',
  'edu-data',
  'policy',
  'research',
  'growth',
  'creation',
  'software',
] as const;

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    module: z.enum(MODULE_SLUGS),
    order: z.number(),
    description: z.string(),
    source: z.string(),
    status: z.enum(['draft', 'ready']).default('draft'),
    minutes: z.number().optional(),
  }),
});

const tools = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
  schema: z.object({
    name: z.string(),
    category: z.enum(['class', 'teaching', 'creation', 'agent', 'local', 'design', 'learn', 'skill']),
    description: z.string(),
    url: z.string().optional(),
    install: z.string().optional(),
    image: z.string().optional(),
    order: z.number().default(99),
  }),
});

const RESOURCE_KINDS = ['interactive-3d', 'interactive-2d', 'diagram', 'external'] as const;
const RESOURCE_SOURCES = ['smartedu', 'phet', 'geogebra'] as const;

const resources = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/resources' }),
  schema: z
    .object({
      title: z.string(),
      subject: z.enum(SUBJECT_SLUGS),
      stage: z.enum(['primary', 'junior', 'senior']),
      grades: z.array(z.number().int().min(1).max(12)).nonempty(),
      topic: z.string(),
      book: z.string().optional(),
      unit: z.string().optional(),
      kind: z.enum(RESOURCE_KINDS),
      file: z.string().optional(),
      url: z.string().url().optional(),
      source: z.enum(RESOURCE_SOURCES).optional(),
      usage: z.string(),
      tags: z.array(z.string()).optional(),
      status: z.enum(['draft', 'ready']).default('draft'),
      order: z.number().default(99),
    })
    .refine((d) => (d.kind === 'external' ? Boolean(d.url && d.source && !d.file) : Boolean(d.file && !d.url)), {
      message: 'external 条目必填 url+source；自产条目必填 file，二者互斥',
    }),
});

export const collections = { lessons, tools, resources };
