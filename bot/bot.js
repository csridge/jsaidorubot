import { Chess } from 'https://esm.sh/chess.js';
import { evaluate } from './evaluate.js';

export function findBestMove(game) {
  const moves = game.moves();
  let best_move = null;
  let best_eval = -Infinity;
  for (let move of moves) {
    game.move(move);
    let evaluation = evaluate(game);
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
