import type { BlockComponentProps } from "@/components/blocks/registry";
import type { ThemeColor } from "@/lib/content/types";
import { getCategories, getProjects } from "@/lib/content";
import ProjectGridClient, {
  type ProjectGridItem,
} from "./client/ProjectGridClient";

interface ProjectGridProps {
  categorySlug?: string;
  showFilters?: boolean;
}

/**
 * §5.3 Project grid — server component resolves the category (block prop
 * wins, then page context, empty = all published projects), fetches the
 * list and hands a plain serializable array to the client FLIP grid.
 */
export default async function ProjectGrid({ props, ctx }: BlockComponentProps) {
  const p = props as ProjectGridProps;
  const categorySlug = p.categorySlug || ctx.categorySlug || "";

  const [projects, categories] = await Promise.all([
    getProjects(categorySlug ? { categorySlug } : undefined),
    getCategories(),
  ]);

  const categorySlugById = new Map(categories.map((c) => [c.id, c.slug]));
  const theme: ThemeColor =
    ctx.theme ??
    (categorySlug
      ? categories.find((c) => c.slug === categorySlug)?.themeColor
      : undefined) ??
    "gold";

  const items: ProjectGridItem[] = projects
    .map((project) => ({
      id: project.id,
      name: project.name,
      slug: project.slug,
      categorySlug: categorySlugById.get(project.categoryId) ?? "",
      location: project.location,
      year: project.year,
      status: project.status,
      coverImage: project.coverImage,
      coverImageAlt: project.coverImageAlt,
    }))
    .filter((item) => item.categorySlug !== "");

  return (
    <section className="section-pad">
      <div className="container-site">
        <ProjectGridClient
          items={items}
          showFilters={p.showFilters !== false}
          theme={theme}
        />
      </div>
    </section>
  );
}
