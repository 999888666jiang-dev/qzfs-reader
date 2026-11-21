import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import build_corpus  # noqa: E402


PARA = "　　" + "这是一段足够长的测试正文。" * 20
SAMPLE = f"""全职法师
作者：乱
简介：测试

第1章 开始
{PARA}
第2章 重复
{PARA}
　　第2章 重复
{PARA}
第3章
{PARA}
"""


class TitleTests(unittest.TestCase):
    def test_page_suffix(self):
        self.assertEqual(build_corpus.clean_title("标题（第1/1页）"), "标题")

    def test_update_note(self):
        self.assertEqual(build_corpus.clean_title("邪庙女主人（今日中午11点新书发布！）"), "邪庙女主人")

    def test_story_parenthetical_kept(self):
        self.assertEqual(build_corpus.clean_title("天生双系（上）"), "天生双系（上）")

    def test_nbsp(self):
        self.assertEqual(build_corpus.clean_title("\u00a0欧洲学府"), "欧洲学府")


def empty_stats():
    return {
        "headings": 0,
        "falsePositive": 0,
        "adHeadings": 0,
        "longTitles": 0,
        "falseHeadingLines": 0,
        "adLines": 0,
        "adSuffixes": 0,
        "bomRemoved": 0,
        "emptyTitles": 0,
        "pickedLater": 0,
    }


class ParseTests(unittest.TestCase):
    def test_parse_keeps_indented_until_build_filters(self):
        stats = empty_stats()
        candidates = build_corpus.parse_candidates(SAMPLE, stats)
        self.assertEqual(stats["headings"], 4)
        self.assertEqual([c.n for c in candidates], [1, 2, 2, 3])
        chapter2 = next(c for c in candidates if c.n == 2)
        paras = build_corpus.clean_body(chapter2.body_raw, stats)
        self.assertTrue(any("足够长的测试正文" in p for p in paras))
        self.assertFalse(any(p.startswith("第2章") for p in paras))


class BuildTests(unittest.TestCase):
    def _build(self, text, total=3):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = root / "sample.txt"
            src.write_text(text, encoding="utf-8")
            out = root / "data"
            report_path = root / "reports" / "quality-report.json"
            report = build_corpus.build(
                input_path=src,
                out_dir=out,
                report_path=report_path,
                total=total,
                deterministic=True,
            )
            meta = json.loads((out / "meta.json").read_text(encoding="utf-8"))
            catalog = json.loads((out / "catalog.json").read_text(encoding="utf-8"))
            chapter = json.loads((out / "chapters" / "c0001.json").read_text(encoding="utf-8"))
            self.assertTrue(report_path.exists())
            self.assertTrue((root / "reports" / "manual-review.csv").exists())
            return meta, catalog, chapter, report

    def test_build_contract(self):
        meta, catalog, chapter, report = self._build(SAMPLE)
        self.assertEqual(meta["chapters"], {"total": 3, "available": 3, "missing": 0})
        self.assertEqual(len(catalog["chapters"]), 3)
        self.assertEqual(chapter["n"], 1)
        self.assertTrue(chapter["paras"])
        self.assertIn("足够长的测试正文", chapter["paras"][0])
        self.assertEqual(report["missing"]["count"], 0)

    def test_missing_stub(self):
        text = f"第1章 开始\n{PARA}\n第3章 结束\n{PARA}\n"
        meta, catalog, _, report = self._build(text)
        self.assertEqual(meta["missing"], [2])
        self.assertEqual(meta["chapters"]["missing"], 1)
        self.assertEqual(catalog["chapters"][1], [2, "（原文缺失）", 0, 1])
        self.assertEqual(report["missing"]["ranges"], [[2, 2]])

    def test_supplement_fills_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = root / "sample.txt"
            src.write_text(f"第1章 开始\n{PARA}\n第3章 结束\n{PARA}\n", encoding="utf-8")
            supp = root / "supplement"
            supp.mkdir()
            (supp / "fill.txt").write_text(f"第2章 补章\n{PARA}\n", encoding="utf-8")
            out = root / "data"
            report_path = root / "reports" / "quality-report.json"
            report = build_corpus.build(
                input_path=src,
                out_dir=out,
                report_path=report_path,
                total=3,
                supplement_dir=supp,
                deterministic=True,
            )
            meta = json.loads((out / "meta.json").read_text(encoding="utf-8"))
            self.assertEqual(meta["missing"], [])
            self.assertEqual(meta["chapters"]["available"], 3)
            self.assertEqual(report["supplement"]["used"], [2])
            stub = json.loads((out / "chapters" / "c0002.json").read_text(encoding="utf-8"))
            self.assertNotIn("missing", stub)
            self.assertTrue(stub["paras"])


if __name__ == "__main__":
    unittest.main()
