// Initialization
let zobristTable = new Array(8) // 8 for 8 ranks on the chessboard
for (let i = 0; i < 8; i++){
  zobristTable[i] = new Array(8) // 8 for 12 types of pieces(6 for each color)
}
for(let i = 0; i < 8; i++){
    for(let j = 0; j < 8; j++){
        zobristTable[i][j] = new Array(12);
    }
}

// get a random 64-bit number(BigInt)
function randomInt64() {
  const array = new Uint32Array(2); // 2 * 32-bit = 64 bits
  crypto.getRandomValues(array);
  return (BigInt(array[0]) << 32n) | BigInt(array[1]);
}

// initialize the table
function initTable(){ // heck, nested nested for loop
  for (let i = 0; i < 8; i++){
    for (let j = 0; j < 8; j++){
      for (let k = 0; k < 12; k++){
        zobristTable[i][j][k] = randomInt64()
      }
    }
  }
}

const pieceIndexMap = {
  w: { p: 0, n: 1, b: 2, r: 3, q: 4, k: 5 },
  b: { p: 6, n: 7, b: 8, r: 9, q: 10, k: 11 }
};
function getPieceIndex(type, color){
  return pieceIndexMap[color][type]
}
// Main hash function
function zobrist(game){
  const board = game.board
  let hash = 0n
  for (let rank = 0; rank <8; rank++){
    for (let file = 0; file < 8; file++){
      const piece = board[rank][file]
      if (piece && piece.type && piece.color){
        const index = getPieceIndex(piece.type, piece.color)
        hash ^= zobristTable[rank][file][index]
      }
    }
  }
  return hash
}
initTable()