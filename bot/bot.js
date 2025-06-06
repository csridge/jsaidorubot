import { Chess } from 'https://esm.sh/chess.js';
import { evaluate } from './evaluate.js';

const game = new Chess()

export function findBestMove(board) {
  const moves = game.moves(); // all legal moves
  let best_move = null;
  let best_eval = -Infinity
  for (let move of moves){
    board.move(move)
    let evaluation = evaluate(board)
    board.undo()
    if (best_eval === null || evaluation > best_eval){
        best_eval = evaluation
        best_move = move
    }
  }
  return best_move
}

export function makeMove(move){
    game.move(findBestMove(game))
    board.position(game.fen());
}