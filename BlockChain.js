const EventEmitter = require('events')
const fork = require('child_process').fork

const Network = require('./Network')
const User = require('./User')

const genesisCode = '0000000000000000000000000000000000000000000000000000000000000000'

const BlockChain = function(opts) {
  opts = opts || {}

  this.network = opts.network || new Network(opts)
  this.miner = opts.miner || fork('./miner')
  this.user = opts.user || new User(opts)
  
  this.difficulty = opts.difficulty || 4
  if (opts.difficulty === 0) { // Damn truthy/falsey
    this.difficulty = opts.difficulty
  }
  
  this.pendingActions = []

  this.network.on('block', (event) => {
    // console.log('block from network')
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
  
  this.network.on('action', (action) => {
    // console.log('ACTION')
    this.pendingActions.push(action)
  })
}

BlockChain.prototype.__proto__ = EventEmitter.prototype

BlockChain.prototype.join = function(opts) {
  opts = opts || {}

  this.network.start(opts)
    .then(() => {
      if (opts.server) {
        this.network.connect(opts.server)
      }

      if (!this.user.exists()) {
        this.user.create()
      }

      let user = this.user.public()

      if (!this.network.get(user.hash)) {
        this.network.publish({
          type: 'action',
          action: 'create-user',
          value: user.value
        })
      }
      
      if (opts.genesis) {
        let genesis = {
          type: 'block',
          previous: genesisCode,
          difficulty: this.difficulty,
          nonce: 0,
          actions: this.pendingActions
        }
        
        genesis.actions.unshift({
          action: 'transfer-land',
          value: {
            square: '0-0',
            to: user.value.record.key
          }
        })

        this.tip = genesis
        this.miner.send({
          type: 'block',
          body: genesis
        })
      }
      
      if (opts.cb) {

        opts.cb()
      }
    })
    .catch((err) => console.error(err))
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

BlockChain.prototype.view = function() {  
  let view = {
    users: [],
    land: {}
  }
  
  this.walk(block => {    
    for (let action of block.actions) {
      if (action.action == 'create-user') {
        view.users.push(action.value.record)
      }
      
      if (action.action == 'transfer-land') {
        view.land[action.value.square] = {
          owner: action.value.to
        }
      }
    }
  })
  
  return view
}

BlockChain.prototype.walk = function(action) {
  let current = this.tip
  action(current)
  
  while (current.previous != genesisCode) {
    current = this.network.get(current.previous)
    
    action(current)
  }
}

module.exports = BlockChain
