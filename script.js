(function () {
  "use strict";

  var SIZE = 4;
  var CELL_COUNT = SIZE * SIZE;

  var boardEl = document.getElementById("board");

  // 一维数组表示棋盘，索引 = 行 * SIZE + 列，0 表示空格。
  var board = [];

  /**
   * 创建并开始一局新游戏。
   */
  function init() {
    board = new Array(CELL_COUNT).fill(0);
    addRandomTile();
    addRandomTile();
    render();
  }

  /**
   * 在随机空格处生成一个新方块（90% 为 2，10% 为 4）。
   */
  function addRandomTile() {
    var emptyIndexes = [];
    for (var i = 0; i < CELL_COUNT; i++) {
      if (board[i] === 0) {
        emptyIndexes.push(i);
      }
    }

    if (emptyIndexes.length === 0) {
      return;
    }

    var index = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
    board[index] = Math.random() < 0.9 ? 2 : 4;
  }

  /**
   * 对一条长度为 4 的数字线执行“向左滑动并合并”。
   * 每个方块在一次操作中最多参与一次合并。
   * 例如 [2, 2, 2, 2] -> [4, 4, 0, 0]
   */
  function slideLeft(line) {
    var result = [];
    var i;

    // 去掉空格，得到紧凑排列的非零数字。
    for (i = 0; i < line.length; i++) {
      if (line[i] !== 0) {
        result.push(line[i]);
      }
    }

    // 合并相邻且相等的数字，合并后跳过下一个，避免重复合并。
    var merged = [];
    for (i = 0; i < result.length; i++) {
      if (i + 1 < result.length && result[i] === result[i + 1]) {
        merged.push(result[i] * 2);
        i++; // 跳过已参与合并的下一个方块
      } else {
        merged.push(result[i]);
      }
    }

    // 末尾补 0 至固定长度。
    while (merged.length < SIZE) {
      merged.push(0);
    }

    return merged;
  }

  /**
   * 取出棋盘中的某一行（从左到右）。
   */
  function getRow(row) {
    var line = [];
    for (var col = 0; col < SIZE; col++) {
      line.push(board[row * SIZE + col]);
    }
    return line;
  }

  /**
   * 取出棋盘中的某一列（从上到下）。
   */
  function getColumn(col) {
    var line = [];
    for (var row = 0; row < SIZE; row++) {
      line.push(board[row * SIZE + col]);
    }
    return line;
  }

  /**
   * 将一条线写回某一行。
   */
  function setRow(row, line) {
    for (var col = 0; col < SIZE; col++) {
      board[row * SIZE + col] = line[col];
    }
  }

  /**
   * 将一条线写回某一列。
   */
  function setColumn(col, line) {
    for (var row = 0; row < SIZE; row++) {
      board[row * SIZE + col] = line[row];
    }
  }

  /**
   * 通用的向左移动逻辑：对每一行应用 slideLeft。
   * @returns {boolean} 棋盘是否发生变化
   */
  function moveLeft() {
    var moved = false;
    for (var row = 0; row < SIZE; row++) {
      var original = getRow(row);
      var slid = slideLeft(original);
      if (!arraysEqual(original, slid)) {
        moved = true;
        setRow(row, slid);
      }
    }
    return moved;
  }

  /**
   * 向右移动 = 每行反转变换后向左移动，再反转回来。
   */
  function moveRight() {
    var moved = false;
    for (var row = 0; row < SIZE; row++) {
      var original = getRow(row);
      var reversed = original.slice().reverse();
      var slid = slideLeft(reversed).reverse();
      if (!arraysEqual(original, slid)) {
        moved = true;
        setRow(row, slid);
      }
    }
    return moved;
  }

  /**
   * 向上移动 = 每列向左移动。
   */
  function moveUp() {
    var moved = false;
    for (var col = 0; col < SIZE; col++) {
      var original = getColumn(col);
      var slid = slideLeft(original);
      if (!arraysEqual(original, slid)) {
        moved = true;
        setColumn(col, slid);
      }
    }
    return moved;
  }

  /**
   * 向下移动 = 每列反转变换后向左移动，再反转回来。
   */
  function moveDown() {
    var moved = false;
    for (var col = 0; col < SIZE; col++) {
      var original = getColumn(col);
      var reversed = original.slice().reverse();
      var slid = slideLeft(reversed).reverse();
      if (!arraysEqual(original, slid)) {
        moved = true;
        setColumn(col, slid);
      }
    }
    return moved;
  }

  /**
   * 比较两个数组是否完全相等。
   */
  function arraysEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * 根据滑动方向执行移动；仅当有效移动时生成新方块。
   * @param {string} direction one of "left" | "right" | "up" | "down"
   */
  function move(direction) {
    var moved = false;

    if (direction === "left") {
      moved = moveLeft();
    } else if (direction === "right") {
      moved = moveRight();
    } else if (direction === "up") {
      moved = moveUp();
    } else if (direction === "down") {
      moved = moveDown();
    }

    if (moved) {
      addRandomTile();
      render();
    }
  }

  /**
   * 根据数值返回对应的 CSS 类名。
   */
  function getTileClass(value) {
    if (value === 0) {
      return "tile";
    }
    if (value <= 2048) {
      return "tile tile-" + value;
    }
    return "tile tile-super";
  }

  /**
   * 渲染棋盘到页面。
   */
  function render() {
    // 首次渲染时创建 16 个格子，之后复用。
    if (boardEl.children.length !== CELL_COUNT) {
      boardEl.innerHTML = "";
      for (var i = 0; i < CELL_COUNT; i++) {
        var cell = document.createElement("div");
        cell.className = "tile";
        boardEl.appendChild(cell);
      }
    }

    for (var j = 0; j < CELL_COUNT; j++) {
      var tileEl = boardEl.children[j];
      var value = board[j];
      tileEl.className = getTileClass(value);
      tileEl.textContent = value === 0 ? "" : String(value);
    }
  }

  /**
   * 键盘事件处理：方向键与 WASD。
   */
  function handleKeydown(event) {
    var key = event.key;
    var direction = null;

    if (key === "ArrowLeft" || key === "a" || key === "A") {
      direction = "left";
    } else if (key === "ArrowRight" || key === "d" || key === "D") {
      direction = "right";
    } else if (key === "ArrowUp" || key === "w" || key === "W") {
      direction = "up";
    } else if (key === "ArrowDown" || key === "s" || key === "S") {
      direction = "down";
    }

    if (direction !== null) {
      event.preventDefault();
      move(direction);
    }
  }

  document.addEventListener("keydown", handleKeydown);

  init();
})();
