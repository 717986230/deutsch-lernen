const letters = [
  {l:'A a', name:'啊（ah）', desc:'长/短"啊"\nAlt=啊尔特，ja=雅', special:false},
  {l:'B b', name:'贝（beh）', desc:'发音"b"\n词尾变清音"p"\nBrot=布罗特', special:false},
  {l:'C c', name:'采（tseh）', desc:'e/i前→"ts采"\n其他→"k卡"\nCafé=卡菲', special:false},
  {l:'D d', name:'德（deh）', desc:'发音"d"\n词尾变清音"t"\nDanke=当克', special:false},
  {l:'E e', name:'诶（eh）', desc:'重读→"诶"\n词尾轻读→"厄"\nes=埃斯', special:false},
  {l:'F f', name:'艾夫（ef）', desc:'发音"f夫"\nFrau=弗劳', special:false},
  {l:'G g', name:'格（geh）', desc:'发音"g格"\n词尾变"k克"\ngut=古特', special:false},
  {l:'H h', name:'哈（hah）', desc:'词首发"h哈"\n母音后不发音\nHallo=哈洛', special:false},
  {l:'I i', name:'伊（ih）', desc:'短"i伊"或长"i依"\nich=伊希\nie→长"依"', special:false},
  {l:'J j', name:'约特（yot）', desc:'⚠️ 发"y雅"音！\n不是英语"j"\nja=雅，Jahr=雅尔', special:false},
  {l:'K k', name:'卡（kah）', desc:'发音"k卡"\nKaffee=卡菲\nkalt=卡尔特', special:false},
  {l:'L l', name:'艾尔（el）', desc:'发音"l勒"（清晰）\nlieben=里本\nlaut=劳特', special:false},
  {l:'M m', name:'艾姆（em）', desc:'发音"m妈"\nMorgen=摩根\nMilch=米尔希', special:false},
  {l:'N n', name:'艾恩（en）', desc:'发音"n嫩"\nnein=奈因\nNacht=纳赫特', special:false},
  {l:'O o', name:'哦（oh）', desc:'长/短"哦"\noder=哦德尔\noben=哦本', special:false},
  {l:'P p', name:'配（peh）', desc:'发音"p配"\nPause=葩乌泽\nPost=波斯特', special:false},
  {l:'Q q', name:'库（kuh）', desc:'⚠️ qu→"kv夸"\n不是"kw"\nQualität=克瓦利泰特', special:false},
  {l:'R r', name:'艾尔（er）', desc:'⚠️ 喉部颤音\n词尾→弱化"厄"\nrot=罗特', special:false},
  {l:'S s', name:'艾斯（es）', desc:'母音间→"z兹"\n其余→"s斯"\nSee=泽，das=达斯', special:false},
  {l:'T t', name:'特（teh）', desc:'发音"t特"\nTag=塔克\nTisch=提什', special:false},
  {l:'U u', name:'乌（uh）', desc:'长/短"乌"\nund=温特\nUhr=乌尔', special:false},
  {l:'V v', name:'法乌（fau）', desc:'⚠️ 发"f夫"音！\n外来词发"v"\nVater=法特尔', special:false},
  {l:'W w', name:'韦（veh）', desc:'⚠️ 发"v"音！\n不是英语"w"\nWasser=瓦瑟', special:false},
  {l:'X x', name:'伊克斯（iks）', desc:'发"ks"音\nTaxi=塔克西\n（主要在外来词）', special:false},
  {l:'Y y', name:'于普西龙（Ypsilon）', desc:'德语词→"ü于"\n外来词→"i伊/j雅"\n（主要外来词）', special:false},
  {l:'Z z', name:'采特（tset）', desc:'⚠️ 发"ts茨"！\n不是英语"z"\nZeit=采特，zu=楚', special:false},
  {l:'Ä ä', name:'埃（ä）', desc:'发"ä诶"（类似"诶"）\nMädchen=梅特兴\nÄpfel=埃普费尔', special:true},
  {l:'Ö ö', name:'欧（ö）', desc:'⚠️ 圆唇发"诶"\n嘴形成"o"说"e"\nschön=舍恩', special:true},
  {l:'Ü ü', name:'于（ü）', desc:'⚠️ 圆唇发"衣"\n嘴形成"u"说"i"\ngrün=格吕恩', special:true},
  {l:'ß', name:'艾斯采特（Eszett）', desc:'等于双ss"斯"\n长元音/双元音后用\nStraße=施特拉瑟', special:true},
]

const combos = [
  {c:'ei', rule:'发"ai"音', zh:'艾', ex:'Wein（酒）= 魏因'},
  {c:'ie', rule:'发长"i"音', zh:'伊', ex:'viel（多）= 菲尔'},
  {c:'eu/äu', rule:'发"oi"音', zh:'欧伊', ex:'Freund（朋友）= 弗洛伊恩特'},
  {c:'au', rule:'发"ao"音', zh:'奥', ex:'blau（蓝）= 布劳'},
  {c:'ch', rule:'舌后摩擦音', zh:'希/赫', ex:'ich（我）= 伊希；Bach = 巴赫'},
  {c:'sch', rule:'类似"sh"', zh:'施', ex:'schön（美）= 修恩'},
  {c:'sp/st', rule:'词首发"shp/sht"', zh:'斯普/斯特', ex:'Sprache（语言）= 斯普拉赫'},
  {c:'qu', rule:'发"kv"音', zh:'克夫', ex:'Qualität = 克法利泰特'},
  {c:'ng', rule:'鼻音"ng"', zh:'嗯（鼻音）', ex:'jung（年轻）= 永'},
  {c:'pf', rule:'"pf"连读', zh:'普夫', ex:'Kopf（头）= 科普夫'},
  {c:'tz', rule:'发"ts"', zh:'茨', ex:'Satz（句子）= 扎茨'},
  {c:'chs', rule:'发"ks"', zh:'克斯', ex:'wachsen（生长）= 瓦克森'},
]

const rules = [
  {title:'规则1：字尾 -e 轻读', body:'词尾的e通常发轻声"呃"。例：Hunde（狗们）= 洪德呃，Sprache（语言）= 斯普拉赫呃'},
  {title:'规则2：-ig 结尾发"希"', body:'词尾-ig发/ɪç/音，近似"希"。例：richtig（正确的）= 里希希，lustig（有趣的）= 卢斯希'},
  {title:'规则3：词尾辅音清化', body:'词尾的b/d/g变清音p/t/k。例：Hund（狗）读作"洪特"，Weg（路）读作"韦克"'},
  {title:'规则4：重音基本在第一音节', body:'德语词重音通常在第一个音节。外来词例外。例：KOM-men，SPRA-che，GU-ten'},
  {title:'规则5：v 发"f"音', body:'德语v通常发"f"音。例：Vater（父亲）= 法特尔，viel（多）= 菲尔'},
  {title:'规则6：w 发"v"音', body:'德语w发"v"音（英语的v）。例：Wasser（水）= 瓦瑟，weiß（白色）= 魏斯'},
]

Page({
  data: { letters, combos, rules }
})
