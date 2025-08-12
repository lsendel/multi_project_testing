import { z } from 'zod';
import { DocumentNodeSchema } from './document.js';

// API Response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.date(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
};

// Search related schemas
export const SearchQuerySchema = z.object({
  query: z.string(),
  filters: z.object({
    documentType: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z.object({
      from: z.date().optional(),
      to: z.date().optional(),
    }).optional(),
    sizeRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  }).optional(),
  sort: z.object({
    field: z.enum(['relevance', 'name', 'date', 'size']),
    order: z.enum(['asc', 'desc']),
  }).optional(),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
  }).optional(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const SearchResultSchema = z.object({
  nodes: z.array(DocumentNodeSchema),
  totalCount: z.number(),
  facets: z.object({
    documentTypes: z.record(z.number()),
    tags: z.record(z.number()),
  }),
  searchTime: z.number(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;