"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Office, SiteSettings, StatItem } from "@/lib/content/types";
import { adminGet, adminSend } from "@/components/admin/api";
import {
  Button,
  EmptyState,
  PageHeader,
  Spinner,
  useToast,
} from "@/components/admin/ui";
import {
  BooleanField,
  ImageField,
  NumberField,
  SelectField,
  TextField,
  TextareaField,
  inputClass,
} from "@/components/admin/fields";

/* ── Small local helpers ───────────────────────────────────────────────── */

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-ink/10 bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-stone">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function moveItem<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

const rowIconButton =
  "rounded p-1 text-stone transition-colors hover:text-ink disabled:opacity-30";

function RowControls({
  index,
  total,
  label,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  label: string;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label={`Move ${label} up`}
        className={rowIconButton}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 19V5m-6 6 6-6 6 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        aria-label={`Move ${label} down`}
        className={rowIconButton}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14m6-6-6 6-6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="rounded p-1 text-stone transition-colors hover:text-red-700"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 7h16M10 11v5M14 11v5M6 7l1 13h10l1-13M9 7V4h6v3" />
        </svg>
      </button>
    </div>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-input border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-ink/5"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {label}
    </button>
  );
}

/** Repeatable single-line string rows (phones, emails). */
function StringListEditor({
  label,
  itemLabel,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  itemLabel: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">
        {label}
      </legend>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              placeholder={placeholder}
              aria-label={`${itemLabel} ${index + 1}`}
              onChange={(e) =>
                onChange(values.map((v, i) => (i === index ? e.target.value : v)))
              }
              className={inputClass()}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label={`Remove ${itemLabel} ${index + 1}`}
              className="shrink-0 rounded p-1.5 text-stone transition-colors hover:text-red-700"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 7h16M10 11v5M14 11v5M6 7l1 13h10l1-13M9 7V4h6v3" />
              </svg>
            </button>
          </div>
        ))}
        <AddRowButton label={`Add ${itemLabel.toLowerCase()}`} onClick={() => onChange([...values, ""])} />
      </div>
    </fieldset>
  );
}

const HERO_MODE_OPTIONS = [
  { label: "Gold particle field (canvas)", value: "particles" },
  { label: "Looping background video", value: "video" },
];

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: () => adminGet<SiteSettings>("settings"),
  });

  const [form, setForm] = useState<SiteSettings | null>(null);

  // Initialize the working copy once (don't clobber in-progress edits).
  useEffect(() => {
    if (data && form === null) {
      setForm(JSON.parse(JSON.stringify(data)) as SiteSettings);
    }
  }, [data, form]);

  const save = useMutation({
    mutationFn: (settings: SiteSettings) =>
      adminSend<SiteSettings>("settings", "PUT", settings),
    onSuccess: (saved) => {
      queryClient.setQueryData(["settings"], saved);
      setForm(JSON.parse(JSON.stringify(saved)) as SiteSettings);
      toast("Settings saved — live within seconds.", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  if (error) {
    return (
      <>
        <PageHeader title="Site settings" />
        <EmptyState title="Could not load settings" text={(error as Error).message} />
      </>
    );
  }

  if (isLoading || !form) {
    return (
      <>
        <PageHeader title="Site settings" />
        <div className="flex items-center gap-2 text-stone">
          <Spinner size={18} /> Loading settings…
        </div>
      </>
    );
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(data);

  const patch = (partial: Partial<SiteSettings>) =>
    setForm((prev) => (prev ? { ...prev, ...partial } : prev));
  const patchContact = (partial: Partial<SiteSettings["contact"]>) =>
    patch({ contact: { ...form.contact, ...partial } });
  const patchOffice = (index: number, partial: Partial<Office>) =>
    patchContact({
      offices: form.contact.offices.map((o, i) =>
        i === index ? { ...o, ...partial } : o,
      ),
    });
  const patchStat = (index: number, partial: Partial<StatItem>) =>
    patch({
      stats: form.stats.map((s, i) => (i === index ? { ...s, ...partial } : s)),
    });

  return (
    <>
      <PageHeader
        title="Site settings"
        description="Global content: identity, contact details, home-page stats, SEO defaults and integrations."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(form);
        }}
        className="space-y-6 pb-24"
      >
        <SectionCard title="General">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Site name"
              value={form.siteName}
              onChange={(v) => patch({ siteName: v })}
            />
            <NumberField
              label="Founded year"
              value={form.foundedYear}
              onChange={(v) => patch({ foundedYear: v })}
              min={1900}
              max={2100}
              help="Shown in the hero kicker and about timeline."
            />
          </div>
          <TextField
            label="Tagline"
            value={form.tagline}
            onChange={(v) => patch({ tagline: v })}
          />
        </SectionCard>

        <SectionCard title="Branding">
          <TextField
            label="Logo wordmark text"
            value={form.branding.logoText}
            onChange={(v) => patch({ branding: { ...form.branding, logoText: v } })}
            help="Used when no logo image is uploaded."
          />
          <ImageField
            label="Logo image (optional)"
            hideAlt
            value={{ src: form.branding.logoImage ?? "", alt: "" }}
            onChange={(v) =>
              patch({
                branding: {
                  ...form.branding,
                  logoImage: v.src.trim() ? v.src.trim() : undefined,
                },
              })
            }
            help="SVG preferred. Leave empty to use the wordmark text."
          />
        </SectionCard>

        <SectionCard
          title="Contact"
          description="Shown on the contact page, footer and fullscreen menu."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <StringListEditor
              label="Phone numbers"
              itemLabel="Phone"
              values={form.contact.phones}
              onChange={(v) => patchContact({ phones: v })}
              placeholder="+357 22 000 000"
            />
            <StringListEditor
              label="Email addresses"
              itemLabel="Email"
              values={form.contact.emails}
              onChange={(v) => patchContact({ emails: v })}
              placeholder="info@characom.example.com"
            />
          </div>
          <TextField
            label="Fax (optional)"
            value={form.contact.fax ?? ""}
            onChange={(v) => patchContact({ fax: v.trim() ? v : undefined })}
          />

          <fieldset className="min-w-0 border-0 p-0">
            <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">
              Offices
            </legend>
            <div className="space-y-3">
              {form.contact.offices.length === 0 && (
                <p className="rounded-input border border-dashed border-stone/40 px-3 py-4 text-center text-xs text-stone">
                  No offices yet.
                </p>
              )}
              {form.contact.offices.map((office, index) => (
                <div key={index} className="rounded-input border border-ink/10 bg-white/60 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2 border-b border-ink/10 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone">
                      Office {index + 1}
                    </p>
                    <RowControls
                      index={index}
                      total={form.contact.offices.length}
                      label={`office ${index + 1}`}
                      onMove={(delta) =>
                        patchContact({ offices: moveItem(form.contact.offices, index, delta) })
                      }
                      onRemove={() =>
                        patchContact({
                          offices: form.contact.offices.filter((_, i) => i !== index),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField
                      label="Name"
                      value={office.name}
                      onChange={(v) => patchOffice(index, { name: v })}
                      placeholder="Nicosia HQ"
                    />
                    <TextField
                      label="Phone (optional)"
                      value={office.phone ?? ""}
                      onChange={(v) => patchOffice(index, { phone: v.trim() ? v : undefined })}
                    />
                    <TextField
                      label="Address"
                      value={office.address}
                      onChange={(v) => patchOffice(index, { address: v })}
                      className="sm:col-span-2"
                    />
                    <TextField
                      label="Hours (optional)"
                      value={office.hours ?? ""}
                      onChange={(v) => patchOffice(index, { hours: v.trim() ? v : undefined })}
                      placeholder="Mon–Fri 08:00–17:00"
                      className="sm:col-span-2"
                    />
                  </div>
                </div>
              ))}
              <AddRowButton
                label="Add office"
                onClick={() =>
                  patchContact({
                    offices: [...form.contact.offices, { name: "", address: "" }],
                  })
                }
              />
            </div>
          </fieldset>
        </SectionCard>

        <SectionCard
          title="Stat counters"
          description="The animated numbers band on the home page. Only use verified figures on the live site."
        >
          <div className="space-y-3">
            {form.stats.length === 0 && (
              <p className="rounded-input border border-dashed border-stone/40 px-3 py-4 text-center text-xs text-stone">
                No stats yet.
              </p>
            )}
            {form.stats.map((stat, index) => (
              <div key={index} className="rounded-input border border-ink/10 bg-white/60 p-3">
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-ink/10 pb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone">
                    Stat {index + 1}
                  </p>
                  <RowControls
                    index={index}
                    total={form.stats.length}
                    label={`stat ${index + 1}`}
                    onMove={(delta) => patch({ stats: moveItem(form.stats, index, delta) })}
                    onRemove={() =>
                      patch({ stats: form.stats.filter((_, i) => i !== index) })
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <TextField
                    label="Label"
                    value={stat.label}
                    onChange={(v) => patchStat(index, { label: v })}
                    placeholder="Years of experience"
                  />
                  <NumberField
                    label="Value"
                    value={stat.value}
                    onChange={(v) => patchStat(index, { value: v })}
                  />
                  <TextField
                    label="Suffix"
                    value={stat.suffix ?? ""}
                    onChange={(v) => patchStat(index, { suffix: v.trim() ? v : undefined })}
                    placeholder="+"
                  />
                </div>
              </div>
            ))}
            <AddRowButton
              label="Add stat"
              onClick={() =>
                patch({ stats: [...form.stats, { label: "", value: 0, suffix: "+" }] })
              }
            />
          </div>
        </SectionCard>

        <SectionCard
          title="SEO defaults"
          description="Used on pages without their own SEO settings."
        >
          <TextField
            label="Default title"
            value={form.seoDefaults.title ?? ""}
            onChange={(v) =>
              patch({ seoDefaults: { ...form.seoDefaults, title: v.trim() ? v : undefined } })
            }
          />
          <TextareaField
            label="Default description"
            rows={3}
            value={form.seoDefaults.description ?? ""}
            onChange={(v) =>
              patch({
                seoDefaults: { ...form.seoDefaults, description: v.trim() ? v : undefined },
              })
            }
          />
          <ImageField
            label="Default social share image"
            hideAlt
            value={{ src: form.seoDefaults.ogImage ?? "", alt: "" }}
            onChange={(v) =>
              patch({
                seoDefaults: {
                  ...form.seoDefaults,
                  ogImage: v.src.trim() ? v.src.trim() : undefined,
                },
              })
            }
            help="1200×630 recommended."
          />
        </SectionCard>

        <SectionCard title="Integrations">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Analytics ID (optional)"
              value={form.integrations.analyticsId ?? ""}
              onChange={(v) =>
                patch({
                  integrations: {
                    ...form.integrations,
                    analyticsId: v.trim() ? v : undefined,
                  },
                })
              }
              placeholder="G-XXXXXXXXXX"
            />
            <TextField
              label="Map embed URL (optional)"
              value={form.integrations.mapEmbedUrl ?? ""}
              onChange={(v) =>
                patch({
                  integrations: {
                    ...form.integrations,
                    mapEmbedUrl: v.trim() ? v : undefined,
                  },
                })
              }
              help="Iframe src for the contact page map."
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Hero media"
          description="Background of the home-page hero."
        >
          <SelectField
            label="Mode"
            options={HERO_MODE_OPTIONS}
            value={form.heroMedia.mode}
            onChange={(v) =>
              patch({
                heroMedia: { ...form.heroMedia, mode: v === "video" ? "video" : "particles" },
              })
            }
          />
          {form.heroMedia.mode === "video" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Video URL"
                value={form.heroMedia.videoSrc ?? ""}
                onChange={(v) =>
                  patch({
                    heroMedia: { ...form.heroMedia, videoSrc: v.trim() ? v : undefined },
                  })
                }
                help="Muted loop, 10–20s, ≤4MB (mp4)."
              />
              <TextField
                label="Poster image URL"
                value={form.heroMedia.posterSrc ?? ""}
                onChange={(v) =>
                  patch({
                    heroMedia: { ...form.heroMedia, posterSrc: v.trim() ? v : undefined },
                  })
                }
                help="Shown before the video loads and under reduced motion."
              />
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Load screen photos"
          description="Full-bleed construction photos shown behind the counting percentage on page loads and transitions. Empty = built-in placeholders. Use Media library URLs (/api/media/…) or full https URLs."
        >
          <StringListEditor
            label="Photo URLs"
            itemLabel="Photo URL"
            placeholder="https://… or /api/media/…"
            values={form.loaderImages ?? []}
            onChange={(v) => patch({ loaderImages: v.filter(Boolean) })}
          />
        </SectionCard>

        <SectionCard title="Maintenance">
          <BooleanField
            label="Maintenance mode"
            value={form.maintenanceMode}
            onChange={(v) => patch({ maintenanceMode: v })}
            help="Shows a holding message on the public site. The admin stays reachable."
          />
        </SectionCard>

        {/* Sticky save bar */}
        <div className="sticky bottom-4 z-20">
          <div className="flex items-center justify-between gap-4 rounded-card border border-white/10 bg-ink px-5 py-3 shadow-xl">
            <p className="text-sm text-plaster/80" aria-live="polite">
              {dirty ? "Unsaved changes" : "All changes saved"}
            </p>
            <div className="on-dark flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  data && setForm(JSON.parse(JSON.stringify(data)) as SiteSettings)
                }
                disabled={!dirty || save.isPending}
                className="rounded-input border border-white/20 px-4 py-2 text-sm text-plaster transition-colors hover:border-white/40 disabled:opacity-40"
              >
                Reset
              </button>
              <Button type="submit" loading={save.isPending} disabled={!dirty}>
                Save settings
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
