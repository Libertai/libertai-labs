import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  const papers = (await getCollection("papers"))
    .filter((paper) => paper.data.publishedAt)
    .sort(
      (a, b) =>
        a.data.publishedAt!.valueOf() - b.data.publishedAt!.valueOf() ||
        a.data.title.localeCompare(b.data.title),
    );

  const registry = {
    registry: "https://labs.libertai.io/priority",
    firstPublished: "2026-10-27T16:15:00Z",
    papers: papers.map((paper) => ({
      id: paper.id,
      title: paper.data.title,
      authors: paper.data.authors ?? null,
      field: paper.data.field,
      status: paper.data.status,
      manuscriptDate: paper.data.date.toISOString(),
      firstPublished: paper.data.publishedAt!.toISOString(),
      doi: paper.data.doi ?? null,
      arxiv: paper.data.arxiv ?? null,
      pdf: paper.data.pdf ?? null,
      sha256: paper.data.sha256 ?? null,
      page: `/papers/${paper.id}/`,
    })),
  };

  return new Response(JSON.stringify(registry, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
