/**
 * tools/counts.js — 词句计数的单一来源
 * ───────────────────────────────────────────────
 * 数据源唯一：packageData/data/*.js（与 build-offline-html.js 相同）。
 * 用法：
 *   npm run build:counts     生成 constants/counts.js
 * 首页 / 词句页 / 离线页 / README 都读这份生成文件，不再手写数字。
 * build-offline-html.js 也复用 getCounts()，离线 HTML 的 {{PHRASE_COUNT}} 等
 * 占位符与小程序内数字同源。
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

function getCounts() {
  const { getCategories } = require(path.join(ROOT, 'packageData', 'data', 'index.js'))
  const categories = getCategories()
  const byLevel = {}
  let phraseCount = 0
  categories.forEach((c) => {
    const k = byLevel[c.level] || (byLevel[c.level] = { c: 0, p: 0 })
    k.c++
    k.p += c.phrases.length
    phraseCount += c.phrases.length
  })
  return { phraseCount, catCount: categories.length, byLevel }
}

// 直接运行时：写出 constants/counts.js（小程序页面 require 用）
if (require.main === module) {
  const counts = getCounts()
  const out = path.join(ROOT, 'constants', 'counts.js')
  fs.writeFileSync(
    out,
    '// 自动生成（请勿手改）：由 npm run build:counts 从 packageData/data 生成\n' +
      '// 首页 / 词句页 / 离线页共读此文件，消灭手写数字。\n' +
      'module.exports = ' +
      JSON.stringify(counts, null, 2) +
      ';\n'
  )
  console.log('✓ counts 已生成 → constants/counts.js：%d 分类 / %d 词句', counts.catCount, counts.phraseCount)
  Object.keys(counts.byLevel)
    .sort()
    .forEach((l) => {
      const b = counts.byLevel[l]
      console.log('  %s：%d 分类 / %d 词句', l, b.c, b.p)
    })
}

module.exports = { getCounts }
