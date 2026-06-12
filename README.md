# LibertAI Labs

The website for **labs.libertai.io**: the research and releases side of
LibertAI. It showcases published model quants, infrastructure writeups, and
agent experiments.

Built with [Astro](https://astro.build) and Tailwind CSS v4. All content is
markdown, so adding a launch writeup or a project costs one file.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

## Content model

| Collection | Path | What goes there |
|---|---|---|
| Projects | `src/content/projects/*.md` | One page per project. Frontmatter: `title`, `summary`, `status` (shipped / experiment / research), `order`, optional `image` + `imageAlt`, optional `links`. |
| Notes | `src/content/notes/*.md` | Launch writeups and benchmarks. Frontmatter: `title`, `date`, `summary`. |

House style for copy: no em-dashes, no "not X, it's Y" constructions, no
staccato fragment chains. Benchmark numbers must come from a real run and
losses get stated next to wins.

Brand assets (logo, Satoshi/Inter fonts) are vendored in `public/` from the
marketing asset set.
