# Release scripts

`zenodo-manifest.json` describes the public papers and their exact PDFs.
`zenodo-publish.py` mints one Zenodo record per entry.

```sh
# dry run: validates paths and prints the hashes
python3 scripts/zenodo-publish.py

# mint the records
export ZENODO_TOKEN=...
python3 scripts/zenodo-publish.py --publish

# or store the token once, outside the repo, mode 600:
#   ~/.config/zenodo/token

```

The script writes `scripts/zenodo-dois.json`. Add each DOI to the matching
paper frontmatter and rebuild the site. It does not write tokens to disk.

Use `--sandbox` for sandbox.zenodo.org and `--only <slug>` for a single record.
