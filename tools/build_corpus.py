#!/usr/bin/env python3
"""Build the static corpus for the 全职法师 reader.

Input : UTF-8/UTF-16 novel text (multi-pass scrape, known to be incomplete).
Output: public/data/{meta.json,catalog.json,chapters/cNNNN.json}
        reports/quality-report.json + reports/manual-review.csv

Only the Python 3.12 standard library is used. The output is deterministic
except for `builtAt` (use --deterministic for tests).
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import shutil
import statistics
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = 1
TOOL_VERSION = "build_corpus.py@1"
DEFAULT_TOTAL = 3233

HEAD_RE = re.compile(
    r"^(?P<indent>[ \t\u3000\u00a0]*)(?P<label>第[ \t\u3000\u00a0]*(?P<num>\d+)[ \t\u3000\u00a0]*章)(?P<rest>.*)$"
)
PAGE_SUFFIX_RE = re.compile(r"[（(]第\s*\d+\s*/\s*\d+\s*页[）)]")
MEMBER_RE = re.compile(r"(?:是)?由「[^」]*」[^\n]*?(?:会员手打|小说网)[^\n]*")
TITLE_JUNK_RE = re.compile(r"请点击下一页|点击下一页|——>>")
AD_LINE_RES = [
    re.compile(r"如您已阅读到此章节"),
    re.compile(r"笔趣阁|小-说-网"),
    re.compile(r"请记住.{0,40}(?:网址|域名|www\.)"),
    re.compile(r"百度.{0,8}搜索"),
    re.compile(r"最新章节.{0,6}上传"),
    re.compile(r"(?:https?://|www\.)"),
    re.compile(r"会员手打"),
    re.compile(r"^（第\d+/\d+页）$"),
]
# Inline site junk: truncate from the marker to the end of the paragraph.
TRUNCATE_RES = [
    re.compile(r"请用小写字母输入网址.*$"),
    re.compile(r"记住手机版网址.*$"),
    re.compile(r"请用搜索引擎.*$"),
    re.compile(r"完美破防盗章节.*$"),
    re.compile(r"书客居.*$"),
    re.compile(r"蚂蚁阅读网.*$"),
    re.compile(r"readChapter\d+.*$", re.IGNORECASE),
    re.compile(r"加入书签.*$"),
    re.compile(r"章节错误.*$"),
    re.compile(r"手机用户请浏览阅读.*$"),
    re.compile(r"请记住[^。]{0,40}阅读网.*$"),
    re.compile(r"https?:\s*\d+.*$"),
]
# Promotional author notes in parentheses, e.g. 求月票 / 订阅 / 打赏 / 公众号.
PROMO_PAREN_RE = re.compile(
    r"[（(][^（）()]{0,200}(?:求月票|求推荐票|推荐票|月票|订阅|收藏本书|收藏一下|打赏|加更|断更|"
    r"上架|新书|首发|微信公众号|公众号|QQ群|书友群|手机版网址|阅读器|正版|盗版|"
    r"章节错误|防盗章节)[^（）()]{0,200}[）)]"
)
PROMO_BRACKET_RE = re.compile(
    r"【[^【】]{0,300}(?:求月票|求推荐票|推荐票|月票|订阅|收藏|打赏|加更|断更|上架|新书|"
    r"公众号|微信|QQ|网址|阅读器|盗版|正版)[^【】]{0,300}】"
)
# Whole-line promotional notes / site ads that are not parenthesized.
PROMO_LINE_RES = [
    re.compile(
        r"本站网址|手机版更新最快|手机版网址|顶点[^\s，。；]{0,8}更新最快|最快更新无错|"
        r"请收藏本站|请访问.*本站|中文网】|readx|readChapter|追书神器|手机免费阅读器|"
        r"免费阅读器|无弹窗|txt下载|蚂蚁阅读网|书客居|笔趣阁|云来阁|移动网|内容更新后|"
        r"重新刷新页面|获取最新更新"
    ),
    re.compile(r"公众号|QQ阅读|微信阅读|起点中文网|创世中文网|作家荣耀堂|粉丝节"),
    re.compile(r"新书.*(?:发布|起点|QQ阅读|微信阅读|创世|网站)"),
    re.compile(r"百度一下.*(?:书法网|公益|签到)"),
    re.compile(r"ps[•·].*(?:更新|票|起点)"),
    re.compile(
        r"求月票|求推荐票|推荐票|月票|订阅正版|订阅本书|打赏|加更|断更|上架|"
        r"每天.*章更新|明天.*更新|今天.*更新|更新完这章"
    ),
    re.compile(r"收藏.*(?:本书|书架|最新章节|更新提醒|阅读)"),
    re.compile(r"微信.*(?:公众号|红包|书币|加我|luanshu)"),
    re.compile(r"^(?:https?:?|\d{4,6}\s*\.)$"),
]
SITE_INLINE_REMOVE_RES = [
    re.compile(r"顶点[^\s，。；]{0,8}更新最快[；;]?"),
    re.compile(r"手机版更新最快网址[:：]?\s*m\.?", re.IGNORECASE),
    re.compile(r"手机用户请访问手机网址[^。；]*"),
    re.compile(r"本站网址[:：]?[^。；]*"),
    re.compile(r"最快更新无错阅读.*$"),
    re.compile(r"中文网】.*$"),
    re.compile(r"readx;.*$", re.IGNORECASE),
    re.compile(r"（\d{4,6}\s*\.）"),
    re.compile(r"[^\s，。；：！？]{2,30}一章节已更新[；;]?"),
    re.compile(r"一章节已更新[；;]?"),
    re.compile(r"请大家搜索[！!]?\s*更新最快[的]?[；;，。]?"),
    re.compile(r"更新最快的?[；;，。]?"),
]
SITE_RESIDUE_RE = re.compile(r"\.{1,2}(?:com|net|org)|www\.", re.IGNORECASE)
STRONG_PROMO_RE = re.compile(
    r"求月票|求推荐票|求票|推荐票|月票|订阅|打赏|加更|断更|上架|新书.{0,20}(?:发布|连载)|"
    r"书评区|粉丝节|公众号|QQ阅读|微信阅读|起点中文网|创世中文网|本站网址|手机版|阅读器|"
    r"txt下载|无弹窗|防盗章节|章节错误|作家荣耀堂|免费阅读|看书神器|百度搜关键词|"
    r"更新章|更新时间|每天.{0,8}章更新|明天.{0,8}更新|今天.{0,8}更新|更新完|"
    r"乱叔|乱盟|书友|读者群|收藏本书|加入书架|最新章节|盗版|正版|"
    r"起点.{0,12}(?:书评|粉丝|票|中文网|APP|阅读)|微信.{0,12}(?:号|红包|书币|加我|luhu|luanshu)|"
    r"手机下载APP|重要内容|全职法师.{0,12}(?:更新|上架|订阅)|更新变更|中场休息|四年小说|"
    r"投票|断个更|更新稳定|写小说.{0,12}(?:更新|断更)|移动网|内容更新后|重新刷新页面|获取最新更新|"
    r"稳定更新|这几天更新|更新都是小章|看书的朋友|第一时间找到本站|——.{0,40}(?:更新|支持|抱歉)"
)
NOTE_START_RE = re.compile(r"^(?:（|\(|【|——|—|ps|PS|重要内容|乱语)")
NOTE_WORD_RE = re.compile(
    r"更新|章节|写|稿|作者|读者|票|订阅|收藏|月票|推荐|加更|断更|新书|上架|访谈|小说|群|微信|公众号"
)
ZERO_WIDTH = dict.fromkeys(map(ord, "\ufeff\u200b\u200c\u200d\u2060\u00ad"), None)
TITLE_NOTE_WORDS = ("新书", "发布", "更新", "月票", "推荐票")
TRAILING_PAREN_RE = re.compile(r"[（(]([^（）()]{1,60})[）)]\s*$")


@dataclass
class Candidate:
    n: int
    line: int
    indent: bool
    title_raw: str
    body_raw: str
    title: str = ""
    paras: list[str] = field(default_factory=list)
    chars: int = 0
    score: float = 0.0
    reasons: list[str] = field(default_factory=list)


def strip_invis(text: str) -> str:
    return text.translate(ZERO_WIDTH)


def decode_text(raw: bytes) -> str:
    if raw.startswith(b"\xff\xfe"):
        return raw.decode("utf-16-le")
    if raw.startswith(b"\xfe\xff"):
        return raw.decode("utf-16-be")
    if raw.startswith(b"\xef\xbb\xbf"):
        return raw.decode("utf-8-sig")
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw.decode("gb18030")


def is_ad_line(text: str) -> bool:
    s = text.strip()
    if not s or len(s) >= 200:
        return False
    return any(p.search(s) for p in AD_LINE_RES)


def clean_inline(text: str, stats: dict) -> str:
    before = text
    text = PAGE_SUFFIX_RE.sub("", text)
    text = MEMBER_RE.sub("", text)
    text = re.sub(r"最新章节已上传；?", "", text)
    text = re.sub(r"（第\d+/\d+页）", "", text)
    text = text.replace("顶点•更新最快", "").replace("顶点·更新最快", "")
    text = text.replace("手机用户请浏览阅读，更优质的阅读体验。", "")
    text = PROMO_PAREN_RE.sub("", text)
    text = PROMO_BRACKET_RE.sub("", text)
    for pattern in SITE_INLINE_REMOVE_RES:
        text = pattern.sub("", text)
    text = SITE_RESIDUE_RE.sub("", text)
    for pattern in TRUNCATE_RES:
        text = pattern.sub("", text)
    text = re.sub(r"==\s*$", "", text)
    ad_changed = text != before
    text = re.sub(r"[ \t\u3000\u00a0]+", " ", text).strip()
    if ad_changed:
        stats["adSuffixes"] += 1
    return text


def clean_title(raw: str) -> str:
    title = strip_invis(raw)
    title = PAGE_SUFFIX_RE.sub("", title)
    title = MEMBER_RE.sub("", title)
    title = re.sub(r"最新章节.{0,6}上传；?", "", title)
    title = re.sub(r"[ \t\u3000\u00a0]+", " ", title).strip(" \t\u3000\u00a0:：")
    while True:
        m = TRAILING_PAREN_RE.search(title)
        if not m:
            break
        inner = m.group(1)
        if any(w in inner for w in TITLE_NOTE_WORDS) and len(inner) > 8:
            title = title[: m.start()].rstrip()
            continue
        break
    return title.strip(" \t\u3000\u00a0:：")


def clean_body(raw: str, stats: dict) -> list[str]:
    paras: list[str] = []
    for line in raw.split("\n"):
        s = strip_invis(line).strip(" \t\u3000\u00a0")
        if not s:
            continue
        if HEAD_RE.match(s):
            stats["falseHeadingLines"] += 1
            continue
        if is_ad_line(s):
            stats["adLines"] += 1
            continue
        s = clean_inline(s, stats)
        if not s:
            continue
        if (
            is_ad_line(s)
            or (len(s) < 600 and STRONG_PROMO_RE.search(s))
            or (len(s) < 1200 and NOTE_START_RE.match(s) and NOTE_WORD_RE.search(s))
            or (len(s) < 400 and re.match(r"^(?:ps|PS|重要内容|乱语|——)", s) and PROMO_LINE_RES[0].search(s))
        ):
            stats["adLines"] += 1
            continue
        if len(s) < 400 and any(p.search(s) for p in PROMO_LINE_RES):
            stats["adLines"] += 1
            continue
        paras.append(s)
    return paras


def parse_candidates(text: str, stats: dict) -> list[Candidate]:
    text = strip_invis(text).replace("\r\n", "\n").replace("\r", "\n")
    lines = text.split("\n")
    raw: list[Candidate] = []

    for idx, line in enumerate(lines):
        m = HEAD_RE.match(line)
        if not m:
            continue
        stats["headings"] += 1
        n = int(m.group("num"))
        rest = m.group("rest")
        title_raw = rest.lstrip(" \t\u3000\u00a0:：").strip(" \t\u3000\u00a0")
        if len(title_raw) > 60:
            stats["longTitles"] += 1
            continue
        raw.append(
            Candidate(
                n=n,
                line=idx + 1,
                indent=bool(m.group("indent")),
                title_raw=title_raw,
                body_raw="",
            )
        )

    # Slice bodies against every raw heading (including ones that will be
    # dropped as false positives), so no text is lost between headings.
    for k, item in enumerate(raw):
        start = item.line  # 0-based index of the line after the heading
        end = raw[k + 1].line - 1 if k + 1 < len(raw) else len(lines)
        item.body_raw = "\n".join(lines[start:end])

    return raw


def normalize_title(title: str) -> str:
    return re.sub(r'[\s\u3000，,。.！!？?：:；;、\-—…·「」『』“”"\'（）()]', "", title or "")


def load_supplement(supplement_dir: Path, stats: dict) -> dict[int, Candidate]:
    """Read optional supplement/*.txt; only fill chapters that are missing."""
    result: dict[int, Candidate] = {}
    if not supplement_dir or not supplement_dir.exists():
        return result
    for path in sorted(supplement_dir.glob("*.txt")):
        text = decode_text(path.read_bytes())
        for c in parse_candidates(text, stats):
            c.title = clean_title(c.title_raw)
            c.paras = clean_body(c.body_raw, stats)
            c.chars = sum(len(p) for p in c.paras)
            if c.chars < 50 or is_ad_line(c.title):
                continue
            old = result.get(c.n)
            if old is None or c.chars > old.chars:
                result[c.n] = c
    return result


def build(
    input_path: Path,
    out_dir: Path,
    report_path: Path,
    total: int = DEFAULT_TOTAL,
    supplement_dir: Path | None = None,
    deterministic: bool = False,
) -> dict:
    raw_bytes = input_path.read_bytes()
    text = decode_text(raw_bytes)
    stats = {
        "headings": 0,
        "falsePositive": 0,
        "adHeadings": 0,
        "longTitles": 0,
        "falseHeadingLines": 0,
        "adLines": 0,
        "adSuffixes": 0,
        "bomRemoved": text.count("\ufeff"),
        "emptyTitles": 0,
        "pickedLater": 0,
    }

    overrides_path = Path(__file__).resolve().parent / "overrides.json"
    overrides = {"selection": {}, "titles": {}, "dropLines": []}
    if overrides_path.exists():
        overrides.update(json.loads(overrides_path.read_text(encoding="utf-8")))

    candidates = parse_candidates(text, stats)
    drop_lines = {int(x) for x in overrides.get("dropLines", [])}
    if drop_lines:
        candidates = [c for c in candidates if c.line not in drop_lines]

    for c in candidates:
        c.title = clean_title(c.title_raw)
        c.paras = clean_body(c.body_raw, stats)
        c.chars = sum(len(p) for p in c.paras)

    title_sets: dict[int, set[str]] = defaultdict(set)
    raw_title_sets: dict[int, set[str]] = defaultdict(set)
    for c in candidates:
        if not c.indent:
            raw_title_sets[c.n].add(c.title_raw)
        if c.title:
            title_sets[c.n].add(c.title)
    title_conflicts_raw = sum(1 for titles in raw_title_sets.values() if len(titles) > 1)
    title_conflicts_exact = sum(1 for titles in title_sets.values() if len(titles) > 1)
    norm_title_sets: dict[int, set[str]] = defaultdict(set)
    for c in candidates:
        if c.title:
            norm_title_sets[c.n].add(normalize_title(c.title))
    title_conflicts_norm = sum(1 for titles in norm_title_sets.values() if len(titles) > 1)

    column0 = {c.n for c in candidates if not c.indent}
    kept: list[Candidate] = []
    for c in candidates:
        if c.indent and c.n in column0:
            # A real chapter that only appears indented (e.g. 1523) can still
            # have a column-0 twin that is an empty ad/false heading. Drop the
            # indented row only when it is empty or itself an ad.
            if c.chars < 50 or is_ad_line(c.title) or TITLE_JUNK_RE.search(c.title):
                stats["falsePositive"] += 1
                continue
            c.reasons.append("缩进重复候选")
        if is_ad_line(c.title) or TITLE_JUNK_RE.search(c.title):
            stats["adHeadings"] += 1
            continue
        kept.append(c)

    groups: dict[int, list[Candidate]] = defaultdict(list)
    for c in kept:
        groups[c.n].append(c)

    supp_stats = {k: 0 for k in stats}
    supplement = load_supplement(supplement_dir, supp_stats) if supplement_dir else {}
    supplement_used: list[int] = []

    valid_lengths = [c.chars for cs in groups.values() for c in cs if c.chars >= 50]
    global_median = int(statistics.median(valid_lengths)) if valid_lengths else 2000

    records: list[dict] = []
    missing: list[int] = []
    manual_rows: list[dict] = []
    needs_manual: list[dict] = []
    selected_map: dict[int, Candidate] = {}

    for n in range(1, total + 1):
        cands = [c for c in groups.get(n, []) if c.chars >= 50]
        if not cands and n in supplement:
            sc = supplement[n]
            title = sc.title or f"第{n}章"
            records.append(
                {
                    "n": n,
                    "title": title,
                    "chars": sc.chars,
                    "status": 0,
                    "line": sc.line,
                    "missing": False,
                    "paras": sc.paras,
                }
            )
            supplement_used.append(n)
            continue
        if not cands:
            missing.append(n)
            records.append(
                {
                    "n": n,
                    "title": "（原文缺失）",
                    "chars": 0,
                    "status": 1,
                    "line": None,
                    "missing": True,
                    "paras": [],
                }
            )
            continue

        median = statistics.median([c.chars for c in cands]) if len(cands) > 1 else global_median
        for c in cands:
            score = 0.0
            ad_hits = sum(1 for p in c.paras if is_ad_line(p))
            if is_ad_line(c.title):
                ad_hits += 1
            score += ad_hits * 1000
            score += (c.title + "".join(c.paras)).count("\u26b9") * 20
            if not c.title:
                score += 200
            if any(w in c.title for w in TITLE_NOTE_WORDS) and len(c.title) > 8:
                score += 150
            if "缩进重复候选" in c.reasons:
                score += 200
            if c.chars < 500:
                score += 300
            elif c.chars < 1000:
                score += 150
            score += abs(c.chars - median) / max(median, 1) * 120
            score -= c.line / 1_000_000  # tie-break: prefer the later pass
            c.score = score

        cands.sort(key=lambda c: (c.score, -c.line))
        chosen = cands[0]
        reasons: list[str] = []
        titles = {normalize_title(c.title) for c in cands if c.title}
        if len(titles) > 1:
            reasons.append("标题冲突")
        if len(cands) > 1 and (cands[1].score - cands[0].score) < 10 and (
            normalize_title(cands[0].title) != normalize_title(cands[1].title)
        ):
            reasons.append("前两名分差<10")
        if len(cands) > 1 and chosen.line > min(c.line for c in cands):
            stats["pickedLater"] += 1

        title = chosen.title
        if not title:
            titled = [c.title for c in cands if c.title]
            title = titled[0] if titled else f"第{n}章"
            stats["emptyTitles"] += 1

        selected_map[n] = chosen
        records.append(
            {
                "n": n,
                "title": title,
                "chars": chosen.chars,
                "status": 0,
                "line": chosen.line,
                "missing": False,
                "paras": chosen.paras,
            }
        )

        if len(cands) > 1 or reasons:
            manual_rows.append(
                {
                    "n": n,
                    "candidateCount": len(cands),
                    "chosenLine": chosen.line,
                    "chosenTitle": title,
                    "chosenChars": chosen.chars,
                    "score": round(chosen.score, 3),
                    "top2Gap": round(cands[1].score - chosen.score, 3) if len(cands) > 1 else "",
                    "titles": " | ".join(dict.fromkeys(c.title for c in cands if c.title)),
                    "needsManual": "yes" if reasons else "no",
                    "reason": "；".join(reasons),
                }
            )
        if reasons:
            needs_manual.append(
                {
                    "n": n,
                    "titles": [c.title for c in cands],
                    "pickedLine": chosen.line,
                    "reason": "；".join(reasons),
                }
            )

    # Apply manual title overrides after selection.
    title_overrides = {int(k): v for k, v in overrides.get("titles", {}).items()}
    for rec in records:
        if rec["n"] in title_overrides:
            rec["title"] = title_overrides[rec["n"]]

    missing_ranges = []
    if missing:
        start = prev = missing[0]
        for n in missing[1:]:
            if n == prev + 1:
                prev = n
            else:
                missing_ranges.append([start, prev])
                start = prev = n
        missing_ranges.append([start, prev])

    total_chars = sum(r["chars"] for r in records)
    title_conflicts = sum(1 for r in manual_rows if r["needsManual"] == "yes")
    duplicate_groups = sum(1 for n, cs in groups.items() if len([c for c in cs if c.chars >= 50]) > 1)
    short_chapters = [r["n"] for r in records if 0 < r["chars"] < 500]
    redactions = sum((r["title"] + "".join(r["paras"])).count("\u26b9") for r in records)

    meta = {
        "schema": SCHEMA,
        "book": {"title": "全职法师", "author": "乱"},
        "chapters": {"total": total, "available": total - len(missing), "missing": len(missing)},
        "chars": total_chars,
        "missing": missing,
        "source": {
            "file": input_path.name,
            "bytes": len(raw_bytes),
            "sha256": hashlib.sha256(raw_bytes).hexdigest().upper(),
        },
        "builtAt": (
            "2026-11-21T00:00:00+08:00"
            if deterministic
            else datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
        ),
        "tool": TOOL_VERSION,
    }

    volumes = []
    for i, start in enumerate(range(1, total + 1, 100), 1):
        volumes.append(
            {
                "id": f"v{i:02d}",
                "label": f"第 {i} 卷",
                "from": start,
                "to": min(start + 99, total),
            }
        )

    catalog = {
        "schema": SCHEMA,
        "volumes": volumes,
        "chapters": [[r["n"], r["title"], r["chars"], r["status"]] for r in records],
    }

    report = {
        "schema": SCHEMA,
        "source": {
            "file": input_path.name,
            "bytes": len(raw_bytes),
            "sha256": meta["source"]["sha256"],
            "chars": len(text),
        },
        "candidates": {
            "headings": stats["headings"],
            "falsePositive": stats["falsePositive"],
            "longTitles": stats["longTitles"],
            "adHeadings": stats["adHeadings"],
            "uniqueNumbers": len(groups),
            "duplicateGroups": duplicate_groups,
            "titleConflicts": title_conflicts_exact,
            "titleConflictsRaw": title_conflicts_raw,
            "titleConflictsNormalized": title_conflicts_norm,
        },
        "missing": {"count": len(missing), "ranges": missing_ranges, "numbers": missing},
        "supplement": {"used": supplement_used, "count": len(supplement_used)},
        "selection": {
            "policy": "clean-complete-later-v1",
            "pickedLater": stats["pickedLater"],
            "needsManualCount": title_conflicts,
            "needsManual": needs_manual,
        },
        "cleaning": {
            "adLines": stats["adLines"],
            "adSuffixes": stats["adSuffixes"],
            "bomRemoved": stats["bomRemoved"],
            "falseHeadingLines": stats["falseHeadingLines"],
            "emptyTitles": stats["emptyTitles"],
            "redactionsRaw": text.count("\u26b9"),
        },
        "anomalies": {
            "shortChapters": short_chapters,
            "redactions": redactions,
            "titleConflicts": [x["n"] for x in needs_manual],
        },
        "chapters": {"total": total, "available": total - len(missing), "missing": len(missing)},
        "chars": total_chars,
    }

    write_outputs(out_dir, records, meta, catalog)
    write_reports(report_path, report, manual_rows)
    return report


def write_outputs(out_dir: Path, records: list[dict], meta: dict, catalog: dict) -> None:
    tmp = out_dir.with_name(out_dir.name + ".tmp")
    if tmp.exists():
        shutil.rmtree(tmp)
    (tmp / "chapters").mkdir(parents=True)
    write_json(tmp / "meta.json", meta)
    write_json(tmp / "catalog.json", catalog)
    for rec in records:
        payload = {"n": rec["n"], "title": rec["title"]}
        if rec["missing"]:
            payload.update({"missing": True, "paras": [], "srcLine": None})
        else:
            payload.update({"paras": rec["paras"], "srcLine": rec["line"]})
        write_json(tmp / "chapters" / f"c{rec['n']:04d}.json", payload)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    tmp.rename(out_dir)


def write_reports(report_path: Path, report: dict, manual_rows: list[dict]) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    write_json(report_path, report)
    csv_path = report_path.with_name("manual-review.csv")
    fields = [
        "n",
        "candidateCount",
        "chosenLine",
        "chosenTitle",
        "chosenChars",
        "score",
        "top2Gap",
        "titles",
        "needsManual",
        "reason",
    ]
    with csv_path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(sorted(manual_rows, key=lambda x: x["n"]))


def write_json(path: Path, payload: dict) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build the 全职法师 static corpus.")
    parser.add_argument("--input", required=True, help="raw novel text")
    parser.add_argument("--out", default="public/data", help="output data directory")
    parser.add_argument("--report", default="reports/quality-report.json", help="quality report path")
    parser.add_argument("--total", type=int, default=DEFAULT_TOTAL, help="total chapter slots")
    parser.add_argument("--supplement", default=None, help="optional supplement directory")
    parser.add_argument("--deterministic", action="store_true", help="fixed builtAt for tests")
    args = parser.parse_args(argv)

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"input not found: {input_path}", file=sys.stderr)
        return 2
    report = build(
        input_path=input_path,
        out_dir=Path(args.out),
        report_path=Path(args.report),
        total=args.total,
        supplement_dir=Path(args.supplement) if args.supplement else None,
        deterministic=args.deterministic,
    )
    print(
        f"built {report['chapters']['total']} slots: "
        f"{report['chapters']['available']} available, "
        f"{report['chapters']['missing']} missing, "
        f"{report['chars']} chars"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
