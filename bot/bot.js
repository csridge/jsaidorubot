import { Chess } from 'https://esm.sh/chess.js';
import { evaluate } from './evaluate.js';

const chess = new Chess()
let posEvaluated = 0; // Keep this global
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
  if (move.promotion) {
    score += pieceValues[move.promotion] || 0;
  }

  // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
  if (move.captured) {
    const capturedPiece = pieceValues[move.captured];
    const capturingPiece = pieceValues[move.piece];
    score += 10 * capturedPiece - capturingPiece;
  }

  if (move.flags.includes('c')) score += 50; // check
  if (move.flags.includes('k')) score += 20; // kingside castling
  if (move.flags.includes('q')) score += 20; // queenside castling
  if (move.san.includes('#')) score += 2147483647; // checkmate lol

  // if (moves.san === "Rb8") score -= 2147483647 // ok dude this is not fun at all
  return score;
}
function quiescenceSearch(game, alpha, beta, depth = 5) {
  if (depth <= 0 || game.isGameOver()) return evaluate(game);
  const standPat = evaluate(game); // in case there are no captures
  if (standPat >= beta) return beta; // if stand pat < beta, return beta as the lower bound
  if (standPat > alpha) alpha = standPat; // if stand pat > alpha, update alpha as the upper bound

  const captures = game.moves({ verbose: true }).filter(
    move => move.flags.includes('c') || move.flags.includes('e')
  ); // filtering captures(including en passant) and checks

  for (const move of captures) {
    game.move(move);
    // continue searching even if the depth reached 0 to ensure the position is quiet
    // negate for negamax
    const score = -quiescenceSearch(game, -beta, -alpha, depth - 1);
    game.undo();

    if (score >= beta) return beta; // same as above, returning lower bound
    if (score > alpha) alpha = score; // same as above, updating upper bound 
  }

  return alpha; // return the best score found
}

// negamax + alpha-beta pruning + sorting moves
// for some reason this is working very slowly, even with all the optimizations
// im trying to figure out why
const transpositionTable = new Map();
const depthLimit = 3;
let bestMove = null;

// Optimizations: Negamax, Alpha-beta pruning, quiescence search, transposition table
function negamax(game, depth = depthLimit, alpha = -Infinity, beta = Infinity) {
  const key = game.hash(); // wtf i remember implemented this before
  if (transpositionTable.has(key)) { // if the position is evaluated before, return instantly
    const entry = transpositionTable.get(key);
    if (entry.depth >= depth) {
      posEvaluated++;
      return entry.evaluation;
    }
  }

  if (depth === 0 || game.isGameOver()) {
    const evaluation = quiescenceSearch(game, alpha, beta);
    transpositionTable.set(key, { evaluation: evaluation, depth });
    return evaluation;
  }

  let maxEval = -Infinity;
  const moves = game.moves({ verbose: true });
  const sortedMoves = moves.sort((a, b) => sortMove(b) - sortMove(a));

  for (const move of sortedMoves) {
    game.move(move);
    posEvaluated++;
    const evaluation = -negamax(game, depth - 1, -beta, -alpha); // negate for negamax
    if (depth === depthLimit) console.log(`Move: ${move.san}, Eval: ${evaluation}`);
    game.undo();

    if (evaluation > maxEval) {
      maxEval = evaluation;
      if (depth === depthLimit) { // if evaluating at the root level, update best move
        bestMove = move;
      }
    }

    alpha = Math.max(alpha, evaluation);
    if (alpha >= beta) break;
  }

  transpositionTable.set(key, { evaluation: maxEval, depth });
  return maxEval;
}

// not again another function
function iterativeDeepening(game, maxDepth = 3, timeLimit = 6942){
  
}

// finding best move
export function makeMove(game, board) {
  posEvaluated = 0;
  bestMove = null;

  const startTime = performance.now();
  const evaluation = negamax(game, depthLimit);
  const timeElapsed = performance.now() - startTime;
  const speed = timeElapsed > 0 ? Math.round(posEvaluated / (timeElapsed / 1000)) : posEvaluated;

  // Debug info
  document.querySelector('#positions').textContent = `Positions evaluated: ${posEvaluated}`;
  document.querySelector('#time').textContent = `Time: ${timeElapsed.toFixed(2)}ms`;
  document.querySelector('#speed').textContent = `Speed: ${speed.toLocaleString()} pos/sec`;
  document.querySelector('#eval').textContent = `Eval: ${evaluation}`;

  if (bestMove) {
    game.move(bestMove);
    board.position(game.fen());
    document.querySelector('#fen').innerText = game.fen();
    document.querySelector('#pgn').innerText = game.pgn();
  }
}
