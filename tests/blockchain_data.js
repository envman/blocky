const assert = require('assert')
const createTestingZone = require('./framework/testing-zone')

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

    assert(result.users.find(u => u.name == 'user_0'))
  })

  it('wtf', () => {
    let result = zone[1].chain.view()
    let genesisUser = result.users.find(u => u.name == 'user_0')

    assert(result.land['0:0'].owner === genesisUser.key)
  })
})

describe('', () => {
  let zone

  beforeEach((done) => {
    createTestingZone({total: 2})
      .then(z => {
        zone = z
        done()
      })
  })

  it('should?', () => {
    zone[0].miner._generate()
    zone[1].miner._generate()
    zone[1].miner._generate()

    let result = zone[1].chain.view()
    let user = result.users.find(u => u.name == 'user_1')

    assert(result.land['0:-1'].owner === user.key)
    assert(result.land['1:-1'].owner === user.key)
  })

  it('Should generate cash', () => {
    zone[0].miner._generate()

    let result = zone[0].chain.view()

    assert.equal(result.cash, 1000)
  })
})
