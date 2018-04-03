const EventEmitter = require('events')
const assert = require('assert')

const FakeMiner = require('./framework/FakeMiner')
const FakeNetwork = require('./framework/FakeNetwork')
const blockFactory = require('./framework/fake_block_factory')

const BlockChain = require('../BlockChain')

describe('When using the block chain', () => {
  let test = {}

  beforeEach((done) => {
    test.miner = new FakeMiner()
    test.network = new FakeNetwork()

    test.blockChain = new BlockChain({
      miner: test.miner,
      network: test.network,
      difficulty: 0,
    })

    test.blockChain.join({genesis: true, cb: done})
  })

  it('Should pass kill to miner', () => {
    test.blockChain.kill()

    assert.equal('kill', test.miner.message.type)
  })

  it('Should generate gensis block', () => {
    assert.equal('0000000000000000000000000000000000000000000000000000000000000000', test.miner.block.previous)
  })

  it('Should use difficulty', () => {
    assert.equal(0, test.miner.block.difficulty)
  })

  it('Should connect to network', () => {
    assert.equal(true, test.network.started, 'Network should be started')
  })

  it('Should pass opts', () => {
    let opts = {test:'hey'}
    test.blockChain.join(opts)

    assert.equal(opts.test, test.network.startOpts.test)
  })
})

describe('When not genesis', () => {
  let test = {}

  beforeEach((done) => {
    test.miner = new FakeMiner()
    test.network = new FakeNetwork()

    test.blockChain = new BlockChain({
      miner: test.miner,
      network: test.network,
      difficulty: 1,
    })

    test.blockChain.join({cb: done})
  })

  it('Should handle blocks from network', () => {
    let block = blockFactory()

    test.network.emit('block', block)

    assert.equal(block.hash, test.miner.block.previous)
  })

  it('Should emit block event from miner', () => {
    let result
    test.blockChain.on('block', event => {
      result = event.block
    })

    test.network.emit('block', blockFactory())

    assert(result)
  })

  it('Should ignore same distance blocks', () => {
    let genesis = blockFactory()
    test.network.data[genesis.hash] = genesis.block

    let b1 = blockFactory(genesis)
    test.network.data[b1.hash] = b1.block

    let b2 = blockFactory(genesis)
    test.network.data[b2.hash] = b2.block

    test.network.emit('block', b1)
    test.network.emit('block', b2)

    assert.equal(test.miner.block.previous, b1.hash)
  })

  it('Should accept longer blocks', () => {
    let genesis = blockFactory()
    test.network.data[genesis.hash] = genesis.block

    let b1 = blockFactory(genesis)
    test.network.data[b1.hash] = b1.block

    let b2 = blockFactory(genesis)
    test.network.data[b2.hash] = b2.block

    let c2 = blockFactory(b2)
    test.network.data[c2.hash] = c2.block

    test.network.emit('block', b1)
    test.network.emit('block', c2)

    assert.equal(test.miner.block.previous, c2.hash)
  })

  it('Should pass mined blocks to network', () => {
    let genesis = blockFactory()
    test.network.data[genesis.hash] = genesis.block

    let b1 = blockFactory(genesis)
    test.network.data[b1.hash] = b1.block

    test.miner.emit('message', b1)

    assert.equal(test.network.lastAdded.previous, genesis.hash)
  })

  it('Should emit block event from miner', () => {
    let genesis = blockFactory()
    test.network.data[genesis.hash] = genesis.block

    let b1 = blockFactory(genesis)
    test.network.data[b1.hash] = b1.block

    let result
    test.blockChain.on('block', event => {
      result = event.block
    })

    test.miner.emit('message', b1)

    assert.equal(result.previous, genesis.hash)
  })


  it('Mine on its own creations', () => {
    let genesis = blockFactory()
    test.network.data[genesis.hash] = genesis.block

    let b1 = blockFactory(genesis)
    test.network.data[b1.hash] = b1.block

    test.miner.emit('message', b1)

    assert.equal(test.miner.block.previous, b1.hash)
  })
})
