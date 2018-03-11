const EventEmitter = require('events')
const fork = require('child_process').fork

const Network = require('./Network')

const genesisCode = '0000000000000000000000000000000000000000000000000000000000000000'

const BlockChain = function(opts) {
  opts = opts || {}
  
  this.network = opts.network || new Network(opts)
  this.miner = opts.miner || fork('./miner')
  this.difficulty = opts.difficulty || 4
  
  this.network.on('block', (event) => {    
    if (!this.tip || this.distance(event.block) > this.distance(this.tip)) {
      this.tip = event.block
        
      this.miner.send({
        type: 'block',
        body: {
          type: 'block',
          previous: event.hash,
          difficulty: this.difficulty,
          nonce: 0,
        }
      })
      
      event.source = 'Network'
      this.emit('block', event)
    }
  })
  
  this.miner.on('message', (event) => {
    this.network.publish(event.block)
    
    this.tip = event.block
    this.miner.send({
      type: 'block',
      body: {
        type: 'block',
        previous: event.hash,
        difficulty: this.difficulty,
        nonce: 0,
      }
    })
    
    event.source = 'Miner'
    this.emit('block', event)
  })
}

BlockChain.prototype.__proto__ = EventEmitter.prototype

BlockChain.prototype.join = function(opts) {
  opts = opts || {}
  
  if (opts.genesis) {
    let genesis = {
      type: 'block',
      previous: genesisCode,
      difficulty: this.difficulty,
      nonce: 0
    }
    
    this.tip = genesis
    this.miner.send({
      type: 'block',
      body: genesis
    })
  }
  
  this.network.start(opts)
    .then(() => {
      if (opts.server) {
        this.network.connect(opts.server)
      }
    })
}

BlockChain.prototype.kill = function() {
  this.miner.send({type: 'kill'})
}

BlockChain.prototype.distance = function(block) {
  if (!block) throw new Error('undefined block passed to distance')  
  
  let current = block
  let distance = 0
  
  while (block.previous != genesisCode) {    
    distance++
    let previous = block.previous
    block = this.network.get(previous)
    
    if (!block) {
      // TODO: this should probably just return a really big number
      throw new Error(`Could not find block for previous ${previous}`)
    }
  }
  
  return distance
}

module.exports = BlockChain