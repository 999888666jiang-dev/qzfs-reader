#!/usr/bin/env python3
"""Validate public/data against the corpus contract.

Usage:
    python tools/validate_corpus.py --data public/data
    python tools/validate_corpus.py --data public/data --source "全法原本/《全职法师》作者：乱.txt"
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_corpus import AD_LINE_RES, ZERO_WIDTH, is_ad_line  # noqa: E402

ABS_PATH_RE = re.compile(r"(?:^|[\s\"'])(?:[A-Za-z]:\\|/Users/|/home/)")


def fail(msg: str) -> int:
    print(f"FAIL: {msg}", file=sys.stderr)
    return 1


def load_json(path: Path) -> dict:
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        raise ValueError(f"BOM not allowed: {path}")
    if b"\r\n" in raw:
        raise ValueError(f"CRLF not allowed: {path}")
    return json.loads(raw.decode("utf-8"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="public/data")
    parser.add_argument("--source", default=None)
    args = parser.parse_args(argv)
    data = Path(args.data)
    if not data.exists():
        return fail(f"data directory not found: {data}")

    try:
        meta = load_json(data / "meta.json")
        catalog = load_json(data / "catalog.json")
    except Exception as exc:  # noqa: BLE001
        return fail(f"cannot read meta/catalog: {exc}")

    chapters = catalog.get("chapters")
    if not isinstance(chapters, list):
        return fail("catalog.chapters is not a list")
    if len(chapters) != 3233:
        return fail(f"catalog.chapters length {len(chapters)} != 3233")
    nums = [row[0] for row in chapters]
    if nums != list(range(1, 3234)):
        return fail("catalog chapter numbers are not 1..3233 in order")

    status = {row[0]: row[3] for row in chapters}
    missing = set(meta.get("missing", []))
    if len(missing) != 132:
        return fail(f"missing count {len(missing)} != 132")
    if meta["chapters"]["available"] + meta["chapters"]["missing"] != 3233:
        return fail("meta available + missing != 3233")
    if {n for n, s in status.items() if s == 1} != missing:
        return fail("catalog status does not match meta.missing")

    total_chars = 0
    chapter_dir = data / "chapters"
    files = sorted(chapter_dir.glob("c*.json"))
    if len(files) != 3233:
        return fail(f"chapter files {len(files)} != 3233")

    for row in chapters:
        n, title, chars, st = row
        path = chapter_dir / f"c{n:04d}.json"
        if not path.exists():
            return fail(f"missing file {path.name}")
        try:
            payload = load_json(path)
        except Exception as exc:  # noqa: BLE001
            return fail(f"{path.name}: {exc}")
        if payload.get("n") != n:
            return fail(f"{path.name}: n mismatch")
        if not payload.get("title"):
            return fail(f"{path.name}: empty title")
        if st == 1:
            if not payload.get("missing") or payload.get("paras") != []:
                return fail(f"{path.name}: missing chapter is not a stub")
            continue
        paras = payload.get("paras")
        if not isinstance(paras, list) or not paras:
            return fail(f"{path.name}: no paragraphs")
        body = "\n".join(paras)
        if not body.strip():
            return fail(f"{path.name}: empty body")
        if chars != sum(len(p) for p in paras):
            return fail(f"{path.name}: chars mismatch")
        if any(p.search(body) for p in AD_LINE_RES) or is_ad_line(payload["title"]):
            return fail(f"{path.name}: ad marker remains")
        if payload["title"].count("\ufeff") or body.count("\ufeff"):
            return fail(f"{path.name}: BOM remains")
        zero_chars = [chr(k) for k in ZERO_WIDTH]
        if any(ch in body or ch in payload["title"] for ch in zero_chars):
            return fail(f"{path.name}: zero-width remains")
        if ABS_PATH_RE.search(body) or "http://" in body or "https://" in body:
            return fail(f"{path.name}: absolute path/URL in body")
        total_chars += chars

    if abs(total_chars - meta.get("chars", 0)) > max(1000, meta.get("chars", 1) * 0.01):
        return fail(f"total chars {total_chars} != meta.chars {meta.get('chars')}")

    if args.source:
        source = Path(args.source)
        if not source.exists():
            return fail(f"source not found: {source}")
        digest = hashlib.sha256(source.read_bytes()).hexdigest().upper()
        if digest != meta["source"]["sha256"]:
            return fail(f"source sha256 mismatch: {digest}")

    print(
        "PASS: "
        f"{len(chapters)} chapters, {len(missing)} missing, "
        f"{total_chars} chars, {len(files)} files"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
