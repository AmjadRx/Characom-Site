"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DUR, EASE_FM } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";
import { MorphButton } from "@/components/motion";
import FloatingInput from "@/components/ui/FloatingInput";
import FloatingTextarea from "@/components/ui/FloatingTextarea";
import FloatingSelect from "@/components/ui/FloatingSelect";

const EASE_OUT: [number, number, number, number] = [...EASE_FM.out];

const SUBJECTS = ["general", "project", "partnership", "careers"] as const;

const formSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z.string().trim().optional(),
  subjectType: z.enum(SUBJECTS),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a little more (at least 10 characters)."),
  consent: z.boolean().refine((v) => v, {
    message: "Please agree to the privacy policy so we can respond.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * §5.5 inquiry form — react-hook-form + zod mirroring POST /api/inquiries:
 * { subjectType, name, email, phone?, message, consent, website (honeypot),
 * startedAt (time-trap) }. Inline errors are announced politely; the submit
 * button morphs loading → success, then the form swaps for a thank-you state.
 */
export default function ContactFormClient() {
  const { reduced } = useReducedMotionPref();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subjectType: "general",
      message: "",
      consent: false,
    },
  });

  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const startedAtRef = useRef(0);
  const honeypotRef = useRef<HTMLInputElement | null>(null);
  const doneTimer = useRef<number | null>(null);

  useEffect(() => {
    startedAtRef.current = Date.now();
    // Preselect the subject from ?subject= (e.g. careers "Apply" links).
    const subject = new URLSearchParams(window.location.search).get("subject");
    if (subject && (SUBJECTS as readonly string[]).includes(subject)) {
      setValue("subjectType", subject as FormValues["subjectType"]);
    }
    return () => {
      if (doneTimer.current) window.clearTimeout(doneTimer.current);
    };
  }, [setValue]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectType: values.subjectType,
          name: values.name,
          email: values.email,
          phone: values.phone?.trim() ? values.phone.trim() : undefined,
          message: values.message,
          consent: values.consent,
          website: honeypotRef.current?.value ?? "",
          startedAt: startedAtRef.current || Date.now() - 10_000,
        }),
      });
      if (!res.ok) {
        let message = "Something went wrong — please try again in a moment.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          // non-JSON error body — keep the friendly default
        }
        setServerError(message);
        return;
      }
      setSent(true);
      doneTimer.current = window.setTimeout(
        () => setDone(true),
        reduced ? 0 : 1100,
      );
    } catch {
      setServerError(
        "We could not reach the server. Please check your connection and try again.",
      );
    }
  };

  if (done) {
    return (
      <motion.div
        role="status"
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.base, ease: EASE_OUT }}
        className="rounded-card border border-gold/30 bg-white p-10 text-center"
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-pill bg-gold text-ink">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="m4.5 12.5 5 5 10-11" />
          </svg>
        </span>
        <h3 className="mt-6 font-display text-[length:var(--text-h3)] font-semibold">
          Thank you — your message is on its way.
        </h3>
        <p className="mt-3 text-stone">
          We read every inquiry and will get back to you within two business
          days.
        </p>
      </motion.div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="relative">
      <div className="grid gap-x-8 sm:grid-cols-2">
        <FloatingInput
          label="Full name"
          autoComplete="name"
          required
          error={errors.name?.message}
          {...register("name")}
        />
        <FloatingInput
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register("email")}
        />
        <FloatingInput
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <FloatingSelect
          label="Subject"
          required
          error={errors.subjectType?.message}
          {...register("subjectType")}
        >
          <option value="general">General inquiry</option>
          <option value="project">Project inquiry</option>
          <option value="partnership">Partnership</option>
          <option value="careers">Careers</option>
        </FloatingSelect>
        <FloatingTextarea
          label="Your message"
          required
          className="sm:col-span-2"
          error={errors.message?.message}
          {...register("message")}
        />
      </div>

      {/* Honeypot — visually hidden, ignored by real users */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor="contact-website">Website</label>
        <input
          ref={honeypotRef}
          id="contact-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="mt-2">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "contact-consent-error" : undefined}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-gold"
            {...register("consent")}
          />
          <span className="text-sm leading-relaxed text-ink/80">
            I agree to Characom Group processing my details to respond to this
            inquiry, in line with the{" "}
            <Link href="/legal/privacy" className="link-underline text-aegean">
              privacy policy
            </Link>
            . <span aria-hidden="true">*</span>
          </span>
        </label>
        <p
          id="contact-consent-error"
          aria-live="polite"
          className="mt-1.5 min-h-[1.25rem] text-[0.8125rem] leading-snug text-[#b3261e]"
        >
          {errors.consent?.message}
        </p>
      </div>

      <p aria-live="polite" className="min-h-[1.5rem] text-sm text-[#b3261e]">
        {serverError}
      </p>

      <div className="mt-4">
        <MorphButton
          type="submit"
          label={sent ? "Message sent" : "Send message"}
          loading={isSubmitting}
          success={sent}
          variant="gold"
        />
      </div>
    </form>
  );
}
