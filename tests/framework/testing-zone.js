const FakeMiner = require('./FakeMiner')
const fakeTcp = require('./fake_tcp')
const FakeRandom = require('./FakeRandom')

const BlockChain = require('../../BlockChain')

const fakeNetwork = fakeTcp()

const createChain = function(opts) {
  return new Promise((fulfill, reject) => {
    let miner = new FakeMiner()
    let random = new FakeRandom()

    let blockChain = new BlockChain({
      tcp: fakeNetwork,
      random: random,
      miner: miner,
      difficulty: 0,
      username: opts.username
    })

    blockChain.join({
      genesis: opts.genesis,
      port: opts.port,
      server: opts.server,
      cb: () => {
        fulfill({ miner: miner, chain: blockChain, random: random})
      }
    })
  })
}

const createTestingZone = function(opts) {
  let results = []
  opts = opts || {}
  opts.total = opts.total || 1

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

module.exports = createTestingZone
