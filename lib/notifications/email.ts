export type EmailResult = 'sent' | 'queued' | 'failed'

export async function sendAlertEmail(to: string, subject: string, lines: string[]): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return 'queued'

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? 'CampusScope <onboarding@resend.dev>',
        to,
        subject,
        text: `${lines.join('\n\n')}\n\nCampusScope · manage alerts at /alerts`,
      }),
      signal: AbortSignal.timeout(8000),
    })
    return response.ok ? 'sent' : 'failed'
  } catch {
    return 'failed'
  }
}
