import { Chess } from 'https://esm.sh/chess.js';
import { makeMove } from './bot/bot.js';
const game = new Chess();
// chessboard
const board = Chessboard('board', {
  draggable: true,
  position: 'start',
  onDragStart: (source, piece, position, orientation) => {
    if (game.isGameOver()) return false;
    // Only allow dragging of white pieces
    if (piece.search(/^b/) !== -1) return false;
  },
  onDrop: (source, target) => {
    const piece = game.get(source);
    let moveConfig = { from: source, to: target };
    if (
      piece &&
      piece.type === 'p' &&
      ((piece.color === 'w' && target[1] === '8') ||
       (piece.color === 'b' && target[1] === '1'))
    ) {
      moveConfig.promotion = 'q';
    }
    let move;
    try {
        move = game.move(moveConfig);
    } catch (e) {
        console.error("Invalid move:", moveConfig, e);
        return 'snapback';
    }
    if (!move) return 'snapback';

    // Update board and info after a legal move
    board.position(game.fen());
    document.querySelector('#fen').innerText = game.fen();
    document.querySelector('#pgn').innerText = game.pgn();

    if (!game.isGameOver()) {
        window.setTimeout(() => makeMove(game, board), 250);
    }
},
  onSnapEnd: () => {
    board.position(game.fen());
    document.querySelector('#fen').innerText = game.fen();
    document.querySelector('#pgn').innerText = game.pgn();
  }
});
