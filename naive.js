// naive.js

// ====== 戦略実装 ======
// ====== ランダム配置 ======
class RandomPlacement extends PlacementStrategy {
    
  place(board, mineCount, rng, excludeIndex = -1) {
    let placed = 0;
    const total = board.rows * board.cols;
    while (placed < mineCount) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;
      const cell = board.cells[idx];
      if (!cell.mine) {
        cell.mine = true;
        placed++;
      }
    }
  }
  
}
// ====== クラスター配置 ======
class ClusterPlacement extends PlacementStrategy {

  place(board, mineCount, rng, excludeIndex = -1) {
    const total = board.rows * board.cols;
    let placed = 0;

    while (placed < mineCount) {
      // 1. クラスターの中心をランダムに選ぶ
      const centerIdx = Math.floor(rng() * total);
      const centerCell = board.cells[centerIdx];
      if (centerIdx === excludeIndex) continue;

      // 2. 中心に地雷を置く
      if (!centerCell.mine) {
        centerCell.mine = true;
        placed++;
      }

      // 3. 周囲のセルにも追加で地雷を置く（クラスター形成）
      const r = centerCell.r, c = centerCell.c;
      const neighbors = [
        [r-1,c],[r+1,c],[r,c-1],[r,c+1],
        [r-1,c-1],[r-1,c+1],[r+1,c-1],[r+1,c+1]
      ];
      for (const [rr, cc] of neighbors) {
        if (placed >= mineCount) break;
        if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
        const nb = board.getCell(rr, cc);
        if (!nb.mine && (rng() <0.82)) { // 80%の確率で置く
          nb.mine = true;
          placed++;
        }
      }
    }
    //console.log("4444ent used");
  }
}
// 斜め禁止配置
class NoDiagonalPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    let placed = 0;
    const total = board.rows * board.cols;

    while (placed < mineCount) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;
      const cell = board.cells[idx];
      if (cell.mine) continue;

      // 斜め方向に地雷があるかチェック
      const r = cell.r, c = cell.c;
      const diagonals = [
        [r-1, c-1], [r-1, c+1],
        [r+1, c-1], [r+1, c+1]
      ];
      let hasDiagonalMine = false;
      for (const [rr, cc] of diagonals) {
        if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
        if (board.getCell(rr, cc).mine) {
          hasDiagonalMine = true;
          break;
        }
      }

      if (hasDiagonalMine) continue; // 斜めに地雷があるなら置かない

      // 問題なければ地雷を置く
      cell.mine = true;
      placed++;
    }
    //console.log("NoDiagonalPlacement used");
  }
}
// 3連禁止配置
class NoThreeInRowPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    let placed = 0;
    const total = board.rows * board.cols;

    while (placed < mineCount) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;
      const cell = board.cells[idx];
      if (cell.mine) continue;

      // 置いてもOKかチェック
      if (this._wouldMakeThree(board, cell)) continue;

      // 問題なければ設置
      cell.mine = true;
      placed++;
    }
  }

  _wouldMakeThree(board, cell) {
    const dirs = [
      [1,0], [0,1], [1,1], [1,-1] // 縦・横・斜め
    ];
    for (const [dr, dc] of dirs) {
      let count = 1; // 自分を含めて数える

      // 前方向
      let r = cell.r + dr, c = cell.c + dc;
      while (r >= 0 && c >= 0 && r < board.rows && c < board.cols) {
        if (board.getCell(r,c).mine) {
          count++;
          r += dr; c += dc;
        } else break;
      }

      // 逆方向
      r = cell.r - dr; c = cell.c - dc;
      while (r >= 0 && c >= 0 && r < board.rows && c < board.cols) {
        if (board.getCell(r,c).mine) {
          count++;
          r -= dr; c -= dc;
        } else break;
      }

      if (count >= 3) return true; // 3連以上になる
    }
    return false;
  }
}
// ペア配置
class PairPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    let placed = 0;
    const total = board.rows * board.cols;

    while (placed < mineCount) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;
      const cell = board.cells[idx];
      if (cell.mine) continue;

      // 1個目を仮置き
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      const [dr, dc] = dirs[Math.floor(rng() * dirs.length)];
      const rr = cell.r + dr, cc = cell.c + dc;
      if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
      const nb = board.getCell(rr, cc);
      if (nb.mine) continue;

      // ★ 隣接禁止チェック
      if (this._hasAdjacentMine(board, cell) || this._hasAdjacentMine(board, nb)) {
        continue; // このペアは無効
      }

      // 問題なければ確定
      cell.mine = true;
      nb.mine = true;
      placed += 2;
    }}
      _hasAdjacentMine(board, cell) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const rr = cell.r + dr, cc = cell.c + dc;
      if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
      if (board.getCell(rr, cc).mine) return true;
    }
    return false;
  }
}

  // 行・列固定配置
class RowColFixedPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const rows = board.rows;
    const cols = board.cols;

    // 正方形特別処理
  if (rows === cols) {
      if (mineCount % rows !== 0) {
        throw new Error("正方形では地雷数は行数(=列数)の倍数である必要があります");
      }
      const perLine = mineCount / rows;
      const colRemain = Array(cols).fill(perLine);

      for (let r = 0; r < rows; r++) {
        const colIndices = Array.from({length: cols}, (_, i) => i);
        // シャッフル
        for (let i = colIndices.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [colIndices[i], colIndices[j]] = [colIndices[j], colIndices[i]];
        }

        let placed = 0;
        for (let c of colIndices) {
          if (placed >= perLine) break;
          if (colRemain[c] <= 0) continue;
          const cell = board.getCell(r, c);
          if (cell.mine || (r * cols + c === excludeIndex)) continue;

          cell.mine = true;
          colRemain[c]--;
          placed++;
        }

        // 行に必要数置けなかったら失敗
        if (placed < perLine) {
          throw new Error("配置失敗");
        }
      }
      return;
    }



    // 通常処理（長方形）
    const byRow = (mineCount % rows === 0);
    const byCol = (mineCount % cols === 0);

    if (!byRow && !byCol) {
      throw new Error("地雷数は行数または列数の倍数である必要があります");
    }

    if (byRow) {
      const perRow = mineCount / rows;
      for (let r = 0; r < rows; r++) {
        let placed = 0;
        while (placed < perRow) {
          const c = Math.floor(rng() * cols);
          const cell = board.getCell(r, c);
          if (cell.mine || (r * cols + c === excludeIndex)) continue;
          cell.mine = true;
          placed++;
        }
      }
    } else if (byCol) {
  const perCol = mineCount / cols;
  for (let c = 0; c < cols; c++) {
    // 行インデックスをシャッフル
    const rowIndices = Array.from({length: rows}, (_, i) => i);
    for (let i = rowIndices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [rowIndices[i], rowIndices[j]] = [rowIndices[j], rowIndices[i]];
    }

    let placed = 0;
    for (let r of rowIndices) {
      if (placed >= perCol) break;
      const cell = board.getCell(r, c);
      if (cell.mine || (r * cols + c === excludeIndex)) continue;
      cell.mine = true;
      placed++;
    }
  }
}
  }
}
// 橋配置
class BridgePlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const rows = board.rows;
    const cols = board.cols;

    const byRow = (mineCount % cols === 0);
    const byCol = (mineCount % rows === 0);

    if (!byRow && !byCol) {
      throw new Error("地雷数は行数または列数の倍数である必要があります");
    }

    if (byRow) {
      const bridges = mineCount / cols;
      const usedRows = new Set();
      while (usedRows.size < bridges) {
        let r = Math.floor(rng() * rows);
        if (usedRows.has(r)) continue;
        usedRows.add(r);

        const startRow = r;
        const path = [];

        for (let c = 0; c < cols; c++) {
          path.push([r, c]);

          if (c < cols - 1) {
            const offset = r - startRow;
            let choices = [0];
            if (offset > 0) choices.push(-1, -1), choices.push(1);
            else if (offset < 0) choices.push(1, 1), choices.push(-1);
            else choices.push(-1, 1);

            // ★ 合流禁止チェック
            const validMoves = choices.filter(delta => {
              const candidate = Math.max(0, Math.min(rows - 1, r + delta));
              const nextCell = board.getCell(candidate, c + 1);
              return !nextCell.mine; // 既に地雷があるなら除外
            });

            if (validMoves.length === 0) {
              // 進めない → この橋は失敗扱い（リトライ）
              return this.place(board, mineCount, rng, excludeIndex);
            }

            const delta = validMoves[Math.floor(rng() * validMoves.length)];
            r = Math.max(0, Math.min(rows - 1, r + delta));
          }
        }

        // 経路をユニーク化
        const unique = [...new Set(path.map(p => p.join(",")))];
        let placed = 0;
        for (const key of unique) {
          const [rr, cc] = key.split(",").map(Number);
          if (rr * cols + cc === excludeIndex) continue;
          const cell = board.getCell(rr, cc);
          if (!cell.mine) {
            cell.mine = true;
            placed++;
          }
        }

        // 足りなかった分は同じ行から補填
        while (placed < cols) {
          const cc = Math.floor(rng() * cols);
          const cell = board.getCell(r, cc);
          if (!cell.mine && (r * cols + cc !== excludeIndex)) {
            cell.mine = true;
            placed++;
          }
        }
      }
    } else if (byCol) {
      const bridges = mineCount / rows;
      const usedCols = new Set();
      while (usedCols.size < bridges) {
        let c = Math.floor(rng() * cols);
        if (usedCols.has(c)) continue;
        usedCols.add(c);

        const startCol = c;
        const path = [];

        for (let r = 0; r < rows; r++) {
          path.push([r, c]);

          if (r < rows - 1) {
            const offset = c - startCol;
            let choices = [0];
            if (offset > 0) choices.push(-1, -1), choices.push(1);
            else if (offset < 0) choices.push(1, 1), choices.push(-1);
            else choices.push(-1, 1);

            // ★ 合流禁止チェック
            const validMoves = choices.filter(delta => {
              const candidate = Math.max(0, Math.min(cols - 1, c + delta));
              const nextCell = board.getCell(r + 1, candidate);
              return !nextCell.mine;
            });

            if (validMoves.length === 0) {
              // 進めない → この橋は失敗扱い（リトライ）
              return this.place(board, mineCount, rng, excludeIndex);
            }

            const delta = validMoves[Math.floor(rng() * validMoves.length)];
            c = Math.max(0, Math.min(cols - 1, c + delta));
          }
        }

        // 経路をユニーク化
        const unique = [...new Set(path.map(p => p.join(",")))];
        let placed = 0;
        for (const key of unique) {
          const [rr, cc] = key.split(",").map(Number);
          if (rr * cols + cc === excludeIndex) continue;
          const cell = board.getCell(rr, cc);
          if (!cell.mine) {
            cell.mine = true;
            placed++;
          }
        }

        // 足りなかった分は同じ列から補填
        while (placed < rows) {
          const rr = Math.floor(rng() * rows);
          const cell = board.getCell(rr, c);
          if (!cell.mine && (rr * cols + c !== excludeIndex)) {
            cell.mine = true;
            placed++;
          }
        }
      }
    }
  }
}
//必ずくっつく
class NoIsolatedPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const total = board.rows * board.cols;
    let attempt = 0;

    while (true) {
      attempt++;
      // 盤面をリセット
      for (const cell of board.cells) {
        cell.mine = false;
      }

      // ランダムに地雷を配置
      let placed = 0;
      while (placed < mineCount) {
        const idx = Math.floor(rng() * total);
        if (idx === excludeIndex) continue;
        const cell = board.cells[idx];
        if (!cell.mine) {
          cell.mine = true;
          placed++;
        }
      }

      // 孤立チェック
      let isolated = false;
      for (const cell of board.cells) {
        if (!cell.mine) continue;
        let hasNeighborMine = false;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const rr = cell.r + dr, cc = cell.c + dc;
            if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
            if (board.getCell(rr, cc).mine) {
              hasNeighborMine = true;
              break;
            }
          }
          if (hasNeighborMine) break;
        }
        if (!hasNeighborMine) {
          isolated = true;
          break;
        }
      }

      if (!isolated) {
        // 成功
        // console.log("配置成功 after", attempt, "attempts");
        return;
      }
      // 失敗ならリトライ
    }
  }
}
//大陸設置
class ContinentPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const total = board.rows * board.cols;

    while (true) {
      // 盤面リセット
      for (const cell of board.cells) {
        cell.mine = false;
      }

      // ランダム配置
      let placed = 0;
      while (placed < mineCount) {
        const idx = Math.floor(rng() * total);
        if (idx === excludeIndex) continue;
        const cell = board.cells[idx];
        if (!cell.mine) {
          cell.mine = true;
          placed++;
        }
      }

      // --- 連結チェック ---
      if (this._isSingleContinent(board)) {
        return; // 成功
      }
      // 失敗ならリトライ
    }
  }

  _isSingleContinent(board) {
    // 地雷セルを探す
    const mines = board.cells.filter(c => c.mine);
    if (mines.length === 0) return false;

    // BFS/DFSで最初の地雷から連結成分を探索
    const visited = new Set();
    const start = mines[0];
    const stack = [start];
    visited.add(start);

    while (stack.length > 0) {
      const cur = stack.pop();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = cur.r + dr, cc = cur.c + dc;
          if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
          const nb = board.getCell(rr, cc);
          if (nb.mine && !visited.has(nb)) {
            visited.add(nb);
            stack.push(nb);
          }
        }
      }
    }

    // すべての地雷が訪問済みなら「大陸」
    return visited.size === mines.length;
  }
}
//  3連のみ
class ThreeInRowPlacement extends PlacementStrategy {
  constructor() {
    super();
    this.dirs = [
      [1, 0],   // 縦
      [0, 1],   // 横
      [1, 1],   // 斜め
      [1, -1],  // 逆斜め
    ];
  }

  place(board, mineCount, rng, excludeIndex = -1) {
    if (mineCount % 3 !== 0) {
      throw new Error("3連のみルールでは地雷数は3の倍数である必要があります");
    }

    // 盤面リセット
    for (const cell of board.cells) cell.mine = false;

    const groups = mineCount / 3;
    let placedGroups = 0;

    let safety = 0;
    const MAX = 20000;

    while (placedGroups < groups) {
      safety++;
      if (safety > MAX) {
        throw new Error("3連配置に失敗（空間不足）");
      }

      const r = Math.floor(rng() * board.rows);
      const c = Math.floor(rng() * board.cols);
      const [dr, dc] = this.dirs[Math.floor(rng() * this.dirs.length)];

      const cells = [
        [r, c],
        [r + dr, c + dc],
        [r + 2 * dr, c + 2 * dc],
      ];

      // 盤面外
      if (cells.some(([rr, cc]) => rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols))
        continue;

      // excludeIndex のセルを含むならNG
      if (cells.some(([rr, cc]) => rr * board.cols + cc === excludeIndex))
        continue;

      // 既存地雷と重複
      if (cells.some(([rr, cc]) => board.getCell(rr, cc).mine))
        continue;

      // 仮置きして4連チェック
      if (this._wouldMakeFour(board, cells))
        continue;

      // 配置
      for (const [rr, cc] of cells) {
        board.getCell(rr, cc).mine = true;
      }

      placedGroups++;
    }
  }

  _wouldMakeFour(board, cells) {
    // 仮置き
    for (const [r, c] of cells) {
      board.getCell(r, c).mine = true;
    }

    let bad = false;

    for (const [r, c] of cells) {
      for (const [dr, dc] of this.dirs) {
        let count = 1;

        // 前方向
        let rr = r + dr, cc = c + dc;
        while (board.getCell(rr, cc)?.mine) {
          count++; rr += dr; cc += dc;
        }

        // 逆方向
        rr = r - dr; cc = c - dc;
        while (board.getCell(rr, cc)?.mine) {
          count++; rr -= dr; cc -= dc;
        }

        if (count >= 4) {
          bad = true;
          break;
        }
      }
      if (bad) break;
    }

    // 元に戻す
    for (const [r, c] of cells) {
      board.getCell(r, c).mine = false;
    }

    return bad;
  }
}
//4分割
class QuadrantEqualPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const rows = board.rows;
    const cols = board.cols;

    if (rows % 2 !== 0 || cols % 2 !== 0) {
      throw new Error("行・列は偶数である必要があります");
    }
    if (mineCount % 4 !== 0) {
      throw new Error("地雷数は4の倍数である必要があります");
    }

    const perQuadrant = mineCount / 4;
    const halfR = rows / 2;
    const halfC = cols / 2;

    // 4つの領域を定義
    const quadrants = [
      { r0: 0,     r1: halfR, c0: 0,     c1: halfC }, // 左上
      { r0: 0,     r1: halfR, c0: halfC, c1: cols }, // 右上
      { r0: halfR, r1: rows,  c0: 0,     c1: halfC }, // 左下
      { r0: halfR, r1: rows,  c0: halfC, c1: cols }  // 右下
    ];

    for (const q of quadrants) {
      let placed = 0;
      while (placed < perQuadrant) {
        const r = q.r0 + Math.floor(rng() * (q.r1 - q.r0));
        const c = q.c0 + Math.floor(rng() * (q.c1 - q.c0));
        const idx = r * cols + c;
        if (idx === excludeIndex) continue;
        const cell = board.getCell(r, c);
        if (!cell.mine) {
          cell.mine = true;
          placed++;
        }
      }
    }
  }
}

// 端点数を数える（次数1のセル）
// 8方向の隣接セル取得
function neighbors8(board, cell) {
  const dirs = [
    [-1,0],[1,0],[0,-1],[0,1],
    [-1,-1],[-1,1],[1,-1],[1,1]
  ];
  const out = [];
  for (const [dr, dc] of dirs) {
    const n = board.getCell(cell.r + dr, cell.c + dc);
    if (n) out.push(n);
  }
  return out;
}

// 次数（隣接する地雷セル数）
function degree(board, cell) {
  return neighbors8(board, cell).filter(n => n.mine).length;
}

// 経路を伸ばせるか判定
function canExtendTo(board, currentEnd, next, startCell) {
  if (!next || next.mine) return false;
  if (startCell && next === startCell) return false; // ループ禁止

  const adjMines = neighbors8(board, next).filter(n => n.mine);
  if (!adjMines.includes(currentEnd)) return false; // 終端セルに隣接していない
  if (adjMines.some(m => m !== currentEnd)) return false; // 他の地雷に触れている

  // 斜めすり抜け禁止
  const dr = next.r - currentEnd.r;
  const dc = next.c - currentEnd.c;
  if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
    const side1 = board.getCell(currentEnd.r, currentEnd.c + dc);
    const side2 = board.getCell(currentEnd.r + dr, currentEnd.c);
    if ((side1 && side1.mine) || (side2 && side2.mine)) return false;
  }

  // 追加後の次数 <= 2
  const degEndAfter  = degree(board, currentEnd) + 1;
  const degNextAfter = degree(board, next) + 1;
  return degEndAfter <= 2 && degNextAfter <= 2;
}

// ★道 実装
class PathPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const total = board.rows * board.cols;
    let placed = 0;
    let retries = 0;
    const MAX_RETRY = 5000; // 大きめに設定

    while (placed < mineCount && retries < MAX_RETRY) {
      retries++;

      // 盤面クリア
      for (const c of board.cells) c.mine = false;
      placed = 0;

      // --- スタートセル選択 ---
      let start = null;
      for (let tries = 0; tries < 300; tries++) {
        const idx = Math.floor(rng() * total);
        const cand = board.cells[idx];
        if (cand.mine) continue;
        if (excludeIndex >= 0 && board.cells[excludeIndex] === cand) continue;
        if (neighbors8(board, cand).some(n => n.mine)) continue;
        if (degree(board, cand) > 1) { // ★ 次数2以上は不適格
          start = null;
          break;
        }
        start = cand;
        break;
      }
      if (!start) continue; // → リトライ

      // スタート確定
      start.mine = true;
      placed++;
      let current = start;

      // --- 経路を伸ばす ---
      while (placed < mineCount) {
        const cands = neighbors8(board, current)
          .filter(nb => canExtendTo(board, current, nb, start));

        if (cands.length === 0) break;

        // ヒューリスティック：自由度が少ない候補を優先
        cands.sort((a, b) =>
          neighbors8(board, a).filter(x => !x.mine).length -
          neighbors8(board, b).filter(x => !x.mine).length
        );

        const next = cands[Math.floor(rng() * Math.min(3, cands.length))];
        next.mine = true;
        placed++;
        current = next;
      }

      if (placed >= mineCount) break; // 成功
    }

    // --- 保険補充（孤立セルで埋める） ---
    while (placed < mineCount) {
      for (const cell of board.cells) {
        if (cell.mine) continue;
        if (excludeIndex >= 0 && board.cells[excludeIndex] === cell) continue;
        if (neighbors8(board, cell).some(n => n.mine)) continue;
        cell.mine = true;
        placed++;
        if (placed >= mineCount) break;
      }
    }
  }
}
//色ごとに均等に配置
class ColorBalancedPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const rows = board.rows;
    const cols = board.cols;

    // 2色に分ける（チェス盤パターン）
    const groups = [[], []];
    for (const cell of board.cells) {
      const color = (cell.r + cell.c) % 2; // 0 or 1
      groups[color].push(cell);
    }

    // mineCount が2で割り切れるかチェック
    if (mineCount % 2 !== 0) {
      throw new Error("地雷数は色数で割り切れる必要があります");
    }
    const perGroup = mineCount / 2;

    // 各グループに均等配置
    for (const group of groups) {
      let placed = 0;
      while (placed < perGroup) {
        const idx = Math.floor(rng() * group.length);
        const cell = group[idx];
        if (cell.mine) continue;
        if (excludeIndex >= 0 && board.cells[excludeIndex] === cell) continue;
        cell.mine = true;
        placed++;
      }
    }
  }
}

// 周囲8マスに地雷がない場所をランダムに配置
class NoTouchPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    // 全セルを候補に入れる
    let candidates = board.cells.map(c => c);

    let placed = 0;
    while (placed < mineCount && candidates.length > 0) {
      // ランダムに候補を選ぶ
      const idx = Math.floor(rng() * candidates.length);
      const cell = candidates[idx];

      if (cell.r * board.cols + cell.c === excludeIndex) {
        candidates.splice(idx, 1);
        continue;
      }

      // 地雷を置く
      cell.mine = true;
      placed++;

      // このセルと周囲8マスを候補から削除
      candidates = candidates.filter(c => {
        return Math.abs(c.r - cell.r) > 1 || Math.abs(c.c - cell.c) > 1;
      });
    }

    if (placed < mineCount) {
      throw new Error("指定数の地雷を配置できませんでした");
    }
  }
}

// 縦横禁止配置（斜めはOK）
class NoOrthogonalPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    let placed = 0;
    const total = board.rows * board.cols;

    while (placed < mineCount) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;

      const cell = board.cells[idx];
      if (cell.mine) continue;

      // 上下左右に地雷があるかチェック
      const r = cell.r, c = cell.c;
      const orthogonals = [
        [r-1, c], [r+1, c],
        [r, c-1], [r, c+1]
      ];
      let hasNeighborMine = false;
      for (const [rr, cc] of orthogonals) {
        if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
        if (board.getCell(rr, cc).mine) {
          hasNeighborMine = true;
          break;
        }
      }

      if (hasNeighborMine) continue; // 縦横に地雷があるなら置かない

      // 問題なければ設置
      cell.mine = true;
      placed++;
    }
  }
}
// 4連クラスタを離して配置
class Cluster4IsolatedPlacement extends PlacementStrategy {
  place(board, mineCount, rng) {
    if (mineCount % 4 !== 0) {
      throw new Error("地雷数は4の倍数である必要があります");
    }

    const groupCount = mineCount / 4;
    const placed = new Set();

    let attempts = 0;
    while (placed.size < mineCount && attempts < 10000) {
      attempts++;

      // ランダムな位置に2×2の地雷グループを試す
      const r = Math.floor(rng() * (board.rows - 1));
      const c = Math.floor(rng() * (board.cols - 1));

      const indices = [
        r * board.cols + c,
        r * board.cols + (c + 1),
        (r + 1) * board.cols + c,
        (r + 1) * board.cols + (c + 1),
      ];

      // 接触チェック（縦横方向）
      let conflict = false;
      for (const idx of indices) {
        const cell = board.cells[idx];
        const neighbors = this._orthogonalNeighbors(board, cell.r, cell.c);
        for (const nb of neighbors) {
          if (nb.mine) {
            conflict = true;
            break;
          }
        }
        if (conflict) break;
      }

      if (conflict) continue;

      // 配置
      for (const idx of indices) {
        board.cells[idx].mine = true;
        placed.add(idx);
      }
    }

    if (placed.size < mineCount) {
      throw new Error("地雷配置に失敗しました（空間不足）");
    }
  }

  _orthogonalNeighbors(board, r, c) {
    const out = [];
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < board.rows && nc >= 0 && nc < board.cols) {
        out.push(board.getCell(nr, nc));
      }
    }
    return out;
  }
}
// テトリスミノ配置
class TetrisMinoPlacement extends PlacementStrategy {
  place(board, mineCount, rng) {
    if (mineCount % 4 !== 0) {
      throw new Error("地雷数は4の倍数である必要があります（ミノ単位）");
    }

    const minoCount = mineCount / 4;
    let placed = 0;

    let attempts = 0;
    while (placed < minoCount && attempts < 5000) {
      attempts++;

      // ランダムにミノを選ぶ
      const keys = Object.keys(TETRIS_MINOS);
      const key = keys[Math.floor(rng() * keys.length)];
      let shape = TETRIS_MINOS[key];

      // ランダム回転
      const rot = Math.floor(rng() * 4);
      for (let i = 0; i < rot; i++) {
        shape = rotateShape(shape);
      }

      // ランダム位置
      const baseR = Math.floor(rng() * board.rows);
      const baseC = Math.floor(rng() * board.cols);

      // 実際の座標に変換
      const cells = shape.map(([dr, dc]) => [baseR + dr, baseC + dc]);

      // 盤面外チェック
      if (cells.some(([r, c]) =>
        r < 0 || r >= board.rows || c < 0 || c >= board.cols
      )) continue;

      // 接触禁止チェック（縦横）
      let conflict = false;
      for (const [r, c] of cells) {
        const nb = this._orthNeighbors(board, r, c);
        if (nb.some(n => n.mine)) {
          conflict = true;
          break;
        }
      }
      if (conflict) continue;

      // 配置
      for (const [r, c] of cells) {
        board.getCell(r, c).mine = true;
      }

      placed++;
    }

    if (placed < minoCount) {
      throw new Error("ミノ配置に失敗しました（空間不足）");
    }
  }

  _orthNeighbors(board, r, c) {
    const out = [];
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < board.rows && nc >= 0 && nc < board.cols) {
        out.push(board.getCell(nr, nc));
      }
    }
    return out;
  }
}
const TETRIS_MINOS = {
  O: [ [0,0], [0,1], [1,0], [1,1] ],
  I: [ [0,0], [1,0], [2,0], [3,0] ],
  T: [ [0,1], [1,0], [1,1], [1,2] ],
  L: [ [0,0], [1,0], [2,0], [2,1] ],
  J: [ [0,1], [1,1], [2,1], [2,0] ],
  S: [ [0,1], [0,2], [1,0], [1,1] ],
  Z: [ [0,0], [0,1], [1,1], [1,2] ]
};
function rotateShape(shape) {
  return shape.map(([r, c]) => [c, -r]);
}
// 雷配置
class LightningPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const rows = board.rows;
    const cols = board.cols;

    // スタート位置（上側から始めると雷っぽい）
    let r = Math.floor(rng() * Math.min(1, rows));
    let c = Math.floor(rng() * cols);

    let current = board.getCell(r, c);
    current.mine = true;

    let placed = 1;
    const visited = new Set([r * cols + c]);

    while (placed < mineCount) {

      // --- メインの雷の進行方向（ジグザグ） ---
      const mainDirs = [
        [1, 0],   // 下
        [1, 1],   // 右下
        [1, -1],  // 左下
        [0, 1],   // 右
        [0, -1],  // 左
      ];

      const [dr, dc] = mainDirs[Math.floor(rng() * mainDirs.length)];
      const nr = current.r + dr;
      const nc = current.c + dc;

      if (nr >= 0 && nc >= 0 && nr < rows && nc < cols) {
        const next = board.getCell(nr, nc);
        const idx = nr * cols + nc;

        if (!visited.has(idx)) {
          next.mine = true;
          visited.add(idx);
          placed++;
          current = next;
        }
      }

      // --- ★ 枝を作る（確率高め） ---
      if (rng() < 0.35 && placed < mineCount) {
        this._makeBranch(board, current, rng, visited, mineCount, placed);
        placed = visited.size;
      }
    }
  }

  // --- 枝を作る処理 ---
  _makeBranch(board, startCell, rng, visited, mineCount, placed) {
    const rows = board.rows;
    const cols = board.cols;

    // 枝の長さ：1〜3
    const branchLength = 1 + Math.floor(rng() * 3);

    // 枝の方向：上下左右＋斜め
    const dirs = [
      [0, 1], [0, -1], [1, 0], [-1, 0],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];

    let r = startCell.r;
    let c = startCell.c;

    for (let i = 0; i < branchLength; i++) {
      const [dr, dc] = dirs[Math.floor(rng() * dirs.length)];
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) break;

      const idx = nr * cols + nc;
      if (!visited.has(idx)) {
        board.getCell(nr, nc).mine = true;
        visited.add(idx);
      }

      r = nr;
      c = nc;

      // 枝からさらに枝を生む（低確率）
      if (rng() < 0.05 && visited.size < mineCount) {
        this._makeBranch(board, board.getCell(r, c), rng, visited, mineCount, visited.size);
      }

      if (visited.size >= mineCount) break;
    }
  }
}
// 蜘蛛の巣配置
class SpiderWebPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    for (const cell of board.cells) cell.mine = false;

    const rows = board.rows;
    const cols = board.cols;

    const centerR = Math.floor(rows / 2) + Math.floor(rng() * 3) - 1;
    const centerC = Math.floor(cols / 2) + Math.floor(rng() * 3) - 1;

// ★ 8方向の基準角度
const baseAngles = [
    0,
    51.5,
    103,
    154.5,
    206,
    257.5,
    309,
];

// ★ 角度ゆがみ入りの方向ベクトル生成
let dirs = [];

for (const base of baseAngles) {
  // ±10〜25°のゆがみ
  const jitter = (10 + rng() * 15) * (rng() < 0.5 ? -1 : 1);
  const angle = base + jitter;

  const rad = angle * Math.PI / 180;

  // 方向ベクトル（整数化）
  const dr = Math.round(Math.sin(rad));
  const dc = Math.round(Math.cos(rad));

  // 無効方向（0,0）を除外
  if (dr === 0 && dc === 0) continue;

  dirs.push([dr, dc]);
}

    let remaining = mineCount;

    // === タイプ判定 ===
    let ringCount = 0;
    if (mineCount <= 8) {
      ringCount = 0; // MiniLegs
    } else if (mineCount <= 20) {
      ringCount = 1;
    } else if (mineCount <= 40) {
      ringCount = 2;
    } else {
      ringCount = 4;
    }

    // === 放射線配置 ===
    for (const [dr, dc] of dirs) {
      let r = centerR;
      let c = centerC;
      const legLength = Math.floor(Math.min(rows, cols) / 2 * (0.6 + rng() * 0.4));

      for (let step = 0; step < legLength && remaining > 0; step++) {
        r += dr;
        c += dc;
        if (r < 0 || c < 0 || r >= rows || c >= cols) break;
        const idx = r * cols + c;
        if (idx === excludeIndex) continue;
        const cell = board.getCell(r, c);
        if (!cell.mine) {
          cell.mine = true;
          remaining--;
        }
      }
    }

    // === リング配置 ===
    for (let ring = 1; ring <= ringCount && remaining > 0; ring++) {
      const d = ring * 2 + Math.floor(rng() * 2); // ゆがみ
      for (let r = centerR - d; r <= centerR + d; r++) {
        for (let c = centerC - d; c <= centerC + d; c++) {
          if (remaining <= 0) break;
          if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
          if (Math.abs(r - centerR) === d || Math.abs(c - centerC) === d) {
            const idx = r * cols + c;
            if (idx === excludeIndex) continue;
            const cell = board.getCell(r, c);
            if (!cell.mine) {
              cell.mine = true;
              remaining--;
            }
          }
        }
      }
    }

    // === 余りはランダムに埋める（DenseWeb用） ===
    if (remaining > 0) {
      const total = rows * cols;
      while (remaining > 0) {
        const idx = Math.floor(rng() * total);
        if (idx === excludeIndex) continue;
        const cell = board.cells[idx];
        if (!cell.mine) {
          cell.mine = true;
          remaining--;
        }
      }
    }

    if (excludeIndex >= 0) {
      board.cells[excludeIndex].mine = false;
    }
  }
}
// リダクションルック
class ReducedLuckPlacement extends PlacementStrategy {

  place(board, mineCount, rng, excludeIndex = -1) {
    const total = board.rows * board.cols;

    // ランダム配置
    for (const c of board.cells) c.mine = false;
    let placed = 0;
    while (placed < mineCount) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;
      const cell = board.cells[idx];
      if (!cell.mine) { cell.mine = true; placed++; }
    }

    // NG を部分修正していく
    let changed = true;
    let safety = 0;
    while (changed && safety < 400) {
      changed = false;
      if (this._fix2x2(board, rng)) changed = true;
      if (this._fixIsolated(board, rng)) changed = true;
      if (this._fixDiagonalIsolated(board, rng)) changed = true;
      if (this._fix121(board, rng)) changed = true;
      if (this._fixEdge5050(board, rng)) changed = true;   // ★ 追加
      safety++;
    }
  }

  // --- 2×2 固まり ---
  _fix2x2(board, rng) {
    for (let r = 0; r < board.rows - 1; r++) {
      for (let c = 0; c < board.cols - 1; c++) {
        const a = board.getCell(r, c);
        const b = board.getCell(r, c+1);
        const d = board.getCell(r+1, c);
        const e = board.getCell(r+1, c+1);
        if (a.mine && b.mine && d.mine && e.mine) {
          [a,b,d,e][Math.floor(rng()*4)].mine = false;
          this._placeSafeMine(board, rng);
          return true;
        }
      }
    }
    return false;
  }

  // --- 独立地雷 ---
  _fixIsolated(board, rng) {
    for (const cell of board.cells) {
      if (!cell.mine) continue;
      if (!this._hasAdjacentMine(board, cell)) {
        cell.mine = false;
        this._placeSafeMine(board, rng);
        return true;
      }
    }
    return false;
  }

  // --- 斜め孤立 ---
  _fixDiagonalIsolated(board, rng) {
    for (const cell of board.cells) {
      if (!cell.mine) continue;

      let ortho = 0, diag = 0;

      for (const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const rr = cell.r + dr, cc = cell.c + dc;
        if (rr>=0 && cc>=0 && rr<board.rows && cc<board.cols) {
          if (board.getCell(rr,cc).mine) ortho++;
        }
      }

      for (const [dr,dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
        const rr = cell.r + dr, cc = cell.c + dc;
        if (rr>=0 && cc>=0 && rr<board.rows && cc<board.cols) {
          if (board.getCell(rr,cc).mine) diag++;
        }
      }

      if (diag > 0 && ortho === 0) {
        cell.mine = false;
        this._placeSafeMine(board, rng);
        return true;
      }
    }
    return false;
  }

  // --- 1-2-1（横方向） ---
  _fix121(board, rng) {
    for (let r = 0; r < board.rows; r++) {
      for (let c = 1; c < board.cols - 1; c++) {
        const L = board.getCell(r, c-1).mine;
        const M = board.getCell(r, c).mine;
        const R = board.getCell(r, c+1).mine;

        if (L && !M && R) {
          const target = Math.random() < 0.5 ? board.getCell(r,c-1) : board.getCell(r,c+1);
          target.mine = false;
          this._placeSafeMine(board, rng);
          return true;
        }
      }
    }
    return false;
  }

  // --- ★ 50/50（端の2セル地雷） ---
  _fixEdge5050(board, rng) {
    // 左端
    for (let r = 0; r < board.rows; r++) {
      const a = board.getCell(r, 0);
      const b = board.getCell(r, 1);
      if (a.mine && b.mine) {
        (Math.random() < 0.5 ? a : b).mine = false;
        this._placeSafeMine(board, rng);
        return true;
      }
    }

    // 右端
    for (let r = 0; r < board.rows; r++) {
      const a = board.getCell(r, board.cols - 1);
      const b = board.getCell(r, board.cols - 2);
      if (a.mine && b.mine) {
        (Math.random() < 0.5 ? a : b).mine = false;
        this._placeSafeMine(board, rng);
        return true;
      }
    }

    return false;
  }

  // --- 隣接地雷があるか ---
  _hasAdjacentMine(board, cell) {
    for (let dr=-1; dr<=1; dr++) {
      for (let dc=-1; dc<=1; dc++) {
        if (dr===0 && dc===0) continue;
        const rr = cell.r+dr, cc = cell.c+dc;
        if (rr>=0 && cc>=0 && rr<board.rows && cc<board.cols) {
          if (board.getCell(rr,cc).mine) return true;
        }
      }
    }
    return false;
  }

  // --- 安全な場所に地雷を置く ---
  _placeSafeMine(board, rng) {
    while (true) {
      const idx = Math.floor(rng() * board.cells.length);
      const cell = board.cells[idx];
      if (!cell.mine && this._hasAdjacentMine(board, cell)) {
        cell.mine = true;
        return;
      }
    }
  }
}
// --- フラクタル島を置く ---
class FractalIslandsPlacement extends PlacementStrategy {

  place(board, mineCount, rng, excludeIndex = -1) {
    // 全セルを初期化
    for (const c of board.cells) c.mine = false;

    // 再帰的に島を生成
    this._makeIslands(board, 0, 0, board.rows, rng);

    // 地雷数が多すぎる場合はランダム削減
    let mines = board.cells.filter(c => c.mine).length;
    while (mines > mineCount) {
      const idx = Math.floor(rng() * board.cells.length);
      const cell = board.cells[idx];
      if (cell.mine) {
        cell.mine = false;
        mines--;
      }
    }

    // 地雷数が少なすぎる場合はランダム追加
    while (mines < mineCount) {
      const idx = Math.floor(rng() * board.cells.length);
      const cell = board.cells[idx];
      if (!cell.mine) {
        cell.mine = true;
        mines++;
      }
    }
  }

  // --- 再帰的に島を作る ---
  _makeIslands(board, r0, c0, size, rng) {
    if (size < 2) return;

    // ブロックを 2×2 に分割
    const half = Math.floor(size / 2);

    const blocks = [
      [r0, c0],
      [r0, c0 + half],
      [r0 + half, c0],
      [r0 + half, c0 + half]
    ];

    for (const [br, bc] of blocks) {
      // 島の数（1〜2）
      const islandCount = 1 + Math.floor(rng() * 2);

      for (let i = 0; i < islandCount; i++) {
        // 島の中心
        const rr = br + Math.floor(rng() * half);
        const cc = bc + Math.floor(rng() * half);

        // 島の大きさ（1〜3）
        const size = 1 + Math.floor(rng() * 3);

        this._placeIsland(board, rr, cc, size, rng);
      }

      // 再帰
      if (half >= 4) {
        this._makeIslands(board, br, bc, half, rng);
      }
    }
  }

  // --- 島（クラスター）を置く ---
  _placeIsland(board, r, c, size, rng) {
    const dirs = [
      [0,0], [1,0], [-1,0], [0,1], [0,-1]
    ];

    for (let i = 0; i < size; i++) {
      const [dr, dc] = dirs[Math.floor(rng() * dirs.length)];
      const rr = r + dr;
      const cc = c + dc;

      if (rr >= 0 && rr < board.rows && cc >= 0 && cc < board.cols) {
        board.getCell(rr, cc).mine = true;
      }
    }
  }
}
//運の固まり
class Chaos12Placement extends PlacementStrategy {

  place(board, mineCount, rng, excludeIndex = -1) {
    for (const c of board.cells) c.mine = false;

    const total = board.rows * board.cols;
    let placed = 0;

    // --- ① 孤立地雷 ---
    while (placed < mineCount * 0.5) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;
      const cell = board.cells[idx];
      if (!cell.mine) {
        cell.mine = true;
        placed++;
      }
    }

    // --- ② ペア地雷 ---
    while (placed < mineCount * 0.8) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;

      const cell = board.cells[idx];
      const r = cell.r, c = cell.c;

      const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
      const [dr, dc] = dirs[Math.floor(rng() * dirs.length)];
      const rr = r + dr, cc = c + dc;

      if (rr>=0 && rr<board.rows && cc>=0 && cc<board.cols) {
        const nb = board.getCell(rr, cc);

        let added = 0;
        if (!cell.mine) { cell.mine = true; added++; }
        if (!nb.mine)   { nb.mine = true;   added++; }

        placed += added;
        if (placed >= mineCount) return;
      }
    }

    // --- ③ クラスター（必要数だけ置く） ---
    while (placed < mineCount) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;

      const cell = board.cells[idx];
      const r = cell.r, c = cell.c;

      if (r < board.rows - 1 && c < board.cols - 1) {
        const a = board.getCell(r, c);
        const b = board.getCell(r, c+1);
        const d = board.getCell(r+1, c);
        const e = board.getCell(r+1, c+1);

        let need = mineCount - placed;
        let added = 0;

        if (!a.mine && added < need) { a.mine = true; added++; }
        if (!b.mine && added < need) { b.mine = true; added++; }
        if (!d.mine && added < need) { d.mine = true; added++; }
        if (!e.mine && added < need) { e.mine = true; added++; }

        placed += added;
        if (placed >= mineCount) return;
      }
    }
  }
}
//Σの固まり
class SigmaClusterPlacement extends PlacementStrategy {

  place(board, mineCount, rng, excludeIndex = -1) {
    const rows = board.rows;
    const cols = board.cols;

    // --- 最大の k を求める（1+2+…+k ≤ mineCount）
    let k = Math.floor((Math.sqrt(8 * mineCount + 1) - 1) / 2);

    const MAX_GLOBAL_RETRY = 40;
    let globalRetry = 0;

    while (globalRetry < MAX_GLOBAL_RETRY) {

      // 全セル初期化
      for (const c of board.cells) c.mine = false;

      let allSuccess = true;

      // --- 1〜k の固まりを順番に置く ---
      for (let size = 1; size <= k; size++) {

        let success = false;
        const MAX_LOCAL_RETRY = 300;

        for (let attempt = 0; attempt < MAX_LOCAL_RETRY; attempt++) {

          // 固まり候補
          let cluster = [];

          // 1. 最初のセル
          let idx = Math.floor(rng() * rows * cols);
          if (idx === excludeIndex) continue;

          let start = board.cells[idx];
          if (start.mine) continue;
          if (this._touchesOtherCluster(board, start)) continue;

          cluster.push(start);

          // 2. BFS で size 個まで伸ばす
          let ok = true;

          while (cluster.length < size) {
            const base = cluster[Math.floor(rng() * cluster.length)];
            const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
            const [dr, dc] = dirs[Math.floor(rng() * dirs.length)];

            const rr = base.r + dr;
            const cc = base.c + dc;

            if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) {
              ok = false;
              break;
            }

            const nb = board.getCell(rr, cc);

            if (cluster.includes(nb)) continue;
            if (this._touchesOtherCluster(board, nb)) {
              ok = false;
              break;
            }

            cluster.push(nb);
          }

          if (!ok) continue;

          // --- 配置成功 ---
          for (const c of cluster) c.mine = true;
          success = true;
          break;
        }

        // ★ この固まりが置けなかった → 盤面全体をやり直す
        if (!success) {
          allSuccess = false;
          break;
        }
      }

      // ★ 全固まり成功 → 完了
      if (allSuccess) return;

      globalRetry++;
    }

    throw new Error("SigmaClusterPlacement: 配置に失敗しました");
  }

  // 他の固まりと縦横接触しているか？
  _touchesOtherCluster(board, cell) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, dc] of dirs) {
      const rr = cell.r + dr;
      const cc = cell.c + dc;
      if (rr < 0 || rr >= board.rows || cc < 0 || cc >= board.cols) continue;
      const nb = board.getCell(rr, cc);
      if (nb.mine) return true;
    }
    return false;
  }
}
//Σの線
class SigmaLinePlacement extends PlacementStrategy {

  place(board, mineCount, rng, excludeIndex = -1) {
    // 全セル初期化
    for (const c of board.cells) c.mine = false;

    const rows = board.rows;
    const cols = board.cols;

    // --- 最大の k を求める（1+2+…+k ≤ mineCount）
    let k = Math.floor((Math.sqrt(8 * mineCount + 1) - 1) / 2);

    let placed = 0;

    // --- 盤面全体のリトライ安全装置 ---
    const MAX_GLOBAL_RETRY = 40;
    let globalRetry = 0;

    while (globalRetry < MAX_GLOBAL_RETRY) {

      // 盤面をリセット
      for (const c of board.cells) c.mine = false;
      placed = 0;

      let allSuccess = true;

      // --- 1〜k の固まりを順番に置く ---
      for (let size = 1; size <= k; size++) {

        let success = false;

        // ★ この固まり専用のリトライ回数
        const MAX_LOCAL_RETRY = 300;

        for (let attempt = 0; attempt < MAX_LOCAL_RETRY; attempt++) {

          // ランダムに縦 or 横を選ぶ
          const vertical = rng() < 0.5;

          // ランダムに開始位置を選ぶ
          const r = Math.floor(rng() * rows);
          const c = Math.floor(rng() * cols);

          let cluster = [];

          // --- 直線を生成 ---
          for (let i = 0; i < size; i++) {
            let rr = vertical ? r + i : r;
            let cc = vertical ? c : c + i;

            // 盤面外なら失敗
            if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) {
              cluster = null;
              break;
            }

            const cell = board.getCell(rr, cc);

            // 他の固まりと縦横接触していないか
            if (this._touchesOtherCluster(board, cell)) {
              cluster = null;
              break;
            }

            cluster.push(cell);
          }

          if (!cluster) continue;

          // --- 配置成功 ---
          for (const c of cluster) c.mine = true;
          placed += size;
          success = true;
          break;
        }

        // ★ この固まりが置けなかった → 盤面全体をやり直す
        if (!success) {
          allSuccess = false;
          break;
        }
      }

      // ★ 全固まり成功 → 完了
      if (allSuccess) return;

      globalRetry++;
    }

    // ★ ここに来ることはほぼ無いが、念のため
    throw new Error("SigmaLinePlacement: 配置に失敗しました");
  }

  // 他の固まりと縦横接触しているか？
  _touchesOtherCluster(board, cell) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, dc] of dirs) {
      const rr = cell.r + dr;
      const cc = cell.c + dc;
      if (rr < 0 || rr >= board.rows || cc < 0 || cc >= board.cols) continue;
      const nb = board.getCell(rr, cc);
      if (nb.mine) return true;
    }
    return false;
  }
}

// ノイズ構造物
class NoiseStructurePlacement extends PlacementStrategy {

  place(board, mineCount, rng) {
    const rows = board.rows;
    const cols = board.cols;

    // 盤面初期化
    for (const cell of board.cells) {
      cell.mine = false;
    }

    // --- 構造物の目標数（全体の20%） ---
    const structureTarget = Math.floor(mineCount * 0.40);
    let placed = 0;

    // --- 構造物を順番に配置（超えたら止める） ---
    placed += this._placeMiniBlocks(board, structureTarget - placed, rng);
    placed += this._placeLShapes(board, structureTarget - placed, rng);
    placed += this._placeLines(board, structureTarget - placed, rng);
    placed += this._placeTriangles(board, structureTarget - placed, rng);

    // --- 残りはノイズで埋める ---
    while (placed < mineCount) {
      const r = Math.floor(rng() * rows);
      const c = Math.floor(rng() * cols);
      const cell = board.getCell(r, c);
      if (!cell.mine) {
        cell.mine = true;
        placed++;
      }
    }


  }

  // =========================
  //  構造物①：ミニ四角（2×2）
  // =========================
  _placeMiniBlocks(board, target, rng) {
    let placed = 0;
    const rows = board.rows;
    const cols = board.cols;

    for (let i = 0; i < 20 && placed < target; i++) {
      const r = Math.floor(rng() * (rows - 1));
      const c = Math.floor(rng() * (cols - 1));

      const cells = [
        board.getCell(r, c),
        board.getCell(r + 1, c),
        board.getCell(r, c + 1),
        board.getCell(r + 1, c + 1),
      ];

      for (const cell of cells) {
        if (placed >= target) break;
        if (!cell.mine) {
          cell.mine = true;
          placed++;
        }
      }
    }
    return placed;
  }

  // =========================
  //  構造物②：L字
  // =========================
  _placeLShapes(board, target, rng) {
    let placed = 0;
    const rows = board.rows;
    const cols = board.cols;

    const shapes = [
      [[0,0],[1,0],[1,1]],
      [[0,0],[0,1],[1,1]],
      [[0,1],[1,1],[1,0]],
      [[1,0],[0,0],[0,1]],
    ];

    for (let i = 0; i < 20 && placed < target; i++) {
      const r = Math.floor(rng() * (rows - 1));
      const c = Math.floor(rng() * (cols - 1));

      const shape = shapes[Math.floor(rng() * shapes.length)];

      for (const [dr, dc] of shape) {
        if (placed >= target) break;
        const cell = board.getCell(r + dr, c + dc);
        if (!cell.mine) {
          cell.mine = true;
          placed++;
        }
      }
    }
    return placed;
  }

  // =========================
  //  構造物③：直線（縦 or 横）
  // =========================
  _placeLines(board, target, rng) {
    let placed = 0;
    const rows = board.rows;
    const cols = board.cols;

    for (let i = 0; i < 20 && placed < target; i++) {
      const len = 3 + Math.floor(rng() * 5); // 3〜7
      const vertical = rng() < 0.5;

      if (vertical) {
        const c = Math.floor(rng() * cols);
        const start = Math.floor(rng() * (rows - len));
        for (let r = start; r < start + len && placed < target; r++) {
          const cell = board.getCell(r, c);
          if (!cell.mine) {
            cell.mine = true;
            placed++;
          }
        }
      } else {
        const r = Math.floor(rng() * rows);
        const start = Math.floor(rng() * (cols - len));
        for (let c = start; c < start + len && placed < target; c++) {
          const cell = board.getCell(r, c);
          if (!cell.mine) {
            cell.mine = true;
            placed++;
          }
        }
      }
    }
    return placed;
  }

  // =========================
  //  構造物④：三角形
  // =========================
  _placeTriangles(board, target, rng) {
    let placed = 0;
    const rows = board.rows;
    const cols = board.cols;

    for (let i = 0; i < 20 && placed < target; i++) {
      const r = Math.floor(rng() * (rows - 2));
      const c = Math.floor(rng() * (cols - 2));

      const cells = [
        board.getCell(r, c + 1),
        board.getCell(r + 1, c),
        board.getCell(r + 1, c + 1),
        board.getCell(r + 1, c + 2),
      ];

      for (const cell of cells) {
        if (placed >= target) break;
        if (!cell.mine) {
          cell.mine = true;
          placed++;
        }
      }
    }
    return placed;
  }
}
//複製禁止
class UniqueShapePlacement extends PlacementStrategy {

  place(board, mineCount, rng) {
    const rows = board.rows;
    const cols = board.cols;

    // 盤面初期化
    for (const cell of board.cells) {
      cell.mine = false;
    }

    // --- 形の生成（基本形 → 回転反転 → 正規化 → 重複排除） ---
    const baseShapes = this._getBaseShapes();
    let shapes = [];

    for (const shape of baseShapes) {
      const variants = this._generateVariants(shape);
      shapes.push(...variants);
    }

    // 正規化して重複排除
    shapes = this._uniqueShapes(shapes);

    // ★ ここで一度だけシャッフル（重要）
    shapes = this._shuffle(shapes, rng);

    // 大きい順に並べる（同サイズはランダム）
    shapes.sort((a, b) => b.length - a.length);

    let placed = 0;

    // --- 形を順番に置く ---
    for (const shape of shapes) {

      if (placed >= mineCount) break;

      // 置いたら mineCount を超える形はスキップ
      if (placed + shape.length > mineCount) continue;

      // すでに同じ形が盤面にあるならスキップ
      if (this._shapeExists(board, shape)) continue;

      // ランダム位置に置けるか試す
      const count = this._tryPlaceShape(board, shape, rng);

      if (count > 0) {
        placed += count;
      }
    }

    // --- ミニ形で補完（端数だけ） ---
    let miniShapes = this._getMiniShapes();
  // ★ ここで一度だけシャッフル（重要）
    miniShapes = this._shuffle(miniShapes, rng);
    for (const shape of miniShapes) {
      if (placed >= mineCount) break;

      if (placed + shape.length > mineCount) continue;

      const count = this._tryPlaceShape(board, shape, rng);
      if (count > 0) placed += count;
    }

    // --- 最後に mineCount までノイズで調整（単発は最小限） ---
    const cells = board.cells;
    while (placed < mineCount) {
      const cell = cells[Math.floor(rng() * cells.length)];
      if (!cell.mine) {
        cell.mine = true;
        placed++;
      }
    }
  }

  // ============================================================
  // 基本形（5マス中心・負の座標を除去）
  // ============================================================
  _getBaseShapes() {
    return [

      // L
      [[0,0],[1,0],[2,0],[2,1],[2,2]],

      // Y
      [[0,1],[1,1],[2,1],[2,0],[2,2]],

      // T
      [[0,0],[0,1],[0,2],[1,1],[2,1]],

      // U
      [[0,0],[0,2],[1,0],[1,1],[1,2]],

      // V
      [[0,0],[1,0],[2,0],[2,1],[2,2]],

      // W
      [[0,0],[1,0],[1,1],[2,1],[2,2]],

      // Z（5マス版）
      [[0,0],[0,1],[1,1],[1,2],[2,2]],

      // F
      [[0,1],[1,0],[1,1],[1,2],[2,2]],

      // P
      [[0,0],[0,1],[1,0],[1,1],[1,2]],
    ];
  }

  // ============================================================
  // ミニ形（補完用）
  // ============================================================
  _getMiniShapes() {
    return [
      [[1,0],[1,1],[0,1],[0,2]], // S字
      [[0,0],[0,1],[1,1],[1,2]], // Z字
      [[0,0],[1,0],[0,1],[1,1]],  // 2×2
      [[0,1],[1,0],[1,1],[1,2]],// 小三角
      [[1,0],[0,1],[1,1],[2,1]],// ひし形
      [[0,0],[0,1],[0,2],[0,3]],// 直線4（横）
      [[0,0],[1,0],[2,0],[3,0]],// 直線4（縦）
      [[0,0],[0,1],[0,2]],  // 3マス横
      [[0,0],[1,0],[2,0]],  // 3マス縦
      [[0,0],[1,0],[1,1]],  // 小L字
      [[0,0],[0,1]],        // 2マス横
      [[0,0],[1,0]],        // 2マス縦
    ];
  }

  // ============================================================
  // 回転・反転バリエーション生成
  // ============================================================
  _generateVariants(shape) {
    const variants = new Set();

    const rotate = (cells) => cells.map(([r,c]) => [c, -r]);
    const flipH  = (cells) => cells.map(([r,c]) => [r, -c]);

    let current = shape;

    for (let i = 0; i < 4; i++) {
      current = rotate(current);
      variants.add(JSON.stringify(this._normalize(current)));

      const flipped = flipH(current);
      variants.add(JSON.stringify(this._normalize(flipped)));
    }

    return [...variants].map(s => JSON.parse(s));
  }

  // ============================================================
  // 正規化（左上を (0,0) に揃える）
  // ============================================================
  _normalize(cells) {
    const minR = Math.min(...cells.map(c => c[0]));
    const minC = Math.min(...cells.map(c => c[1]));
    return cells.map(([r,c]) => [r - minR, c - minC]).sort();
  }

  // ============================================================
  // 重複形の排除
  // ============================================================
  _uniqueShapes(shapes) {
    const set = new Set(shapes.map(s => JSON.stringify(s)));
    return [...set].map(s => JSON.parse(s));
  }

  // ============================================================
  // 形が盤面に存在するかチェック
  // ============================================================
  _shapeExists(board, shape) {
    const rows = board.rows;
    const cols = board.cols;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {

        let match = true;

        for (const [dr, dc] of shape) {
          const cell = board.getCell(r + dr, c + dc);
          if (!cell || !cell.mine) {
            match = false;
            break;
          }
        }

        if (match) return true;
      }
    }

    return false;
  }

  // ============================================================
  // 縦横だけ隣接禁止チェック
  // ============================================================
  _isAreaFreeOrthogonal(board, r, c, shape) {
    const dirs = [[0,-1],[0,1],[-1,0],[1,0]];

    for (const [dr, dc] of shape) {
      const rr = r + dr;
      const cc = c + dc;

      for (const [ar, ac] of dirs) {
        const cell = board.getCell(rr + ar, cc + ac);
        if (cell && cell.mine) return false;
      }
    }
    return true;
  }

  // ============================================================
  // 配列シャッフル
  // ============================================================
  _shuffle(array, rng) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // ============================================================
  // 形を置く（置けなければ0）
  // ============================================================
_tryPlaceShape(board, shape, rng) {
  const rows = board.rows;
  const cols = board.cols;

  for (let i = 0; i < 30; i++) {

    // ★ 端を完全に禁止（1〜rows-2 の範囲でランダム）
    const r = 1 + Math.floor(rng() * (rows - 3));
    const c = 1 + Math.floor(rng() * (cols - 3));

    // 置けるかチェック
    let ok = true;

    for (const [dr, dc] of shape) {
      const cell = board.getCell(r + dr, c + dc);
      if (!cell || cell.mine) {
        ok = false;
        break;
      }
    }

    if (!ok) continue;

    // 隣接禁止チェック（縦横のみ）
    if (!this._isAreaFreeOrthogonal(board, r, c, shape)) continue;

    // 置く
    for (const [dr, dc] of shape) {
      board.getCell(r + dr, c + dc).mine = true;
    }

    return shape.length;
  }

  return 0;
}
}
//各行に最低1マス必要
class RowConnectedPlacement extends PlacementStrategy {

  place(board, mineCount, rng) {
    const rows = board.rows;
    const cols = board.cols;

    // 盤面初期化
    for (const cell of board.cells) {
      cell.mine = false;
    }

    // 各行に最低1マス必要
    const minRequired = rows;
    if (mineCount < minRequired) {
      console.warn("地雷数が行数より少ないため、ルールを満たせません");
      return;
    }

    // 残りをランダム配分
    let remaining = mineCount - rows;

    // 各行のブロック長を決める
    const blockLengths = Array(rows).fill(1);

    // ランダムに追加配分
    while (remaining > 0) {
      const r = Math.floor(rng() * rows);
      if (blockLengths[r] < cols) {
        blockLengths[r]++;
        remaining--;
      }
    }

    // 各行に連結ブロックを配置
    for (let r = 0; r < rows; r++) {
      const len = blockLengths[r];

      // 端もOKなので 0〜cols-len の範囲でランダム
      const start = Math.floor(rng() * (cols - len + 1));

      for (let c = start; c < start + len; c++) {
        board.getCell(r, c).mine = true;
      }
    }
  }
}
//各行に最低3x3

class RowConnectedWith3x3Placement extends PlacementStrategy {

  place(board, mineCount, rng, excludeIndex = -1) {

    const rows = board.rows;
    const cols = board.cols;

    const MAX_RETRY = 50;

    for (let attempt = 0; attempt < MAX_RETRY; attempt++) {

      // 盤面初期化
      for (const cell of board.cells) cell.mine = false;

      // ① ランダム配置
      const all = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r * cols + c === excludeIndex) continue;
          all.push([r, c]);
        }
      }

      // シャッフル
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }

      // mineCount 個を置く
      for (let i = 0; i < mineCount; i++) {
        const [r, c] = all[i];
        board.getCell(r, c).mine = true;
      }

      // ② カバー率計算（固定）
      const coverScore = Array.from({ length: rows }, () => Array(cols).fill(0));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

          let score = 0;

          for (let sr = r - 2; sr <= r; sr++) {
            for (let sc = c - 2; sc <= c; sc++) {

              if (sr < 0 || sc < 0) continue;
              if (sr + 2 >= rows || sc + 2 >= cols) continue;

              score++;
            }
          }

          coverScore[r][c] = score;
        }
      }

      // ③ 空白3×3チェック
      const is3x3Empty = (sr, sc) => {
        for (let r = sr; r < sr + 3; r++) {
          for (let c = sc; c < sc + 3; c++) {
            if (board.getCell(r, c).mine) return false;
          }
        }
        return true;
      };

      // ★ 空白3×3 のリストを作る
      const queue = [];

      for (let sr = 0; sr <= rows - 3; sr++) {
        for (let sc = 0; sc <= cols - 3; sc++) {
          if (is3x3Empty(sr, sc)) {
            queue.push([sr, sc]);
          }
        }
      }

      // ④ 空白がある限り処理
      while (queue.length > 0) {

        const [sr, sc] = queue.shift();

        // すでに埋まっていたらスキップ
        if (!is3x3Empty(sr, sc)) continue;

        // この3×3内で最もカバー率が高いマス
        let best = null;

        for (let r = sr; r < sr + 3; r++) {
          for (let c = sc; c < sc + 3; c++) {
            const score = coverScore[r][c];
            if (!best || score > best.score) {
              best = { r, c, score };
            }
          }
        }

        // 盤面の中で最も価値の低い地雷
        let worst = null;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (!board.getCell(r, c).mine) continue;

            const score = coverScore[r][c];
            if (!worst || score < worst.score) {
              worst = { r, c, score };
            }
          }
        }

        // 置き換え
        board.getCell(best.r, best.c).mine = true;
        board.getCell(worst.r, worst.c).mine = false;

        // ★ 置き換えた周辺の3×3だけ再チェック
        for (let rr = best.r - 2; rr <= best.r; rr++) {
          for (let cc = best.c - 2; cc <= best.c; cc++) {
            if (rr < 0 || cc < 0) continue;
            if (rr + 2 >= rows || cc + 2 >= cols) continue;
            if (is3x3Empty(rr, cc)) queue.push([rr, cc]);
          }
        }
      }

      // ⑤ 最終チェック
      let ok = true;
      for (let sr = 0; sr <= rows - 3; sr++) {
        for (let sc = 0; sc <= cols - 3; sc++) {
          if (is3x3Empty(sr, sc)) {
            ok = false;
            break;
          }
        }
        if (!ok) break;
      }

      if (ok) return;
    }

    console.warn("RowConnectedWith3x3Placement: リトライ上限に達しました");
  }
}
//探索範囲  の実装
// 8方向探索（標準マインスイーパー）
class Normal8Explore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
          out.push(board.getCell(rr, cc));
        }
      }
    }
    return out;
  }
}

// ナイト移動（チェスのナイト型）
class KnightExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const moves = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
    return moves
      .map(([dr, dc]) => [r+dr, c+dc])
      .filter(([rr, cc]) => rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols)
      .map(([rr, cc]) => board.getCell(rr, cc));
  }
}

// クイーン視線型（一直線に伸びる）
class QueenSightExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
    const out = [];
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
        out.push(board.getCell(rr, cc));
        rr += dr; cc += dc;
      }
    }
    return out;
  }
}
// 5×5探索（上下左右2マスまで）
class Big25Explore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue; // 自分は除外
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
          out.push(board.getCell(rr, cc));
        }
      }
    }
    return out;
  }
}
// 色別探索：lightマスは縦のみ、darkマスは横のみ
class ColorAxisExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const isLight = ((r + c) % 2 === 0);

    if (isLight) {
      // 縦方向に端まで
      for (let rr = 0; rr < board.rows; rr++) {
        if (rr === r) continue;
        out.push(board.getCell(rr, c));
      }
    } else {
      // 横方向に端まで
      for (let cc = 0; cc < board.cols; cc++) {
        if (cc === c) continue;
        out.push(board.getCell(r, cc));
      }
    }

    return out;
  }
}
// 色別探索：lightは縦横、darkは斜めに端まで
class ColorAxisDiagonalExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const isLight = ((r + c) % 2 === 0);

    if (isLight) {
      // 縦横に端まで
      // 縦
      for (let rr = 0; rr < board.rows; rr++) {
        if (rr !== r) out.push(board.getCell(rr, c));
      }
      // 横
      for (let cc = 0; cc < board.cols; cc++) {
        if (cc !== c) out.push(board.getCell(r, cc));
      }
    } else {
      // 斜めに端まで
      const dirs = [[1,1], [1,-1], [-1,1], [-1,-1]];
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
          out.push(board.getCell(rr, cc));
          rr += dr;
          cc += dc;
        }
      }
    }

    return out;
  }
}
// 地雷が見つかるまで直線探索
class UntilMineExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const dirs = [
      [1,0], [-1,0], [0,1], [0,-1],   // 縦横
      [1,1], [1,-1], [-1,1], [-1,-1] // 斜め
    ];

    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
        const cell = board.getCell(rr, cc);
        out.push(cell);
        if (cell.mine) {
          // 地雷を見つけたらこの方向はストップ
          break;
        }
        rr += dr;
        cc += dc;
      }
    }

    return out;
  }
}
// 周囲から同心円状に広げ、地雷が見つかるまで探索
class ExpandUntilMineExplore extends ExploreStrategy {
   neighbors(board, r, c) {
    const out = [];
    const maxRadius = Math.max(board.rows, board.cols);

    for (let radius = 1; radius <= maxRadius; radius++) {
      let foundMine = false;

      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const dist = Math.sqrt(dr*dr + dc*dc);
          // ★ 内側はすべて含める
          if (dist <= radius) {
            const rr = r + dr, cc = c + dc;
            if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;

            const cell = board.getCell(rr, cc);
            if (!out.includes(cell)) {
              out.push(cell);
            }
            if (cell.mine) {
              foundMine = true;
            }
          }
        }
      }

      if (foundMine) break; // この半径で地雷を見つけたら終了
    }

    return out;
  }
}

// 縦横方向に地雷がつながっている部分を探索する
class ClusterDetectExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const seen = new Set();
    const start = board.getCell(r, c);

    // 自分が地雷ならそのクラスターを返す
    if (start.mine) {
      return this._collectCluster(board, start, seen);
    }

    // 自分が地雷でない場合 → 隣接セルに地雷があるか調べる
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, dc] of dirs) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
      const nb = board.getCell(rr, cc);
      if (nb.mine) {
        const cluster = this._collectCluster(board, nb, seen);
        for (const c of cluster) {
          if (!out.includes(c)) out.push(c);
        }
      }
    }
    return out;
  }

  _collectCluster(board, start, seen) {
    const cluster = [];
    const q = [start];
    while (q.length > 0) {
      const cur = q.pop();
      const key = cur.r + "," + cur.c;
      if (seen.has(key)) continue;
      seen.add(key);
      cluster.push(cur);

      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dr, dc] of dirs) {
        const rr = cur.r + dr, cc = cur.c + dc;
        if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
        const nb = board.getCell(rr, cc);
        if (nb.mine && !seen.has(nb.r + "," + nb.c)) {
          q.push(nb);
        }
      }
    }
    return cluster;
  }
}
// 縦横1マスだけ探索する//ハイライト
class Cross4Explore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, dc] of dirs) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
      out.push(board.getCell(rr, cc));
    }
    return out;
  }
}
//十字
class Cross2Explore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const dirs = [
      [1, 0],  // 下
      [-1, 0], // 上
      [0, 1],  // 右
      [0, -1]  // 左
    ];
    for (const [dr, dc] of dirs) {
      for (let step = 1; step <= 2; step++) { // ★ 2マス先まで
        const rr = r + dr * step;
        const cc = c + dc * step;
        if (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
          out.push(board.getCell(rr, cc));
        }
      }
    }
    return out;
  }
}
//リング
class RingExplore extends ExploreStrategy {
  constructor(radius = 2) {
    super();
    this.radius = radius;
  }

  neighbors(board, r, c) {
    const ns = [];
    const R = this.radius;

    for (let dr = -R; dr <= R; dr++) {
      for (let dc = -R; dc <= R; dc++) {
        if (dr === 0 && dc === 0) continue; // 自分自身は除外
        const dist = Math.max(Math.abs(dr), Math.abs(dc));
        if (dist === R) { // ★ちょうど半径Rのマスだけ
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
            ns.push(board.getCell(rr, cc));
          }
        }
      }
    }
    return ns;
  }
}
//菱形
class Diamond2Explore extends ExploreStrategy {
  neighbors(board, r, c) {
    const cell = board.getCell(r, c);
    if (!cell) return [];

    const radius = 2; // ★ シンプルに固定半径1（ダイヤ型）

    const out = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (dr === 0 && dc === 0) continue;
        // マンハッタン距離で判定
        if (Math.abs(dr) + Math.abs(dc) <= radius) {
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
            out.push(board.getCell(rr, cc));
          }
        }
      }
    }

    return out;
  }
}
//地雷から地雷に接続
class RippleChainExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const seen = new Set();
    const queue = [[r, c, 0]]; // [行, 列, 現在の半径]

    while (queue.length > 0) {
      const [cr, cc, depth] = queue.shift();

      // 半径4を超えたら打ち切り
      if (depth >= 4) continue;

      let foundMine = false;

      // この半径で探索
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = cr + dr, cc2 = cc + dc;
          if (rr < 0 || cc2 < 0 || rr >= board.rows || cc2 >= board.cols) continue;

          const cell = board.getCell(rr, cc2);
          const key = rr + "," + cc2;
          if (!seen.has(key)) {
            out.push(cell);
            seen.add(key);
          }

          if (cell.mine) {
            foundMine = true;
            // ★ 地雷を起点にさらに波紋を広げる（ただし半径4まで）
            queue.push([rr, cc2, depth + 1]);
          }
        }
      }

      // 波紋状の性質を残すなら「地雷を見つけたら break」して次の起点へ
      if (foundMine) continue;
    }

    return out;
  }
}
//地雷から地雷に波紋
class RippleExplore extends ExploreStrategy {
    neighbors(board, r, c) {
    const out = [];
    const maxRadius = Math.max(board.rows, board.cols);

    for (let radius = 1; radius <= maxRadius; radius++) {
      let foundMine = 0;

      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const dist = (dr*dr + dc*dc);
          // ★ 内側はすべて含める
          if (dist <= radius) {
            const rr = r + dr, cc = c + dc;
            if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;

            const cell = board.getCell(rr, cc);
            if (!out.includes(cell)) {
              out.push(cell);
            }
            if (cell.mine) {
              foundMine += 1;
            }
          }
        }
      }

      if (foundMine<radius) break; // この半径で地雷を見つけたら終了
    }
    //console.log(maxRadius);
    return out;
  }
}
//地雷3つになるまで探索、三角
class ExpandUntil2MinesTriangleExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const maxRadius = Math.max(board.rows, board.cols);
    let mineCount = 0;

    for (let radius = 1; radius <= maxRadius; radius++) {
      // 三角形の頂点を定義（中心を (0,0) とした座標系）
      const v1 = {x: 0, y: -radius};
      const v2 = {x: -Math.sqrt(3)/2 * radius, y: radius/2};
      const v3 = {x:  Math.sqrt(3)/2 * radius, y: radius/2};

      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;

          // (dc,dr) が三角形内か判定
          if (this._pointInTriangle({x: dc, y: dr}, v1, v2, v3)) {
            const cell = board.getCell(rr, cc);
            if (!out.includes(cell)) {
              out.push(cell);
              if (cell.mine) {
                mineCount++;
                if (mineCount >= 2) {
                  return out; // 地雷3つ見つけたら終了
                }
              }
            }
          }
        }
      }
    }
    return out;
  }

  // 三角形内判定（バリセントリック座標）
  _pointInTriangle(p, a, b, c) {
    const area = (a, b, c) => (b.x - a.x)*(c.y - a.y) - (c.x - a.x)*(b.y - a.y);
    const areaABC = area(a, b, c);
    const areaPAB = area(p, a, b);
    const areaPBC = area(p, b, c);
    const areaPCA = area(p, c, a);

    const hasNeg = (areaPAB < 0) || (areaPBC < 0) || (areaPCA < 0);
    const hasPos = (areaPAB > 0) || (areaPBC > 0) || (areaPCA > 0);

    return !(hasNeg && hasPos); // 全部同符号なら内側
  }
}

// 全盤面を探索範囲にする ExploreStrategy
class GlobalExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    for (let rr = 0; rr < board.rows; rr++) {
      for (let cc = 0; cc < board.cols; cc++) {
        // 自分自身は除外
        if (rr === r && cc === c) continue;
        out.push(board.getCell(rr, cc));
      }
    }
    return out;
  }
}
// 地雷数に応じた探索範囲正方形
class SquareMineCountExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    let radius = 1;
    const maxRadius = Math.max(board.rows, board.cols);
    let totalMines = 0;

    while (radius <= maxRadius) {
      let newMines = 0;

      // この半径の正方形の外周だけを調べる
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue; // 外周のみ
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
          if (rr === r && cc === c) continue;

          const cell = board.getCell(rr, cc);
          if (cell.mine) newMines++;
        }
      }

      totalMines += newMines;

      // 2個以上見つかったら次の半径へ
      if (newMines >= 2) {
        radius++;
      } else {
        break;
      }
    }

    // 最終的な半径で neighbors を返す
    const out = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
        if (rr === r && cc === c) continue;
        out.push(board.getCell(rr, cc));
      }
    }
    return out;
  }
}
// 地雷数に応じた探索範囲ひし形
class DiamondMineCountExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    let radius = 1;
    const maxRadius = board.rows + board.cols;
    let mineCount = 0;
    let required = 2; // 最初に必要な地雷数

    while (radius <= maxRadius) {
      // この半径のひし形範囲を走査
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (Math.abs(dr) + Math.abs(dc) > radius) continue; // ひし形条件
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
          if (rr === r && cc === c) continue;

          const cell = board.getCell(rr, cc);
          if (cell.mine) mineCount++;
        }
      }

      // 累計地雷数が必要数を満たす限り、段階的に広げる
      while (mineCount >= required) {
        radius++;
        required += 1; // 次の半径に必要な地雷数を増やす
      }

      // まだ必要数に届かないなら終了
      if (mineCount < required) break;
    }

    // 最終的な半径で neighbors を返す
    const out = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) + Math.abs(dc) > radius) continue;
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
        if (rr === r && cc === c) continue;

        out.push(board.getCell(rr, cc));
      }
    }
    return out;
  }
}
// 7×7探索（上下左右3マスまで）
class Big49Explore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    for (let dr = -3; dr <= 3; dr++) {
      for (let dc = -3; dc <= 3; dc++) {
        if (dr === 0 && dc === 0) continue; // 自分は除外
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
          out.push(board.getCell(rr, cc));
        }
      }
    }
    return out;
  }
}
//菱形2マス
class Diamond3Explore extends ExploreStrategy {
  neighbors(board, r, c) {
    const cell = board.getCell(r, c);
    if (!cell) return [];

    const radius = 3; // ★ シンプルに固定半径3（ダイヤ型）

    const out = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (dr === 0 && dc === 0) continue;
        // マンハッタン距離で判定
        if (Math.abs(dr) + Math.abs(dc) <= radius) {
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
            out.push(board.getCell(rr, cc));
          }
        }
      }
    }

    return out;
  }
}
// 上下左右2マス,3*3, 偶数行奇数列
class AlternatingExplore extends ExploreStrategy {

  neighbors(board, r, c) {
    const out = [];

    // ★ 偶数 → 3×3
    if ((r + c) % 2 === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < board.rows && cc >= 0 && cc < board.cols) {
            out.push(board.getCell(rr, cc));
          }
        }
      }
      return out;
    }

    // ★ 奇数 → 十字（上下左右に2マス）
    const dirs = [
      [-1, 0], [-2, 0],  // 上に2マス
      [1, 0], [2, 0],    // 下に2マス
      [0, -1], [0, -2],  // 左に2マス
      [0, 1], [0, 2],    // 右に2マス
    ];

    for (const [dr, dc] of dirs) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < board.rows && cc >= 0 && cc < board.cols) {
        out.push(board.getCell(rr, cc));
      }
    }

    return out;
  }
}
// 上下左右見つかるまで
class StraightLineExplore extends ExploreStrategy {

  neighbors(board, r, c) {
    const out = [];

    // 上方向
    for (let rr = r - 1; rr >= 0; rr--) {
      const cell = board.getCell(rr, c);
      out.push(cell);
      if (cell.mine) break; // ★ 地雷に当たったら止まる
    }

    // 下方向
    for (let rr = r + 1; rr < board.rows; rr++) {
      const cell = board.getCell(rr, c);
      out.push(cell);
      if (cell.mine) break;
    }

    // 左方向
    for (let cc = c - 1; cc >= 0; cc--) {
      const cell = board.getCell(r, cc);
      out.push(cell);
      if (cell.mine) break;
    }

    // 右方向
    for (let cc = c + 1; cc < board.cols; cc++) {
      const cell = board.getCell(r, cc);
      out.push(cell);
      if (cell.mine) break;
    }

    return out;
  }
}
// 5*5見つかるまで

class UntilMine5x5ImmutableExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const dirs = [
      [1,0], [-1,0], [0,1], [0,-1],   // 縦横
      [1,1], [1,-1], [-1,1], [-1,-1] // 斜め
    ];

    for (const [dr, dc] of dirs) {
      for(let i = 1; i < 3; i++) {
      let rr = r + dr*i, cc = c + dc*i;
      if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols ) break;
        const cell = board.getCell(rr, cc);
            if (!cell) break;

        out.push(cell);
        if (cell.mine) {
          // 地雷を見つけたらこの方向はストップ
          break;
        }
      }
    
    }

    return out;
  }
}
// 5*5
class UntilMine5x5Explore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const dirs = [
      [1,0], [-1,0], [0,1], [0,-1],   // 縦横
      [1,1], [1,-1], [-1,1], [-1,-1] // 斜め
    ];

    for (const [dr, dc] of dirs) {
      for(let i = 1; i < 3; i++) {
      let rr = r + dr*i, cc = c + dc*i;
      if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols ) break;
        const cell = board.getCell(rr, cc);
            if (!cell) break;

        out.push(cell);
      
      }
    
    }

    return out;
  }
}
// 8方向トーラス
class Normal8torusExplore extends ExploreStrategy {
  constructor({wrap=true} = {}) {
    super();
    this.wrap = wrap;
  }

  neighbors(board, r, c) {
    const out = [];
    const seen = new Set();
    // 8方向のみ（自分自身を含めない）
    const dirs = [
      [1,0], [-1,0], [0,1], [0,-1],
      [1,1], [1,-1], [-1,1], [-1,-1]
    ];

    for (const [dr, dc] of dirs) {
      // ラップ処理を簡潔に
      const rr = ((r + dr) % board.rows + board.rows) % board.rows;
      const cc = ((c + dc) % board.cols + board.cols) % board.cols;
      const cell = board.getCell(rr, cc);
      // board.getCell が null を返す実装なら下行を使う（安全）
      // if (!cell) continue;
      const key = `${cell.r},${cell.c}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(cell);
      }
    }
    return out;
  }
}
// 8方向盲点
class RandomBlindSpotExplore extends ExploreStrategy {
 constructor() {
    super();

    // シード値から RNG を作る
    const seed = document.getElementById("seed").value || "123456";
    const rng = makeRngFromSeed(seed + "_blind");

    // 3×3 の中で中央以外の 8 マスから 1 つ選ぶ
    const spots = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue; // 中央は除外
        spots.push([dr, dc]);
      }
    }

    // ★ 盤面全体で共通の blind spot を決定
    this.blindSpot = spots[Math.floor(rng() * spots.length)];
  }

  neighbors(board, r, c) {
    const rows = board.rows;
    const cols = board.cols;

    const out = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {

        // 中央は除外
        if (dr === 0 && dc === 0) continue;

        // ★ blind spot は除外
        if (dr === this.blindSpot[0] && dc === this.blindSpot[1]) continue;

        const rr = r + dr;
        const cc = c + dc;

        if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
          out.push(board.getCell(rr, cc));
        }
      }
    }

    return out;
  }
}
// 十字盲点
class CrossBlindSpotExplore extends ExploreStrategy {
  constructor() {
    super();

    // シード値から RNG を作る
    const seed = document.getElementById("seed").value || "123456";
    const rng = makeRngFromSeed(seed + "_crossblind");

    // 十字の4方向
    this.dirs = [
      [-1, 0],
      [-2, 0], // 上
      [1, 0], 
      [2, 0], // 下
      [0, -1],
      [0, -2], // 左
      [0, 1] ,
      [0, 2]  // 右
    ];

    // ★ 盤面全体で共通の blind spot を決定
    this.blindSpot = this.dirs[Math.floor(rng() * this.dirs.length)];
  }

  neighbors(board, r, c) {
    const rows = board.rows;
    const cols = board.cols;

    const out = [];

    for (const [dr, dc] of this.dirs) {

      // ★ blind spot は除外
      if (dr === this.blindSpot[0] && dc === this.blindSpot[1]) continue;

      const rr = r + dr;
      const cc = c + dc;

      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
        out.push(board.getCell(rr, cc));
      }
    }

    return out;
  }
}
// ====== 数字ルール実装 ======
// 総数ルール（標準）
class TotalNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 周囲の地雷数を数値で返す
    return neighbors.filter(nb => nb.mine).length;
  }
  render(cell) {
    // 0なら空白、それ以外は数字
    return cell.value === 0 ? "" : String(cell.value);
  }
}

// クエスチョンルール（3以上は ?）
class QmarkNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    const count = neighbors.filter(nb => nb.mine).length;
    return count; // ← 数値を返す
  }
  render(cell) {
    if (cell.value === 0) return "";
    if (cell.value === 1) return "1";
    if (cell.value === 2) return "2";
    return "?";
  }
}

// ファジー（±1 誤差付き）
class FuzzyNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 正しい数値を保持
    return neighbors.filter(nb => nb.mine).length;
  }
  render(cell) {
    if (cell.value === 0) {
      return ""; // ← 周囲に地雷がないなら空白
    }
    const offset = Math.random() < 0.5 ? -1 : +1;
    const fuzzy = Math.max(0, cell.value + offset);
    return String(fuzzy);
  }
}

// 色別（白黒マスで分けて数える）
class ColorSplitNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    let lightCount = 0, darkCount = 0;
    for (const nb of neighbors) {
      if (nb.mine) {
        const isLight = ((nb.r + nb.c) % 2 === 0);
        if (isLight) lightCount++;
        else darkCount++;
      }
    }
    return { light: lightCount, dark: darkCount };
  }

  render(cell) {
    const { light, dark } = cell.value;
    if (light === 0 && dark === 0) return "";
    return `${light}:${dark}`;
  }

  isZero(cell) {
    return cell.value.light === 0 && cell.value.dark === 0;
  }
}
// 3で割った余りルール
class mod3NumberRule extends NumberRule {
  calculate(cell, neighbors) {
    const count = neighbors.filter(nb => nb.mine).length;

    // 周囲に地雷がない場合は特別扱い
    if (count === 0) {
      cell._rawCount = 0;
      return 0;
    }

    cell._rawCount = count;
    return count % 3;
  }

  render(cell) {
    if (cell.mine) {
      return "💣";
    }
    if (cell._rawCount === 0) {
      return ""; // 周囲に地雷がないときだけ空白
    }
    return String(cell.value); // 余りが0でも "0" を表示
  }

  // ★ floodOpen 判定用にオーバーライド
  isZero(cell) {
    return cell._rawCount === 0; 
  }
}
// 10で割った余りルール
class mod10NumberRule extends NumberRule {
  calculate(cell, neighbors) {
    const count = neighbors.filter(nb => nb.mine).length;

    // 周囲に地雷がない場合は特別扱い
    if (count === 0) {
      cell._rawCount = 0;
      return 0;
    }

    cell._rawCount = count;
    return count % 10;
  }

  render(cell) {
    if (cell.mine) {
      return "💣";
    }
    if (cell._rawCount === 0) {
      return ""; // 周囲に地雷がないときだけ空白
    }
    return String(cell.value); // 余りが0でも "0" を表示
  }

  // ★ floodOpen 判定用にオーバーライド
  isZero(cell) {
    return cell._rawCount === 0; 
  }
}
// 固まりごと数ルール
class ClusterNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    const mines = neighbors.filter(nb => nb.mine);
    const seen = new Set();
    const clusters = [];

    for (const m of mines) {
      const key = m.r + "," + m.c;
      if (seen.has(key)) continue;

      // 新しい固まりを探索
      let size = 0;
      const q = [m];
      while (q.length) {
        const cur = q.pop();
        const curKey = cur.r + "," + cur.c;
        if (seen.has(curKey)) continue;
        seen.add(curKey);
        size++;

        // ★ 縦横4方向だけで繋がっている地雷を追加
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dr, dc] of dirs) {
          const rr = cur.r + dr, cc = cur.c + dc;
          const nb = neighbors.find(n => n.r === rr && n.c === cc && n.mine);
          if (nb) q.push(nb);
        }
      }
      clusters.push(size);
    }

    // サイズを降順に並べる
    clusters.sort((a, b) => b - a);
    return clusters;
  }

   render(cell) {
    if (cell.mine) return "💣";
    if (!cell.value || cell.value.length === 0) return "";
//圧縮
    const compressed = compressSequence(cell.value);

    // ★ 各要素を <div> にして返す
    return `<div class="grid-cell">${compressed.map(v => `<span>${v}</span>`).join("")}</div>`;

  }

  isZero(cell) {
    return !cell.value || cell.value.length === 0;
  }
}
// 固まり数ルール（縦横4方向接続版）MAX,MIN表示
class ClusterMaxMixNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    const mines = neighbors.filter(nb => nb.mine);
    const seen = new Set();
    const clusters = [];

    for (const m of mines) {
      const key = m.r + "," + m.c;
      if (seen.has(key)) continue;

      // 新しい固まりを探索
      let size = 0;
      const q = [m];
      while (q.length) {
        const cur = q.pop();
        const curKey = cur.r + "," + cur.c;
        if (seen.has(curKey)) continue;
        seen.add(curKey);
        size++;

        // 縦横だけで繋がっている地雷を追加
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dr, dc] of dirs) {
          const rr = cur.r + dr, cc = cur.c + dc;
          const nb = neighbors.find(n => n.r === rr && n.c === cc && n.mine);
          if (nb) q.push(nb);
        }
      }
      clusters.push(size);
    }

    return clusters;
  }

  render(cell) {
    if (cell.mine) return "💣";
    if (!cell.value || cell.value.length === 0) return "";

    const clusters = cell.value;
    if (clusters.length === 1) {
      // 固まりが1つ → そのまま表示
      return String(clusters[0]);
    } else {
      // 固まりが複数 → 最大値と最小値を表示
      const max = Math.max(...clusters);
      const min = Math.min(...clusters);
      return `${max},${min}`;
    }
  }

  isZero(cell) {
    return !cell.value || cell.value.length === 0;
  }
}
// 色ごとの差だけを出すルール
class ColorDiffNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    if (!neighbors || neighbors.length === 0) {
      return null; // 検知対象がない → 空白
    }

    let lightCount = 0, darkCount = 0;
    for (const nb of neighbors) {
      if (nb.mine) {
        const isLight = ((nb.r + nb.c) % 2 === 0);
        if (isLight) lightCount++;
        else darkCount++;
      }
    }

    // 両方とも「差の絶対値」を返す
    const diff = Math.abs(lightCount - darkCount);

    // 検知なしなら空白
    if (lightCount === 0 && darkCount === 0) {
      return null;
    }
    return diff;
  }
  
  render(cell) {
    if (cell.value === null) return ""; // 検知なしは空白
    return String(cell.value);          // 0 も数字もそのまま表示
  }

  isZero(cell) {
    // floodOpen で「0」と「空白(null)」の両方を広げる
    return cell.value === null ;
  }
}
//カラーごとに価値
class ColorWeightNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    let total = 0;
    for (const nb of neighbors) {
      if (nb.mine) {
        const isLight = ((nb.r + nb.c) % 2 === 0);
        total += isLight ? 1 : 2;
      }
    }
    return total;
  }

  render(cell) {
    if (cell.value === 0) return ""; // 0は空白
    return String(cell.value);
  }

  isZero(cell) {
    return cell.value === 0;
  }
}
//三つごと
class Range3NumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 周囲の地雷数を数える
    return neighbors.filter(nb => nb.mine).length;
  }

  render(cell) {
    if (cell.mine) return "💣"; // 地雷はそのまま

    const v = cell.value;
    if (v === 0) return ""; // 空白は空文字

    // 3ごとの区間にまとめる
    const start = Math.floor((v - 1) / 3) * 3 + 1;
    const end = start + 2;
    return `${start}~${end}`;
  }
}
// 分解表示ルール
class DecomposeNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 周囲の地雷数を数える
    return neighbors.filter(nb => nb.mine).length;
  }

  render(cell) {
    const n = cell.value;

    // 0は空白
    if (n === 0) return "";
    // 1と2はそのまま
    if (n === 1 || n === 2) return String(n);

    // --- 素因数分解 ---
    const factors = [];
    let num = n;
    for (let p = 2; p * p <= num; p++) {
      while (num % p === 0) {
        factors.push(p);
        num /= p;
      }
    }
    if (num > 1) factors.push(num);

    let parts = [];

    if (factors.length === 2) {
      // 素因数がちょうど2つ → そのまま
      parts = factors;
    } else if (factors.length > 2) {
      // 素因数が3つ以上 → 2項にまとめる
      const a = factors[0] * factors[1];
      const b = factors.slice(2).reduce((x, y) => x * y, 1);
      parts = [a, b];
    } else {
      // 素数（分解できない） → 和分解
      const a = Math.floor(n / 2);
      const b = n - a;
      parts = [a, b];
    }

    // 大きい順に並べて「、」で区切る
    parts.sort((a, b) => b - a);
    return parts.join(",");
  }

  isZero(cell) {
    return cell.value === 0;
  }
}
// 距離の合計
class DistanceSumRule extends NumberRule {
  constructor(explore) {
    super();
    this.explore = explore;
  }

  calculate(cell, neighborsIgnored) {
    const board = cell.board;
    const r = cell.r, c = cell.c;
    const scope = this.explore.neighbors(board, r, c);

    let sum = 0;
    for (const nb of scope) {
      if (nb.mine) {
        const dx = r - nb.r;
        const dy = c - nb.c;
        sum += Math.sqrt(dx * dx + dy * dy);
      }
    }

    // 合計値を保存
    cell.value = sum;
    return sum;
  }

 render(cell) {
  if (cell.value === 0) return "";

  const squared = Math.round(cell.value * cell.value); // 合計を2乗して整数化
  const root = Math.sqrt(squared);

  if (Number.isInteger(root)) {
    return String(root); // 完全平方数なら整数表示
  } else {
    return `√${squared}`; // それ以外は√表記
  }
}


  isZero(cell) {
    return cell.value === 0;
  }
}


// 距離の積
class DistanceProductInExploreRule extends NumberRule {
  constructor(explore) {
    super();
    this.explore = explore;
  }

  calculate(cell, neighborsIgnored) {
    const board = cell.board;
    const r = cell.r, c = cell.c;
    const scope = this.explore.neighbors(board, r, c);

    let product = 1;
    let found = false;

    for (const nb of scope) {
      if (nb.mine) {
        const dx = r - nb.r;
        const dy = c - nb.c;
        const d = Math.sqrt(dx * dx + dy * dy);
        product *= d;
        found = true;
      }
    }

    cell.value = found ? product : 0;
    return cell.value;
  }

 render(cell) {
  if (cell.value === 0) return "";

  const squared = Math.round(cell.value * cell.value);

  // 平方数なら整数に
  const root = Math.sqrt(squared);
  if (Number.isInteger(root)) {
    return String(root);
  }

  // 平方数で割れる部分を探す（最大の平方因数を外に出す）
  let outside = 1;
  let inside = squared;
  for (let i = Math.floor(Math.sqrt(squared)); i >= 2; i--) {
    if (squared % (i * i) === 0) {
      outside = i;
      inside = squared / (i * i);
      break;
    }
  }

  if (inside === 1) {
    return String(outside); // ちょうど平方数
  } else {
    return `${outside === 1 ? "" : outside}√${inside}`;
  }
}

  isZero(cell) {
    return cell.value === 0;
  }
}
// 真偽の数
class TruthLieNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 通常の value 計算
    return neighbors.filter(nb => nb.mine).length;
  }

  render(cell) {
    if (cell.value === 0) return "";

    const truth = cell.value;
    let lie;

  if (truth <= 3) {
  lie = truth + Math.floor(Math.random() * 2 + 2); // 2〜3を足す
} else {
  const delta = Math.floor(Math.random() * 2 + 2); // 2〜3
  lie = (Math.random() < 0.5) ? truth - delta : truth + delta;
  if (lie < 0) lie = truth + delta;
}

    // 大きい順に並べる
    const values = [truth, lie].sort((a, b) => b - a);

    return `${values[0]}, ${values[1]}`;

  }
}
// 隣接セルの平均値
class NeighborAverageNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 通常の真値
    cell.trueValue = neighbors.filter(nb => nb.mine).length;

    // 探索ルールに従って取得
    const ns = currentGame.explore.neighbors(cell.board, cell.r, cell.c);

    // ★ 地雷が一つもないかどうか
    const hasMine = ns.some(nb => nb.mine);

    // ★ safeZone フラグをセット
    cell.safeZone = !hasMine;

    // 地雷→1、数字→trueValue、0は除外
    const valid = ns
      .map(nb => nb.mine ? 1 : nb.trueValue)
      .filter(v => v !== undefined && v > 0);

    // 平均値が無い → 空白
    if (valid.length === 0) {
      cell.displayValue = "";
    } else {
      const sum = valid.reduce((a, v) => a + v, 0);
      const avg = sum / valid.length;
      cell.displayValue = avg === 0 ? "" : avg.toFixed(1);
    }

    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}

// 起点から最も近い地雷と、次に近い地雷の距離の積（探索範囲に従う）
class NearestTwoProductNumberRule extends NumberRule {
  constructor(explore) {
    super();
    this.explore = explore; // 探索ルールに従う
  }

  calculate(cell, neighborsIgnored) {
    const board = cell.board;
    const scope = this.explore.neighbors(board, cell.r, cell.c);

    // 距離の二乗（d^2）を収集（地雷のみ）
    const d2s = [];
    for (const nb of scope) {
      if (nb.mine) {
        const dx = cell.r - nb.r;
        const dy = cell.c - nb.c;
        d2s.push(dx * dx + dy * dy);
      }
    }

    if (d2s.length === 0) {
      cell.value = 0;
      cell.displayValue = "";
      return 0;
    }

    d2s.sort((a, b) => a - b);
    const d1 = d2s[0];

    if (d2s.length === 1) {
      // 地雷が1つ：√(d1) を簡約表示
      cell.value = Math.sqrt(d1);
      cell.displayValue = simplifySqrt(d1);
      return cell.value;
    }

    // d1 より大きい最小の距離^2 を二番目として採用
    let d2 = null;
    for (let i = 1; i < d2s.length; i++) {
      if (d2s[i] > d1) { d2 = d2s[i]; break; }
    }

    if (d2 === null) {
      // すべて同じ距離しかない → 1つ扱い（合算しない）
      cell.value = Math.sqrt(d1);
      cell.displayValue = simplifySqrt(d1);
      return cell.value;
    }

    // √(d1) × √(d2) = √(d1*d2) を簡約表示
    const n = d1 * d2;
    cell.value = Math.sqrt(n);
    cell.displayValue = simplifySqrt(n);
    return cell.value;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }

  isZero(cell) {
    return cell.value === 0;
  }
}
// √(n) を「最大の平方因数」を外に出して k√m に整形
function simplifySqrt(n) {
  if (n <= 0) return "0";
  // 最大の平方因数 k^2 を探す（k は floor(sqrt(n)) から降順に）
  const maxK = Math.floor(Math.sqrt(n));
  for (let k = maxK; k >= 2; k--) {
    const sq = k * k;
    if (n % sq === 0) {
      const inside = n / sq;
      if (inside === 1) return String(k);    // ぴったり平方数
      return `${k}√${inside}`;
    }
  }
  // 何も外に出せない場合
  return `√${n}`;
}
// 偶数は「偶」、奇数は数字を表示するルール
class EvenOddNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    const count = neighbors.filter(nb => nb.mine).length;
    return count; // ← 数値を返す
  }
  render(cell) {
    if (cell.value === 0) return ""; // 0は空白のまま
    if (cell.value % 2 === 0) {
      return "偶"; // 偶数なら「偶」
    } else {
      return String(cell.value); // 奇数はそのまま数字
    }
  }
}
// 奇数は「奇」、偶数は数字を表示するルール
class OddNumberRule extends NumberRule {
    calculate(cell, neighbors) {
    const count = neighbors.filter(nb => nb.mine).length;
    return count; // ← 数値を返す
  }
  render(cell) {
    if (cell.value === 0) return ""; // 0は空白のまま
    if (cell.value % 2 === 1) {
      return "奇"; // 奇数なら「奇」
    } else {
      return String(cell.value); // 偶数はそのまま数字
    }
  }
}
// 素数は「素」、それ以外は数字を表示するルール

class PrimeNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 通常の数字計算（周囲の地雷数を数える）
    let count = 0;
    for (const nb of neighbors) {
      if (nb.mine) count++;
    }
    return count;
  }

  _isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }

  render(cell) {
    if (cell.value === 0) return "";
    if (this._isPrime(cell.value)) {
      return "素"; // 素数なら「素」
    } else {
      return String(cell.value); // 素数以外は数字
    }
  }
}
// 素数なら数字を表示、それ以外は空白
class PrimeOnlyNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 周囲の地雷数を計算（通常通り）
    let count = 0;
    for (const nb of neighbors) {
      if (nb.mine) count++;
    }
    return count;
  }

  _isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }

  render(cell) {
    if (cell.value === 0) return "";
    if (this._isPrime(cell.value)) {
      return String(cell.value); // 素数なら数字を表示
    } else {
      return "?"; // 素数以外は空白
    }
  }
}
class PercentNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 周囲の地雷数
    const mines = neighbors.filter(nb => nb.mine).length;

    // 探索範囲のマス数（neighbors.length）
    const total = neighbors.length;
    // ％計算（0〜100）
    const percent = Math.round((mines / total) * 100);
if(isNaN(percent)){
  return 0;
}
    return percent;
  }

  render(cell) {
    if (cell.value === 0|| cell.value === "") { return "";} // 0% は空白
    // 0% のときは空白にするかどうかは好み
    // ここでは 0% も表示するようにする
    return cell.value + "%";
  }
}
// マンハッタン距離ルール
class ManhattanVectorRule extends NumberRule {
  constructor(explore) {
    super();
    this.explore = explore; // 使わなくても受け取る必要がある
  }

  calculate(cell, neighbors) {
    if (cell.mine) return "💣";

    if (!neighbors || neighbors.length === 0) return "";

let sumDx = 0;
let sumDy = 0;

for (const nb of neighbors) {
  if (!nb.mine) continue;

  sumDx += Math.abs(nb.c - cell.c);
  sumDy += Math.abs(nb.r - cell.r);
}

return `X:${Math.abs(sumDx)} Y:${Math.abs(sumDy)}`;
  }

render(cell) {
  if (cell.mine) return "💣";
  if (cell.value === "X:0 Y:0") return "";

  if (typeof cell.value === "string") {
    const parts = cell.value.split(" ");
    if (parts.length === 2) {
      return `${parts[0]}<br>${parts[1]}`; // 上下を改行で分ける
    }
    return cell.value;
  }

  return "";
}


isZero(cell) {
  if (cell.mine) return false;

  if (typeof cell.value === "string") {
    // 上も下も 0 のときだけゼロ扱い
    return cell.value === "X:0 Y:0";
  }

  return false;
}
}
// 上下分割数ルール
class VerticalSplitCountRule extends NumberRule {
  constructor(explore) {
    super();
    this.explore = explore;
  }

calculate(cell, neighbors) {
  if (cell.mine) return "💣";

  let up = 0;
  let down = 0;

  for (const nb of neighbors) {
    if (!nb.mine) continue;

    if (nb.r <= cell.r) up++;
     if (nb.r >= cell.r) down++;
  }

  //if (up === 0 && down === 0) return "";

  return `上${up} 下${down}`;
}

render(cell) {
  if (cell.mine) return "💣";
  if (cell.value === "上0 下0") return "";

  if (typeof cell.value === "string") {
    const parts = cell.value.split(" ");
    if (parts.length === 2) {
      return `${parts[0]}<br>${parts[1]}`; // 上下を改行で分ける
    }
    return cell.value;
  }

  return "";
}

isZero(cell) {
  if (cell.mine) return false;

  if (typeof cell.value === "string") {
    // 上も下も 0 のときだけゼロ扱い
    return cell.value === "上0 下0";
  }

  return false;
}

}
// 左右分割数ルール
class HorizontalSplitCountRule extends NumberRule {
  constructor(explore) {
    super();
    this.explore = explore;
  }

  calculate(cell, neighbors) {
    if (cell.mine) return "💣";

    let left = 0;
    let right = 0;

    for (const nb of neighbors) {
      if (!nb.mine) continue;

      if (nb.c <= cell.c) left++;
      if (nb.c >= cell.c) right++;
    }

    if (left === 0 && right === 0) return "左0 右0";

    return `左${left} 右${right}`;
  }

  render(cell) {
    if (cell.mine) return "💣";
    if (cell.value === "左0 右0") return "";

    if (typeof cell.value === "string") {
      const parts = cell.value.split(" ");
      if (parts.length === 2) {
        return `${parts[0]}<br>${parts[1]}`; // 左右を縦に並べる
      }
      return cell.value;
    }

    return "";
  }

  isZero(cell) {
    if (cell.mine) return false;
    return cell.value === "左0 右0";
  }
}
// 固まり個数ルール
class ClusterQuantityNumberRule extends NumberRule {

  calculate(cell, neighbors) {
    // neighbors 内の地雷だけを対象にする
    const mines = neighbors.filter(nb => nb.mine);

    const visited = new Set();
    let groupCount = 0;

    for (const m of mines) {
      const key = `${m.r},${m.c}`;
      if (visited.has(key)) continue;

      // ★ 新しい固まりを探索
      this._floodLocalCluster(m, neighbors, visited);
      groupCount++;
    }

    return groupCount; // ★ 固まり数だけ返す
  }

  // ★ neighbors 内だけで BFS する
  _floodLocalCluster(start, neighbors, visited) {
    const q = [start];

    while (q.length) {
      const cur = q.pop();
      const key = `${cur.r},${cur.c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      // 4方向だけで繋がっている地雷を追加
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dr, dc] of dirs) {
        const rr = cur.r + dr;
        const cc = cur.c + dc;

        // neighbors 内にある地雷だけを対象にする
        const nb = neighbors.find(n => n.r === rr && n.c === cc && n.mine);
        if (nb) q.push(nb);
      }
    }
  }

  render(cell) {
    // 地雷セルは普通に地雷表示
    if (cell.mine) return "💣";

    // 数字セルは固まり数をそのまま表示
    if (!cell.value) return "";
    return String(cell.value);
  }

  isZero(cell) {
    return !cell.value;
  }
}
// 隣接中央値ルール
class MedianNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 通常の真値（内部用）
    cell.trueValue = neighbors.filter(nb => nb.mine).length;

    // 探索ルールに従って取得
    const ns = currentGame.explore.neighbors(cell.board, cell.r, cell.c);

    // ★ 地雷が一つもないかどうか
    const hasMine = ns.some(nb => nb.mine);
    cell.safeZone = !hasMine;

    // 地雷 → 1、数字 → trueValue、0 は除外
    const valid = ns
      .map(nb => nb.mine ? 1 : nb.trueValue)
      .filter(v => v !== undefined && v > 0);

    // ★ valid が空 → 表示なし
    if (valid.length === 0) {
      cell.displayValue = "";
      return cell.trueValue;
    }

    // ★ 中央値を計算
    valid.sort((a, b) => a - b);
    let median;

    if (valid.length % 2 === 1) {
      // 奇数個 → 真ん中
      median = valid[(valid.length - 1) / 2];
    } else {
      // 偶数個 → 2つの平均
      const mid = valid.length / 2;
      median = (valid[mid - 1] + valid[mid]) / 2;
    }

    // 小数点1桁で表示
    cell.displayValue = median.toFixed(1);

    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}
// 半分以上地雷なら数字を表示
class HalfMineRevealRule extends NumberRule {
  calculate(cell, neighbors) {
    // 通常の真値（内部用）
    cell.trueValue = neighbors.filter(nb => nb.mine).length;

    // 探索ルールに従って neighbors を取得
    const ns = currentGame.explore.neighbors(cell.board, cell.r, cell.c);

    // ★ 地雷数
    const mineCount = ns.filter(nb => nb.mine).length;

    // ★ 全体数
    const total = ns.length;

    // ★ safeZone（地雷が1つもない）
    cell.safeZone = mineCount === 0;

    // ★ 地雷が 0 → 空白
    if (mineCount === 0) {
      cell.displayValue = "";
      return cell.trueValue;
    }

    // ★ 半分以上が地雷 → 数字を表示
    if (mineCount >= total * 0.63) {
      cell.displayValue = String(cell.trueValue);
    } else {
      // ★ 半分未満 → 「？」表示
      cell.displayValue = "?";
    }

    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}
// 差を大きい方を採用
class BiasDiffNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 真値（内部用）
    cell.trueValue = neighbors.filter(nb => nb.mine).length;

    // 地雷ゼロ → 空白
    if (cell.trueValue === 0) {
      cell.displayValue = "";
      cell.safeZone = true;
      return cell.trueValue;
    }

    const r0 = cell.r;
    const c0 = cell.c;

    let up = 0, down = 0, left = 0, right = 0;

    for (const nb of neighbors) {
      if (!nb.mine) continue;

      if (nb.r <= r0) up++;
      if (nb.r >= r0) down++;
      if (nb.c <= c0) left++;
      if (nb.c >= c0) right++;
    }

    // 上下差・左右差
    const ud = Math.abs(up - down);
    const lr = Math.abs(left - right);

    const diff = Math.max(ud, lr);

    // 方向ラベル
    let label = "";
    if (ud > lr) {
      label = "上下";
    } else if (lr > ud) {
      label = "左右";
    } else {
      label = "両方";
    }

    // ★ 改行して表示
    cell.displayValue =" " + diff + "<br>" + label;

    cell.safeZone = false;
    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}


// 上下差
class VerticalBiasDiffNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 真値（内部用）
    cell.trueValue = neighbors.filter(nb => nb.mine).length;

    // 地雷ゼロ → 空白
    if (cell.trueValue === 0) {
      cell.displayValue = "";
      cell.safeZone = true;
      return cell.trueValue;
    }

    const r0 = cell.r;


    let up = 0, down = 0

    for (const nb of neighbors) {
      if (!nb.mine) continue;

      if (nb.r <= r0) up++;
      if (nb.r >= r0) down++;

    }

    // 上下差
    const diff = Math.abs(up - down);


    // 差が 0 → "0"
    // 差が 1〜9 → その数字
    cell.displayValue = diff === 0 ? "0" : String(diff);

    // safeZone は地雷ゼロのみ
    cell.safeZone = false;

    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}
// 左右差
class HorizontalBiasDiffNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 真値（内部用）
    cell.trueValue = neighbors.filter(nb => nb.mine).length;

    // 地雷ゼロ → 空白
    if (cell.trueValue === 0) {
      cell.displayValue = "";
      cell.safeZone = true;
      return cell.trueValue;
    }

    const c0 = cell.c;

    let  left = 0, right = 0;

    for (const nb of neighbors) {
      if (!nb.mine) continue;

        if (nb.c <= c0) left++;
      if (nb.c >= c0) right++;
    }

    // 左右差

    const diff =  Math.abs(left - right);

    // 差が 0 → "0"
    // 差が 1〜9 → その数字
    cell.displayValue = diff === 0 ? "0" : String(diff);

    // safeZone は地雷ゼロのみ
    cell.safeZone = false;

    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}
// 周囲地雷数
class PerimeterRule extends NumberRule {
  calculate(cell, neighbors) {
    const mines = neighbors.filter(nb => nb.mine);
    cell.trueValue = mines.length;

    // 地雷ゼロ → 空白
    if (mines.length === 0) {
      cell.displayValue = "";
      cell.safeZone = true;
      return 0;
    }

    let per = 0;

    for (const nb of mines) {
      const r = nb.r;
      const c = nb.c;

      // 上
      if (!neighbors.some(x => x.r === r - 1 && x.c === c && x.mine)) per++;
      // 下
      if (!neighbors.some(x => x.r === r + 1 && x.c === c && x.mine)) per++;
      // 左
      if (!neighbors.some(x => x.r === r && x.c === c - 1 && x.mine)) per++;
      // 右
      if (!neighbors.some(x => x.r === r && x.c === c + 1 && x.mine)) per++;
    }

    // 外周長をそのまま表示
    cell.displayValue = String(per);
    cell.safeZone = false;

    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}
// 秩序度
class OrderlinessRule extends NumberRule {
  calculate(cell, neighbors) {
    const mines = neighbors.filter(nb => nb.mine);
    cell.trueValue = mines.length;

    if (mines.length === 0) {
      cell.displayValue = "";
      cell.safeZone = true;
      return 0;
    }

    const r0 = cell.r;
    const c0 = cell.c;

    const distances = mines.map(nb => {
      return Math.abs(nb.r - r0) + Math.abs(nb.c - c0);
    });

    distances.sort((a, b) => a - b);

    let delta = 0;
    for (let i = 0; i < distances.length - 1; i++) {
      delta += Math.abs(distances[i + 1] - distances[i]);
    }

    // Δ の最大値を 6 として正規化
    const percent = (delta / 6) * 100;

    // 小数1桁の％表示
    cell.displayValue = percent.toFixed(1) + "%";
    cell.safeZone = false;

    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}
// 複素数
class CompositeComplexRule extends NumberRule {
  calculate(cell, neighbors) {
    const mines = neighbors.filter(nb => nb.mine);
    cell.trueValue = mines.length;

    if (mines.length === 0) {
      cell.displayValue = "";
      cell.safeZone = true;
      return 0;
    }

    const r0 = cell.r;
    const c0 = cell.c;

    let M_re = 0;
    let M_im = 0;

    for (const nb of mines) {
      const x = nb.c - c0; // 横
      const y = nb.r - r0; // 縦

      // z^2 = (x^2 - y^2) + i(2xy)
      const re = x * x - y * y;
      const im = 2 * x * y;

      M_re += re;
      M_im += im;
    }

    // 整数に丸める
    const a = Math.round(M_re);
    const b = Math.round(M_im);

    let text = "";

    if (a === 0 && b === 0) {
      // ★ ここを変更：0+0i を表示
      text = "0+0i";
      cell.safeZone = false;
    } else if (a === 0) {
      text = `${b}i`;
      cell.safeZone = false;
    } else if (b === 0) {
      text = `${a}`;
      cell.safeZone = false;
    } else {
      const sign = b >= 0 ? "+" : "-";
      const absB = Math.abs(b);
      text = `${a}${sign}${absB}i`;
      cell.safeZone = false;
    }

    cell.displayValue = text;
    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}
// スキャン左右
class ScanRatioinfluenceRule extends NumberRule {
  calculate(cell, neighbors) {
    const mines = neighbors.filter(nb => nb.mine);
    cell.trueValue = mines.length;

    if (mines.length === 0) {
      cell.displayValue = "";
      cell.safeZone = true;
      return 0;
    }

    // neighbors を行ごとにグループ化（r の昇順、c の昇順）
    const rows = {};
    for (const nb of neighbors) {
      if (!rows[nb.r]) rows[nb.r] = [];
      rows[nb.r].push(nb);
    }
    for (const r in rows) {
      rows[r].sort((a, b) => a.c - b.c);
    }

    let leftTotal = 0;
    let rightTotal = 0;

    // 左スキャン
    for (const r in rows) {
      const row = rows[r];
      let count = 0;
      for (const nb of row) {
        if (nb.mine) break;
        count++;
      }
      leftTotal += count;
    }

    // 右スキャン
    for (const r in rows) {
      const row = rows[r];
      let count = 0;
      for (let i = row.length - 1; i >= 0; i--) {
        if (row[i].mine) break;
        count++;
      }
      rightTotal += count;
    }

    cell.displayValue = `${leftTotal}:${rightTotal}`;
    cell.safeZone = false;

    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}
// スキャン上下
class ScanVerticalRatioRule extends NumberRule {
  calculate(cell, neighbors) {
    const mines = neighbors.filter(nb => nb.mine);
    cell.trueValue = mines.length;

    if (mines.length === 0) {
      cell.displayValue = "";
      cell.safeZone = true;
      return 0;
    }

    // neighbors を列ごとにグループ化（c の昇順、r の昇順）
    const cols = {};
    for (const nb of neighbors) {
      if (!cols[nb.c]) cols[nb.c] = [];
      cols[nb.c].push(nb);
    }
    for (const c in cols) {
      cols[c].sort((a, b) => a.r - b.r);
    }

    let upTotal = 0;
    let downTotal = 0;

    // 上スキャン
    for (const c in cols) {
      const col = cols[c];
      let count = 0;
      for (const nb of col) {
        if (nb.mine) break;
        count++;
      }
      upTotal += count;
    }

    // 下スキャン
    for (const c in cols) {
      const col = cols[c];
      let count = 0;
      for (let i = col.length - 1; i >= 0; i--) {
        if (col[i].mine) break;
        count++;
      }
      downTotal += count;
    }

    cell.displayValue = `${upTotal}:${downTotal}`;
    cell.safeZone = false;

    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}
// 四方向スキャン
class ScanFourDirectionRule extends NumberRule {
  calculate(cell, neighbors) {
    const mines = neighbors.filter(nb => nb.mine);
    cell.trueValue = mines.length;

    if (mines.length === 0) {
      cell.displayValue = "";
      cell.safeZone = true;
      return 0;
    }

    // 行ごとにグループ化
    const rows = {};
    for (const nb of neighbors) {
      if (!rows[nb.r]) rows[nb.r] = [];
      rows[nb.r].push(nb);
    }
    for (const r in rows) {
      rows[r].sort((a, b) => a.c - b.c);
    }

    // 列ごとにグループ化
    const cols = {};
    for (const nb of neighbors) {
      if (!cols[nb.c]) cols[nb.c] = [];
      cols[nb.c].push(nb);
    }
    for (const c in cols) {
      cols[c].sort((a, b) => a.r - b.r);
    }

    const counted = new Set();

    const add = (nb) => counted.add(`${nb.r},${nb.c}`);

    // 左スキャン
    for (const r in rows) {
      for (const nb of rows[r]) {
        if (nb.mine) break;
        add(nb);
      }
    }

    // 右スキャン
    for (const r in rows) {
      const row = rows[r];
      for (let i = row.length - 1; i >= 0; i--) {
        if (row[i].mine) break;
        add(row[i]);
      }
    }

    // 上スキャン
    for (const c in cols) {
      for (const nb of cols[c]) {
        if (nb.mine) break;
        add(nb);
      }
    }

    // 下スキャン
    for (const c in cols) {
      const col = cols[c];
      for (let i = col.length - 1; i >= 0; i--) {
        if (col[i].mine) break;
        add(col[i]);
      }
    }

    const total = counted.size;

    cell.displayValue = `${total}`;
    cell.safeZone = false;

    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}
//集大成

class CompositeCellRule extends NumberRule {
  constructor(explore) {
    super();
    this.explore = explore; // 探索ルールに従う
  }

  calculate(cell, neighbors) {
    const rule = cell.displayRule;
    let v = 0;

    switch (rule) {

      // --- 総数 ---
      case 1:
        v = neighbors.filter(n => n.mine).length;
        break;

      // --- ファジー ---
      case 2:
        v = neighbors.filter(n => n.mine).length;
        break;

      // --- 色別の差 ---
      case 3: {
        let light = 0, dark = 0;
        for (const nb of neighbors) {
          if (nb.mine) {
            ((nb.r + nb.c) % 2 === 0) ? light++ : dark++;
          }
        }
        if (light === 0 && dark === 0) v = null;
        else v = Math.abs(light - dark);
        break;
      }

      // --- 色加重 ---
      case 4: {
        let total = 0;
        for (const nb of neighbors) {
          if (nb.mine) {
            const isLight = ((nb.r + nb.c) % 2 === 0);
            total += isLight ? 1 : 2;
          }
        }
        v = total;
        break;
      }

      // --- 固まり個数 ---
      case 5: {
        const mines = neighbors.filter(nb => nb.mine);
        const visited = new Set();
        let groups = 0;

        for (const m of mines) {
          const key = `${m.r},${m.c}`;
          if (visited.has(key)) continue;

          this._floodLocalCluster(m, neighbors, visited);
          groups++;
        }
        v = groups;
        break;
      }

      // --- 余り3 ---
      case 6: {
        const count = neighbors.filter(nb => nb.mine).length;
        cell._rawCount = count;
        v = (count === 0) ? 0 : (count % 3);
        break;
      }
      // --- 距離2 ---
      case 7: {
      const board = cell.board;
      const scope = this.explore.neighbors(board, cell.r, cell.c);

    
      const d2s = [];
      for (const nb of scope) {
        if (!nb || !nb.mine) continue;
        const dx = cell.r - nb.r;
        const dy = cell.c - nb.c;
        d2s.push(dx*dx + dy*dy);
      }
    
      if (d2s.length === 0) {
        cell.displayValue = "";
        v = 0;
        break;
      }
    
      d2s.sort((a,b)=>a-b);
      const d1 = d2s[0];
    
      if (d2s.length === 1) {
        cell.displayValue = simplifySqrt(d1);
        v = Math.sqrt(d1);
        break;
      }
    
      let d2 = null;
      for (let i=1;i<d2s.length;i++){
        if (d2s[i] > d1) { d2 = d2s[i]; break; }
      }
    
      if (d2 === null) {
        cell.displayValue = simplifySqrt(d1);
        v = Math.sqrt(d1);
        break;
      }
    
      const n = d1 * d2;
      cell.displayValue = simplifySqrt(n);
      v = Math.sqrt(n);
      break;
    }//外周
    case 8: {
  const mines = neighbors.filter(nb => nb.mine);
  if (mines.length === 0) {
  cell.displayValue = "";
  v = 0;
  break;
  }
  
  let per = 0;
  for (const nb of mines) {
  const r = nb.r, c = nb.c;
  
  if (!neighbors.some(x => x.r===r-1 && x.c===c && x.mine)) per++;
  if (!neighbors.some(x => x.r===r+1 && x.c===c && x.mine)) per++;
  if (!neighbors.some(x => x.r===r && x.c===c-1 && x.mine)) per++;
  if (!neighbors.some(x => x.r===r && x.c===c+1 && x.mine)) per++;
  }
  
  cell.displayValue = String(per);
  v = mines.length;
  break;
  }//上下差
    case 9: {
  const trueCount = neighbors.filter(nb => nb.mine).length;
  if (trueCount === 0) {
    cell.displayValue = "";
    v = 0;
    break;
  }

  const r0 = cell.r;
  let up = 0, down = 0;

  for (const nb of neighbors) {
    if (!nb.mine) continue;
    if (nb.r <= r0) up++;
    if (nb.r >= r0) down++;
  }

  const diff = Math.abs(up - down);
  cell.displayValue = String(diff);
  v = trueCount;
  break;
}//左右差
case 10: {
  const trueCount = neighbors.filter(nb => nb.mine).length;
  if (trueCount === 0) {
    cell.displayValue = "";
    v = 0;
    break;
  }

  const c0 = cell.c;
  let left = 0, right = 0;

  for (const nb of neighbors) {
    if (!nb.mine) continue;
    if (nb.c <= c0) left++;
    if (nb.c >= c0) right++;
  }

  const diff = Math.abs(left - right);
  cell.displayValue = String(diff);
  v = trueCount;
  break;
}
    }

    cell.value = v;
    return v;
  }

  // clusterCount 用 BFS
  _floodLocalCluster(start, neighbors, visited) {
    const q = [start];
    while (q.length) {
      const cur = q.pop();
      const key = `${cur.r},${cur.c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dr, dc] of dirs) {
        const rr = cur.r + dr;
        const cc = cur.c + dc;
        const nb = neighbors.find(n => n.r === rr && n.c === cc && n.mine);
        if (nb) q.push(nb);
      }
    }
  }

  render(cell) {
    const rule = cell.displayRule;
    
    // --- total ---
    if (rule === 1) {
      if (cell.value === 0) return "";
      return `${cell.value}<span class="ruleTag">総数</span>`;
    }
    // --- fuzzy ファジー ---
    if (rule === 2) {
      if (cell.value === 0) return ``;
      const offset = Math.random() < 0.5 ? -1 : +1;
      return `${Math.max(0, cell.value + offset)}<span class="ruleTag">ファジ</span>`;
    }

    // --- colorDiff いろべつ---
    if (rule ===3) {
      if (cell.value === null) return ``;
      return `${cell.value}<span class="ruleTag">色別差</span>`;
    }

    // --- colorWeighted 色重---
    if (rule === 4) {
      if (cell.value === 0) return ``;
      return `${cell.value}<span class="ruleTag">色加重</span>`;
    }

    // --- clusterCount固まり個数 ---
    if (rule === 5) {
      if (!cell.value) return ``;
      return `${cell.value}<span class="ruleTag">固個数</span>`;
    }

    // --- mod3 ---
    if (rule === 6) {
      if (cell._rawCount === 0) return ``;
      return `${cell.value}<span class="ruleTag">余り3</span>`;
    }
    // --- 距離 ---
    
    if (rule === 7) {
      if (cell.value === 0) return ``;
      return `${cell.displayValue ?? ""}<span class="ruleTag">距離</span>`;
    }// 外周
    if (rule === 8) {
      if (cell.value === 0) return ``;
      return `${cell.displayValue}<span class="ruleTag">外周長</span>`;   
    }// 上下差
    if (rule === 9) {
      if (cell.value === 0) return ``;
      return `${cell.displayValue}<span class="ruleTag">上下差</span>`;
    }// 左右差
    if (rule === 10) {
      if (cell.value === 0) return ``;
      return `${cell.displayValue}<span class="ruleTag">左右差</span>`;
    }
    return String(cell.value);
  }
 isZero(cell) {
  const rule = cell.displayRule;

  // 色別差：null をゼロ扱い
  if (rule === 3) {
    return cell.value === null;
  }

  // 色加重 / 固まり個数 / 距離 / 外周 / 上下差 / 左右差：0 をゼロ扱い
  if (rule === 4 || rule === 5 || rule === 7 ||
      rule === 8 || rule === 9 || rule === 10) {
    return cell.value === 0;
  }

  // mod3：生のカウントが 0 のときだけゼロ扱い
  if (rule === 6) {
    return cell._rawCount === 0;
  }

  // それ以外はデフォルト
  return cell.value === 0;
}
}
// ====== ★ここでマップを定義 ======
const placementMap = {
  random: RandomPlacement,
  cluster: ClusterPlacement,
  noDiagonal: NoDiagonalPlacement,
  noThree: NoThreeInRowPlacement,
  pair: PairPlacement,
    rowcolfixed: RowColFixedPlacement,
  bridge: BridgePlacement,
 NoIsolated: NoIsolatedPlacement,
 Continent:ContinentPlacement,
 ThreeInRow:ThreeInRowPlacement,
 QuadrantEqual:QuadrantEqualPlacement,
 Path:PathPlacement,
ColorBalanced:ColorBalancedPlacement,
NoTouch:NoTouchPlacement,
noOrthogonal: NoOrthogonalPlacement,
Cluster4Isolated:Cluster4IsolatedPlacement,
TetrisMino:TetrisMinoPlacement,
Lightning:LightningPlacement,
SpiderWeb:SpiderWebPlacement,
ReducedLuck:ReducedLuckPlacement,
FractalIslands:FractalIslandsPlacement,
Chaos12:Chaos12Placement,
SigmaCluster:SigmaClusterPlacement,
SigmaLine:SigmaLinePlacement,
NoiseStructure:NoiseStructurePlacement,
UniqueShape:UniqueShapePlacement,
RowConnected:RowConnectedPlacement,
RowConnectedWith3x3:RowConnectedWith3x3Placement,

};

const exploreMap = {
  normal8: Normal8Explore,
  knight: KnightExplore,
  queen: QueenSightExplore,
    big25: Big25Explore,
  colorAxis: ColorAxisExplore,
  colorAxisDiagonal: ColorAxisDiagonalExplore ,
  untilMine: UntilMineExplore ,
  expandUntilMine: ExpandUntilMineExplore ,
  clusterDetect: ClusterDetectExplore,
  Cross1: Cross4Explore,
  Cross2:Cross2Explore,
  Ring:RingExplore,
  Diamond2:Diamond2Explore,
  RippleChain:RippleChainExplore,
  Ripple:RippleExplore,
  RippleImmutable:RippleExplore,
  ExpandUntil2MinesTriangle:ExpandUntil2MinesTriangleExplore,
   Global: GlobalExplore,
   SquareMineCount:SquareMineCountExplore,
   DiamondMineCount:DiamondMineCountExplore,
    big49:Big49Explore,
    Diamond3:Diamond3Explore,
    Alternating:AlternatingExplore,
    StraightLine:StraightLineExplore,
    UntilMine5x5Immutable:UntilMine5x5ImmutableExplore,
    UntilMine5x5:UntilMine5x5Explore,
    Normal8torus:Normal8torusExplore,
    RandomBlindSpot:RandomBlindSpotExplore,
    CrossBlindSpot:CrossBlindSpotExplore,


    

};

const numberMap = {
  total: TotalNumberRule,
  qmark: QmarkNumberRule,
  fuzzy: FuzzyNumberRule,
  colorSplit: ColorSplitNumberRule,
  mod3: mod3NumberRule,
  mod10: mod10NumberRule,
  cluster: ClusterNumberRule ,
  clusterMazMin: ClusterMaxMixNumberRule,
  colorDiff: ColorDiffNumberRule,
  ColorWeight:ColorWeightNumberRule ,
  range3: Range3NumberRule,
  decompose: DecomposeNumberRule ,
  distanceSum: DistanceSumRule,
  distanceProduct: DistanceProductInExploreRule,
  TruthLie:TruthLieNumberRule,
  NeighborAverage:NeighborAverageNumberRule,
  NearestTwoProduct: NearestTwoProductNumberRule,
  EvenOdd: EvenOddNumberRule,
  Odd:OddNumberRule,
  prime:PrimeNumberRule,
  PrimeOnly:PrimeOnlyNumberRule,
  Percent:PercentNumberRule,
ManhattanVector: ManhattanVectorRule,
VerticalSplit: VerticalSplitCountRule,
HorizontalSplit: HorizontalSplitCountRule,
ClusterQuantity:ClusterQuantityNumberRule,
Median:MedianNumberRule,
HalfMineReveal:HalfMineRevealRule,
BiasDiff: BiasDiffNumberRule,
VerticalBiasDiff:VerticalBiasDiffNumberRule,
HorizontalBiasDiff:HorizontalBiasDiffNumberRule,
Perimeter:PerimeterRule,
Orderliness:OrderlinessRule,
CompositeComplex:CompositeComplexRule,
ScanRatioinfluence:ScanRatioinfluenceRule,
ScanVerticalRatio:ScanVerticalRatioRule,
ScanFourDirection:ScanFourDirectionRule,
CompositeCell:CompositeCellRule,


};



