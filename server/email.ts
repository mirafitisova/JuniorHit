import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "CourtMatch <onboarding@resend.dev>";

function isConfigured() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return false;
  }
  return true;
}

function wrapper(content: string) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f9fafb;">
      <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        ${content}
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">
        CourtMatch · Find your next hitting partner
      </p>
    </div>`;
}

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#2D7A4F;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${label}</a>`;
}

// ── Hit request notification ─────────────────────────────────────────────────

interface HitRequestEmailOptions {
  toEmail: string;
  toFirstName: string;
  fromFirstName: string;
  fromLastName: string;
  fromUtr: number | null;
  message: string | null;
}

export async function sendHitRequestEmail(opts: HitRequestEmailOptions) {
  if (!isConfigured()) return;
  const { toEmail, fromFirstName, fromLastName, fromUtr, message } = opts;

  const html = wrapper(`
    <h1 style="color:#2D7A4F;font-size:22px;margin:0 0 8px;">🎾 New Hitting Request!</h1>
    <p style="color:#4b5563;margin:0 0 24px;">
      <strong>${fromFirstName} ${fromLastName}</strong>${fromUtr ? ` (UTR ${fromUtr})` : ""} wants to hit with you.
    </p>
    ${message ? `<div style="background:#f3f4f6;border-left:4px solid #2D7A4F;border-radius:8px;padding:16px;margin-bottom:24px;"><p style="color:#374151;margin:0;font-style:italic;">"${message}"</p></div>` : ""}
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Log in to CourtMatch to accept or decline this request.</p>
    ${btn("https://courtmatch.onrender.com/requests", "View Request")}
  `);

  try {
    await resend.emails.send({ from: FROM, to: toEmail, subject: `${fromFirstName} wants to hit with you on CourtMatch!`, html });
    console.log(`[email] Hit request sent to ${toEmail}`);
  } catch (err) {
    console.error("[email] Failed to send hit request email:", err);
  }
}

// ── Email verification ────────────────────────────────────────────────────────

interface VerificationEmailOptions {
  toEmail: string;
  firstName: string;
  verificationToken: string;
  baseUrl: string;
}

export async function sendVerificationEmail(opts: VerificationEmailOptions) {
  if (!isConfigured()) return;
  const verificationUrl = `${opts.baseUrl}/api/auth/verify-email/${opts.verificationToken}`;

  const html = wrapper(`
    <h1 style="color:#2D7A4F;font-size:22px;margin:0 0 16px;">🎾 Verify your email</h1>
    <p style="color:#374151;font-size:15px;margin:0 0 16px;line-height:1.6;">Hi ${opts.firstName},</p>
    <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">
      Welcome to CourtMatch! Click the button below to verify your email address and activate your account.
    </p>
    ${btn(verificationUrl, "Verify Email Address")}
    <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;">
      This link expires in 24 hours. If you didn't create a CourtMatch account, you can safely ignore this email.
    </p>
  `);

  try {
    await resend.emails.send({ from: FROM, to: opts.toEmail, subject: "Verify your CourtMatch email address", html });
    console.log(`[email] Verification email sent to ${opts.toEmail}`);
  } catch (err) {
    console.error("[email] Failed to send verification email:", err);
    throw err;
  }
}

// ── Parent consent ────────────────────────────────────────────────────────────

interface ParentConsentEmailOptions {
  toEmail: string;
  playerFirstName: string;
  parentApprovalToken: string;
  baseUrl: string;
  isReminder?: boolean;
}

export async function sendParentConsentEmail(opts: ParentConsentEmailOptions) {
  if (!isConfigured()) return;
  const { playerFirstName, isReminder } = opts;
  const approvalUrl = `${opts.baseUrl}/parent-approve/${opts.parentApprovalToken}`;

  const reminderBanner = isReminder ? `
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      <p style="color:#92400e;font-size:14px;margin:0;">Reminder: ${playerFirstName}'s account is still waiting for your approval.</p>
    </div>` : "";

  const html = wrapper(`
    <h1 style="color:#2D7A4F;font-size:22px;margin:0 0 16px;">🎾 Parental Approval Request</h1>
    ${reminderBanner}
    <h2 style="color:#374151;font-size:18px;margin:0 0 16px;">${playerFirstName} wants to join CourtMatch</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      CourtMatch is a safe platform that helps junior USTA tennis players find hitting partners based
      on UTR ratings. All sessions are arranged at public courts — no private location sharing is permitted.
    </p>
    <p style="color:#2D7A4F;font-size:15px;font-weight:600;margin:0 0 8px;">Safety features</p>
    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 24px;">
      🔒 Parent visibility into all scheduled sessions<br>
      📍 Public courts only — home/school addresses prohibited<br>
      📋 All players agree to community safety guidelines<br>
      🎾 UTR-based matching keeps sessions skill-appropriate<br>
      🚩 Report system for any concerns
    </p>
    ${btn(approvalUrl, `Approve ${playerFirstName}'s Account`)}
    <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;">
      If you do not wish to approve this account, simply ignore this email. ${playerFirstName}'s account will remain inactive.
    </p>
  `);

  const subject = isReminder
    ? `Reminder: ${playerFirstName} is waiting for your approval on CourtMatch`
    : `${playerFirstName} wants to join CourtMatch — your approval is needed`;

  try {
    await resend.emails.send({ from: FROM, to: opts.toEmail, subject, html });
    console.log(`[email] Parent consent email sent to ${opts.toEmail} (reminder=${isReminder})`);
  } catch (err) {
    console.error("[email] Failed to send parent consent email:", err);
  }
}
