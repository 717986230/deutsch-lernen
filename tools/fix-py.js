/**
 * 谐音批量校正（可复用）
 * ───────────────────────────────────────────────
 * 用法：  node tools/fix-py.js <corrections.json>
 *
 * corrections.json = { "<德语原词>": "<新谐音>", ... }
 *   按 de 精确匹配，覆盖该词条的 py。
 *
 * 自动：① 扫全库 packageData，命中即改 py
 *      ② 写回 ③ 重新生成离线 HTML + 内嵌包
 * 幂等，可重复跑。用于谐音口语化/纠错。
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const LEVELS = ['0', 'a1', 'a2', 'b1', 'b2']
const levelFile = l => path.join(ROOT, 'packageData', 'data', `level-${l}.js`)
const load = l => { delete require.cache[require.resolve(levelFile(l))]; return require(levelFile(l)) }

function main() {
  const arg = process.argv[2]
  if (!arg) { console.error('用法: node tools/fix-py.js <corrections.json>'); process.exit(1) }
  const fixes = JSON.parse(fs.readFileSync(arg, 'utf8'))
  const keys = new Set(Object.keys(fixes))

  const data = {}; LEVELS.forEach(l => data[l] = load(l))
  let changed = 0; const hit = new Set()
  LEVELS.forEach(l => data[l].forEach(c => c.phrases.forEach(p => {
    if (keys.has(p.de) && p.py !== fixes[p.de]) { p.py = fixes[p.de]; changed++; hit.add(p.de) }
    else if (keys.has(p.de)) hit.add(p.de)
  })))

  LEVELS.forEach(l => fs.writeFileSync(levelFile(l), 'module.exports = ' + JSON.stringify(data[l], null, 2) + ';\n'))

  const missing = [...keys].filter(k => !hit.has(k))
  console.log(`谐音校正：改动 ${changed} 条 | 命中词 ${hit.size}/${keys.size}`)
  if (missing.length) console.log('  ⚠️ 库中未找到:', missing.join(', '))

  execSync('node ' + path.join(__dirname, 'build-offline-html.js'), { stdio: 'inherit' })
}

main()
