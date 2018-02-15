module.exports = function createMiner(opts) {
  let currentBlock = {}
  
  let pendingMoves = []
  let genesis = {}
  let lastBlock = {}
  
  return {
    addMove: function addMove(move) {
      pendingMoves.push(move)
    },
    
    addBlock: function addBlock(block) {
      
    }
  }
}