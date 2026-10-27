#!/usr/bin/env python3
"""Mint Zenodo DOIs for the LibertAI Labs preprints.

Default is a dry run. Use --publish to create and publish the records.
The token is read from ZENODO_TOKEN, or from ZENODO_TOKEN_FILE, or from
~/.config/zenodo/token (mode 600). It needs deposit:write and
deposit:actions. Use --sandbox for sandbox.zenodo.org.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "scripts" / "zenodo-manifest.json"


def get_token() -> str | None:
    token = os.environ.get("ZENODO_TOKEN")
    if token:
        return token.strip()
    candidates = []
    if os.environ.get("ZENODO_TOKEN_FILE"):
        candidates.append(Path(os.environ["ZENODO_TOKEN_FILE"]))
    candidates.append(Path.home() / ".config" / "zenodo" / "token")
    for path in candidates:
        if path.is_file():
            return path.read_text().strip()
    return None


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def metadata(paper: dict, checksum: str, license_id: str, first_published: str) -> dict:
    description = (
        f"<p><strong>Preprint.</strong> {paper['summary']}</p>"
        f"<p>Published on LibertAI Labs: "
        f"<a href=\"{paper['labs_url']}\">{paper['labs_url']}</a>.</p>"
        f"<p>First public timestamp: {first_published} (UTC). "
        f"SHA-256 of the PDF: <code>{checksum}</code>.</p>"
    )
    related = [
        {
            "identifier": paper["labs_url"],
            "relation": "isDocumentedBy",
            "resource_type": "other",
        }
    ] + paper.get("related", [])
    return {
        "metadata": {
            "title": paper["title"],
            "upload_type": "publication",
            "publication_type": "preprint",
            "description": description,
            "creators": paper["creators"],
            "publication_date": paper["date"],
            "license": license_id,
            "keywords": paper["keywords"],
            "related_identifiers": related,
            "version": "1.0",
            "language": "eng",
            "access_right": "open",
            "imprint_publisher": "LibertAI Labs",
            "notes": (
                f"First public timestamp: {first_published} (UTC). "
                f"Labs record: {paper['labs_url']}. PDF SHA-256: {checksum}."
            ),
        }
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--publish", action="store_true", help="create and publish records")
    ap.add_argument("--sandbox", action="store_true", help="use sandbox.zenodo.org")
    ap.add_argument("--only", help="process one slug only")
    args = ap.parse_args()

    manifest = json.loads(MANIFEST.read_text())
    base = "https://sandbox.zenodo.org" if args.sandbox else "https://zenodo.org"
    token = get_token()
    if args.publish and not token:
        print(
            "No Zenodo token: set ZENODO_TOKEN, ZENODO_TOKEN_FILE, or "
            "~/.config/zenodo/token",
            file=sys.stderr,
        )
        return 2

    out = []
    for paper in manifest["papers"]:
        if args.only and paper["slug"] != args.only:
            continue
        pdf = ROOT / paper["pdf"]
        if not pdf.exists():
            print(f"missing PDF: {pdf}", file=sys.stderr)
            return 2
        checksum = sha256(pdf)
        meta = metadata(paper, checksum, manifest["license"], manifest["first_published"])
        print(f"[{paper['slug']}] {pdf.name}  sha256={checksum[:16]}…")
        if not args.publish:
            print(f"  would publish: {paper['title']}")
            continue

        headers = {"Authorization": f"Bearer {token}"}
        r = requests.post(f"{base}/api/deposit/depositions", json={}, headers=headers, timeout=60)
        r.raise_for_status()
        dep = r.json()
        dep_id = dep["id"]
        links = dep["links"]

        with pdf.open("rb") as f:
            r = requests.post(
                links["files"],
                headers=headers,
                files={"file": (pdf.name, f, "application/pdf")},
                timeout=300,
            )
        r.raise_for_status()

        r = requests.put(links["self"], json=meta, headers=headers, timeout=60)
        r.raise_for_status()

        r = requests.post(links["publish"], headers=headers, timeout=60)
        r.raise_for_status()
        record = r.json()
        doi = record.get("doi")
        print(f"  published: {doi}  {record.get('links', {}).get('record_html', '')}")
        out.append({"slug": paper["slug"], "id": dep_id, "doi": doi, "checksum": checksum})

    if out:
        path = ROOT / "scripts" / "zenodo-dois.json"
        path.write_text(json.dumps(out, indent=2) + "\n")
        print(f"wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
