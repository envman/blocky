const assert = require('assert')
const Random = require('../Random')

describe('When using the random generator', () => {

  it('Should return correct random based on seed', () => {
    let r1 = new Random()
    let r2 = new Random()

    r1.seed('hello')
    r2.seed('hello')

    assert.equal(r1.random(1, 10), r2.random(1, 10))
    assert.equal(r1.random(1, 10), r2.random(1, 10))
    assert.equal(r1.random(1, 10), r2.random(1, 10))
  })
})
