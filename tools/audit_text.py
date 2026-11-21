import json
import re
from collections import Counter, defaultdict
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'public' / 'data' / 'chapters'
markers = [
    '笔趣阁', '云来阁', '书客居', '顶点', '起点', '小说', '手机版', '加入书签', '请记住',
    '百度', '最新章节', '无错', '手打', '会员', '免费阅读', '全文阅读', '首发', '转载',
    '微信', '公众号', 'QQ群', '群号', '求月票', '求推荐票', '推荐票', '月票', '打赏',
    '订阅', '收藏', '新书', '发布', '本章完', '未完待续', '网址', '域名', 'www', 'http',
    '.com', '.net', '.org', '记住', '阅读网', '小说网', '更新', '求票', '加更', '断更',
]
counts = Counter()
chapters = defaultdict(set)
examples = defaultdict(list)
urls = Counter()

for path in sorted(root.glob('c*.json')):
    data = json.loads(path.read_text(encoding='utf-8'))
    body = '\n'.join(data.get('paras', []))
    for marker in markers:
        c = body.count(marker)
        if c:
            counts[marker] += c
            chapters[marker].add(path.stem)
            if len(examples[marker]) < 3:
                idx = body.find(marker)
                examples[marker].append(body[max(0, idx - 40):idx + 80].replace('\n', ' '))
    for m in re.finditer(r'(?:https?://|www\.)[^\s，。；）)]+', body):
        urls[m.group(0)] += 1

print('CHAPTERS', len(list(root.glob('c*.json'))))
for marker, count in counts.most_common():
    print(f'\n{marker}: {count} hits in {len(chapters[marker])} chapters')
    for ex in examples[marker]:
        print('  ', ex)

print('\nURLS', sum(urls.values()), 'unique', len(urls))
for url, count in urls.most_common(20):
    print(' ', count, url)
