import { Chess } from 'https://esm.sh/chess.js';
import { makeMove } from './bot/bot.js';
const fen = 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1' // debug purpose only
const chess = new Chess();
// chessboard
const board = Chessboard('board', {
  draggable: true,
  position: 'start',
  animation: 0,
  onDragStart: (source, piece, position, orientation) => {
    if (chess.isGameOver()) return false;
    // Only allow dragging of white pieces
    if (piece.search(/^b/) !== -1) return false;
  },
  onDrop: (source, target) => {
    const piece = chess.get(source);
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
        move = chess.move(moveConfig);
    } catch (e) {
        console.error("Invalid move:", moveConfig, e);
        return 'snapback';
    }
    if (!move) return 'snapback';

    // Update board and info after a legal move
    board.position(chess.fen());
    document.querySelector('#fen').innerText = chess.fen();
    document.querySelector('#pgn').innerText = chess.pgn();

    if (!chess.isGameOver()) {
        window.setTimeout(() => makeMove(chess, board), 250);
    }
},
  onSnapEnd: () => {
    board.position(chess.fen());
    document.querySelector('#fen').innerText = chess.fen();
    document.querySelector('#pgn').innerText = chess.pgn();
  }
});