const assert = require('assert')
const createTest = require('./framework/testing-zone')
const global = require('../global')

describe('Grass', () => {
  let test

  beforeEach(done => {
    createTest()
      .then(t => {
        test = t[0]
        done()
      })
  })

  it('Should be grass', () => {
    test.miner._generate()
    test.random.setNext(0)

    let result = test.chain.view()

    assert.equal('grass', result.land['0:0'].type)
  })

  it('Random generator got seed', () => {
    test.miner._generate()

    let result = test.chain.view()

    assert.equal(test.random.lastSeed, global.genesis)
  })

  it('Should generate stone', () => {
    test.random.setNext(1)
    test.miner._generate()

    let result = test.chain.view()

    assert.equal('stone', result.land['0:0'].type)
  })
})
