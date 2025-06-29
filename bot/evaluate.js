import { Chess } from 'https://esm.sh/chess.js';
console.log('evaluate.js loaded');
const piece_vals = {
    'p': 100, // pawn
    'n': 320, // knight
    'b': 330, // bishop
    'r': 500, // rook
    'q': 900, // queen
    'k': 69420  // king
}
function mirrorPST(pst) { // can also works for the chessboard i think
  const mirrored = [];
  for (let rank = 7; rank >= 0; rank--) {
    const row = pst.slice(rank * 8, (rank + 1) * 8);
    mirrored.push(...row);
  }
  return mirrored;
}

export const psts = {
  'p':[ 
  0,  0,  0,  0,  0,  0,  0,  0,
 20, 20, 20, 20, 20, 20, 20, 20,
  5,  5, 10, 15, 15, 10,  5,  5,
  2,  2,  5, 20, 20,  5,  2,  2,
  0,  0,  0, 10, 10,  0,  0,  0,
 -2, -2, -2,  0,  0, -2, -2, -2,
 -5, -5, -5, -5, -5, -5, -5, -5,
  0,  0,  0,  0,  0,  0,  0,  0
],
  'n':[
-50,-40,-30,-30,-30,-30,-40,-50,
-40,-20,  0,  0,  0,  0,-20,-40,
-30,  0, 10, 15, 15, 10,  0,-30,
-30,  5, 15, 20, 20, 15,  5,-30,
-30,  0, 15, 20, 20, 15,  0,-30,
-30,  5, 10, 15, 15, 10,  5,-30,
-40,-20,  0,  5,  5,  0,-20,-40,
-50,-40,-30,-30,-30,-30,-40,-50,
],
  'b':[
-20,-10,-10,-10,-10,-10,-10,-20,
-10,  0,  0,  0,  0,  0,  0,-10,
-10,  0,  5, 10, 10,  5,  0,-10,
-10,  5,  5, 10, 10,  5,  5,-10,
-10,  0, 10, 10, 10, 10,  0,-10,
-10, 10, 10, 10, 10, 10, 10,-10,
-10,  5,  0,  0,  0,  0,  5,-10,
-20,-10,-10,-10,-10,-10,-10,-20,
],
  'r':[
0,  0,  0,  0,  0,  0,  0,  0,
5, 10, 10, 10, 10, 10, 10,  5,
-5,  0,  0,  0,  0,  0,  0, -5,
-5,  0,  0,  0,  0,  0,  0, -5,
-5,  0,  0,  0,  0,  0,  0, -5,
-5,  0,  0,  0,  0,  0,  0, -5,
-5,  0,  0,  0,  0,  0,  0, -5,
 0,  0,  0,  5,  5,  0,  0,  0],
   'q':[
-20,-10,-10, -5, -5,-10,-10,-20,
-10,  0,  0,  0,  0,  0,  0,-10,
-10,  0,  5,  5,  5,  5,  0,-10,
-5,  0,  5,  5,  5,  5,  0, -5,
 0,  0,  5,  5,  5,  5,  0, -5,
-10,  5,  5,  5,  5,  5,  0,-10,
-10,  0,  5,  0,  0,  0,  0,-10,
-20,-10,-10, -5, -5,-10,-10,-20
],
  'k':[
-30,-40,-40,-50,-50,-40,-40,-30,
-30,-40,-40,-50,-50,-40,-40,-30,
-30,-40,-40,-50,-50,-40,-40,-30,
-30,-40,-40,-50,-50,-40,-40,-30,
-20,-30,-30,-40,-40,-30,-30,-20,
-10,-20,-20,-20,-20,-20,-20,-10,
 20, 20,  0,  0,  0,  0, 20, 20,
 20, 40, 10,  0,  0, 10, 40, 20
]
}

const kingEndgamePST = 
[
-50,-40,-30,-20,-20,-30,-40,-50,
-30,-20,-10,  0,  0,-10,-20,-30,
-30,-10, 20, 30, 30, 20,-10,-30,
-30,-10, 30, 40, 40, 30,-10,-30,
-30,-10, 30, 40, 40, 30,-10,-30,
-30,-10, 20, 30, 30, 20,-10,-30,
-30,-30,  0,  0,  0,  0,-30,-30,
-50,-30,-30,-30,-30,-30,-30,-50
]

const originalKingPST = psts['k']
const SQUARES = [
    'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
    'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
    'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
    'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
    'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
    'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
    'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
    'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1']

function isEndgame(whiteScore, blackScore){
  return (whiteScore + blackScore) < 2600 // endgame is considered when each player has less than
                                          // 13 points of material(in this case 1300 centipawns)
                                          // 1300 + 1300 = 2600 centipawns
}

// maybe this isnt neccessary yet...
// function setKingPST(board){
//   let whiteMaterial = 0; // these two variables is for pure material evaluation(no psts)
//   let blackMaterial = 0; // read above
// 
//   for (let idx = 0; idx < SQUARES.length; idx++) {
//       let square = SQUARES[idx];
//       let piece = board.get(square);
//       if (!piece || piece.type === "k") continue; // skip empty squares
//       let val = piece_vals[piece.type]
// 
//       if (piece.color === 'w'){
//         whiteMaterial += val;
//       }
//       else if (piece.color === 'b'){
//         blackMaterial += val;
//       }
//   }
//  
//   if (isEndgame(whiteMaterial, blackMaterial)){
//     psts['k'] = kingEndgamePST;
//   }
//   else {
//     psts['k'] = originalKingPST
//   }
//   return 0;
// }
export function evaluate(board){
  if (board.isCheckmate()) return 2147483647;
  if (board.isDraw()) return 0;
  let white = 0; // white score with PSTs included
  let black = 0; // black score with PSTs included
  // setKingPST(board);
  for (let idx = 0; idx < SQUARES.length; idx++) {
      let square = SQUARES[idx];
      let piece = board.get(square);
      if (!piece) continue; // skip empty squares
      let index = piece.color === 'w' ? idx : 63 - idx;
      let val = piece_vals[piece.type] + psts[piece.type][index]; 

      if (piece.color === 'w'){
        white += val;
      }
      else if (piece.color === 'b'){
        black += val;
      }
  }
  return white - black;
}

