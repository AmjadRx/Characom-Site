"use client";

import Link from "next/link";
import type { AriaAttributes, MouseEventHandler, ReactNode } from "react";
import type { NavigationItem } from "@/lib/content/types";

/**
 * Internal helper — renders a NavigationItem as either a Next <Link>
 * (internal path) or a plain <a> (absolute URL / newTab), with shared
 * aria plumbing. Not exported from the layout barrel.
 */
interface NavLinkProps extends AriaAttributes {
  item: NavigationItem;
  className?: string;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  tabIndex?: number;
}

export default function NavLink({
  item,
  className,
  children,
  onClick,
  tabIndex,
  ...aria
}: NavLinkProps) {
  const external = /^(https?:)?\/\//i.test(item.href);
  const content = children ?? item.label;

  if (external || item.newTab) {
    return (
      <a
        href={item.href}
        className={className}
        onClick={onClick}
        tabIndex={tabIndex}
        target={item.newTab ? "_blank" : undefined}
        rel={item.newTab ? "noopener noreferrer" : undefined}
        {...aria}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      onClick={onClick}
      tabIndex={tabIndex}
      {...aria}
    >
      {content}
    </Link>
  );
}
