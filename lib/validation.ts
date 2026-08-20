import { z } from 'zod'

const nonNegativeInteger = z.coerce.number().int().min(0)

export const collegeIdSchema = z.coerce.number().int().positive()

export const collegeQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    location: z.string().trim().max(80).optional(),
    minFee: nonNegativeInteger.optional(),
    maxFee: nonNegativeInteger.optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(12),
  })
  .refine(
    (data) => data.minFee === undefined || data.maxFee === undefined || data.minFee <= data.maxFee,
    { message: 'minFee must be less than or equal to maxFee', path: ['minFee'] },
  )

export const compareIdsSchema = z
  .array(collegeIdSchema)
  .min(2, 'Choose at least 2 college IDs')
  .max(3, 'Choose no more than 3 college IDs')
  .refine((ids) => new Set(ids).size === ids.length, 'ids must be unique')

export function errorResponse(error: string, status: number, details?: unknown) {
  return Response.json({ error, ...(details === undefined ? {} : { details }) }, { status })
}

export function parseSearchParams(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams.entries())
}

export function parseCompareIds(request: Request) {
  const raw = new URL(request.url).searchParams.get('ids')
  return raw ? raw.split(',').map((id) => id.trim()).filter(Boolean) : []
}
