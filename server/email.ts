import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface HitRequestEmailOptions {
  toEmail: string;
  toFirstName: string;
  fromFirstName: string;
  fromLastName: string;
  fromUtr: number | null;
  message: string | null;
}

export async function sendHitRequestEmail(opts: HitRequestEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return;
  }

  const { toEmail, toFirstName, fromFirstName, fromLastName, fromUtr, message } = opts;

  try {
    await resend.emails.send({
      from: "CourtMatch <onboarding@resend.dev>",
      to: toEmail,
      subject: `${fromFirstName} wants to hit with you on CourtMatch!`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #f9fafb;">
          <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
            <h1 style="color: #1e3a5f; font-size: 22px; margin: 0 0 8px;">
              🎾 New Hitting Request!
            </h1>
            <p style="color: #4b5563; margin: 0 0 24px;">
              <strong>${fromFirstName} ${fromLastName}</strong>${fromUtr ? ` (UTR ${fromUtr})` : ""} wants to hit with you.
            </p>

            ${message ? `
            <div style="background: #f3f4f6; border-left: 4px solid #1e3a5f; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #374151; margin: 0; font-style: italic;">"${message}"</p>
            </div>` : ""}

            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
              Log in to CourtMatch to accept or decline this request.
            </p>

            <a href="https://juniorhit.onrender.com/requests"
               style="display: inline-block; background: #1e3a5f; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
              View Request
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            CourtMatch · Find your next hitting partner
          </p>
        </div>
      `,
    });

    console.log(`[email] Hit request notification sent to ${toEmail}`);
  } catch (err) {
    console.error("[email] Failed to send hit request email:", err);
  }
}
