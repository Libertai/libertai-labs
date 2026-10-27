import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(["shipped", "experiment", "research"]),
    order: z.number(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    links: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});

const papers = defineCollection({
  loader: glob({ pattern: ["**/*.md", "!README.md"], base: "./src/content/papers" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    publishedAt: z.coerce.date().optional(),
    summary: z.string(),
    field: z.enum(["AI", "Physics"]).default("AI"),
    status: z.enum(["draft", "preprint", "published"]).default("preprint"),
    authors: z.string().optional(),
    pdf: z.string().optional(),
    doi: z.string().optional(),
    arxiv: z.string().optional(),
    sha256: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    links: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
  }),
});

const models = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/models" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(["shipped", "preview"]).default("shipped"),
    order: z.number(),
    date: z.coerce.date(),
    baseModel: z.string(),
    weights: z.string().url(),
    license: z.string().default("Apache-2.0"),
    metrics: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          note: z.string().optional(),
        }),
      )
      .default([]),
    links: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
  }),
});

export const collections = { projects, notes, papers, models };
