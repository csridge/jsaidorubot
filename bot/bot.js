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
  if (move.promotion) {
    score += pieceValues[move.promotion] || 0;
  }

  // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
  if (move.captured) {
    const capturedPiece = pieceValues[move.captured];
    const capturingPiece = pieceValues[move.piece];
    score += 10 * capturedPiece - capturingPiece;
  }

  if (move.san.includes('+')) score += 30; // check
  if (move.san.includes('O-O')) score += 20; // kingside castling
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

const transpositionTable = new Map(); // map is op
let bestMove = null;

// Optimizations: Negamax, Alpha-beta pruning, quiescence search, transposition table
let posEvaluated = 0; // Keep this global
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

  const DEPTH_REDUCTION_VALUE = 2;
  if (!game.isCheck() && depth >= DEPTH_REDUCTION_VALUE + 1){
    game.setTurn('w'); // because the bot only plays as black
    const evaluation = -negamax(game, depthLimit, depth - 1 - DEPTH_REDUCTION_VALUE, -beta, -alpha);
    game.setTurn('b');
    if (evaluation > beta){
      return beta; // beta cutoff
    }
  }
  let maxEval = -Infinity;
  const moves = game.moves({ verbose: true });
  const sortedMoves = moves.sort((a, b) => sortMove(b) - sortMove(a));

  // mate check
  const CHECKMATE_SCORE = -2147483647
  if (game.isCheckmate()){return CHECKMATE_SCORE + depth;} // mate in 4 is better than mate in 1, so we increase score by depth

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
    if (alpha >= beta) break;
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
  document.querySelector('#eval').textContent = `Eval: ${evaluation}`;

  if (bestMove) {
    game.move(bestMove);
    board.position(game.fen(), false);
    document.querySelector('#fen').innerText = game.fen();
    document.querySelector('#pgn').innerText = game.pgn();
  }
}