const EventEmitter = require('events')
const fork = require('child_process').fork
const sha256 = require('sha256')

const Network = require('./Network')
const User = require('./User')
const Random = require('./Random')
const pos = require('./pos')

const genesisCode = '0000000000000000000000000000000000000000000000000000000000000000'

const BlockChain = function(opts) {
  opts = opts || {}

  this.network = opts.network || new Network(opts)
  this.miner = opts.miner || fork('./miner')
  this.user = opts.user || new User(opts)
  this.random = opts.random || new Random()

  this.difficulty = opts.difficulty || 4
  if (opts.difficulty === 0) { // Damn truthy/falsey
    this.difficulty = opts.difficulty
  }

  this.pendingActions = []

  this.network.on('block', (event) => {
    if (!this.tip || this.distance(event.block) > this.distance(this.tip)) {
      this.tip = event.block

      this.updateMiner(event.hash)

      event.source = 'Network'
      this.emit('block', event)
    }
  })

  this.miner.on('message', (event) => {
    this.network.publish(event.block)

    this.tip = event.block
    this.updateMiner(event.hash)

    event.source = 'Miner'
    this.emit('block', event)
  })

  this.network.on('action', (action) => {
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
        this.updateMiner(genesisCode)
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
    distance: this.distance(this.tip),
    users: [],
    land: {},
    me: this.user.public().value,
    money: {}
  }

  this.walk(block => {
    this.random.seed(block.previous)

    for (let action of block.actions) {
      if (action.action == 'create-user') {
        view.users.push(action.value.record)
      }

      if (action.action == 'transfer-land') {
        let rand = this.random.random(0, 2)

        view.land[action.value.square] = {
          owner: action.value.to,
          type: rand == 0 ? 'grass' : 'stone'
        }
      }

      if (action.action == 'transfer-money') {
        view.money[action.value.to] = view.money[action.value.to] || 0

        view.money[action.value.to] += action.value.amount
      }
    }
  })

  view.cash = view.money[view.me.record.key] || 0

  return view
}

BlockChain.prototype.walk = function(action) {
  if (!this.tip) return

  let current = this.tip
  action(current)

  while (current.previous != genesisCode) {
    current = this.network.get(current.previous)

    action(current)
  }
}

BlockChain.prototype.actions = function() {
  let included = []

  this.walk(block => {
    for (let action of block.actions) {
      included.push(sha256.x2(JSON.stringify(action)))
    }
  })

  let todo = this.pendingActions.filter(a => {
    let hash = sha256.x2(JSON.stringify(a))

    return included.indexOf(hash) < 0
  })

  return todo
}

BlockChain.prototype.updateMiner = function(previous) {
  let block = {
    type: 'block',
    previous: previous,
    difficulty: this.difficulty,
    nonce: 0,
    actions: this.actions()
  }

  let user = this.user.public()
  let nextLand

  if (this.tip) {
    nextLand = this.nextLand(this.distance(this.tip))
  } else {
    nextLand = this.nextLand(-1)
  }

  block.actions.unshift({
    action: 'transfer-land',
    value: {
      square: nextLand,
      to: user.value.record.key
    }
  })

  block.actions.unshift({
    action: 'transfer-money',
    value: {
      to: user.value.record.key,
      amount: 1000
    }
  })

  this.miner.send({
    type: 'block',
    body: block
  })
}

BlockChain.prototype.nextLand = function(distance) {
  let coords = pos(distance + 1)
  return `${coords.x}:${coords.y}`
}

module.exports = BlockChain
