import { z } from 'zod'
import { SLOT_EXTRACTION_SYSTEM_PROMPT, buildSlotExtractionPrompt } from './prompts'
import { parseAdmissionQuery } from './rules-parser'

export type AdmissionIntent = 'predict' | 'compare' | 'deadline' | 'fees' | 'eligibility' | 'unknown'

export type AdmissionQuery = {
  intent: AdmissionIntent
  exam?: 'MHT-CET' | 'JEE'
  percentile?: number
  category?: string
  branch?: string
  city?: string
  budget?: number
  homeUniversity?: boolean
  colleges?: string[]
}

export const admissionQuerySchema = z.object({
  intent: z.enum(['predict', 'compare', 'deadline', 'fees', 'eligibility', 'unknown']).default('unknown'),
  exam: z.enum(['MHT-CET', 'JEE']).optional(),
  percentile: z.coerce.number().min(0).max(100).optional(),
  category: z.string().trim().max(20).optional(),
  branch: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  budget: z.coerce.number().min(0).max(10_000_000).optional(),
  homeUniversity: z
    .preprocess((value) => (value === 'true' ? true : value === 'false' ? false : value), z.boolean())
    .optional(),
  colleges: z.array(z.string().trim().min(1).max(160)).max(5).optional(),
})

export type ParseProvider = 'campuslm' | 'gemini' | 'rules' | 'edited'

export type ParsedQuery = {
  query: AdmissionQuery
  provider: ParseProvider
  fallbackReason?: string
}

const TIMEOUT_MS = 8000

// Provider chain: self-hosted CampusLM, then Gemini, then deterministic rules.
// LLMs only extract slots; every number in the answer is computed by our code.
export async function parseQuery(message: string): Promise<ParsedQuery> {
  const failures: string[] = []

  if (process.env.CAMPUSLM_URL) {
    try {
      return { query: await callCampusLM(message), provider: 'campuslm' }
    } catch (error) {
      failures.push(`campuslm: ${messageOf(error)}`)
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return { query: await callGemini(message), provider: 'gemini' }
    } catch (error) {
      failures.push(`gemini: ${messageOf(error)}`)
    }
  }

  return {
    query: parseAdmissionQuery(message),
    provider: 'rules',
    ...(failures.length ? { fallbackReason: failures.join('; ') } : {}),
  }
}

async function callCampusLM(message: string): Promise<AdmissionQuery> {
  const base = process.env.CAMPUSLM_URL!.replace(/\/$/, '')
  const endpoint = base.endsWith('/chat/completions') ? base : `${base}/v1/chat/completions`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(process.env.CAMPUSLM_API_KEY ? { authorization: `Bearer ${process.env.CAMPUSLM_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: process.env.CAMPUSLM_MODEL ?? 'campuslm',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SLOT_EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: buildSlotExtractionPrompt(message) },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
  return validateJson(body.choices?.[0]?.message?.content)
}

async function callGemini(message: string): Promise<AdmissionQuery> {
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
  const key = process.env.GEMINI_API_KEY!
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SLOT_EXTRACTION_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: buildSlotExtractionPrompt(message) }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }
  )
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const body = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  return validateJson(body.candidates?.[0]?.content?.parts?.[0]?.text)
}

function validateJson(text: string | undefined): AdmissionQuery {
  if (!text) throw new Error('empty response')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('no JSON object')
  const parsed = admissionQuerySchema.safeParse(JSON.parse(text.slice(start, end + 1)))
  if (!parsed.success) throw new Error('slot schema mismatch')
  return parsed.data
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error'
}

export function toDbExam(exam: AdmissionQuery['exam']): 'CET' | 'JEE' {
  return exam === 'JEE' ? 'JEE' : 'CET'
}
