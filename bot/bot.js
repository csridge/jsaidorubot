import { Chess } from 'https://esm.sh/chess.js';
import { evaluate } from './evaluate.js';

const chess = new Chess()
let posEvaluated = 0; // Keep this global
// presorting moves
function sortMove(moves) {
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
  if (moves.promotion) {
    score += pieceValues[moves.promotion] || 0;
  }

  // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
  if (moves.captured) {
    const capturedPiece = pieceValues[moves.captured];
    const capturingPiece = pieceValues[moves.piece];
    score += 10 * capturedPiece - capturingPiece;
  }

  if (moves.flags.includes('c')) score += 50; // check
  if (moves.flags.includes('k')) score += 20; // kingside castling
  if (moves.flags.includes('q')) score += 20; // queenside castling

  return score;
}
function quiescenceSearch(game, alpha, beta, depth = 5) {
  if (depth <= 0 || game.isGameOver()) return evaluate(game);
  const standPat = evaluate(game);

  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;

  const captures = game.moves({ verbose: true }).filter(
    move => move.flags.includes('c') || move.flags.includes('e') || move.san.includes('+')
  );

  for (const move of captures) {
    game.move(move);
    const score = -quiescenceSearch(game, -beta, -alpha, depth - 1);
    game.undo();

    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  return alpha;
}
// transposition table helper func
function getTranspositionKey(game) {
  return game.fen(); // using FEN as a key
}

// negamax + alpha-beta pruning + sorting moves
const transpositionTable = new Map();
function negamax(game, depth, alpha=-Infinity, beta=Infinity) {
  const key = getTranspositionKey(game);
  if (transpositionTable.has(key)) { // if position is evaluated b4
    const entry = transpositionTable.get(key);
    if (entry.depth >= depth) {
      posEvaluated++;
      return entry.evaluation; // return cached eval
    }
  }
  if (depth === 0 || game.isGameOver()) {
    const evaluation = quiescenceSearch(game, alpha, beta);
    transpositionTable.set(key, { evaluation: evaluation, depth });
    return evaluation
  }

  let maxEval = -Infinity;
  const moves = game.moves({ verbose: true });
  const sortedMoves = moves.sort((a, b) => sortMove(b) - sortMove(a));
  for (const move of sortedMoves) {
    game.move(move);
    posEvaluated++;
    const evaluation = -negamax(game, depth - 1, -beta, -alpha);
    game.undo();

    maxEval = Math.max(maxEval, evaluation);
    alpha = Math.max(alpha, evaluation);
    if (alpha >= beta) break;
  }
  transpositionTable.set(key, { eval: maxEval, depth });
  return maxEval;
}


// finding best move
export function findBestMove(game) {
  posEvaluated = 0;
  const startTime = performance.now();
  
  const moves = game.moves({verbose: true});
  let bestMove = null;
  
  // check whose turn it is
  let bestEval = game.turn() === 'w' ? -Infinity : Infinity;
  
  for (let move of moves) {
    game.move(move);
    let evaluation = negamax(game, 2, -1); // second param is depth
    game.undo();
    
    console.log(`Evaluation of ${move.san}: ${evaluation}`);
    
    // white wants max, black wants min
    if (game.turn() === 'w' ? (evaluation > bestEval) : (evaluation < bestEval)) {
      bestEval = evaluation;
      bestMove = move;
    }
  }
  
  const timeElapsed = performance.now() - startTime;
  const speed = timeElapsed > 0 ? Math.round(posEvaluated / (timeElapsed/1000)) : posEvaluated;
  // debugging info
  document.querySelector('#positions').textContent = `Positions evaluated: ${posEvaluated}`;
  document.querySelector('#time').textContent = `Time: ${timeElapsed.toFixed(2)}ms`;
  document.querySelector('#speed').textContent = `Speed: ${speed.toLocaleString()} pos/sec`;
  
  console.log(`Evaluated ${posEvaluated} positions in ${timeElapsed}ms (${speed} pos/sec)`);
  document.querySelector('#eval').textContent = `Eval: ${bestEval}`;
  return bestMove;
}
export function makeMove(game, board) {
  const move = findBestMove(game);
  if (move) {
    game.move(move);
    board.position(game.fen());
    document.querySelector('#fen').innerText = game.fen();
    document.querySelector('#pgn').innerText = game.pgn();
  }
}