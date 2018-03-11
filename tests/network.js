const EventEmitter = require('events')
const assert = require('assert')
const sha256 = require('sha256')
const fakeTcp = require('./framework/fake_tcp')

const Network = require('../Network')

describe('When connected to server', () => {
  let fakey = { tcp: fakeTcp()}
  
  let n1 = new Network(fakey)
  let n2 = new Network(fakey)
  
  let testData = {test: 'fun'}
  let hash = sha256.x2(JSON.stringify(testData))
  
  before((done) => {
    n1.start({port: 1001})
      .then(() => n2.connect('127.0.0.1:1001'))
      .then(() => done())
      .catch((err) => {
        console.error(err)
      })
  })
  
  it('Data should get synced', () => {
    n1.publish(testData)
    
    assert.equal('fun', n2.get(hash).test)
  })
})

describe('Block', () => {
  let fakey = { tcp: fakeTcp()}
  
  let n1 = new Network(fakey)
  let n2 = new Network(fakey)
  
  let block = {
    type: 'block',
    previous: '0000000000000000000000000000000000000000000000000000000000000000'
  }
  
  let received
  n2.on('block', (data) => {
    received = data
  })
  
  before((done) => {
    n1.start({port: 1001})
      .then(() => n2.connect('127.0.0.1:1001'))
      .then(() => done())
      .catch((err) => {
        console.error(err)
      })
  })
  
  it('??', () => {
    n1.publish(block)
    
    assert.equal('0000000000000000000000000000000000000000000000000000000000000000', received.block.previous)
  })
})

describe('Chain retrevial mech', () => {
  let fakey = { tcp: fakeTcp()}
  
  let n1 = new Network(fakey)
  let n2 = new Network(fakey)
  
  // let b1 = {
  //   type: 'block',
  //   previous: '0000000000000000000000000000000000000000000000000000000000000000'
  // }
})