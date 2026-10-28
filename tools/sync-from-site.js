/**
 * 从网站（deutsch-lernen-site）同步德语词库到小程序
 * ───────────────────────────────────────────────
 * 词库的唯一数据源是网站仓库的 data/categories.json，小程序不再单独维护一份。
 * 本脚本把它按级别拆成 packageData/data/level-{0,a1,a2,b1,b2}.js。
 *
 * 运行：
 *   npm run sync:site                       # 从 GitHub 上网站仓库的 main 分支下载
 *   npm run sync:site -- ../deutsch-lernen-site/data/categories.json   # 用本地文件
 *
 * 同步完记得再跑 npm run build:offline，离线包才会跟着更新。
 */
const fs = require('fs')
const path = require('path')

const REMOTE = 'https://raw.githubusercontent.com/717986230/deutsch-lernen-site/main/data/categories.json'
const OUT_DIR = path.join(__dirname, '..', 'packageData', 'data')
const LEVELS = ['0', 'a1', 'a2', 'b1', 'b2']

async function load(src) {
  if (src) return JSON.parse(fs.readFileSync(path.resolve(src), 'utf8'))
  const res = await fetch(REMOTE)
  if (!res.ok) throw new Error('下载失败 ' + res.status + '：' + REMOTE)
  return res.json()
}

// 小程序只用 de / zh / py；网站的 syn、ref 等字段不带过来，省分包体积
function slim(p) {
  const out = { de: p.de, zh: p.zh }
  if (p.py) out.py = p.py
  return out
}

function render(cats) {
  // 一条词句一行：比逐字段缩进小一半，diff 也按词句对齐
  const body = cats.map(c => [
    '  {',
    '    "name": ' + JSON.stringify(c.name) + ',',
    '    "level": ' + JSON.stringify(c.level) + ',',
    '    "icon": ' + JSON.stringify(c.icon) + ',',
    '    "phrases": [',
    c.phrases.map(p => '      ' + JSON.stringify(slim(p))).join(',\n'),
    '    ]',
    '  }'
  ].join('\n')).join(',\n')
  return '// 自动生成（请勿手改）：由 npm run sync:site 从网站 data/categories.json 同步\n' +
    'module.exports = [\n' + body + '\n];\n'
}

async function main() {
  const categories = await load(process.argv[2])
  if (!Array.isArray(categories) || !categories.length) throw new Error('词库为空或格式不对')

  const unknown = categories.filter(c => !LEVELS.includes(c.level))
  if (unknown.length) throw new Error('未知级别：' + unknown.map(c => c.name + '/' + c.level).join('、'))

  for (const level of LEVELS) {
    const cats = categories.filter(c => c.level === level)
    fs.writeFileSync(path.join(OUT_DIR, 'level-' + level + '.js'), render(cats))
    const n = cats.reduce((s, c) => s + c.phrases.length, 0)
    console.log('  level-%s.js：%d 分类 / %d 词句', level, cats.length, n)
  }
  console.log('✓ 已从网站同步。下一步：npm run build:offline')
}

main().catch(e => { console.error('✗', e.message); process.exit(1) })
