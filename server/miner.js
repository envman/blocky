const sha256 = require('sha256')
const fork = require('child_process').fork
const EventEmitter = require('events')

const genesisCode = '0000000000000000000000000000000000000000000000000000000000000000'
const difficulty = 3

module.exports = function createMiner(opts) {
  let pendingMoves = []
  let tip
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
    setTip(opts.store.add(genesis))
  }
  
  let forked = fork('./solver')
  
  forked.on('message', (msg) => {
    console.log('Block was solved ', hash(msg), `Previous: ${msg.previous}`)
    
    setTip(hash(msg))
    opts.store.add(msg)
    emitter.emit('block', tip)
    
    // console.log(`Attempt to append block to ${tip}`)
    forked.send({
      type: 'block',
      body: createBlock(tip, pendingMoves),
    })
  })

  if (tip) {
    console.log('got tip send')
    
    setTimeout(() => {
      console.log('time')
      forked.send({
        type: 'block',
        body: createBlock(tip, pendingMoves),
      })      
    }, 5000)

  }
  
  function setTip(hash) {
    if (!hash) throw `Can not add invalid tip ${hash}`
    
    tip = hash
  }
  
  return {
    addMove: function addMove(move) {
      pendingMoves.push(move)
    },
    
    addBlock: function addBlock(block) {
      // TODO: check block is valid (hash & contents)
      console.log(`Received Block ${hash(block)} Previous: ${block.previous}`)
      // console.log(`Current Tip ${tip}`)
      
      if (!tip) {
        setTip(hash(block))
        
        forked.send({
          type: 'block',
          body: createBlock(tip, pendingMoves),
        })
        
        return
      }
      
      let current = opts.store.get(tip)
      let proposed = block
      
      let currentDistance = distance(current, opts.store)
      let proposedDistance = distance(proposed, opts.store)
      console.log(`Current Distance: ${currentDistance} Proposed Distance ${proposedDistance}`)
      
      if (distance(current, opts.store) < distance(proposed, opts.store)) {
        console.log(`Current Distance less than proposed`)
        
        setTip(hash(proposed))
        
        forked.send({
          type: 'block',
          body: createBlock(tip, pendingMoves),
        })
      }
    },
    
    stop: function stop() {
      forked.message({type: 'kill'})
    },
    
    chain: function() {
      let block = opts.store.get(tip)
      let chain = []
      
      while (block.previous != genesisCode) {
        chain.push({
          hash: hash(block),
          previous: block.previous,
          actions: block.actions,
        })
        
        block = opts.store.get(block.previous)
      }
      
      chain.push({
        hash: hash(block),
        previous: block.previous,
        actions: block.actions,
      })
      
      return chain
    },
    
    emitter: emitter
  }
}

function createBlock(previous, actions) {
  // console.log(`Create Block Previous: ${previous}`)
  
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
    // console.log(`Previous  ${block.previous} ${store.get(block.previous)}`)
    
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