"use client";

/**
 * Builder center pane — the selected block's edit form, auto-generated from
 * BLOCK_DEFS[type].fields via admin-core's renderField dispatcher.
 */

import { BLOCK_DEFS, type BlockType } from "@/lib/blocks/defs";
import type { Role, Section } from "@/lib/content/types";
import { Field, cardCls } from "@/components/admin/collections/kit";
import { IconWarning } from "@/components/admin/collections/icons";

export default function BlockForm({
  section,
  role,
  issues,
  onPropChange,
}: {
  section: Section;
  role: Role | null;
  issues: string[];
  onPropChange: (name: string, value: unknown) => void;
}) {
  const def = BLOCK_DEFS[section.type as BlockType];

  if (!def) {
    return (
      <div className={`${cardCls} p-6`}>
        <p className="text-sm text-red-700" role="alert">
          Unknown block type “{section.type}”. This section cannot be edited —
          delete it or restore its type in the content file.
        </p>
      </div>
    );
  }

  const locked = def.ownerOnly && role !== "owner";

  return (
    <div className={`${cardCls} p-6`}>
      <header className="mb-6 border-b border-ink/10 pb-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          {def.label}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-stone">
          {def.description}
        </p>
      </header>

      <div aria-live="polite">
        {issues.length > 0 ? (
          <div
            className="mb-5 rounded-card border border-red-200 bg-red-50 px-4 py-3"
            role="alert"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
              <IconWarning />
              This block has validation issues
            </p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-red-800">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {locked ? (
        <p className="rounded-card border border-gold/40 bg-gold/10 px-4 py-3 text-sm leading-relaxed text-gold-deep">
          Only the owner role can edit this block. Ask an owner to make
          changes, or delete the section.
        </p>
      ) : (
        <div className="space-y-5">
          {def.fields.map((field) => (
            <Field
              key={field.name}
              field={field}
              value={section.props[field.name]}
              onChange={(value) => onPropChange(field.name, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
