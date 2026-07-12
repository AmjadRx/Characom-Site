"use client";

import type { FieldDef } from "@/lib/blocks/defs";
import { TextField } from "./TextField";
import { TextareaField } from "./TextareaField";
import { NumberField } from "./NumberField";
import { BooleanField } from "./BooleanField";
import { SelectField } from "./SelectField";
import { LinkField } from "./LinkField";
import { ImageField } from "./ImageField";
import { ListField } from "./ListField";
import { RichTextField } from "./RichTextField";
import {
  asBoolean,
  asImage,
  asLink,
  asList,
  asNumber,
  asRichDoc,
  asString,
} from "./coerce";

export { TextField } from "./TextField";
export type { TextFieldProps } from "./TextField";
export { TextareaField } from "./TextareaField";
export type { TextareaFieldProps } from "./TextareaField";
export { NumberField } from "./NumberField";
export type { NumberFieldProps } from "./NumberField";
export { BooleanField } from "./BooleanField";
export type { BooleanFieldProps } from "./BooleanField";
export { SelectField } from "./SelectField";
export type { SelectFieldProps } from "./SelectField";
export { LinkField, EMPTY_LINK } from "./LinkField";
export type { LinkFieldProps, LinkValue } from "./LinkField";
export { ImageField, EMPTY_IMAGE } from "./ImageField";
export type { ImageFieldProps, ImageValue } from "./ImageField";
export { ListField } from "./ListField";
export type { ListFieldProps } from "./ListField";
export { RichTextField } from "./RichTextField";
export type { RichTextFieldProps } from "./RichTextField";
export { FieldShell, inputClass } from "./FieldShell";
export * from "./coerce";

/**
 * Declarative form dispatcher — renders the right field component for a
 * FieldDef from lib/blocks/defs.ts. Used by the page-builder to auto-generate
 * block edit forms. Values arrive as `unknown` (JSON props) and are coerced.
 */
export function renderField(
  field: FieldDef,
  value: unknown,
  onChange: (value: unknown) => void,
  error?: string,
): React.ReactNode {
  switch (field.kind) {
    case "text":
      return (
        <TextField
          key={field.name}
          label={field.label}
          help={field.help}
          error={error}
          value={asString(value)}
          onChange={onChange}
        />
      );
    case "textarea":
      return (
        <TextareaField
          key={field.name}
          label={field.label}
          help={field.help}
          error={error}
          value={asString(value)}
          onChange={onChange}
        />
      );
    case "number":
      return (
        <NumberField
          key={field.name}
          label={field.label}
          help={field.help}
          error={error}
          value={asNumber(value)}
          onChange={onChange}
        />
      );
    case "boolean":
      return (
        <BooleanField
          key={field.name}
          label={field.label}
          help={field.help}
          error={error}
          value={asBoolean(value)}
          onChange={onChange}
        />
      );
    case "select":
      return (
        <SelectField
          key={field.name}
          label={field.label}
          help={field.help}
          error={error}
          options={field.options ?? []}
          value={asString(value) || (field.options?.[0]?.value ?? "")}
          onChange={onChange}
        />
      );
    case "link":
      return (
        <LinkField
          key={field.name}
          label={field.label}
          help={field.help}
          error={error}
          value={asLink(value)}
          onChange={onChange}
        />
      );
    case "image":
      return (
        <ImageField
          key={field.name}
          label={field.label}
          help={field.help}
          error={error}
          value={asImage(value)}
          onChange={onChange}
        />
      );
    case "list":
      return (
        <ListField
          key={field.name}
          label={field.label}
          help={field.help}
          error={error}
          itemFields={field.itemFields ?? []}
          itemLabel={field.itemLabel}
          value={asList(value)}
          onChange={onChange}
        />
      );
    case "richtext":
      return (
        <RichTextField
          key={field.name}
          label={field.label}
          help={field.help}
          error={error}
          value={asRichDoc(value)}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
}
