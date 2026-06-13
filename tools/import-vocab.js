/**
 * 词汇导入流水线（可复用）
 * ───────────────────────────────────────────────
 * 用法：  node tools/import-vocab.js <entries.json>
 *
 * entries.json = [{ de, zh, py, theme, level, icon? }, ...]
 *   - de/zh/py：德语 / 中文 / 谐音
 *   - level：'0'|'a1'|'a2'|'b1'|'b2'
 *   - theme：归入的主题分类名（已存在则合并，不存在则新建）
 *   - icon：新建主题时的图标（可选，默认 📘）
 *
 * 自动完成：① 全库查重(已存在的 de 跳过) ② 按 level+theme 归类合并
 *          ③ 写回 packageData ④ 重新生成离线 HTML + 内嵌包
 * 一条命令，幂等可重复跑。
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const LEVELS = ['0', 'a1', 'a2', 'b1', 'b2']
const PROTECT = new Set(['饮料酒水咖啡', '亚洲餐厅菜名'])

function levelFile(l) { return path.join(ROOT, 'packageData', 'data', `level-${l}.js`) }
function load(l) { delete require.cache[require.resolve(levelFile(l))]; return require(levelFile(l)) }

function main() {
  const arg = process.argv[2]
  if (!arg) { console.error('用法: node tools/import-vocab.js <entries.json>'); process.exit(1) }
  const entries = JSON.parse(fs.readFileSync(arg, 'utf8'))

  const data = {}; LEVELS.forEach(l => data[l] = load(l))

  // 全库已有 de
  const have = new Set()
  LEVELS.forEach(l => data[l].forEach(c => c.phrases.forEach(p => have.add(p.de))))

  let added = 0, skipped = 0, created = 0
  const perTheme = {}
  for (const e of entries) {
    if (!e.de || !e.zh || !e.py || !e.level || !e.theme) { console.warn('跳过不完整条目:', JSON.stringify(e)); continue }
    if (have.has(e.de)) { skipped++; continue }
    have.add(e.de)
    const cats = data[e.level]
    let cat = cats.find(c => c.name === e.theme && !PROTECT.has(c.name))
    if (!cat) { cat = { name: e.theme, level: e.level, icon: e.icon || '📘', phrases: [] }; cats.push(cat); created++ }
    cat.phrases.push({ de: e.de, zh: e.zh, py: e.py })
    added++; perTheme[e.level + ' · ' + e.theme] = (perTheme[e.level + ' · ' + e.theme] || 0) + 1
  }

  LEVELS.forEach(l => fs.writeFileSync(levelFile(l), 'module.exports = ' + JSON.stringify(data[l], null, 2) + ';\n'))

  console.log(`导入完成：新增 ${added} | 查重跳过 ${skipped} | 新建主题 ${created}`)
  Object.entries(perTheme).forEach(([k, v]) => console.log(`  + ${k}: ${v}`))

  // 自动同步离线 HTML + 内嵌包
  execSync('node ' + path.join(__dirname, 'build-offline-html.js'), { stdio: 'inherit' })

  // 总览
  const all = LEVELS.flatMap(l => load(l))
  console.log('全库现状:', all.length, '分类 /', all.reduce((s, c) => s + c.phrases.length, 0), '词句')
}

main()
