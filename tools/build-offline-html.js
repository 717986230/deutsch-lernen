/**
 * 离线 HTML 同步生成器（单一数据源）
 * ───────────────────────────────────────────────
 * 数据源唯一：packageData/data/*.js
 * 运行：  npm run build:offline   （或 node tools/build-offline-html.js）
 *
 * 它做两件事：
 *   1) 把 packageData 的词句数据注入 tools/offline-template.html
 *   2) 产出：
 *        - 桌面「德语学习手册-明亮版.html」（可下载离线学习）
 *        - packageOffline/offline-html.js（小程序「离线下载」内嵌包）
 *
 * 以后加词只改 packageData，再跑一次本脚本，三处自动一致。
 */
const fs = require('fs')
const path = require('path')
const os = require('os')

const ROOT = path.join(__dirname, '..')
const TEMPLATE = path.join(__dirname, 'offline-template.html')
const EMBED_OUT = path.join(ROOT, 'packageOffline', 'offline-html.js')
const DESKTOP_OUT = path.join(os.homedir(), 'Desktop', '德语学习手册-明亮版.html')

function build() {
  const { getCategories } = require(path.join(ROOT, 'packageData', 'data', 'index.js'))
  const categories = getCategories()
  const catCount = categories.length
  const phraseCount = categories.reduce((s, c) => s + c.phrases.length, 0)

  const tpl = fs.readFileSync(TEMPLATE, 'utf8')
  if (!tpl.includes('/*__CATEGORIES__*/')) {
    throw new Error('模板缺少 /*__CATEGORIES__*/ 占位符')
  }
  const injected = 'const categories = ' + JSON.stringify(categories) + ';'
  // 用函数形式避免 $ 替换语义
  let html = tpl.replace('/*__CATEGORIES__*/', () => injected)

  // 注入分级阅读短文（tools/readings.js）
  try {
    const readingsPath = path.join(__dirname, 'readings.js')
    delete require.cache[require.resolve(readingsPath)]
    const readings = require(readingsPath)
    html = html.replace('/*__READINGS__*/[]', () => JSON.stringify(readings))
    const rc = readings.length
    console.log('  阅读短文：%d 篇', rc)
  } catch (e) {
    console.warn('  ⚠ readings.js 注入失败（跳过）：', e.message)
  }

  // 产出 1：桌面明亮版 HTML
  fs.writeFileSync(DESKTOP_OUT, html)
  // 产出 2：小程序内嵌离线包
  fs.writeFileSync(
    EMBED_OUT,
    '// 自动生成（请勿手改）：明亮版离线 HTML，由 npm run build:offline 从 packageData 同步\n' +
      'module.exports = ' + JSON.stringify(html) + ';\n'
  )

  console.log('✓ 同步完成')
  console.log('  数据源 packageData：%d 分类 / %d 词句', catCount, phraseCount)
  console.log('  → 桌面：%s', DESKTOP_OUT)
  console.log('  → 内嵌：packageOffline/offline-html.js')
}

build()
