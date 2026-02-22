import { z } from 'zod';

export const testConnectionSchema = z.object({
  connectionString: z.string().min(1, 'Connection string is required'),
});

export const previewRequestSchema = z.object({
  table: z.string().min(1, 'Table name is required'),
  limit: z.number().int().min(1).max(100).optional().default(5),
  mapping: z
    .array(
      z.object({
        sourceColumn: z.string().min(1, 'Source column is required'),
        targetPath: z.string().min(1, 'Target path is required'),
      })
    )
    .min(1, 'At least one mapping entry is required'),
});

export type TestConnectionRequest = z.infer<typeof testConnectionSchema>;
export type PreviewRequest = z.infer<typeof previewRequestSchema>;
