import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')

const FROM_EMAIL = 'Gamexchange <noreply@gamexchange.app>'

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}
