// 聚合 5 个级别文件，按 ['0','a1','a2','b1','b2'] 顺序导出有序 categories 数组
const level0 = require('./level-0.js');
const levelA1 = require('./level-a1.js');
const levelA2 = require('./level-a2.js');
const levelB1 = require('./level-b1.js');
const levelB2 = require('./level-b2.js');

function getCategories() {
  return [].concat(level0, levelA1, levelA2, levelB1, levelB2);
}

module.exports = { getCategories };
