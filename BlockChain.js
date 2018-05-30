const EventEmitter = require('events')
const fork = require('child_process').fork
const sha256 = require('sha256')

const Network = require('./Network')
const User = require('./User')
const Random = require('./Random')
const Contracts = require('./Contracts')
const pos = require('./pos')

const fastnoise = require('fastnoisejs')

const genesisCode = '0000000000000000000000000000000000000000000000000000000000000000'

const BlockChain = function(opts) {
  opts = opts || {}

  this.network = opts.network || new Network(opts)
  this.miner = opts.miner || fork('./miner')
  this.user = opts.user || new User(opts)
  this.random = opts.random || new Random()

  this.noise = fastnoise.Create(324)
  this.noise.SetNoiseType(fastnoise.Perlin)

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
  if (!this.tip) {
    return {}
  }

  let contracts = new Contracts()

  let view = {
    distance: this.distance(this.tip),
    users: [],
    land: {},
    me: this.user.public().value,
    money: {},
  }

  this.walk((block, index) => {
    this.random.seed(block.previous)

    for (let action of block.actions) {
      if (action.action == 'create-user') {
        view.users.push(action.value.record)
      }

      if (action.action == 'transfer-land') {
        let coords = action.value.square.split(':').map(c => Number(c))
        let x = coords[0]
        let y = coords[1]

        let rand = this.random.random(0, 2)

        let land = {
          owner: action.value.to,
          type: 'grass'
        }

        if (generators.stone(x, y)) {
          land.type = 'stone'
        }

        // TODO: do we need to sub seed another random generator, this would stop future changes re writing history?
        // Could be seeded with # + index?, or we could just new seed for each action...? later problem.

        if (land.type == 'grass') {
          let trees = generators.trees(x, y)

          if (trees) {
            land.trees = 8
          }
        }

        view.land[action.value.square] = land
      }

      if (action.action == 'transfer-money') {
        view.money[action.value.to] = view.money[action.value.to] || 0

        view.money[action.value.to] += action.value.amount
      }

      if (action.action == 'plough') {
        if (index + 10 <= view.distance) {
          view.land[action.value].plouged = true
          if (index + 20 <= view.distance) {
            view.land[action.value].ready = true
          }
        } else {
          view.land[action.value].pending = true
        }
      }

      if (action.action == 'cut-trees') {
        if (index + 8 <= view.distance) {
          delete view.land[action.value].trees
          view.land[action.to].logs = 8
        } else {
          view.land[action.value].trees -= (view.distance - index)
          view.land[action.value].pending = true
          view.land[action.to].logs = 8 - view.land[action.value].trees
        }
      }

      if (action.action == 'move-logs') {
        contracts.move(action.value, 'logs', action.to)
      }

      if (action.action == 'harvest') {
        if (index + 10 <= view.distance) {
          delete view.land[action.value].plouged
          delete view.land[action.value].ready
        } else {
          view.land[action.value].pending = true
        }
      }

      if (action.action == 'build-house') {
        contracts.building(action.value, 'house', { logs: 8 }, index, 4)
        view.land[action.value].contract = true
      }

      if (action.action == 'build-shed') {
        contracts.building(action.value, 'shed', { logs: 4 }, index, 3)
        view.land[action.value].contract = true
      }
    }

    contracts.execute({index, land: view.land})
  })

  view.cash = view.money[view.me.record.key] || 0
  view.contracts = contracts.view()

  return view
}

BlockChain.prototype.walk = function(action) {
  if (!this.tip) return

  let forward = []

  let current = this.tip
  forward.unshift(current)

  while (current.previous != genesisCode) {
    current = this.network.get(current.previous)
    forward.unshift(current)
  }

  for (let travel of forward) {
    action(travel, forward.indexOf(travel))
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

    if (this.distance(this.tip) > 500) {
      block.difficulty = 2
    }
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

BlockChain.prototype.action = function(action) {
  this.pendingActions.push(action)
}

module.exports = BlockChain

function generator(seed, frequency, filter) {
  let noise = fastnoise.Create(seed)

  noise.SetNoiseType(fastnoise.Perlin)
  noise.SetFrequency(frequency)

  return function(x, y) {
    let raw = noise.GetNoise(x, y)
    return filter(raw)
  }
}

let generators = {
  stone: generator(1, 0.1, n => n > 0.5),
  trees: generator(2, 0.024, n => n > 0.03),
  // trees: generator(2, 0.01, n => n > 0.03),
}
