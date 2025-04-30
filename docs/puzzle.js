// Configuration
const ROWS = 3;
const COLUMNS = 3;
const EMPTY_TILE_VALUE = "3";
const GOAL_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

// Game state
let currTile;
let otherTile;
let turns = 0;
let imgOrder = [];
let initialImgOrder = [];
let isProcessing = false;

// -------------------- Utility Functions --------------------

// Toggle interaction state for all buttons and tiles
function toggleInteraction(enable) {
  isProcessing = !enable;
  
  // Toggle buttons
  ["shuffle", "solve", "solveBFS", "solveUCS", "initState"].forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = !enable;
  });
  
  // Toggle draggable state for tiles
  const tiles = document.getElementById("board").getElementsByTagName("img");
  for (let tile of tiles) {
    tile.setAttribute("draggable", enable.toString());
  }
}

// Helper function to check if two arrays are equal
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Count misplaced tiles
function countMisplaced(puzzle, goal) {
  return puzzle.filter((val, idx) => val !== goal[idx]).length;
}

// Count inversions in a puzzle state
function countInversions(puzzle) {
  let inversions = 0;
  
  for (let i = 0; i < puzzle.length; i++) {
    if (puzzle[i] === EMPTY_TILE_VALUE) continue;
    
    for (let j = i + 1; j < puzzle.length; j++) {
      if (puzzle[j] === EMPTY_TILE_VALUE) continue;
      
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

// Generate a solvable random order
function generateSolvableOrder(goal) {
  let order;
  do {
    order = [...goal].sort(() => Math.random() - 0.5);
  } while (!isSolvable(order));
  
  return order;
}

// Get current board state
function getCurrentBoardState() {
  const board = document.getElementById("board");
  const tiles = Array.from(board.getElementsByTagName("img"));
  
  return tiles.map(tile => {
    let fileName = tile.src.split("/").pop();
    return fileName.replace(".jpg", "");
  });
}

// Find empty tile position
function findEmptyTilePosition(boardState) {
  const emptyTilePos = boardState.indexOf(EMPTY_TILE_VALUE);
  return {
    row: Math.floor(emptyTilePos / COLUMNS),
    col: emptyTilePos % COLUMNS
  };
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
      toggleInteraction(true);
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

// -------------------- Game Logic Functions --------------------

// Create game board
function createBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  
  // Make a copy of the current image order
  let currentImgOrder = [...imgOrder];
  
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      let tile = document.createElement("img");
      tile.id = r + "-" + c;
      tile.src = currentImgOrder.shift() + ".jpg";
      tile.setAttribute("draggable", "true");

      // Add drag-and-drop event listeners
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

// Shuffle the puzzle
function shufflePuzzle() {
  if (isProcessing) return;
  toggleInteraction(false);
  
  // Generate a new solvable order
  imgOrder = generateSolvableOrder(GOAL_ORDER);
  
  // Update the board with the new order
  const tiles = document.getElementById("board").getElementsByTagName("img");
  let currentImgOrder = [...imgOrder];
  
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].src = currentImgOrder[i] + ".jpg";
  }
  
  // Save initial state after shuffling
  initialImgOrder = [...imgOrder];
  
  // Reset turn counter
  turns = 0;
  document.getElementById("turns").innerText = turns;
  
  // Log diagnostic information
  console.log("Inversions: " + countInversions(imgOrder));
  console.log("Is solvable: " + (isSolvable(imgOrder) ? "Yes" : "No"));
  console.log("Misplaced tiles: " + countMisplaced(imgOrder, GOAL_ORDER));
  
  toggleInteraction(true);
}

// Return to initial state
function returnToInitialState() {
  if (isProcessing) return;
  toggleInteraction(false);
  
  if (initialImgOrder.length === 0) {
    alert("قم بخلط اللغز أولاً!");
    toggleInteraction(true);
    return;
  }
  
  // Update board with initial order
  const tiles = document.getElementById("board").getElementsByTagName("img");
  
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].src = initialImgOrder[i] + ".jpg";
  }
  
  // Reset turn counter
  turns = 0;
  document.getElementById("turns").innerText = turns;
  
  console.log("تم العودة إلى الحالة الأولية بعد الخلط");
  
  toggleInteraction(true);
}

// Check for win condition
function checkWin() {
  const currentOrder = getCurrentBoardState();

  // Check if current order matches goal order
  if (arraysEqual(currentOrder, GOAL_ORDER)) {
    setTimeout(() => {
      alert("مبروك! لقد حللت اللغز في " + turns + " حركة!");
    }, 300);
  }
}

// -------------------- Drag & Drop Functions --------------------

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
  // Can add visual effects here
}

function dragDrop() {
  otherTile = this;
}

function dragEnd() {
  // If algorithm is running, don't allow moves
  if (isProcessing) return;
  
  // Check if target tile is the empty tile
  if (!otherTile.src.includes(EMPTY_TILE_VALUE + ".jpg")) {
    return;
  }

  let [r, c] = currTile.id.split("-").map(Number);
  let [r2, c2] = otherTile.id.split("-").map(Number);

  // Check if tiles are adjacent
  let isAdjacent = (
    (r === r2 && Math.abs(c - c2) === 1) ||
    (c === c2 && Math.abs(r - r2) === 1)
  );

  if (isAdjacent) {
    // Swap tiles
    let currImg = currTile.src;
    currTile.src = otherTile.src;
    otherTile.src = currImg;

    // Update turn counter
    turns++;
    document.getElementById("turns").innerText = turns;
    
    // Check for win
    checkWin();
  }
}

// -------------------- AI Solver Functions --------------------

// Calculate Manhattan distance heuristic
function calculateHeuristic(state, goal) {
  let totalDistance = 0;
  
  for (let i = 0; i < state.length; i++) {
    if (state[i] !== EMPTY_TILE_VALUE) {
      // Find where this tile should be in the goal state
      let goalIndex = goal.indexOf(state[i]);
      let goalRow = Math.floor(goalIndex / COLUMNS);
      let goalCol = goalIndex % COLUMNS;
      
      // Find where it currently is
      let currentRow = Math.floor(i / COLUMNS);
      let currentCol = i % COLUMNS;
      
      // Add Manhattan distance
      totalDistance += Math.abs(goalRow - currentRow) + Math.abs(goalCol - currentCol);
    }
  }
  
  return totalDistance;
}

// Get possible moves from a state
function getPossibleMoves(state, isForAStar = true) {
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
    if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLUMNS) {
      // Create new board state with the move applied
      let newBoard = [...state.board];
      let oldPos = state.emptyPos.row * COLUMNS + state.emptyPos.col;
      let newPos = newRow * COLUMNS + newCol;
      
      // Swap empty tile with the tile at new position
      [newBoard[oldPos], newBoard[newPos]] = [newBoard[newPos], newBoard[oldPos]];
      
      // Create move info
      let newMove = { 
        from: { row: newRow, col: newCol }, 
        to: { row: state.emptyPos.row, col: state.emptyPos.col } 
      };
      
      // Create new state
      let newState = {
        board: newBoard,
        emptyPos: { row: newRow, col: newCol },
        moves: [...state.moves, newMove]
      };
      
      // Add A* specific properties if needed
      if (isForAStar) {
        newState.cost = state.cost + 1;
        newState.heuristic = calculateHeuristic(newBoard, GOAL_ORDER);
      }
      
      moves.push(newState);
    }
  }
  
  return moves;
}

// A* Search Algorithm
function solvePuzzle() {
  if (isProcessing) return;
  toggleInteraction(false);
  
  // Get current state
  const currentState = getCurrentBoardState();
  const emptyPos = findEmptyTilePosition(currentState);
  
  // Create initial state object
  let initialState = {
    board: currentState,
    emptyPos: emptyPos,
    moves: [],
    cost: 0,
    heuristic: calculateHeuristic(currentState, GOAL_ORDER)
  };
  
  // A* search
  let solution = aStarSearch(initialState);
  
  if (solution) {
    applySolutionMoves(solution.moves);
  } else {
    alert("لا يمكن إيجاد حل للغز!");
    toggleInteraction(true);
  }
}

function aStarSearch(initialState) {
  let openSet = [initialState];
  let closedSet = new Set();
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
    let possibleMoves = getPossibleMoves(current, true);
    
    // Add new states to open set
    for (let move of possibleMoves) {
      openSet.push(move);
    }
  }
  
  return null; // No solution found
}

// BFS Search Algorithm
function solvePuzzleBFS() {
  if (isProcessing) return;
  toggleInteraction(false);
  
  // Get current state
  const currentState = getCurrentBoardState();
  const emptyPos = findEmptyTilePosition(currentState);
  
  // Create initial state object
  let initialState = {
    board: currentState,
    emptyPos: emptyPos,
    moves: []
  };
  
  // BFS search
  let solution = bfsSearch(initialState);
  
  if (solution) {
    applySolutionMoves(solution.moves);
  } else {
    alert("لا يمكن إيجاد حل للغز!");
    toggleInteraction(true);
  }
}

function bfsSearch(initialState) {
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
    
    // Get next state from queue
    let current = queue.shift();
    
    // Check if we've reached the goal
    if (arraysEqual(current.board, GOAL_ORDER)) {
      return current; // Solution found
    }
    
    // Generate possible moves
    let possibleMoves = getPossibleMoves(current, false);
    
    // Add new states to queue
    for (let move of possibleMoves) {
      let stateKey = move.board.join(',');
      if (!visited.has(stateKey)) {
        visited.add(stateKey);
        queue.push(move);
      }
    }
  }
  
  return null; // No solution found
}
// UCS Search Algorithm
function solvePuzzleUCS() {
  if (isProcessing) return;
  toggleInteraction(false);
  
  // Get current state
  const currentState = getCurrentBoardState();
  const emptyPos = findEmptyTilePosition(currentState);
  
  // Create initial state object
  let initialState = {
    board: currentState,
    emptyPos: emptyPos,
    moves: [],
    cost: 0  // Track the cost (number of moves)
  };
  
  // UCS search
  let solution = ucsSearch(initialState);
  
  if (solution) {
    applySolutionMoves(solution.moves);
  } else {
    alert("لا يمكن إيجاد حل للغز باستخدام UCS!");
    toggleInteraction(true);
  }
}

function ucsSearch(initialState) {
  // Priority queue for states to explore, sorted by cost
  let priorityQueue = [initialState];
  
  // Set to keep track of visited states
  let visited = new Set();
  visited.add(initialState.board.join(','));
  
  // Maximum number of iterations to prevent infinite loops
  let maxIterations = 100000;
  let iterations = 0;
  
  while (priorityQueue.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Sort by cost (uniform cost search prioritizes lowest cost)
    priorityQueue.sort((a, b) => a.cost - b.cost);
    
    // Get the state with lowest cost
    let current = priorityQueue.shift();
    
    // Check if we've reached the goal
    if (arraysEqual(current.board, GOAL_ORDER)) {
      console.log(`UCS found solution in ${iterations} iterations with ${current.moves.length} moves`);
      return current; // Solution found
    }
    
    // Generate possible moves
    let possibleMoves = getPossibleMoves(current, false);
    
    // Add new states to priority queue
    for (let move of possibleMoves) {
      let stateKey = move.board.join(',');
      
      // Add cost to the new state
      move.cost = current.cost + 1;
      
      if (!visited.has(stateKey)) {
        visited.add(stateKey);
        priorityQueue.push(move);
      }
    }
  }
  
  console.log(`UCS failed after ${iterations} iterations`);
  return null; // No solution found
}

// Update the getPossibleMoves function to work with UCS
// Note: We're using the existing getPossibleMoves function with isForAStar=false
// This already provides the basic structure we need for UCS

// -------------------- Initialization --------------------
window.onload = function() {
  // Ensure starting order is solvable
  imgOrder = generateSolvableOrder(GOAL_ORDER);
  
  // Create board
  createBoard();
  
  // Save initial state
  initialImgOrder = [...imgOrder];
  
  // Enable interactions
  toggleInteraction(true);
  
  // Set up event listeners for buttons
  document.getElementById("shuffle")?.addEventListener("click", shufflePuzzle);
  document.getElementById("solve")?.addEventListener("click", solvePuzzle);
  document.getElementById("solveBFS")?.addEventListener("click", solvePuzzleBFS);
  document.getElementById("initState")?.addEventListener("click", returnToInitialState);
  document.getElementById("solveUCS")?.addEventListener("click", solvePuzzleUCS);
  
  // Log diagnostic info
  console.log("Initial order:", imgOrder);
  console.log("Inversions: " + countInversions(imgOrder));
  console.log("Is solvable: " + (isSolvable(imgOrder) ? "Yes" : "No"));
}
