import { Chess } from 'https://esm.sh/chess.js';
import { evaluate } from './evaluate.js';

const game = new Chess()
let posEvaluated = 0; // Keep this global

function minimax(game, depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
  if (depth === 0 || game.isGameOver()) {
    posEvaluated++; // Increment here
    return evaluate(game);
  }

  const moves = game.moves({verbose: true});
  if (isMaximizing) {
    let bestEval = -Infinity;
    for (let move of moves) {
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
    for (let move of moves) {
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

export function findBestMove(game) {
  posEvaluated = 0;
  const startTime = performance.now();
  
  const moves = game.moves();
  let bestMove = null;
  
  // Check whose turn it is
  let bestEval = game.turn() === 'w' ? -Infinity : Infinity;
  
  for (let move of moves) {
    game.move(move);
    let evaluation = minimax(game, 3, !game.turn() === 'w'); // Opposite of current player
    game.undo();
    
    console.log(`Evaluation of ${move}: ${evaluation}`);
    
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