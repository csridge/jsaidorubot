import { Chess } from 'https://esm.sh/chess.js';
import { evaluate } from './evaluate.js';
const game = new Chess()


// minimax algorithm
function minimax(game, depth, isMaximizing) {
  if (depth === 0 || game.isGameOver()) {
    return evaluate(game);
  }

  const moves = game.moves();
  if (isMaximizing) {
    let bestEval = -Infinity;
    for (let move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, false);
      game.undo();
      bestEval = Math.max(bestEval, evaluation);
    }
    return bestEval;
  } else {
    let bestEval = Infinity;
    for (let move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, true);
      game.undo();
      bestEval = Math.min(bestEval, evaluation);
    }
    return bestEval;
  }
}
export function findBestMove(game) {
  const moves = game.moves();
  let best_move = null;
  let best_eval = -Infinity;
  for (let move of moves) {
    game.move(move);
    let evaluation = minimax(game, 2, false);
    game.undo();
    if (evaluation > best_eval) {
      best_eval = evaluation;
      best_move = move;
    }
  }
  return best_move;
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
