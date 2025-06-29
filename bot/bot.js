import { Chess } from 'https://esm.sh/chess.js';
import { evaluate } from './evaluate.js';

const chess = new Chess()
// presorting moves
function sortMove(move) {
  const pieceValues = { // idk why i need 2
    'p': 100, // pawn
    'n': 320, // knight
    'b': 330, // bishop
    'r': 500, // rook
    'q': 900, // queen
    'k': 20000 // king
  };
  let score = 0;

  // Promotion bonus
  if (move.isPromotion()) {
    score += pieceValues[move.promotion] || 0;
  }

  // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
  if (move.isCapture() || move.isEnPassant()) {
    const capturedPiece = pieceValues[move.captured];
    const capturingPiece = pieceValues[move.piece];
    score += 10 * capturedPiece - capturingPiece;
  }

  if (move.san.includes('+')) score += 30; // check
  if (move.san.includes('O-O')) score += 20; // kingside castling
  if (move.san.includes('#')) score += 32768; // checkmate

  // if (moves.san === "Rb8") score -= 2147483647 // ok dude this is not fun at all
  return score;
}
function quiescenceSearch(game, alpha, beta) {
  if (game.isCheckmate()) return 2147483647;
  if (game.isDraw()) return 0;
  const standPat = evaluate(game);
  let bestValue = standPat;
  if (bestValue >= beta) return bestValue; // beta cutoff
  if (bestValue > alpha) alpha = bestValue; // update alpha

  const moves = game.moves({ verbose: true })
  const captures = moves.filter(
  move => move.flags.includes('c') || move.flags.includes('e')) // filtering captures and en passant
  if (captures.length === 0) return standPat; // if no capture, return static eval
  for (let capture of captures){
    game.move(capture);
    let evaluation = -quiescenceSearch(game, -beta, -alpha); // negate for negamax
    game.undo();
    if (evaluation >= beta) return beta; // beta cutoff
    if (evaluation > bestValue) bestValue = evaluation; // update best eval
    if (evaluation > alpha) alpha = evaluation; // update alpha
  }
  return bestValue;
}

const transpositionTable = new Map(); // map is op
let bestMove = null;

let posEvaluated = 0; // Keep this global

let historyTable = new Array(64)
for (let i = 0; i < historyTable.length; i++){
  historyTable[i] = new Array(64).fill(0)
}

function squareToIndex(square){
  const fileIndex = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rankIndex = 8 - parseInt(square[1], 10);
  return rankIndex * 8 + fileIndex;
}
// Optimizations: Negamax, Alpha-beta pruning, quiescence search, transposition table
function negamax(game, depthLimit, depth = depthLimit, alpha = -Infinity, beta = Infinity) {
  const key = game.hash(); // wtf i remember implemented this before
  if (transpositionTable.has(key)) { // if the position is evaluated before, return instantly
    const entry = transpositionTable.get(key);
    if (entry.depth >= depth) {
      posEvaluated++;
      return entry.evaluation;
    }
  }

  if (depth === 0 || game.isGameOver()) {
    const evaluation = quiescenceSearch(game, alpha, beta); // continue searching for captures
    transpositionTable.set(key, { evaluation: evaluation, depth });
    return evaluation;
  }
  let maxEval = -Infinity;
  const moves = game.moves({ verbose: true });
  const sortedMoves = moves.sort((a, b) => sortMove(b) - sortMove(a));

  // mate check
  const CHECKMATE_SCORE = -32768;
  if (game.isCheckmate()){return CHECKMATE_SCORE + depth;} // mate in 4 is better than mate in 1, so we increase score by depth
  if (game.isDraw()) return 0;
  // main search loop
  for (const move of sortedMoves) {
    game.move(move);
    posEvaluated++;
    const evaluation = -negamax(game, depthLimit, depth - 1, -beta, -alpha); // negate for negamax
    if (depth === depthLimit) console.log(`Depth: ${depth}, Move: ${move.san}, Eval: ${evaluation}`);
    game.undo();

    if (evaluation > maxEval) {
      maxEval = evaluation;
      if (depth === depthLimit) { // if evaluating at the root level, update best move
        bestMove = move;
      }
    }

    alpha = Math.max(alpha, evaluation);
    if (alpha >= beta){
      if (!game.isCapture(move)){
        let from = squareToIndex(move.from);
        let to = squareToIndex(move.to);
        historyTable[from][to] += depth * depth; // history heuristic
      }
      break;
    }
  }

  transpositionTable.set(key, { evaluation: maxEval, depth });
  return maxEval;
}

// not again another function
function iterativeDeepening(game, maxDepth, timeLimit = 5000){
  let start = performance.now()
  let localBestMove = null;
  for (let depth = 1; depth <= maxDepth; depth++){
    if (performance.now() - start > timeLimit) break; // stop if time limit exceeded
    negamax(game, depth)
    localBestMove = bestMove;
  }
  return localBestMove
}

// finding best move
export function makeMove(game, board) {
  const start = performance.now();
  let depth = 3
  bestMove = iterativeDeepening(game, depth, 5000);
  const evaluation = negamax(game, depth)
  const timeElapsed = performance.now() - start;
  const speed = timeElapsed > 0 ? Math.round(posEvaluated / (timeElapsed / 1000)) : posEvaluated;

  // Debug info
  document.querySelector('#ply').textContent = `Depth: ${depth}`;
  document.querySelector('#positions').textContent = `Positions evaluated: ${posEvaluated}`;
  document.querySelector('#time').textContent = `Time: ${timeElapsed.toFixed(2)}ms`;
  document.querySelector('#speed').textContent = `Speed: ${speed.toLocaleString()} pos/sec`;
  document.querySelector('#eval').textContent = `Eval: ${evaluation/100} (pawns)`;

  if (bestMove) {
    game.move(bestMove);
    board.position(game.fen(), false);
    document.querySelector('#fen').innerText = `Game FEN: ${game.fen()}`;
    document.querySelector('#pgn').innerText = game.pgn();
  }
}