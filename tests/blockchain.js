const EventEmitter = require('events')
const assert = require('assert')

const FakeMiner = require('./framework/FakeMiner')
const FakeNetwork = require('./framework/FakeNetwork')

const BlockChain = require('../BlockChain')

describe('When using the block chain', () => {
  let test = {}

  beforeEach(() => {
    test.miner = new FakeMiner()
    test.network = new FakeNetwork()

    test.blockChain = new BlockChain({
      miner: test.miner,
      network: test.network,
      difficulty: 1,
    })
  })

  it('Should pass kill to miner', () => {
    test.blockChain.join({})

    test.blockChain.kill()

    assert.equal('kill', test.miner.message.type)
  })

  it('Should generate gensis block', () => {
    test.blockChain.join({genesis: true})

    assert.equal('0000000000000000000000000000000000000000000000000000000000000000', test.miner.block.previous)
  })

  it('Should use difficulty', () => {
    test.blockChain.join({genesis: true})

    assert.equal(1, test.miner.block.difficulty)
  })

  it('Should connect to network', () => {
    test.blockChain.join()

    assert.equal(true, test.network.started, 'Network should be started')
  })

  it('Should pass opts', () => {
    let opts = {test:'hey'}
    test.blockChain.join(opts)

    assert.equal(opts.test, test.network.startOpts.test)
  })

  it('Should handle blocks from network', () => {
    test.blockChain.join()

    test.network.emit('block', {
      hash: 'B',
      block: { previous: 'A' },
    })

    assert.equal('B', test.miner.block.previous)
  })

  it('Should emit block event from miner', () => {
    test.blockChain.join()

    let block
    test.blockChain.on('block', event => {
      block = event.block
    })

    test.network.emit('block', {
      hash: 'B',
      block: { previous: 'A' },
    })

    assert(block)
  })

  it('Should ignore same distance blocks', () => {
    test.blockChain.join()

    test.network.data['A'] = { previous: '0000000000000000000000000000000000000000000000000000000000000000' }
    test.network.data['B1'] = { ignore: false, previous: 'A' }
    test.network.data['B2'] = { ignore: true, previous: 'A' }

    test.network.emit('block', {hash: 'B1', block: test.network.data['B1']})
    test.network.emit('block', {hash: 'B2', block: test.network.data['B2']})

    assert.equal(test.miner.block.previous, 'B1')
  })

  it('Should accept longer blocks', () => {
    test.blockChain.join()

    test.network.data['A'] = { previous: '0000000000000000000000000000000000000000000000000000000000000000' }
    test.network.data['B1'] = { previous: 'A' }
    test.network.data['B2'] = { previous: 'A' }
    test.network.data['C2'] = { previous: 'B2' }

    test.network.emit('block', {hash: 'B1', block: test.network.data['B1']})
    test.network.emit('block', {hash: 'C2', block: test.network.data['C2']})

    assert.equal(test.miner.block.previous, 'C2')
  })

  it('Should pass mined blocks to network', () => {
    test.blockChain.join()

    test.network.data['A'] = { previous: '0000000000000000000000000000000000000000000000000000000000000000' }

    test.miner.emit('message', {hash: 'B', block: { data: 'testers', previous: 'A' }})

    assert.equal(test.network.lastAdded.data, 'testers')
  })

  it('Should emit block event from miner', () => {
    test.blockChain.join()

    test.network.data['A'] = { previous: '0000000000000000000000000000000000000000000000000000000000000000' }

    let block
    test.blockChain.on('block', event => {
      block = event.block
    })

    test.miner.emit('message', {hash: 'B', block: { data: 'testers', previous: 'A' }})

    assert(block)
  })

  it('Mine on its own creations', () => {
    test.blockChain.join()

    test.network.data['A'] = { previous: '0000000000000000000000000000000000000000000000000000000000000000' }

    test.miner.emit('message', {hash: 'B', block: { data: 'testers', previous: 'A' }})

    assert.equal(test.miner.block.previous, 'B')
  })
})
