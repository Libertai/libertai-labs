# LibertAI Labs

The website for **labs.libertai.io**: the research, releases and public
priority record for LibertAI.

Built with [Astro 5](https://astro.build) and Tailwind CSS v4. All editorial
content is markdown. Paper PDFs are frozen release artifacts under
[`public/papers/`](public/papers/README.md), and the first-public timestamp
and SHA-256 of each PDF are exposed at [`/priority/`](https://labs.libertai.io/priority/).

This repository is the release surface. Keep private working notes, drafts and
data caches in the source repositories, not here.

## Pages

| Path | What it is |
|---|---|
| `/` | Landing page: latest work, models, projects, papers and notes |
| `/science/` | Overview of the two research programmes |
| `/science/ai/` | AI papers: decision models, model behaviour and measurement |
| `/science/physics/` | Physics papers: chronology, constructive program, synthesis and searches |
| `/#papers` | Every paper entry, including drafts and preprints |
| `/#notes` | Benchmarks and methodology writeups |
| `/#models` | Open-weight releases and quantized builds |
| `/#projects` | Project pages |
| `/priority/` | First-public timestamps, DOI links and PDF SHA-256 values |
| `/priority.json` | Machine-readable copy of the same registry |

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview  # serve dist/ locally
```

## Content model

| Collection | Path | What goes there |
|---|---|---|
| Projects | `src/content/projects/*.md` | One page per project. Frontmatter: `title`, `summary`, `status` (shipped / experiment / research), `order`, optional `image`, `imageAlt`, `links`. |
| Notes | `src/content/notes/*.md` | Launch writeups and benchmarks. Frontmatter: `title`, `date`, `summary`, optional `image`, `imageAlt`. |
| Papers | `src/content/papers/*.md` | One page per paper or preprint. Frontmatter: `title`, `date`, `publishedAt`, `summary`, `field` (`AI` or `Physics`), `status` (`draft` / `preprint` / `published`), optional `authors`, `pdf`, `doi`, `arxiv`, `sha256`, `image`, `imageAlt`, `links`. |
| Models | `src/content/models/*.md` | One page per model or quant. Frontmatter includes `metrics`, `weights`, `baseModel`, `license`, `status` and `order`. |

The science sections are generated from the `papers` collection:

- `field: AI` feeds `/science/ai/`.
- `field: Physics` feeds `/science/physics/`.
- Entries with `publishedAt` appear in `/priority/` and `/priority.json`.

Only add `publishedAt` when the paper is actually public. It is the UTC time
the record first became public here, not the manuscript date.

## Publishing a paper

1. Put the frozen PDF in [`public/papers/`](public/papers/README.md). Do not
   edit a published PDF in place; add a new file or a versioned filename.
2. Add or update the entry in `src/content/papers/`.
3. Set `date` to the manuscript date and `publishedAt` to the UTC release time.
4. Set `sha256` to the exact hash of the PDF:
   `sha256sum public/papers/<file>.pdf`.
5. Set `pdf` to `/papers/<file>.pdf` and `field` to `AI` or `Physics`.
6. Add the same paper to `scripts/zenodo-manifest.json`, run the dry run, mint
   the DOI, then add `doi: 10.5281/zenodo.<id>` to the frontmatter.
7. Build the site, commit, and deploy. The production workflow is
   `.github/workflows/deploy.yml`.
8. Create a GitHub release and tag on this repository for the release date,
   for example `papers-2026-10-27`, and attach the PDFs. The GitHub release
   timestamp is public; the Zenodo DOI is the citable priority record.

The release checklist is kept in the private coordination workspace, and the
public result is the `/priority/` registry plus the GitHub release tag.

## Priority and timestamps

`/priority/` is generated from paper frontmatter. It lists:

- the first-public `publishedAt` in UTC
- the exact `sha256` of the PDF served from `public/papers/`
- the Zenodo `doi` when one exists

`/priority.json` is the same data for scripts and verification. A paper page
also carries a priority block with the same values.

## Science sections

- **AI research** covers Deem and the abliteration paper. It links
  out to the model and note sections.
- **Physics** covers the time-machine and chronology programme, the
  explicit time-machine initial data, the BEC analogue, the engineering
  ledger, and the gravitational-wave and Gaia relic searches.

The sections are curated views over the paper collection. Adding a paper with
the right `field` puts it in the right section automatically.

## House style

- No em-dashes.
- No "not X, it's Y" constructions.
- No staccato fragment chains.
- Benchmark numbers come from a real run.
- State the loss next to the win.
- Preprints say they are preprints. Open items stay visible.

Brand assets (logo, Satoshi/Inter fonts) are vendored in `public/` from the
marketing asset set.
