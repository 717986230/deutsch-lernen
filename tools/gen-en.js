/*
 * 自动生成英语词库：从 ECDICT（开源英中词典）抓取，按中国考试等级(中考/高考/四级/六级)筛选，
 * 中文释义直接用，IPA 音标自动转中文谐音，按词性归类。
 * 输出 packageData/data/en-auto.js（与手写 en.js 合并，手写优先）。
 * 用法：node tools/gen-en.js
 */
const https = require('https')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const URL = 'https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv'
const OUT = path.join(__dirname, '..', 'packageData', 'data', 'en-auto.js')

// 已手写的词（优先保留，自动跳过）
const handWords = new Set()
try {
  require(path.join(__dirname, '..', 'packageData', 'data', 'en.js'))
    .forEach(c => c.phrases.forEach(p => handWords.add(p.de.toLowerCase())))
} catch (e) {}

// ── IPA 音标 → 中文谐音（近似映射，多字符优先） ──
// 按长度从长到短匹配；常见后缀/音节合并，谐音更自然
const MULTI = [
  ['eɪʃən', '诶申'], ['ɪʃən', '伊申'], ['eiʃn', '诶申'], ['iʃn', '伊申'],
  ['ʃən', '申'], ['ʒən', '任'], ['ʃn', '申'], ['ʒn', '任'], ['tʃər', '切'], ['dʒər', '杰'], ['mənt', '门特'],
  ['dənt', '登特'], ['tənt', '坦特'], ['tən', '腾'], ['kən', '肯'], ['gən', '根'],
  ['bəl', '博'], ['pəl', '坡'], ['təl', '透'], ['dəl', '多'], ['juː', '优'], ['aɪə', '艾尔'],
  ['tʃ', '奇'], ['dʒ', '吉'], ['eɪ', '诶'], ['aɪ', '艾'], ['ɔɪ', '奥伊'], ['aʊ', '奥'],
  ['əʊ', '欧'], ['oʊ', '欧'], ['ɪə', '伊尔'], ['eə', '诶尔'], ['ʊə', '乌尔'],
  ['ɑː', '啊'], ['ɔː', '哦'], ['ɜː', '厄'], ['iː', '伊'], ['uː', '乌'],
  ['ei', '诶'], ['ai', '艾'], ['au', '奥'], ['ou', '欧'], ['oi', '奥伊'], ['ɔi', '奥伊'],
  ['iə', '伊尔'], ['eə', '诶尔'], ['uə', '乌尔'],
  ['ər', '尔'], ['əl', '尔'], ['ɪŋ', '因'], ['iŋ', '因'], ['ən', '恩'], ['əm', '姆'], ['æ', '诶'],
]
const SINGLE = {
  'p': '普', 'b': '布', 't': '特', 'd': '德', 'k': '克', 'g': '格', 'f': '夫', 'v': '维',
  'θ': '斯', 'ð': '泽', 's': '斯', 'z': '兹', 'ʃ': '什', 'ʒ': '日', 'h': '赫',
  'm': '姆', 'n': '恩', 'ŋ': '嗯', 'l': '尔', 'r': '尔', 'w': '沃', 'j': '伊',
  'ɑ': '啊', 'ʌ': '啊', 'a': '啊', 'ə': '厄', 'ɜ': '厄', 'e': '诶', 'ɛ': '诶',
  'ɪ': '伊', 'i': '伊', 'ɒ': '哦', 'ɔ': '哦', 'o': '欧', 'ʊ': '乌', 'u': '乌', 'y': '伊',
}
function ipaToPy(ipa) {
  if (!ipa) return ''
  let s = ipa.replace(/[ˈˌ'’‚.\-\s\/\(\)\[\]]/g, '').replace(/:/g, 'ː')
  // 取第一个读音（有些是 "ax, ay" 逗号分隔）
  s = s.split(',')[0]
  let out = '', i = 0
  while (i < s.length) {
    let matched = false
    for (const [k, v] of MULTI) { if (s.startsWith(k, i)) { out += v; i += k.length; matched = true; break } }
    if (matched) continue
    const ch = s[i]
    if (ch === 'ː') { i++; continue }
    if (SINGLE[ch]) { out += SINGLE[ch] }
    i++
  }
  return out
}

// ── 中文释义清洗：取首个义项，去网络释义，限长 ──
function cleanZh(tr) {
  if (!tr) return ''
  let lines = tr.split(/\\n|\n/).map(s => s.trim()).filter(Boolean)
  lines = lines.filter(l => !/^\[(网络|俚语|口语|医)\]/.test(l))
  if (!lines.length) return ''
  let first = lines[0]
  first = first.replace(/^\s*(n|v|vt|vi|a|ad|adj|adv|prep|conj|pron|art|num|int|aux|abbr)\.\s*/i, '')
  first = first.replace(/\[[^\]]*\]/g, '') // 去[..]
  // 取前两个义项
  const senses = first.split(/[；;,，]/).map(s => s.trim()).filter(Boolean)
  let zh = senses.slice(0, 2).join('；')
  if (zh.length > 18) zh = zh.slice(0, 18)
  return zh
}

// ── 词性 → 主题分类 ──
function posTheme(pos, tr) {
  const p = (pos || '').toLowerCase()
  const t = (tr || '')
  const test = (re) => re.test(p) || re.test(t.slice(0, 4).toLowerCase())
  if (test(/^adj|形容/) || /adj\./i.test(t)) return ['形容词', '🎨']
  if (test(/^adv|副/) || /adv\./i.test(t)) return ['副词', '⏩']
  if (test(/^v|动/) || /\bv[ti]?\./i.test(t)) return ['动词', '🏃']
  if (test(/prep|介/) || /prep\./i.test(t)) return ['介词', '🔗']
  return ['名词·其他', '📘']
}

// 等级映射（中考→a1 高考→a2 四级→b1 六级→b2）
function pickLevel(tags) {
  if (tags.includes('zk')) return 'a1'
  if (tags.includes('gk')) return 'a2'
  if (tags.includes('cet4')) return 'b1'
  if (tags.includes('cet6')) return 'b2'
  return null
}

// CSV 行解析（处理引号）
function parseCSV(line) {
  const out = []; let cur = '', q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else q = false }
      else cur += c
    } else {
      if (c === '"') q = true
      else if (c === ',') { out.push(cur); cur = '' }
      else cur += c
    }
  }
  out.push(cur)
  return out
}

console.log('下载并解析 ECDICT（约 66MB，流式处理）…')
https.get(URL, res => {
  if (res.statusCode !== 200) { console.error('下载失败', res.statusCode); process.exit(1) }
  const rl = readline.createInterface({ input: res, crlfDelay: Infinity })
  const byKey = {} // level+theme -> phrases[]
  let total = 0, kept = 0, header = true, buf = '', bufQuotes = 0
  function countQuotes(s) { return (s.match(/"/g) || []).length }
  function handle(line) {
    if (header) { header = false; return }
    const f = parseCSV(line)
    if (f.length < 8) return
    const word = (f[0] || '').trim()
    const phonetic = (f[1] || '').trim()
    const translation = f[3] || ''
    const pos = f[4] || ''
    const tag = (f[7] || '').trim()
    total++
    if (!/^[a-zA-Z][a-zA-Z]+$/.test(word)) return            // 仅纯字母单词
    if (word.length < 2 || word.length > 15) return
    if (handWords.has(word.toLowerCase())) return            // 手写优先
    const tags = tag.split(' ')
    const level = pickLevel(tags)
    if (!level) return                                       // 只要中考/高考/四级/六级
    if (!phonetic) return
    const zh = cleanZh(translation)
    if (!zh) return
    const py = ipaToPy(phonetic)
    if (!py) return
    const [theme, icon] = posTheme(pos, translation)
    const key = level + '|' + theme + '|' + icon
    ;(byKey[key] || (byKey[key] = [])).push({ de: word.toLowerCase(), zh, py })
    kept++
  }
  rl.on('line', raw => {
    // 处理跨行引号（translation 内可能含真实换行）
    if (bufQuotes % 2 !== 0) { buf += '\n' + raw; bufQuotes += countQuotes(raw); if (bufQuotes % 2 === 0) { handle(buf); buf = ''; bufQuotes = 0 } return }
    const qc = countQuotes(raw)
    if (qc % 2 !== 0) { buf = raw; bufQuotes = qc; return }
    handle(raw)
  })
  rl.on('close', () => {
    // 组装 categories（每级每词性一类），同级内去重
    const cats = []
    const order = { 'a1': 1, 'a2': 2, 'b1': 3, 'b2': 4 }
    Object.keys(byKey).sort((a, b) => {
      const [la] = a.split('|'), [lb] = b.split('|')
      return (order[la] - order[lb])
    }).forEach(key => {
      const [level, name, icon] = key.split('|')
      const seen = new Set(); const phrases = []
      byKey[key].forEach(p => { if (!seen.has(p.de)) { seen.add(p.de); phrases.push(p) } })
      cats.push({ name, level, icon, phrases })
    })
    fs.writeFileSync(OUT, '// 自动生成（tools/gen-en.js，源 ECDICT）。中文释义来自词典，谐音由 IPA 自动转写（近似）。\nmodule.exports = ' + JSON.stringify(cats, null, 0) + ';\n')
    const byLvl = {}
    cats.forEach(c => byLvl[c.level] = (byLvl[c.level] || 0) + c.phrases.length)
    console.log('扫描 %d 词，采纳 %d 词', total, kept)
    console.log('分级：', JSON.stringify(byLvl))
    console.log('→ 写入', OUT)
  })
}).on('error', e => { console.error('网络错误', e.message); process.exit(1) })
