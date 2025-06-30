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
  if (move.isKingsideCastle() || move.isQueensideCastle()) score += 20; // kingside castling
  if (move.san.includes('#')) score += 32768; // checkmate

  // if (moves.san === "Rb8") score -= 2147483647 // ok dude this is not fun at all
  score += historyTable[squareToIndex(move.from)][squareToIndex(move.to)];
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
function negamax(game, depthLimit, timeLimitMs = 5000, startTime = performance.now(), depth = depthLimit, alpha = -Infinity, beta = Infinity) 
{
  let maxEval = -Infinity;
  let bestMove = null;
  const key = game.hash(); // wtf i remember implemented this before
  if (transpositionTable.has(key)) { // if the position is evaluated before, return instantly
    const entry = transpositionTable.get(key);
    if (entry.depth >= depth) {
      posEvaluated++;
      return entry.evaluation;
    }
  }
  const CHECKMATE_SCORE = 32768;
  if (game.isCheckmate()){return -CHECKMATE_SCORE + depth;} // mate in 4 is better than mate in 1, so we increase score by depth
  if (game.isDraw() || game.isThreefoldRepetition()) return 0;

  if (depth === 0) {
    const evaluation = quiescenceSearch(game, alpha, beta); // continue searching for captures
    transpositionTable.set(key, { 
      evaluation: evaluation, 
      depth: depth });
    return { evaluation: evaluate(game), move: bestMove };
  }
  const moves = game.moves({ verbose: true });
  const sortedMoves = moves.sort((a, b) => sortMove(b) - sortMove(a));

  // main search loop
  for (const move of sortedMoves) {
    if (performance.now() - startTime >= timeLimitMs){
      console.log("Time limit exceeded");
      return { evaluation: maxEval, move: bestMove };;
    }
    game.move(move);
    posEvaluated++;
    const result = negamax(game, depthLimit, 5000, performance.now(), depth - 1, -beta, -alpha); // negate for negamax
    const evaluation = -result.evaluation;
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
      if (!move.isCapture(move)){
        let from = squareToIndex(move.from);
        let to = squareToIndex(move.to);
        historyTable[from][to] += depth * depth; // history heuristic
      }
      break;
    }
  }

  transpositionTable.set(key, { 
    evaluation: maxEval, 
    depth: depth });
  return { evaluation: maxEval, move: bestMove };
}

// not again another function
function iterativeDeepening(game, maxDepth, timeLimit = 5000){
  let start = performance.now()
  let bestMove = null;
  let evaluation = null;
  for (let depth = 1; depth <= maxDepth; depth++){
    if (performance.now() - start > timeLimit){
      return bestMove;
    }; // stop if time limit exceeded
    let result = negamax(game, depth, timeLimit, start);
    evaluation = result.evaluation;
    bestMove = result.move;
  }
  return { evaluation: evaluation, move: bestMove }; // return the best move found
}

// finding best move
export function makeMove(game, board) {
  const start = performance.now();
  let depth = 3
  const result = iterativeDeepening(game, depth, 5000);
  const evaluation = result.evaluation;
  const bestMove = result.move;
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
    document.querySelector('#pgn').innerText = game.pgn({maxWidth: 0 });
  }
}