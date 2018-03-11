const fork = require('child_process').fork
const assert = require('assert')

describe('Miner', () => {
  let hash
  
  before((done) => {
    let miner = fork('./miner')
    
    miner.on('message', msg => {
      hash = msg.hash
      done()
    })
    
    miner.send({
      type: 'block',
      body: {
        difficulty: 1,
        nonce: 0,
      }
    })  
  })
  
  it('Should ?', () => {
    assert(hash.startsWith('0'))
  })
})