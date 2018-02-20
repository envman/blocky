const sha256 = require('sha256')

const genesisCode = '0000000000000000000000000000000000000000000000000000000000000000'

module.exports = function createMiner(opts) {
  let currentBlock = {}
  
  let pendingMoves = []
  let genesis = {}
  
  let tips = []
  
  if (!opts.genesis) {
    let genesis = {
      type: 'block',
      previous: genesisCode,
      difficulty: 2,
      nonce: 0,
      actions: []
    }
    
    solve(genesis)
    let hash = opts.store.add(genesis)
    
    console.log(`Genesis block created ${hash}`)
    lastBlock = hash
    tips.push(genesis)
  }
  
  return {
    addMove: function addMove(move) {
      pendingMoves.push(move)
    },
    
    addBlock: function addBlock(block) {
      // TODO: check block is valid (hash & contents)
      
      let current = tips[0]
      let proposed = block
      
      if (distance(current, store) < distance(proposed, store)) {
        tips[0] = proposed
      }
    },
    
    getLongest: function getLongest() {
      return tips[0]
    },
  }
}

function distance(block, store) {
  let current = block
  let distance = 0
  
  while (block.previous != genesisCode) {
    distance++
    block = store.get(block.previous)
  }
  
  return distance
}

function solve(block) {  
  let attempt = hash(block)
  
  while (!isSolution(attempt, block.difficulty)) {
    block.nonce++
    attempt = hash(block)
  }
}

function isSolution(attempt, difficulty) {
  return attempt.startsWith(Array(difficulty + 1).join("0"))
}

function hash(block) {
  return sha256.x2(JSON.stringify(block))
}