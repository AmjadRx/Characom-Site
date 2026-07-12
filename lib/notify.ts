import type { Inquiry, InquirySubject } from "@/lib/content/types";

/**
 * Inquiry email notifications via the Resend REST API (no SDK dependency).
 * Silently skipped when RESEND_API_KEY or INQUIRY_NOTIFY_EMAIL is unset —
 * the site works without email configured.
 */

const SUBJECT_LABEL: Record<InquirySubject, string> = {
  general: "General inquiry",
  project: "Project inquiry",
  partnership: "Partnership inquiry",
  careers: "Careers application",
};

function formatBody(inquiry: Inquiry): string {
  const lines = [
    `New ${SUBJECT_LABEL[inquiry.subjectType].toLowerCase()} from the Characom website.`,
    "",
    `Name:    ${inquiry.name}`,
    `Email:   ${inquiry.email}`,
  ];
  if (inquiry.phone) lines.push(`Phone:   ${inquiry.phone}`);
  lines.push(
    `Subject: ${SUBJECT_LABEL[inquiry.subjectType]}`,
    `Page:    ${inquiry.sourcePage}`,
    `Sent:    ${inquiry.createdAt}`,
    "",
    "Message:",
    inquiry.message,
    "",
    `Reference: ${inquiry.id}`,
  );
  return lines.join("\n");
}

/**
 * Fire-and-forget from the caller's perspective — resolves without throwing
 * on any failure (errors are logged server-side only).
 */
export async function sendInquiryEmail(inquiry: Inquiry): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  const from =
    process.env.INQUIRY_FROM_EMAIL ||
    "Characom Website <onboarding@resend.dev>";
  const subject = `[Characom] ${SUBJECT_LABEL[inquiry.subjectType]} — ${inquiry.name}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: inquiry.email,
        subject,
        text: formatBody(inquiry),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[notify] Resend responded ${res.status}: ${detail.slice(0, 300)}`,
      );
    }
  } catch (err) {
    console.error("[notify] inquiry email failed:", err);
  }
}
