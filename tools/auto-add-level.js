/**
 * 全自动加一个级别的词汇（无需人工）
 * ───────────────────────────────────────────────
 * 用法：  node tools/auto-add-level.js <a1|a2|b1|b2> [limit] [--dry]
 *
 * 流程：fetch-goethe(抓取+清洗+查重) → 在线翻译(MyMemory,免key) +
 *       规则谐音(translit) → 自动归类 → import-vocab(入库+同步)
 *
 * 翻译/谐音为机器近似，建议事后在小程序里抽查校正。
 * 保护分类不受影响（import-vocab 内已保护）。
 */
const fs = require('fs')
const path = require('path')
const https = require('https')
const { execSync } = require('child_process')
const { transliterate } = require('./translit')

const LEVELS = ['a1', 'a2', 'b1', 'b2']
const level = process.argv[2]
const limit = parseInt(process.argv[3], 10) || 0
const dry = process.argv.includes('--dry')
if (!LEVELS.includes(level)) { console.error('用法: node tools/auto-add-level.js <a1|a2|b1|b2> [limit] [--dry]'); process.exit(1) }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function translate(word) {
  // 去掉冠词再查，结果更准
  const q = encodeURIComponent(word.replace(/^(der|die|das)\s+/, ''))
  const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=de|zh-CN`
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = ''; res.on('data', c => d += c)
      res.on('end', () => {
        try { const t = JSON.parse(d).responseData.translatedText; resolve(t && t.trim() ? t.trim() : '⚠️待译') }
        catch { resolve('⚠️待译') }
      })
    }).on('error', () => resolve('⚠️待译'))
  })
}

async function main() {
  console.log(`\n▶ 自动添加 ${level.toUpperCase()} 词汇…\n`)
  // 1) 抓取+清洗+查重
  execSync(`node ${path.join(__dirname, 'fetch-goethe.js')} ${level}`, { stdio: 'inherit' })
  const fresh = JSON.parse(fs.readFileSync(path.join(__dirname, `_fresh-${level}.json`), 'utf8'))
  let list = [...fresh.nouns.map(de => ({ de, noun: true })), ...fresh.others.map(de => ({ de, noun: false }))]
  if (limit) list = list.slice(0, limit)
  console.log(`\n需处理 ${list.length} 词，正在翻译+谐音（机器近似）…`)

  const entries = []
  for (let i = 0; i < list.length; i++) {
    const { de, noun } = list[i]
    const zh = await translate(de)
    const py = transliterate(de)
    entries.push({
      de, zh, py, level,
      theme: noun ? `${level.toUpperCase()}名词·自动` : `${level.toUpperCase()}词汇·自动`,
      icon: noun ? '🟡' : '🔤',
    })
    if ((i + 1) % 25 === 0) console.log(`  …${i + 1}/${list.length}`)
    await sleep(120) // 控制 API 频率
  }

  const tmp = path.join(__dirname, `_entries-${level}.json`)
  fs.writeFileSync(tmp, JSON.stringify(entries, null, 0))
  console.log(`\n已生成 ${entries.length} 条 → ${path.basename(tmp)}`)

  if (dry) { console.log('（--dry 试跑，未入库）样例:'); entries.slice(0, 8).forEach(e => console.log('  ', e.de, '=', e.zh, '〔' + e.py + '〕')); return }

  // 2) 入库 + 自动同步
  execSync(`node ${path.join(__dirname, 'import-vocab.js')} ${tmp}`, { stdio: 'inherit' })
  console.log('\n✅ 完成！小程序数据 + 桌面HTML + 离线包已全部更新。')
}
main()
