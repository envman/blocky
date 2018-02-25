const sha256 = require('sha256')
const fork = require('child_process').fork
const EventEmitter = require('events')

const genesisCode = '0000000000000000000000000000000000000000000000000000000000000000'
const difficulty = 3

module.exports = function createMiner(opts) {
  // let pendingMoves = []
  let tip
  let emitter = new EventEmitter()
  
  if (!opts.genesis) {
    let genesis = {
      type: 'block',
      previous: genesisCode,
      difficulty: difficulty,
      turn: 0,
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
      body: createBlock(opts.store.get(tip), pendingMoves(opts.store, tip)),
    })
  })

  if (tip) {    
    setTimeout(() => {
      forked.send({
        type: 'block',
        body: createBlock(opts.store.get(tip), pendingMoves(opts.store, tip)),
      })      
    }, 5000)

  }
  
  function setTip(hash) {
    if (!hash) throw `Can not add invalid tip ${hash}`
    
    tip = hash
  }
  
  return {
    addBlock: function addBlock(block) {
      // TODO: check block is valid (hash & contents)
      console.log(`Received Block ${hash(block)} Previous: ${block.previous}`)
      // console.log(`Current Tip ${tip}`)
      
      if (!tip) {
        setTip(hash(block))
        
        forked.send({
          type: 'block',
          body: createBlock(opts.store.get(tip), pendingMoves(opts.store, tip)),
        })
        
        return
      }
      
      let current = opts.store.get(tip)
      let proposed = block
      
      let currentDistance = distance(current, opts.store)
      let proposedDistance = distance(proposed, opts.store)
      // console.log(`Current Distance: ${currentDistance} Proposed Distance ${proposedDistance}`)
      
      if (distance(current, opts.store) < distance(proposed, opts.store, tip)) {
        // console.log(`Current Distance less than proposed`)
        
        setTip(hash(proposed))
        
        forked.send({
          type: 'block',
          body: createBlock(opts.store.get(tip), pendingMoves(opts.store, tip)),
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
          turn: block.turn,
        })
        
        block = opts.store.get(block.previous)
      }
      
      chain.push({
        hash: hash(block),
        previous: block.previous,
        actions: block.actions,
        turn: block.turn,
      })
      
      return chain
    },
    
    emitter: emitter
  }
}

function crawl(start, store, action) {
  let current = store.get(start)
  
  while (current) {
    action(current)
    
    current = store.get(current.previous)
  }
}

function pendingMoves(store, tip) {
  let doneActions = []
  crawl(hash(tip), store, block => {
    doneActions.push(...block.actions.map(a => hash(a)))
  })
  
  // console.log('store', store.all())
  // console.log(doneActions)
  let pend = store.all()
    .filter(o => o.data)
    .filter(o => o.data.type == 'action')
    .filter(a => doneActions.indexOf(a.hash) < 0)
    
  // console.log('pend', pend)
  
  return pend
}

function createBlock(previous, actions) {
  // console.log(`Create Block Previous: ${previous}`)
  
  return {
    type: 'block',
    previous: hash(previous),
    difficulty: difficulty,
    turn: previous.turn + 1,
    nonce: 0,
    actions: actions
  }
}

function distance(block, store) {
  if (!block) throw new Error('undefined block passed to distance')
  
  let current = block
  let distance = 0
  
  while (block.previous != genesisCode) {
    // console.log(`Previous  ${block.previous} ${store.get(block.previous)}`)
    
    distance++
    let previous = block.previous
    block = store.get(previous)
    
    if (!block) {
      throw new Error(`Could not find block for previous ${previous}`)
    }
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