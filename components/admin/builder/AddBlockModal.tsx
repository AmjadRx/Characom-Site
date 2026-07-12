"use client";

/**
 * Grouped block picker for the builder. rawEmbed is only offered to the
 * "owner" role (BLOCK_DEFS[type].ownerOnly).
 */

import { useMemo, useState } from "react";
import { BLOCK_DEFS, type BlockType } from "@/lib/blocks/defs";
import type { Role } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { Modal, inputCls } from "@/components/admin/collections/kit";
import { IconSearch } from "@/components/admin/collections/icons";

const GROUPS: { label: string; types: BlockType[] }[] = [
  { label: "Heroes", types: ["hero", "pageHero"] },
  {
    label: "Storytelling",
    types: ["richText", "imageWithText", "timeline", "faq", "spacer"],
  },
  {
    label: "Portfolio",
    types: ["sectorCards", "featuredProjects", "categoryPanels", "projectGrid"],
  },
  {
    label: "People & trust",
    types: ["teamGrid", "logoWall", "testimonials", "careersList"],
  },
  { label: "News", types: ["newsList"] },
  {
    label: "Numbers & conversion",
    types: [
      "statsCounters",
      "ctaBand",
      "contactMethods",
      "contactForm",
      "mapEmbed",
      "fileDownload",
    ],
  },
  { label: "Advanced", types: ["rawEmbed"] },
];

export default function AddBlockModal({
  open,
  role,
  onClose,
  onPick,
}: {
  open: boolean;
  role: Role | null;
  onClose: () => void;
  onPick: (type: BlockType) => void;
}) {
  const [filter, setFilter] = useState("");

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return GROUPS.map((group) => ({
      label: group.label,
      types: group.types.filter((type) => {
        const def = BLOCK_DEFS[type];
        if (def.ownerOnly && role !== "owner") return false;
        if (!q) return true;
        return (
          def.label.toLowerCase().includes(q) ||
          def.description.toLowerCase().includes(q)
        );
      }),
    })).filter((group) => group.types.length > 0);
  }, [filter, role]);

  function handleClose() {
    setFilter("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add a block">
      <label className="relative mb-4 block">
        <span className="sr-only">Filter blocks</span>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone">
          <IconSearch />
        </span>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter blocks…"
          className={cn(inputCls, "pl-9")}
          autoFocus
        />
      </label>

      <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-1">
        {groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone">
            No blocks match “{filter}”.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">
                {group.label}
              </h3>
              <ul className="space-y-1.5">
                {group.types.map((type) => {
                  const def = BLOCK_DEFS[type];
                  return (
                    <li key={type}>
                      <button
                        type="button"
                        onClick={() => {
                          setFilter("");
                          onPick(type);
                        }}
                        className="w-full rounded-card border border-ink/10 bg-white px-3.5 py-2.5 text-left transition-colors hover:border-gold hover:bg-gold/5"
                      >
                        <span className="block text-sm font-medium text-ink">
                          {def.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-stone">
                          {def.description}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </Modal>
  );
}
