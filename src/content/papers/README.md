# Papers collection

One markdown file per paper. The file supplies the reading page, the card in
`/science/ai/` or `/science/physics/`, and the row in `/priority/` when
`publishedAt` is set.

## Frontmatter

```yaml
title: "Paper title"
date: 2026-10-27                 # manuscript date
publishedAt: 2026-10-27T16:15:00Z # first public time, UTC; omit until public
field: Physics                   # AI or Physics
status: preprint                 # draft, preprint or published
authors: Jonathan Schemoul
summary: "One or two sentences."
pdf: /papers/file.pdf            # optional; file in public/papers/
sha256: <exact PDF hash>         # required when pdf is set
doi: 10.5281/zenodo.<id>         # optional until minted
arxiv: 2610.xxxxx                # optional until assigned
links:
  - label: Source code
    href: https://github.com/...
```

The body is the abstract and the honest status/limits section. Keep the
preprint status visible. Do not claim peer review.

## Rules

- A paper appears in `/science/ai/` or `/science/physics/` by `field`.
- It appears in `/priority/` only if `publishedAt` is set.
- The `sha256` must match `public/papers/<file>.pdf`.
- If the PDF changes, use a new file or a new release timestamp and update
  `scripts/zenodo-manifest.json`.
- Manuscript-only entries can omit `pdf` and `sha256`; they still get a paper
  page and a science-section card.
