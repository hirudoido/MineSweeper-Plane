const placementGroups = {
   basic: {
    label: "基本設置",
    items: [
      "random","ReducedLuck","Chaos12","cluster","FractalIslands",
      "noDiagonal","noOrthogonal","noThree","Path","NoIsolated","Continent",
      "Lightning","SpiderWeb"
    ]
  },
  limit: {
    label: "制限設置",
    items: [
      "pair","rowcolfixed","bridge","ThreeInRow","QuadrantEqual","ColorBalanced",
      "NoTouch","Cluster4Isolated","TetrisMino"
    ]
  },
  Prohibited: {
    label: "禁止設置",
    items: [
      "ReducedLuck","noDiagonal","noOrthogonal","noThree","NoIsolated"
    ]
  },
  lump: {
    label: "固まり設置",
    items: [
     "Path","Chaos12","cluster","FractalIslands","NoIsolated","Continent","Lightning","SpiderWeb","Cluster4Isolated"
     ,"TetrisMino"
    ]
  },
  Equal: {
    label: "等分設置",
    items: [
"pair","rowcolfixed","bridge","QuadrantEqual","ColorBalanced","ThreeInRow"
    ]
  },
  unique: {
    label: "一意設置",
    items: [
      "NoTouch","random"
    ]
  },
  Beginner: {
    label: "初心者向け",
    items: [
      "NoTouch","random","ReducedLuck","noThree","QuadrantEqual","ColorBalanced"
    ]
  },
  Intermediate: {
    label: "中級者向け",
    items: [
      "Chaos12","noDiagonal","noOrthogonal","NoIsolated","Continent","pair","rowcolfixed","ThreeInRow",
      "TetrisMino"
    ]
  },
  Advanced: {
    label: "上級者向け",
    items: [
      "cluster","FractalIslands","Path","Lightning","SpiderWeb","bridge","Cluster4Isolated"
    ]
  }


}
const exploreGroups = {
  basic: {
    label: "基本探索",
    items: [
      "normal8","big25","big49","Normal8torus",
      "knight","queen","UntilMine5x5",
      "Cross1","Cross2","Alternating",
      "colorAxis","colorAxisDiagonal",
      "Ring","Diamond2","Diamond3","Global"
    ]
  },
  special: {
    label: "特殊探索",
    items: [
      "untilMine","expandUntilMine","ExpandUntil2MinesTriangle",
      "RippleChain","Ripple","SquareMineCount","DiamondMineCount"
    ]
  },
  immutable: {
    label: "不変探索",
    items: [
      "clusterDetect","StraightLine","RippleImmutable","UntilMine5x5Immutable"
    ]
  },
  square: {
    label: "正方形探索",
    items: [
      "normal8","big25","big49","Normal8torus",
      ,"RippleChain","SquareMineCount","Alternating"
    ]
  },
  rectangle:{
    label: "長方形探索",
    items: [
      "Cross1","Cross2","colorAxis","colorAxisDiagonal","StraightLine","Alternating"
    ]
  },
  chess: {
    label: "チェス探索",
    items: [
      "knight","queen","UntilMine5x5","untilMine","UntilMine5x5Immutable"
    ]
  },
  eccentric: {
    label: "異形探索",
    items: [
      "Ring","Diamond2","Diamond3","DiamondMineCount","expandUntilMine","ExpandUntil2MinesTriangle","Ripple"
      ,"RippleImmutable","clusterDetect",
    ]
  },
  Beginner: {
    label: "初心者向け",
    items: [
    "Cross1","Cross2","normal8","UntilMine5x5","untilMine"
    ]
  },
  Intermediate: {
    label: "中級者向け",
    items: [
    "big25","Normal8torus","Alternating","knight","queen","Ring","Diamond2","expandUntilMine",
    "Ripple","SquareMineCount","UntilMine5x5Immutable"
    ]
  },
  Advanced: {
    label: "上級者向け",
    items: [
      "big49","colorAxis","colorAxisDiagonal","Diamond3","ExpandUntil2MinesTriangle","RippleChain",
      "DiamondMineCount","StraightLine","clusterDetect","RippleImmutable","Global"
    ]
  }

};
const numberGroups = {
  basic: {
    label: "基本表示",
    items: [
      "total","qmark","fuzzy","colorDiff","ColorWeight","ClusterQuantity",
      "mod3","mod10","Percent","EvenOdd","Odd","prime","PrimeOnly",
      "distanceSum","distanceProduct","NearestTwoProduct","NeighborAverage"
    ]
  },
  multi: {
    label: "数多の表示",
    items: [
      "colorSplit","cluster","clusterMazMin","range3","decompose",
      "TruthLie","VerticalSplit","HorizontalSplit","ManhattanVector"
    ]
  },
  mathematics: {
    label: "数学の表示",
    items: [
      "total","mod3","mod10","Percent","EvenOdd","Odd",
      "prime","PrimeOnly","NeighborAverage","decompose"
    ]
  },
  distance: {
    label: "距離の表示",
    items: [
      "distanceSum","distanceProduct","NearestTwoProduct","ManhattanVector"
    ]
  },
  colors: {
    label: "色の表示",
    items: [
      "colorSplit","colorDiff","ColorWeight"
    ]
  },
  lumps: {
    label: "固まりの表示",
    items: [
      "cluster","clusterMazMin","ClusterQuantity"
    ]
  },
  unique: {
    label: "個性的な表示",
    items: [
      "qmark","fuzzy","range3","TruthLie","VerticalSplit","HorizontalSplit"
    ]
  },
  Beginner: {
    label: "初心者向け",
    items: [
      "colorSplit","cluster","total","VerticalSplit","HorizontalSplit"
    ]
  },
  Intermediate: {
    label: "中級者向け",
    items: [
      "fuzzy","ColorWeight","ClusterQuantity","mod10","EvenOdd","Odd","prime","PrimeOnly",
      "distanceProduct","NearestTwoProduct","clusterMazMin","decompose","TruthLie"
    ]
  },
  Advanced: {
    label: "上級者向け",
    items: [
      "qmark","colorDiff","mod3","Percent","distanceSum","NeighborAverage","range3","ManhattanVector"
    ]
  }

};
const placementJP = {
  //"基本設置"
  random:"ランダム",
  ReducedLuck:"運排除",
  Chaos12:"運のみ",
  cluster:"クラスター",
  FractalIslands:"フラクタル島",
  noDiagonal:"斜め禁止",
  noOrthogonal:"縦横禁止",
  noThree:"3連禁止",
  Path:"道",
  NoIsolated:"孤立禁止",
  Continent:"大陸",
  Lightning:"稲妻",
  SpiderWeb:"蜘蛛の巣",
//"制限設置
  pair:"ペア",
  rowcolfixed:"行・列固定",
  bridge:"ブリッジ",
  ThreeInRow:"3連のみ",
  QuadrantEqual:"4分割",
  ColorBalanced:"色ごと",
  NoTouch:"ぼっち",
  Cluster4Isolated:"4近傍孤立",
  TetrisMino:"テトリスミノ",
}
const exploreJP = {
  normal8: "8方向(3×3)",
  big25: "8方向(5×5)",
  big49: "8方向(7×7)",
  Normal8torus: "8方向(3×3,トーラス)",
  knight: "ナイト",
  queen: "クイーン",
  UntilMine5x5: "クイーン(2)",
  Cross1: "十字架(1)",
  Cross2: "十字架(2)",
  Alternating: "十字架,8方向交互に",
  colorAxis: "縦横に交互に",
  colorAxisDiagonal: "縦横,斜めに交互に",
  Ring: "リング",
  Diamond2: "菱形(2)",
  Diamond3: "菱形(3)",
  Global: "全範囲",

  // 特殊探索
  untilMine: "クイーン状に発見まで",
  expandUntilMine: "波紋状に発見まで",
  ExpandUntil2MinesTriangle: "三角状に発見まで(2)",
  RippleChain: "地雷から地雷に接続",
  Ripple: "地雷数による波紋",
  SquareMineCount: "地雷数による正方形(2)",
  DiamondMineCount: "地雷数による菱形(+2)",

  // 不変探索
  clusterDetect: "固まり検出α",
  StraightLine: "直線状に発見までα",
  RippleImmutable: "地雷数による波紋α",
  UntilMine5x5Immutable: "クイーン状に発見までα(2)"
};
// 表示ルール分類
const numberJP = {
  total: "総数",
  qmark: "クエスチョン",
  fuzzy: "ファジー",
  colorDiff: "色別の差",
  ColorWeight: "色別加重",
  ClusterQuantity: "固まり個数",
  mod3: "余り3",
  mod10: "余り10",
  Percent: "割合",
  EvenOdd: "偶数",
  Odd: "奇数",
  prime: "素数",
  PrimeOnly: "素数以外",
  distanceSum: "距離の合計",
  distanceProduct: "距離の積",
  NearestTwoProduct: "2点からの距離",
  NeighborAverage: "周りの平均値",

  // 数多
  colorSplit: "色別",
  cluster: "固まり",
  clusterMazMin: "固まり最大 最小",
  range3: "3区間まとめ表示",
  decompose: "分解",
  TruthLie: "真偽",
  VerticalSplit: "上下",
  HorizontalSplit: "左右",
  ManhattanVector: "縦横の距離"
};
const placementOrder = {
    standard: ["basic", "limit"],
  genre:     ["Prohibited", "lump","Equal","unique"], // ジャンル順
  difficulty:  ["Beginner", "Intermediate", "Advanced"]
}
// 並び替えプリセット（optgroup の順番）
const exploreOrder = {
  standard: ["basic", "special", "immutable"],
  genre:    ["square", "rectangle", "chess","eccentric"], // ジャンル順
  difficulty:["Beginner", "Intermediate", "Advanced"]// 難易度順（例）
};

const numberOrder = {
  standard: ["basic", "multi"],
  genre:    ["mathematics", "distance", "colors","lumps","unique"],
  difficulty:  ["Beginner", "Intermediate", "Advanced"]// 必要なら変更
};
function rebuildSelect(selectId, groups, order, dictJP) {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  sel.innerHTML = "";

  order.forEach(groupKey => {
    const g = groups[groupKey];
    if (!g) return;

    const og = document.createElement("optgroup");
    og.label = g.label;

    g.items.forEach(value => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = dictJP[value] || value;
      og.appendChild(opt);
    });

    sel.appendChild(og);
  });
}
document.getElementById("ruleSort").addEventListener("change", e => {
  const mode = e.target.value;

  rebuildSelect("placement", placementGroups, placementOrder[mode], placementJP);
  rebuildSelect("explore", exploreGroups, exploreOrder[mode], exploreJP);
  rebuildSelect("number", numberGroups, numberOrder[mode], numberJP);
});


// ====== 画面サイズをボードサイズに合わせる ======
const colorMap = {
  red:    [255, 0, 0],
  purple: [128, 0, 128],
  blue:   [0, 0, 255],
  yellow: [255, 255, 0],
  green:  [0, 128, 0],
  white:  [255, 255, 255],
  black:  [0, 0, 0]
};
const drawManager = {
  canvas: document.getElementById("drawLayer"),
  ctx: null,
  drawing: false,
  mode: "open",
  color: "red",
  width: 2,
    touchTimer: null,



  init() {
    this.ctx = this.canvas.getContext("2d");
    this.bindEvents();
  },

  bindEvents() {
    this.canvas.addEventListener("mousedown", this.onStart.bind(this));
    this.canvas.addEventListener("mousemove", this.onMove.bind(this));
    document.addEventListener("mouseup", this.onEnd.bind(this));

    this.canvas.addEventListener("touchstart", this.onTouchStart.bind(this));
    this.canvas.addEventListener("touchmove", this.onTouchMove.bind(this));
    this.canvas.addEventListener("touchend", this.onEnd.bind(this));
  },

  onStart(e) {
    if (!["pen", "eraser", "colorEraser"].includes(this.mode)) return;
    const { x, y } = this.getPos(e);
    this.drawing = true;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  },

  onMove(e) {
    if (!this.drawing) return;
    const { x, y } = this.getPos(e);
    if (this.mode === "colorEraser") {
      this.eraseColorAt(x, y);
      return;
    }
    this.ctx.lineWidth = this.width;
    this.ctx.lineCap = "round";
    this.ctx.globalCompositeOperation = this.mode === "eraser" ? "destination-out" : "source-over";
    this.ctx.strokeStyle = this.color;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  },

onTouchStart(e) {
  /*
  if (e.touches.length >= 2) {
    // ★ キャンバスを一時的に無効化してスクロールを許可
    this.canvas.style.pointerEvents = "none";
    this.drawing = false;
    console.log("2本指以上",e.touches.length);
    //return;
    }*/
   
   
   
   // ★ モード判定をタッチ側でも行う
   if (!["pen", "eraser", "colorEraser"].includes(this.mode)) {
     // this.drawing = false;
    // return;
    }
    
    const touch = e.touches[0];
    const { x, y } = this.getPos(touch);
    this.canvas.style.pointerEvents = "auto";
    
    this.drawing = true;
    this.ctx.beginPath();
  this.ctx.moveTo(x, y);
 if (e.touches.length = 1) {
  console.log("1本指",e.touches.length);
  //e.preventDefault();
  }else{
this.drawing = false;
this.canvas.style.pointerEvents = "none";
  //e.preventDefault();
  }

},



onTouchMove(e) {

  
  // 2本指 → スクロール・ズーム
  if (e.touches.length >= 2) {
    this.drawing = false;
    //console.log("2本指",e.touches.length);
    //return;
    // preventDefault しない
  }
  // 描画中のみ描く
  if (!this.drawing){ console.log("描画中",e.touches.length);return;}
  
  const touch = e.touches[0];
  const { x, y } = this.getPos(touch);

  // ★ 色消しゴム（特定色だけ消す）
  if (this.mode === "colorEraser") {
    this.eraseColorAt(x, y);
      if (e.touches.length = 1) {e.preventDefault();}
    return;
  }

  // ★ 消しゴム（透明で消す）
  if (this.mode === "eraser") {
    this.ctx.lineWidth = this.width;
    this.ctx.lineCap = "round";
    this.ctx.globalCompositeOperation = "destination-out";
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    if (e.touches.length = 1) {e.preventDefault();}
    return;
  }

  // ★ ペン（通常描画）
  if (this.mode === "pen") {
    this.ctx.lineWidth = this.width;
    this.ctx.lineCap = "round";
    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.strokeStyle = this.color;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
 if (e.touches.length = 1) {
  console.log("1本指",e.touches.length);
  e.preventDefault();
  }
    return;
  }
},

onEnd() {
  this.drawing = false;

  // ★ 指が離れたらキャンバスを元に戻す
  this.canvas.style.pointerEvents = (this.mode === "open") ? "none" : "auto";

  if (this.touchTimer) clearTimeout(this.touchTimer);
},

  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  },

  eraseColorAt(x, y) {
    const radius = this.width;
    const img = this.ctx.getImageData(x - radius, y - radius, radius * 2, radius * 2);
    const data = img.data;
    const [rT, gT, bT] = colorMap[this.color];

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (colorDistance(r, g, b, rT, gT, bT) < 40) data[i + 3] = 0;
    }

    this.ctx.putImageData(img, x - radius, y - radius);
  },
  clearAll() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
},

clearColor() {
  const [rT, gT, bT] = colorMap[this.color];
  const img = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  const data = img.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    if (colorDistance(r, g, b, rT, gT, bT) < 40) data[i+3] = 0;
  }

  this.ctx.putImageData(img, 0, 0);
}
};

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
}
document.querySelectorAll(".tool-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tool-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    drawManager.mode = btn.dataset.tool;
    updateCanvasMode();
  });
});

document.querySelectorAll(".color-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    drawManager.color = btn.dataset.color;
  });
});
document.getElementById("clearAll").addEventListener("click", () => drawManager.clearAll());
document.getElementById("clearColor").addEventListener("click", () => drawManager.clearColor());

function resizeCanvasToBoard() {
  const boardEl = document.getElementById("board");
  const canvas = drawManager.canvas;
  const ctx = drawManager.ctx;

  // ★ 1. 今の描画内容を保存
  const oldImage = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // ★ 2. キャンバスのサイズを盤面に合わせて変更
  canvas.width  = boardEl.offsetWidth*1.4;
  canvas.height = boardEl.offsetHeight*1.4;

  // ★ 3. サイズ変更後は ctx がリセットされるので取り直す
  drawManager.ctx = canvas.getContext("2d");

  // ★ 4. 保存した画像を新しいサイズに描き戻す
  drawManager.ctx.putImageData(oldImage, 0, 0);
}
document.getElementById("widthSelect").addEventListener("change", e => {
  drawManager.width = +e.target.value;
});
function updateCanvasMode() {
  const canvas = document.getElementById("drawLayer");
  const pe = (drawManager.mode === "open") ? "none" : "auto";
  canvas.style.pointerEvents = pe;
}