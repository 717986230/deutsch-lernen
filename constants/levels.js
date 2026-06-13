const LEVEL_META = {
  all: { label: '全部', desc: '', color: '#c8a84b' },
  '0': { label: '🌱 零基础', desc: '打招呼·道别·礼貌用语，第一天就能开口！', color: '#50c878' },
  a1: { label: '⭐ A1 初级', desc: '自我介绍·时间·天气·家庭，能进行最简单的日常交流。', color: '#5088d0' },
  a2: { label: '⭐⭐ A2 基础', desc: '购物·点餐·交通·住宿，能在熟悉场景下顺畅沟通。', color: '#c8a84b' },
  b1: { label: '🔥 B1 中级', desc: '情感·医疗·银行·娱乐，能理解日常生活主要内容。', color: '#e08050' },
  b2: { label: '💎 B2 中高级', desc: '职场·出行·科技话题，接近流利日常交流水平。', color: '#e05050' }
}

const LEVEL_ORDER = ['0', 'a1', 'a2', 'b1', 'b2']

const LB_CLASS = {
  '0': 'lb-0',
  a1: 'lb-a1',
  a2: 'lb-a2',
  b1: 'lb-b1',
  b2: 'lb-b2'
}

module.exports = { LEVEL_META, LEVEL_ORDER, LB_CLASS }
