const sha256 = require('sha256')
const fork = require('child_process').fork
const EventEmitter = require('events')

const genesisCode = '0000000000000000000000000000000000000000000000000000000000000000'
const difficulty = 4

module.exports = function createMiner(opts) {
  let pendingMoves = []
  let tip = genesisCode
  let emitter = new EventEmitter()
  
  if (!opts.genesis) {
    let genesis = {
      type: 'block',
      previous: genesisCode,
      difficulty: difficulty,
      nonce: 0,
      actions: []
    }
    
    solve(genesis)
    tip = opts.store.add(genesis)
  }
  
  let process = fork('./solver')
  
  process.on('message', (msg) => {
    console.log('Block was solved ', hash(msg))
    
    tip = hash(msg)
    opts.store.add(msg)
    emitter.emit('block', msg)
    
    process.send({
      type: 'block',
      body: createBlock(tip, pendingMoves),
    })
  })
  
  process.send({
    type: 'block',
    body: createBlock(tip, pendingMoves),
  })
  
  return {
    addMove: function addMove(move) {
      pendingMoves.push(move)
    },
    
    addBlock: function addBlock(block) {
      // TODO: check block is valid (hash & contents)
      
      let current = opts.store.get(tip)
      let proposed = block
      
      if (distance(current, store) < distance(proposed, store)) {
        tip = hash(proposed)
        
        process.message({
          type: 'block',
          body: createBlock(tip, pendingMoves),
        })
      }
    },
    
    stop: function stop() {
      process.message({type: 'kill'})
    },
    
    emitter
  }
}

function createBlock(previous, actions) {
  return {
    type: 'block',
    previous: previous,
    difficulty: difficulty,
    nonce: 0,
    actions: actions
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