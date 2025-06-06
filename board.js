import { Chess } from 'https://esm.sh/chess.js'
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
    // Detect if this is a pawn promotion
    const piece = game.get(source);
    let moveConfig = { from: source, to: target };
    if (
      piece &&
      piece.type === 'p' &&
      ((piece.color === 'w' && target[1] === '8') ||
       (piece.color === 'b' && target[1] === '1'))
    ) {
      moveConfig.promotion = 'q'; // promote to queen
    }
    let move;
    try {
        move = game.move(moveConfig);
    } catch (e) {
        console.error("Invalid move:", moveConfig, e);
        return 'snapback'; // Don't crash, just snap back
    }
    if (!move) return 'snapback'; // just please fucking continue to play
    if (!game.isGameOver()) {
      window.setTimeout(makeMove, 250);
    }
},
  onSnapEnd: () => {
    board.position(game.fen());
  }
});

const piece_vals = {
    'p': 1, // pawn
    'n': 3, // knight
    'b': 3, // bishop
    'r': 5, // rook
    'q': 9, // queen
    'k': 69420  // king
}
const SQUARES = [
    'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
    'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
    'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
    'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
    'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
    'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
    'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
    'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'
    // thanks ai for writing every square for me
]
function evaluate(board){
    let white = 0;
    let black = 0;
    for (let square of SQUARES){
        let piece = board.get(square);
        if (!piece) continue; // skip empty squares
        let val = piece_vals[piece.type];
        if (piece.color === 'w'){
            white += val;
        }
        else if (piece.color === 'b'){
            black += val;
        }
    }
    // You may want to return the evaluation
    return white - black;
}
// Random black move function

function findBestMove(board) {
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

function makeMove(move){
    game.move(findBestMove(game))
}