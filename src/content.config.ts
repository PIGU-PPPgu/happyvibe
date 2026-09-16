import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const MODULE_SLUGS = ['start', 'teaching', 'tools'] as const;

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

export const collections = { lessons, tools };
