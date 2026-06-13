// ──────────────────────────────────────────────────────────────
// phrase-service.js — 数据访问层（主包）
// 通过微信分包异步化 require 加载 packageData/data/index.js
// ──────────────────────────────────────────────────────────────

let _cache = null; // 缓存加载结果

/**
 * 异步加载全部分类（分包异步化）。
 * 首次加载后缓存，返回 Promise<Category[]>
 */
function loadCategories() {
  if (_cache) {
    return Promise.resolve(_cache);
  }
  return new Promise(function (resolve, reject) {
    require('../packageData/data/index.js', function (mod) {
      try {
        _cache = mod.getCategories();
        resolve(_cache);
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * 按级别取分类（'all' 返回全部）
 * @param {string} level '0'|'a1'|'a2'|'b1'|'b2'|'all'
 * @returns {Promise<Category[]>}
 */
function getCategoriesByLevel(level) {
  return loadCategories().then(function (cats) {
    if (level === 'all') return cats;
    return cats.filter(function (c) { return c.level === level; });
  });
}

/**
 * 全文检索（de/zh/py 任一命中），跨全部级别
 * @param {string} keyword
 * @returns {Promise<Array<Phrase & {cat, icon}>>}
 */
function search(keyword) {
  if (!keyword || !keyword.trim()) return Promise.resolve([]);
  var kw = keyword.trim().toLowerCase();
  return loadCategories().then(function (cats) {
    var results = [];
    cats.forEach(function (cat) {
      cat.phrases.forEach(function (phrase) {
        if (
          phrase.de.toLowerCase().indexOf(kw) !== -1 ||
          phrase.zh.indexOf(keyword.trim()) !== -1 ||
          phrase.py.indexOf(keyword.trim()) !== -1
        ) {
          results.push({
            de: phrase.de,
            zh: phrase.zh,
            py: phrase.py,
            cat: cat.name,
            icon: cat.icon
          });
        }
      });
    });
    return results;
  });
}

/**
 * 拍平所有词句（测验用），给每条词句加稳定 id（`${ci}-${pi}`）
 * @returns {Promise<Array<Phrase & {id}>>}
 */
function getAllPhrases() {
  return loadCategories().then(function (cats) {
    var results = [];
    cats.forEach(function (cat, ci) {
      cat.phrases.forEach(function (phrase, pi) {
        results.push({
          id: ci + '-' + pi,
          de: phrase.de,
          zh: phrase.zh,
          py: phrase.py
        });
      });
    });
    return results;
  });
}

module.exports = { loadCategories, getCategoriesByLevel, search, getAllPhrases };
