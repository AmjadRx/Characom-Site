import type { BlockComponentProps } from "@/components/blocks/registry";
import { Reveal } from "@/components/motion";
import SectionHeader from "@/components/ui/SectionHeader";
import { STAGGER } from "@/lib/motion/constants";

interface FileItem {
  label: string;
  href: string;
  note: string;
}

interface FileDownloadProps {
  kicker?: string;
  heading?: string;
  files?: FileItem[];
}

/**
 * Download cards for company profile / tender documents. Internal
 * (`/api/media/...`) links download in place; external links open in a
 * new tab.
 */
export default async function FileDownload({ props }: BlockComponentProps) {
  const p = props as FileDownloadProps;
  const files = (Array.isArray(p.files) ? p.files : []).filter(
    (f) => f && f.label && f.href,
  );
  if (files.length === 0) return null;

  return (
    <section className="section-pad">
      <div className="container-site">
        <SectionHeader kicker={p.kicker} heading={p.heading} />

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file, i) => {
            const internal = file.href.startsWith("/");
            return (
              <Reveal
                as="li"
                key={`${file.href}-${i}`}
                delay={(i % 3) * STAGGER.cards}
                className="h-full"
              >
                <a
                  href={file.href}
                  download={internal || undefined}
                  target={internal ? undefined : "_blank"}
                  rel={internal ? undefined : "noreferrer noopener"}
                  className="group flex h-full items-center justify-between gap-5 rounded-card border border-ink/10 bg-white p-6 transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1"
                >
                  <span>
                    <span className="block font-display text-lg font-semibold leading-tight text-ink">
                      {file.label}
                    </span>
                    {file.note ? (
                      <span className="mt-1.5 block text-sm text-stone">
                        {file.note}
                      </span>
                    ) : null}
                  </span>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-pill border border-ink/15 text-gold-deep transition-colors duration-300 group-hover:border-gold-deep">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 transition-transform duration-300 group-hover:translate-y-0.5"
                    >
                      <path d="M12 4v12M6.5 10.5 12 16l5.5-5.5M5 20h14" />
                    </svg>
                  </span>
                  <span className="sr-only">
                    {internal ? " (download)" : " (opens in a new tab)"}
                  </span>
                </a>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
