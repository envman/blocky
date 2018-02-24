const net = require('net')
const EventEmitter = require('events')
const express = require('express')
const shortid = require('shortid')

const help = require('./help')
const createStore = require('./store')
const createMiner = require('./miner')

let fullAddress = process.argv[2]
let store = createStore()
let miner

if (fullAddress) {
  connect(fullAddress)
} else {
  console.log('No connection supplied, creating genesis block')
  
  miner = createMiner({store: store})
  
  miner.emitter.on('block', (hash) => {
    broadCast({
      type: 'HASH',
      value: hash
    })
  })
}

function connect(fullAddress) {
  console.log(`Connecting to ${fullAddress}`)
  
  let address = fullAddress.split(':')
  let client = new net.Socket()
  
  client.connect(address[1], address[0], () => {
    console.log(`Connected to ${address.join(':')}`)

    let emitter = new EventEmitter()

    addPeer({
      ip: address[0],
      port: address[1],
      write: msg => {
        // console.log(`WRITE: ${msg}`)
        client.write(msg + '__')
      },
      event: emitter
    })

    client.on('data', (data) => {
      data = data.toString()
      
      let parts = data.split('__').filter(p => p.length > 0)
      
      parts.map(p => emitter.emit('msg', p))
    })
    
    client.on('error', (err) => {
      console.error(err)
    })    
  })
}

const port = help.random(1300, 1400)

createServer()
  .then(() => {
    // console.log('Server Started')
  })

let peers = []
let pendingBlocks = []

function inChain(block) {
  while (block.previous != '0000000000000000000000000000000000000000000000000000000000000000') {
    
    block = store.get(block.previous)
    
    if (!block) {
      return false
    }
  }
  
  return true
}

function addPeer(peer) {
  console.log(`Adding peer ${peer.ip}:${peer.port}`)
  
  peer.event.on('msg', (data) => {
    // console.log(`Received ${data}`)
    let message = JSON.parse(data)
    
    if (message.type == 'HASH') {
      let hash = message.value
      
      if (!store.saw(hash)) {
        peer.write(JSON.stringify({
          type: 'DATA',
          value: hash
        }))
      }
    } else if (message.type == 'DATA') {
      let hash = message.value
      
      if (store.saw(hash)) {
        peer.write(JSON.stringify({
          type: 'BLOB',
          value: hash,
          body: store.get(hash)
        }))
      }
    } else if (message.type == 'BLOB') {
      let bits = data.split(':')
      
      let hash = message.value
      let blob = message.body
      
      if (store.get(hash)) {
        console.log(`${hash} Exists Ignore`)
        return
      }
      
      let obj = store.check(hash, blob)
      if (obj) {
        broadCast({
          type: 'HASH',
          value: hash,
        })
        
        if (obj.type == 'peer') {
          // if (peers.every(p => p.ip != obj.ip && p.port != obj.port)) {
            // connect(`${obj.ip}:${obj.port}`)
          // }
        } else if (obj.type == 'block') {
          pendingBlocks.push(obj)
          store.add(obj)
          
          if (obj.previous == '0000000000000000000000000000000000000000000000000000000000000000') {
              miner = createMiner({genesis: obj, store: store})
              
              miner.addMove(shortid())
              
              miner.emitter.on('block', (hash) => {
                // console.log(`My Miner Mined one! ${hash}`)
                
                broadCast({
                  type: 'HASH',
                  value: hash
                })
              })
          } else {
            if (!store.get(obj.previous)) {
              peer.write(JSON.stringify({
                type: 'DATA',
                value: obj.previous,
              }))
            }
          }
          
          let newPending = []
          
          for (let block of pendingBlocks) {
            if (inChain(block)) {
              console.log('Block in Chain')
              miner.addBlock(block)
            } else {
              newPending.push(block)
            }
          }
          
          pendingBlocks = newPending
        }
      }
    }
  })
  
  peers.push(peer)
  
  let c = {
    type: 'peer',
    ip: peer.ip,
    port: peer.port,
  }
  
  broadCast({
    type: 'HASH',
    value: store.add(c)
  })
}

function broadCast(msg, ignore) {  
  if (!msg.value) throw new Error('No Message Value')
  
  peers.map(p => p.write(JSON.stringify(msg)))
}

function createServer() {
  return new Promise((fulfill, reject) => {
    let server = net.createServer()
    
    server.on('connection', (connection) => {
      let address = connection.remoteAddress + ':' + connection.remotePort
      // console.log('new client connection from %s', address)

      connection.setEncoding('utf8')

      let emitter = new EventEmitter()

      addPeer({
        ip: connection.remoteAddress.split(':')[3],
        port: connection.remotePort,
        write: msg => {
          // console.log(`WRITE: ${msg}`)
          connection.write(msg + '__')
        },
        event: emitter
      })

      connection.on('data', (data) => {
        data.split('__')
          .filter(p => p.length > 0)
          .map(p => emitter.emit('msg', p))
      })

      connection.once('close', () => {
        console.log(`${address} Connection Closed`)
      })

      connection.on('error', (err) => {
        console.log(`Connection Error ${err} From ${address}`)
      })
    })
    
    server.listen(port, function() {
      console.log(`Server Started On Port ${server.address().port}`)
      // console.log('server listening to ', server.address())

      fulfill()
    })
  })
}

function randomPeer() {
  return peers[help.random(0, peers.length - 1)]
}

const app = express()

app.get('/', (req, res) => {
  if (!miner) {
    return res.send('ERR')
  }
  
  res.json(miner.chain())
})

let serverPort = help.random(8000, 10)
app.listen(serverPort, () => {
  console.log(`API on ${serverPort}`)
})

// setInterval(() => {
  // store
  //   .missing()
  //   .map(m => randomPeer().write(JSON.stringify({
  //     type: 'DATA',
  //     value: m
  //   })))
// }, 1000)