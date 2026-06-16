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

export const collections = { projects, notes };
