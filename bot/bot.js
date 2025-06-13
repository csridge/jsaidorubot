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

  // Checks
  if (move.flags.includes('c')) score += 50; // check
  if (move.flags.includes('k')) score += 20; // kingside castling
  if (move.flags.includes('q')) score += 20; // queenside castling

  return score;
}
function quiescenceSearch(chess, alpha, beta, isMaximizingPlayer) {
    const standPat = evaluate(chess);

    if (isMaximizingPlayer) {
        if (standPat >= beta) return beta;
        if (alpha < standPat) alpha = standPat;
    } else {
        if (standPat <= alpha) return alpha;
        if (beta > standPat) beta = standPat;
    }

    const captureMoves = chess.moves({ verbose: true }).filter(
        move => move.flags.includes('c') || move.flags.includes('e') // captures and en passant
    );

    for (const move of captureMoves) {
        chess.move(move);
        const score = -quiescenceSearch(chess, alpha, beta, !isMaximizingPlayer);
        chess.undo();

        if (isMaximizingPlayer) {
            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        } else {
            if (score <= alpha) return alpha;
            if (score < beta) beta = score;
        }
    }


    return isMaximizingPlayer ? alpha : beta;
}

// minmax + alpha-beta pruning + sorting moves
function minimax(game, depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
  if (depth === 0 || game.isGameOver()) {
    posEvaluated++;
    return quiescenceSearch(game, alpha, beta, isMaximizing);
  }
  const moves = game.moves({verbose: true});
  const sortedMoves = moves.sort((a, b) => sortMove(b) - sortMove(a));
  if (isMaximizing) {
    let bestEval = -Infinity;
    for (let move of sortedMoves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, false, alpha, beta);
      game.undo();
      bestEval = Math.max(bestEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return bestEval;
  } else {
    let bestEval = Infinity;
    for (let move of sortedMoves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, true, alpha, beta);
      game.undo();
      bestEval = Math.min(bestEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return bestEval;
  }
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
    let evaluation = minimax(game, 0, game.turn() === 'b'); // second param is depth
    game.undo();
    
    console.log(`Evaluation of ${move.san}: ${evaluation}`);
    
    // white wants max, black wants min
    if (game.turn() === 'w' ? (evaluation > bestEval) : (evaluation < bestEval)) {
      bestEval = evaluation;
      bestMove = move;
    }
  }
  
  const timeElapsed = performance.now() - startTime;
  const speed = timeElapsed > 0 ? Math.round(posEvaluated / timeElapsed) : posEvaluated;
  // debugging info
  console.log(`Evaluated ${posEvaluated} positions in ${timeElapsed}ms`);
  console.log(`${Math.round(posEvaluated / (timeElapsed / 1000))} positions/second`);
  document.querySelector('#positions').textContent = `Positions evaluated: ${posEvaluated}`;
  document.querySelector('#time').textContent = `Time: ${timeElapsed}ms`;
  document.querySelector('#speed').textContent = `Speed: ${speed.toLocaleString()} pos/sec`;
  
  console.log(`Evaluated ${posEvaluated} positions in ${timeElapsed}ms (${speed} pos/sec)`);
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