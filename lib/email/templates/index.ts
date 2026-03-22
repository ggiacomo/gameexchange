import { sendEmail } from '../resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gamexchange.app'

function baseLayout(content: string): string {
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #171717;">
      <div style="border-bottom: 2px solid #1A6B3C; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #1A6B3C; margin: 0; font-size: 24px;">Gamexchange</h1>
      </div>
      ${content}
      <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 32px; font-size: 12px; color: #6b7280;">
        <p>You're receiving this because you have an account on Gamexchange.</p>
        <p><a href="${APP_URL}/settings" style="color: #1A6B3C;">Manage notifications</a></p>
      </div>
    </div>
  `
}

export async function sendProposalReceivedEmail(
  to: string,
  proposerName: string,
  gameName: string,
  proposalId: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `${proposerName} wants to swap for your game`,
    html: baseLayout(`
      <h2>New swap proposal!</h2>
      <p><strong>${proposerName}</strong> wants to swap for <strong>${gameName}</strong> from your library.</p>
      <p>They've offered games from their collection in exchange.</p>
      <a href="${APP_URL}/proposals/${proposalId}" style="display: inline-block; background: #1A6B3C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Proposal</a>
    `),
  })
}

export async function sendProposalAcceptedEmail(
  to: string,
  receiverName: string,
  gameName: string,
  proposalId: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `${receiverName} accepted your swap proposal`,
    html: baseLayout(`
      <h2>Proposal accepted!</h2>
      <p><strong>${receiverName}</strong> has accepted your proposal for <strong>${gameName}</strong>.</p>
      <p>You can now chat to coordinate the in-person swap.</p>
      <a href="${APP_URL}/inbox/${proposalId}" style="display: inline-block; background: #1A6B3C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Open Chat</a>
    `),
  })
}

export async function sendCounterProposalEmail(
  to: string,
  senderName: string,
  gameName: string,
  proposalId: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `${senderName} sent a counter-proposal`,
    html: baseLayout(`
      <h2>Counter-proposal received</h2>
      <p><strong>${senderName}</strong> has modified the swap proposal for <strong>${gameName}</strong>.</p>
      <a href="${APP_URL}/proposals/${proposalId}" style="display: inline-block; background: #1A6B3C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Review Counter-Proposal</a>
    `),
  })
}

export async function sendMessageEmail(
  to: string,
  senderName: string,
  proposalId: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `New message from ${senderName}`,
    html: baseLayout(`
      <h2>New message</h2>
      <p><strong>${senderName}</strong> sent you a message about your swap.</p>
      <a href="${APP_URL}/inbox/${proposalId}" style="display: inline-block; background: #1A6B3C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Read Message</a>
    `),
  })
}

export async function sendSwapCompletedEmail(
  to: string,
  otherUserName: string,
  gameName: string,
  proposalId: string
): Promise<void> {
  await sendEmail({
    to,
    subject: 'Swap completed — leave a review!',
    html: baseLayout(`
      <h2>Swap completed!</h2>
      <p>Your swap of <strong>${gameName}</strong> with <strong>${otherUserName}</strong> is complete.</p>
      <p>Help the community by leaving a review.</p>
      <a href="${APP_URL}/proposals/${proposalId}" style="display: inline-block; background: #1A6B3C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Leave a Review</a>
    `),
  })
}

export async function sendWishlistMatchEmail(
  to: string,
  gameName: string,
  ownerName: string,
  profileUrl: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `${gameName} is now available to swap!`,
    html: baseLayout(`
      <h2>Wishlist match!</h2>
      <p><strong>${gameName}</strong> from your wishlist is now available for swapping.</p>
      <p><strong>${ownerName}</strong> has listed it in their library.</p>
      <a href="${APP_URL}${profileUrl}" style="display: inline-block; background: #1A6B3C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Their Profile</a>
    `),
  })
}

export async function sendEmailConfirmationReminder(
  to: string,
  username: string
): Promise<void> {
  await sendEmail({
    to,
    subject: 'Please confirm your email',
    html: baseLayout(`
      <h2>Confirm your email, ${username}</h2>
      <p>You're almost ready to start swapping games! Just confirm your email address to unlock proposal sending and accepting.</p>
      <p>Check your inbox for the confirmation email, or resend it from your settings.</p>
      <a href="${APP_URL}/settings" style="display: inline-block; background: #1A6B3C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Go to Settings</a>
    `),
  })
}
