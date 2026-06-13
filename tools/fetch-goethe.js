/**
 * Goethe 词表抓取+清洗+去重（可复用）
 * ───────────────────────────────────────────────
 * 用法：  node tools/fetch-goethe.js <a1|a2|b1>
 *
 * 自动：① 从 github ilkermeliksitki/goethe-institute-wordlist 抓取该级别词表
 *      ② 清洗（去冠词复数标记/词义编号/变位噪音/语法词干/重复）
 *      ③ 与现有 packageData 全库查重，剔除已有词
 *      ④ 输出 tools/_fresh-<level>.json = { nouns:[...], others:[...] }
 *
 * 之后：人工把 _fresh 译成 entries.json（de/zh/py/theme/level），
 *      再 node tools/import-vocab.js entries.json 一键入库+同步。
 */
const fs = require('fs')
const path = require('path')
const https = require('https')

const ROOT = path.join(__dirname, '..')
const LEVELS = ['0', 'a1', 'a2', 'b1', 'b2']
const REPO = 'https://raw.githubusercontent.com/ilkermeliksitki/goethe-institute-wordlist/main'
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 404) { resolve(''); return }
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d))
    }).on('error', reject)
  })
}

async function fetchLevel(level) {
  // a1 有整合文件；a2/b1 是分字母
  const single = await get(`${REPO}/${level}/${level}.tsv`)
  if (single && single.split('\n').length > 50) return single
  let all = ''
  for (const l of LETTERS) all += (await get(`${REPO}/${level}/${l}.tsv`)) + '\n'
  return all
}

function clean(tsv) {
  const set = new Set()
  for (const ln of tsv.split('\n')) {
    let de = ln.split('\t')[0]
    if (!de || de === 'german word') continue
    de = de.replace(/\(\d+\)/g, '').split(',')[0].split('/')[0].trim()
    if (!de) continue
    if (/^(hat|ist|war) /.test(de)) continue          // 完成时/被动变位
    if (/[-]$/.test(de)) continue                      // 语法词干 all- best-
    if (de.includes('(') || de.includes('¨')) continue // 残留标记
    if (/^(der|die|das)$/.test(de)) continue           // 裸冠词
    set.add(de)
  }
  return [...set]
}

async function main() {
  const level = process.argv[2]
  if (!LEVELS.includes(level)) { console.error('用法: node tools/fetch-goethe.js <a1|a2|b1|b2>'); process.exit(1) }

  const tsv = await fetchLevel(level)
  const words = clean(tsv)

  // 全库已有
  const have = new Set()
  LEVELS.forEach(l => {
    const f = path.join(ROOT, 'packageData', 'data', `level-${l}.js`)
    delete require.cache[require.resolve(f)]
    require(f).forEach(c => c.phrases.forEach(p => have.add(p.de)))
  })
  const fresh = words.filter(w => !have.has(w))
  const nouns = fresh.filter(w => /^(der|die|das) /.test(w))
  const others = fresh.filter(w => !/^(der|die|das) /.test(w))

  const out = path.join(__dirname, `_fresh-${level}.json`)
  fs.writeFileSync(out, JSON.stringify({ level, nouns, others }, null, 0))
  console.log(`${level}: 清洗 ${words.length} | 库已有 ${words.length - fresh.length} | 需新译 ${fresh.length}（名词 ${nouns.length} + 其他 ${others.length}）`)
  console.log('→ 已写', path.relative(ROOT, out))
}

main()
