const EventEmitter = require('events')
const assert = require('assert')
const sha256 = require('sha256')

const verify = require('../User').verify
const BlockChain = require('../BlockChain')

describe('When using the block chain', () => {
  let test = {}
  
  before((done) => {
    test.miner = new EventEmitter()
    test.miner.send = msg => {
      test.miner.block = msg.body
      test.miner.message = msg
    }
    
    test.network = new EventEmitter()
    test.network.start = (opts) => {
      test.network.started = true
      test.network.startOpts = opts
      
      return Promise.resolve(true)
    }
    test.network.data = {}
    test.network.get = hash => test.network.data[hash]
    test.network.publish = data => test.network.lastAdded = data
    
    test.fs = {
      existsSync: () => false,
      writeFileSync: () => false,
    }
    
    test.blockChain = new BlockChain({
      miner: test.miner,
      network: test.network,
      difficulty: 1,
      fs: test.fs
    })
    
    test.blockChain.join({genesis: true, cb: done})
  })
  
  it('Should publish a new user!', () => {
    test.blockChain.join({})
    
    assert.equal('dummy', test.network.lastAdded.record.name)
  })
  
  it('Should veryify correctly!', () => {
    let record = test.network.lastAdded
    let hash = sha256.x2(JSON.stringify(record.record))
    
    assert(verify(hash, record.signature, record.record.key))
  })
})