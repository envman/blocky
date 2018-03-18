const assert = require('assert')

const FakeMiner = require('./framework/FakeMiner')
const fakeTcp = require('./framework/fake_tcp')

const BlockChain = require('../BlockChain')

const fakeNetwork = fakeTcp()

const createChain = function(opts) {
  return new Promise((fulfill, reject) => {
    let miner = new FakeMiner()

    let blockChain = new BlockChain({
      tcp: fakeNetwork,
      miner: miner,
      difficulty: 0,
      username: opts.username
    })

    blockChain.join({
      genesis: opts.genesis,
      port: opts.port,
      server: opts.server,
      cb: () => {
        fulfill({ miner: miner, chain: blockChain})
      }
    })
  })
}

const createTestingZone = function(opts) {
  let results = []
  
  for (let i = 0; i < opts.total; i++) {
    let chainOpts = {
      port: 2000 + i,
      username: `user_${i}`
    }
    
    if (i == 0) {
      chainOpts.genesis = true
    } else {
      chainOpts.server = `127.0.0.1:200${i - 1}`
    }
    
    results.push(createChain(chainOpts))
  }
  
  return Promise.all(results)
}

describe('Adding an action', () => {
  let zone
  
  before((done) => {
    createTestingZone({total: 2})
      .then(z => {
        zone = z
        done()
      })
  })

  it('Should ???', () => {    
    zone[0].miner._generate()

    let result = zone[1].chain.view()
    console.log(result)
    
    assert(result.users.find(u => u.name == 'user_0'))
  })
  
  it('Should', () => {
    // zone[0].miner._generate()
    
    let result = zone[1].chain.view()
    
    assert(result.users.find(u => u.name == 'user_1'))
  })
  
  it('wtf', () => {
    let result = zone[1].chain.view()
    let genesisUser = result.users.find(u => u.name == 'user_0')
    
    assert(result.land['0-0'].owner === genesisUser.key)
  })
})
