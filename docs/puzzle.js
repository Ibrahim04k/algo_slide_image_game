// Toggle interaction state for all buttons and tiles
function toggleInteraction(enable) {
  isProcessing = !enable;
  
  // Toggle buttons
  const buttons = ["shuffle", "solve", "solveBFS", "initState"];
  for (let btnId of buttons) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.disabled = !enable;
    }
  }
  
  // Toggle draggable state for tiles
  const board = document.getElementById("board");
  const tiles = board.getElementsByTagName("img");
  for (let tile of tiles) {
    if (enable) {
      tile.setAttribute("draggable", "true");
    } else {
      tile.setAttribute("draggable", "false");
    }
  }
}var rows = 3;
var columns = 3;

var currTile;
var otherTile;

var turns = 0;

// Keep track of the initial state after shuffling
var initialImgOrder = [];

// Flag to track if an algorithm is currently running
var isProcessing = false;

const goalOrder = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const emptyTileValue = "3"; // القطعة الفارغة هي الرقم 3

// عد القطع التي ليست في مكانها الصحيح
function countMisplaced(puzzle, goal) {
  let misplaced = 0;
  for (let i = 0; i < puzzle.length; i++) {
    if (puzzle[i] !== goal[i]) {
      misplaced++;
    }
  }
  return misplaced;
}

// Count inversions in a puzzle state
function countInversions(puzzle) {
  let inversions = 0;
  // Skip the empty tile in counting inversions
  for (let i = 0; i < puzzle.length; i++) {
    if (puzzle[i] === emptyTileValue) continue;
    
    for (let j = i + 1; j < puzzle.length; j++) {
      if (puzzle[j] === emptyTileValue) continue;
      
      if (parseInt(puzzle[i]) > parseInt(puzzle[j])) {
        inversions++;
      }
    }
  }
  return inversions;
}

// Check if a puzzle configuration is solvable
function isSolvable(puzzle) {
  // For 3x3 puzzle, a configuration is solvable if the number of inversions is even
  return countInversions(puzzle) % 2 === 0;
}

// إنشاء ترتيب عشوائي قابل للحل
function generateSolvableOrder(goal) {
  let order;
  do {
    order = [...goal].sort(() => Math.random() - 0.5);
  } while (!isSolvable(order));
  
  return order;
}

var imgOrder = generateSolvableOrder(goalOrder);

// BFS algorithm implementation
function solvePuzzleBFS() {
  // Prevent interaction while solving
  if (isProcessing) return;
  toggleInteraction(false);
  
  // Get current state of the board
  const board = document.getElementById("board");
  let tiles = Array.from(board.getElementsByTagName("img"));
  let currentState = tiles.map(tile => {
    let fileName = tile.src.split("/").pop();
    return fileName.replace(".jpg", "");
  });
  
  // Find empty tile position
  let emptyTilePos = currentState.indexOf(emptyTileValue);
  
  // Convert linear index to 2D coordinates
  let emptyRow = Math.floor(emptyTilePos / columns);
  let emptyCol = emptyTilePos % columns;
  
  // Create initial state object
  let initialState = {
    board: currentState,
    emptyPos: { row: emptyRow, col: emptyCol },
    moves: [],
    parent: null
  };
  
  // BFS search
  let solution = bfsSearch(initialState, goalOrder);
  
  if (solution) {
    // Apply solution moves with animation
    applySolutionMoves(solution.moves);
  } else {
    alert("لا يمكن إيجاد حل للغز!");
    toggleInteraction(true); // Re-enable interaction if no solution found
  }
}

// BFS search algorithm
function bfsSearch(initialState, goal) {
  // Queue for states to explore
  let queue = [initialState];
  
  // Set to keep track of visited states
  let visited = new Set();
  visited.add(initialState.board.join(','));
  
  // Maximum number of iterations to prevent infinite loops
  let maxIterations = 100000;
  let iterations = 0;
  
  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Get the next state from the queue
    let current = queue.shift();
    
    // Check if we've reached the goal
    if (arraysEqual(current.board, goal)) {
      return current; // Solution found
    }
    
    // Generate possible moves
    let possibleMoves = getPossibleMovesBFS(current);
    
    // Add new states to queue
    for (let move of possibleMoves) {
      let stateKey = move.board.join(',');
      if (!visited.has(stateKey)) {
        visited.add(stateKey);
        queue.push(move);
      }
    }
  }
  
  // No solution found
  return null;
}

// Helper function to check if two arrays are equal
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Get all possible moves from current state for BFS
function getPossibleMovesBFS(state) {
  let moves = [];
  let directions = [
    { dr: -1, dc: 0, name: 'up' },
    { dr: 1, dc: 0, name: 'down' },
    { dr: 0, dc: -1, name: 'left' },
    { dr: 0, dc: 1, name: 'right' }
  ];
  
  for (let dir of directions) {
    let newRow = state.emptyPos.row + dir.dr;
    let newCol = state.emptyPos.col + dir.dc;
    
    // Check if new position is valid
    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < columns) {
      // Create new board state with the move applied
      let newBoard = [...state.board];
      let oldPos = state.emptyPos.row * columns + state.emptyPos.col;
      let newPos = newRow * columns + newCol;
      
      // Swap empty tile with the tile at new position
      [newBoard[oldPos], newBoard[newPos]] = [newBoard[newPos], newBoard[oldPos]];
      
      // Calculate the move (which tile moved to which position)
      let newMove = { 
        from: { row: newRow, col: newCol }, 
        to: { row: state.emptyPos.row, col: state.emptyPos.col } 
      };
      
      // Create new state
      let newState = {
        board: newBoard,
        emptyPos: { row: newRow, col: newCol },
        moves: [...state.moves, newMove],
        parent: state
      };
      
      moves.push(newState);
    }
  }
  
  return moves;
}

// A* algorithm implementation
function solvePuzzle() {
  // Prevent interaction while solving
  if (isProcessing) return;
  toggleInteraction(false);
  
  // Get current state of the board
  const board = document.getElementById("board");
  let tiles = Array.from(board.getElementsByTagName("img"));
  let currentState = tiles.map(tile => {
    let fileName = tile.src.split("/").pop();
    return fileName.replace(".jpg", "");
  });
  
  // Find empty tile position
  let emptyTilePos = currentState.indexOf(emptyTileValue);
  
  // Convert linear index to 2D coordinates
  let emptyRow = Math.floor(emptyTilePos / columns);
  let emptyCol = emptyTilePos % columns;
  
  // Create initial state object
  let initialState = {
    board: currentState,
    emptyPos: { row: emptyRow, col: emptyCol },
    moves: [],
    cost: 0,
    heuristic: calculateHeuristic(currentState, goalOrder)
  };
  
  // A* search
  let solution = aStarSearch(initialState, goalOrder);
  
  if (solution) {
    // Apply solution moves with animation
    applySolutionMoves(solution.moves);
  } else {
    alert("لا يمكن إيجاد حل للغز!");
    toggleInteraction(true); // Re-enable interaction if no solution found
  }
}

// Calculate Manhattan distance heuristic
function calculateHeuristic(state, goal) {
  let totalDistance = 0;
  
  for (let i = 0; i < state.length; i++) {
    if (state[i] !== emptyTileValue) {
      // Find where this tile should be in the goal state
      let goalIndex = goal.indexOf(state[i]);
      let goalRow = Math.floor(goalIndex / columns);
      let goalCol = goalIndex % columns;
      
      // Find where it currently is
      let currentRow = Math.floor(i / columns);
      let currentCol = i % columns;
      
      // Add Manhattan distance
      totalDistance += Math.abs(goalRow - currentRow) + Math.abs(goalCol - currentCol);
    }
  }
  
  return totalDistance;
}

// A* search algorithm
function aStarSearch(initialState, goal) {
  // Priority queue for states to explore (using array + sort)
  let openSet = [initialState];
  
  // Set to keep track of visited states
  let closedSet = new Set();
  
  // Maximum number of iterations to prevent infinite loops
  let maxIterations = 10000;
  let iterations = 0;
  
  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Sort by f(n) = g(n) + h(n) - cost plus heuristic
    openSet.sort((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
    
    // Get the most promising state
    let current = openSet.shift();
    
    // Check if we've reached the goal
    if (current.heuristic === 0) {
      return current; // Solution found
    }
    
    // Generate key for this state to track visited states
    let stateKey = current.board.join(',');
    
    // Skip if we've seen this state before
    if (closedSet.has(stateKey)) {
      continue;
    }
    
    // Mark as visited
    closedSet.add(stateKey);
    
    // Generate possible moves
    let possibleMoves = getPossibleMoves(current);
    
    // Add new states to open set
    for (let move of possibleMoves) {
      openSet.push(move);
    }
  }
  
  // No solution found
  return null;
}

// Get all possible moves from current state
function getPossibleMoves(state) {
  let moves = [];
  let directions = [
    { dr: -1, dc: 0, name: 'up' },
    { dr: 1, dc: 0, name: 'down' },
    { dr: 0, dc: -1, name: 'left' },
    { dr: 0, dc: 1, name: 'right' }
  ];
  
  for (let dir of directions) {
    let newRow = state.emptyPos.row + dir.dr;
    let newCol = state.emptyPos.col + dir.dc;
    
    // Check if new position is valid
    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < columns) {
      // Create new board state with the move applied
      let newBoard = [...state.board];
      let oldPos = state.emptyPos.row * columns + state.emptyPos.col;
      let newPos = newRow * columns + newCol;
      
      // Swap empty tile with the tile at new position
      [newBoard[oldPos], newBoard[newPos]] = [newBoard[newPos], newBoard[oldPos]];
      
      // Create new state
      let newState = {
        board: newBoard,
        emptyPos: { row: newRow, col: newCol },
        moves: [...state.moves, { from: { row: newRow, col: newCol }, to: { row: state.emptyPos.row, col: state.emptyPos.col } }],
        cost: state.cost + 1,
        heuristic: calculateHeuristic(newBoard, goalOrder)
      };
      
      moves.push(newState);
    }
  }
  
  return moves;
}

// Apply solution moves with animation
function applySolutionMoves(moves) {
  if (moves.length === 0) {
    alert("اللغز محلول بالفعل!");
    toggleInteraction(true);
    return;
  }
  
  let moveIndex = 0;
  let moveInterval = setInterval(() => {
    if (moveIndex >= moves.length) {
      clearInterval(moveInterval);
      alert("تم حل اللغز في " + moves.length + " خطوة!");
      toggleInteraction(true); // Re-enable interaction when done
      return;
    }
    
    let move = moves[moveIndex];
    let fromTile = document.getElementById(move.from.row + "-" + move.from.col);
    let toTile = document.getElementById(move.to.row + "-" + move.to.col);
    
    // Swap images
    let tempSrc = fromTile.src;
    fromTile.src = toTile.src;
    toTile.src = tempSrc;
    
    // Update turn counter
    turns++;
    document.getElementById("turns").innerText = turns;
    
    moveIndex++;
  }, 300); // 300ms between moves for animation
}

// Function to return to initial state
function returnToInitialState() {
  // Prevent interaction while processing
  if (isProcessing) return;
  toggleInteraction(false);
  
  if (initialImgOrder.length === 0) {
    alert("قم بخلط اللغز أولاً!");
    toggleInteraction(true);
    return;
  }
  
  // تحديث اللوحة بالترتيب الأولي
  const board = document.getElementById("board");
  let tiles = Array.from(board.getElementsByTagName("img"));
  
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].src = initialImgOrder[i] + ".jpg";
  }
  
  // إعادة ضبط عداد الحركات
  turns = 0;
  document.getElementById("turns").innerText = turns;
  
  console.log("تم العودة إلى الحالة الأولية بعد الخلط");
  
  // Re-enable interaction
  toggleInteraction(true);
}

window.onload = function() {
  // التأكد من أن ترتيب البداية قابل للحل
  if (!isSolvable(imgOrder)) {
    imgOrder = generateSolvableOrder(goalOrder);
  }
  
  // إنشاء اللوحة
  createBoard();
  
  // حفظ الحالة الأولية
  initialImgOrder = [...imgOrder];
  
  // Enable all interactions at the start
  toggleInteraction(true);
  
  // إعداد زر الخلط
  let btn = document.getElementById("shuffle");
  if (btn) {
    btn.addEventListener("click", shufflePuzzle);
  }
  
  // إعداد زر الحل باستخدام A*
  let solveBtn = document.getElementById("solve");
  if (solveBtn) {
    solveBtn.addEventListener("click", solvePuzzle);
  }
  
  // إعداد زر الحل باستخدام BFS
  let solveBfsBtn = document.getElementById("solveBFS");
  if (solveBfsBtn) {
    solveBfsBtn.addEventListener("click", solvePuzzleBFS);
  }
  
  // إعداد زر العودة إلى الحالة الأولية
  let initStateBtn = document.getElementById("initState");
  if (initStateBtn) {
    initStateBtn.addEventListener("click", returnToInitialState);
  }
  
  // عرض معلومات التشخيص للترتيب الأولي
  console.log("ترتيب البداية:");
  console.log(imgOrder);
  console.log("عدد الانعكاسات: " + countInversions(imgOrder));
  console.log("هل اللغز قابل للحل؟ " + (isSolvable(imgOrder) ? "نعم" : "لا"));
}

function createBoard() {
  // تنظيف اللوحة أولاً
  const board = document.getElementById("board");
  board.innerHTML = "";
  
  // نسخة من ترتيب الصور الحالي
  let currentImgOrder = [...imgOrder];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      let tile = document.createElement("img");
      tile.id = r + "-" + c;
      tile.src = currentImgOrder.shift() + ".jpg";

      tile.setAttribute("draggable", "true");

      tile.addEventListener("dragstart", dragStart);
      tile.addEventListener("dragover", dragOver);
      tile.addEventListener("dragenter", dragEnter);
      tile.addEventListener("dragleave", dragLeave);
      tile.addEventListener("drop", dragDrop);
      tile.addEventListener("dragend", dragEnd);

      board.append(tile);
    }
  }
}

function shufflePuzzle() {
  // Prevent interaction while processing
  if (isProcessing) return;
  toggleInteraction(false);
  
  // إنشاء ترتيب جديد قابل للحل
  imgOrder = generateSolvableOrder(goalOrder);
  
  // تحديث اللوحة بالترتيب الجديد
  const board = document.getElementById("board");
  let tiles = Array.from(board.getElementsByTagName("img"));
  let currentImgOrder = [...imgOrder];
  
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].src = currentImgOrder[i] + ".jpg";
  }
  
  // حفظ الحالة الأولية بعد الخلط
  initialImgOrder = [...imgOrder];
  
  // إعادة ضبط عداد الحركات
  turns = 0;
  document.getElementById("turns").innerText = turns;
  
  // عرض معلومات التشخيص
  let inversions = countInversions(imgOrder);
  let misplaced = countMisplaced(imgOrder, goalOrder);
  console.log("عدد الانعكاسات: " + inversions);
  console.log("هل اللغز قابل للحل؟ " + (isSolvable(imgOrder) ? "نعم" : "لا"));
  console.log("عدد القطع في غير مكانها: " + misplaced);
  
  // Re-enable interaction
  toggleInteraction(true);
}

function dragStart() {
  currTile = this;
}

function dragOver(e) {
  e.preventDefault();
}

function dragEnter(e) {
  e.preventDefault();
}

function dragLeave() {
  // يمكن إضافة تأثيرات بصرية هنا
}

function dragDrop() {
  otherTile = this;
}

function dragEnd() {
  // If algorithm is running, don't allow moves
  if (isProcessing) return;
  
  // التحقق من أن القطعة المستهدفة هي القطعة الفارغة (3)
  if (!otherTile.src.includes(emptyTileValue + ".jpg")) {
    return;
  }

  let [r, c] = currTile.id.split("-").map(Number);
  let [r2, c2] = otherTile.id.split("-").map(Number);

  // التحقق من أن القطع متجاورة
  let isAdjacent = (
    (r === r2 && Math.abs(c - c2) === 1) ||
    (c === c2 && Math.abs(r - r2) === 1)
  );

  if (isAdjacent) {
    // تبديل القطع
    let currImg = currTile.src;
    currTile.src = otherTile.src;
    otherTile.src = currImg;

    // تحديث عداد الحركات
    turns++;
    document.getElementById("turns").innerText = turns;
    
    // التحقق من الفوز
    checkWin();
  }
}

// التحقق من الفوز
function checkWin() {
  const board = document.getElementById("board");
  let tiles = Array.from(board.getElementsByTagName("img"));
  
  let currentOrder = tiles.map(tile => {
    let fileName = tile.src.split("/").pop(); // الحصول على اسم الملف من الرابط
    return fileName.replace(".jpg", "");
  });

  // التحقق من أن الترتيب الحالي يطابق ترتيب الهدف
  let isWin = true;
  for (let i = 0; i < tiles.length; i++) {
    if (currentOrder[i] !== goalOrder[i]) {
      isWin = false;
      break;
    }
  }
  
  if (isWin) {
    setTimeout(() => {
      alert("مبروك! لقد حللت اللغز في " + turns + " حركة!");
    }, 300);
  }
}
