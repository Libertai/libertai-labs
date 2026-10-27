# Paper PDFs

This folder is the frozen release surface for the nine time-travel papers.
Each PDF is the exact file served to readers, hashed in the paper frontmatter
and listed in the priority registry at <https://labs.libertai.io/priority/>.

Do not edit a published PDF in place. If a paper changes, add the new file,
update the paper entry's `sha256` and `pdf`, update
`scripts/zenodo-manifest.json`, and record the new release.

## Current release set

| PDF | Paper | Pages | SHA-256 |
|---|---|---:|---|
| `protection-without-teeth.pdf` | Protection without teeth | 21 | `1777dac8972ab9915c5cd750f63f4a935af6d3af0db565c75e46aa887952b6ea` |
| `hybrid-construction.pdf` | Initial data for a time machine from dust | 15 | `6b6844a17539016302b1a2c26b2b05d0399975bee47092004267f4243443b866` |
| `xavier-analysis.pdf` | Quotient structure and on-generator diagnostics | 24 | `c65082bba90f0b3cd4af61defb55812a8220861b50d044058d29117db6959399` |
| `relic-survey.pdf` | Boost-holonomy relics in the gravitational-wave catalog | 27 | `ea82d8d45406a8fd15d8ad646d5d1e8f64a157c8f66eddca6517a0d6fe9be338` |
| `gaia-survey.pdf` | Gaia boost-holonomy relic census | 30 | `217edf6b05d4c364f686d7de4764cefe772f0c6ce4f102abfc01eed26f117366` |
| `bec-analog.pdf` | BEC analogue of Misner space | 25 | `4269524fa02eb283c6c00ec3d41b6b6bda3fe27b3a5084df494ac4b0d5b67d5d` |
| `review.pdf` | Time travel: a critical review | 36 | `a03245b1468dc21e36d2b9fa4050c08eccf3363c754fb02b5554a6c4c25586a5` |
| `acquisition.pdf` | Acquisition, not assembly | 22 | `8e76faa9cb7f18aaaf76c8fef345281527b08a6591f8442495217221a517e4ca` |
| `engineering-ledger.pdf` | The engineering ledger of a time machine | 18 | `0a39c34ba3dcf3ac3eb3d9f2be5772e9d6e8016c3006695525e3c513ebc5d718` |

The AI papers are manuscript-only entries in `src/content/papers/`; they have
no PDF in this folder.

## Adding or replacing a PDF

1. Add the file here with a stable, descriptive name.
2. Compute the hash:
   `sha256sum public/papers/<file>.pdf`.
3. Update the paper entry in `src/content/papers/` with the new `pdf` path,
   `sha256`, page count, and `publishedAt` if this is a new public release.
4. Add or update the same paper in `scripts/zenodo-manifest.json`.
5. Add a row above and keep the table in release order.
6. Run `npm run build` and check `/priority.json` contains the new hash.
7. Commit, deploy, and create a GitHub release tag for the release date.

The PDFs are linked from paper pages and, once minted, from their Zenodo DOIs.
The source repositories keep the working notes; only release PDFs belong here.
