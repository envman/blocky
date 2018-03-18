const fakeTcp = require('./framework/fake_tcp')
const fakeNetwork = fakeTcp()

const BlockChain = require('../BlockChain')

describe('System Test', () => {

  before((done) => {
    let blockChain = new BlockChain({
      tcp: fakeNetwork,
      difficulty: 1,
    })

    blockChain.join({
      genesis: true,
      port: 2001
    })

    let once

    blockChain.on('block', (event) => {
      // console.log(event)
      blockChain.kill()

      if (!once) {
        once = true
        done()
      }
    })
  })

  it('Should probably do something', () => {

  })
})
