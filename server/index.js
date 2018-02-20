const net = require('net')
const EventEmitter = require('events')
const sha256 = require('sha256')
// const shortid = require('shortid')

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
      write: msg => client.write(msg),
      event: emitter
    })

    client.on('data', (data) => {
      data = data.toString()
      
      emitter.emit('msg', data)
    })
    
    client.on('error', (err) => {
      console.error(err)
    })    
  })
}

const port = help.random(1300, 1400)

createServer()
  .then(() => {
    console.log('Server Started')
  })

let peers = []

function addPeer(peer) {
  console.log(`Adding peer ${peer.ip}:${peer.port}`)
  
  peer.event.on('msg', (data) => {
    console.log(`Received ${data}`)
    
    if (data.startsWith('HASH')) {
      let hash = data.split(':')[1]
      
      if (!store.saw(hash)) {
        peer.write(`DATA:${hash}`)
      }
    } else if (data.startsWith('DATA')) {
      let hash = data.split(':')[1]
      
      if (store.saw(hash)) {
        peer.write(`BLOB:${hash}:${JSON.stringify(store.saw(hash))}`)
      }
    } else if (data.startsWith('BLOB')) {
      let bits = data.split(':')
      
      let hash = bits[1]
      let blob = bits[2]
      
      let obj = store.check(hash, blob)
      if (obj) {
        broadCast(`HASH:${hash}`)
        
        if (obj.type == 'peer') {
          if (peers.every(p => p.ip != obj.ip && p.port != obj.port)) {
            connect(`${obj.ip}:${obj.port}`)
          }
        } else if (obj.type == 'block') {
          if (obj.previous == '0000000000000000000000000000000000000000000000000000000000000000') {
            miner = createMiner({genesis: obj})
          } else {
            if (!store.get(obj.previous)) {
              peer.write(`DATA:${obj.previous}`)
            }
          }
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
  
  broadCast(`HASH:${store.add(c)}`)
}

function broadCast(msg, ignore) {
  console.log(`Broadcast ${msg}`)
  
  peers.map(p => p.write(msg))
}

function createServer() {
  return new Promise((fulfill, reject) => {
    let server = net.createServer()
    
    server.on('connection', (connection) => {
      let address = connection.remoteAddress + ':' + connection.remotePort
      console.log('new client connection from %s', address)

      connection.setEncoding('utf8')

      let emitter = new EventEmitter()

      addPeer({
        ip: connection.remoteAddress.split(':')[3],
        port: connection.remotePort,
        write: msg => connection.write(msg),
        event: emitter
      })

      connection.on('data', (data) => {
        emitter.emit('msg', data)
      })

      connection.once('close', () => {
        console.log(`${address} Connection Closed`)
      })

      connection.on('error', (err) => {
        console.log(`Connection Error ${err} From ${address}`)
      })
    })
    
    server.listen(port, function() {
      console.log('server listening to ', server.address())

      fulfill()
    })
  })
}

function randomPeer() {
  return peers[help.random(0, peers.length - 1)]
}

setInterval(() => {
  store
    .missing()
    .map(m => randomPeer().write(`DATA:${m}`))
}, 1000)