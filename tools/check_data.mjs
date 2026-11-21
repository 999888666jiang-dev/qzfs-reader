#!/usr/bin/env node
/**
 * CI-side corpus check. Validates public/data without rebuilding it.
 * Usage: node tools/check_data.mjs
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const DATA = process.env.DATA_DIR || 'public/data'

function fail(message) {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

async function readJson(file) {
  const buf = await readFile(file)
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) fail(`BOM not allowed: ${file}`)
  return JSON.parse(buf.toString('utf8'))
}

const meta = await readJson(path.join(DATA, 'meta.json'))
const catalog = await readJson(path.join(DATA, 'catalog.json'))
const chapters = catalog.chapters

if (!Array.isArray(chapters) || chapters.length !== 3233) fail(`chapters length ${chapters?.length}`)
if (meta.chapters.total !== 3233) fail('meta.chapters.total')
if (meta.chapters.available + meta.chapters.missing !== 3233) fail('available + missing')
if (meta.missing.length !== 132) fail(`missing count ${meta.missing.length}`)

const missing = new Set(meta.missing)
const files = (await readdir(path.join(DATA, 'chapters'))).filter(name => /^c\d{4}\.json$/.test(name))
if (files.length !== 3233) fail(`chapter files ${files.length}`)

let totalChars = 0
for (let i = 0; i < chapters.length; i += 1) {
  const [n, title, chars, status] = chapters[i]
  if (n !== i + 1) fail(`chapter number at index ${i} is ${n}`)
  const file = path.join(DATA, 'chapters', `c${String(n).padStart(4, '0')}.json`)
  const payload = await readJson(file)
  if (payload.n !== n) fail(`${file}: n mismatch`)
  if (!payload.title) fail(`${file}: empty title`)
  if (status === 1) {
    if (!missing.has(n)) fail(`${file}: status 1 but not in meta.missing`)
    if (!payload.missing || payload.paras.length !== 0) fail(`${file}: bad stub`)
    continue
  }
  if (!Array.isArray(payload.paras) || payload.paras.length === 0) fail(`${file}: no paragraphs`)
  const sum = payload.paras.reduce((acc, p) => acc + p.length, 0)
  if (sum !== chars) fail(`${file}: chars ${sum} != catalog ${chars}`)
  if (sum <= 0) fail(`${file}: empty body`)
  if (/[\uFEFF\u200B-\u200D\u2060\u00AD]/.test(payload.paras.join(''))) fail(`${file}: zero-width`)
  if (/[A-Za-z]:\\|\/Users\/|\/home\//.test(payload.paras.join(''))) fail(`${file}: absolute path`)
  totalChars += chars
}

if (Math.abs(totalChars - meta.chars) > Math.max(1000, meta.chars * 0.01)) {
  fail(`total chars ${totalChars} != meta.chars ${meta.chars}`)
}

const size = (await stat(path.join(DATA, 'meta.json'))).size
console.log(`PASS: ${chapters.length} chapters, ${meta.missing.length} missing, ${totalChars} chars, ${files.length} files, meta ${size} B`)
