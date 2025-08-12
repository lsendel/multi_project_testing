import { z } from 'zod';

// Document Node Schema
export const DocumentNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['folder', 'document']),
  path: z.string(),
  parentId: z.string().optional(),
  children: z.array(z.lazy(() => DocumentNodeSchema)).optional(),
  metadata: z.object({
    size: z.number(),
    lastModified: z.date(),
    documentType: z.string(),
    tags: z.array(z.string()),
    relevanceScore: z.number().optional(),
    usageCount: z.number(),
  }),
  content: z.object({
    preview: z.string(),
    fullText: z.string().optional(),
    embeddings: z.array(z.number()).optional(),
  }).optional(),
});

export type DocumentNode = z.infer<typeof DocumentNodeSchema>;

// Context State Schema
export const ContextStateSchema = z.object({
  includedNodes: z.set(z.string()),
  pinnedNodes: z.set(z.string()),
  excludedNodes: z.set(z.string()),
  tokenUsage: z.object({
    current: z.number(),
    limit: z.number(),
    breakdown: z.object({
      pinned: z.number(),
      selected: z.number(),
      conversation: z.number(),
    }),
  }),
});

export type ContextState = z.infer<typeof ContextStateSchema>;

// User Preferences Schema
export const UserPreferencesSchema = z.object({
  view: z.object({
    defaultExpansionLevel: z.number(),
    sortBy: z.enum(['name', 'date', 'relevance', 'size']),
    viewMode: z.enum(['tree', 'grid', 'list']),
    showMetadata: z.boolean(),
  }),
  behavior: z.object({
    autoIncludeRelated: z.boolean(),
    contextInclusionDefault: z.enum(['manual', 'auto']),
    enableAnimations: z.boolean(),
  }),
  accessibility: z.object({
    highContrast: z.boolean(),
    reducedMotion: z.boolean(),
    fontSize: z.enum(['small', 'medium', 'large']),
  }),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;