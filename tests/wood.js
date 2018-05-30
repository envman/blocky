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
    test.random.setNext(1)

    let result = test.chain.view()

    assert.equal(true, result.land['0:0'].trees)
  })
})
