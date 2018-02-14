const net = require('net')
const shortid = require('shortid')
const EventEmitter = require('events')
const sha256 = require('sha256')

const help = require('./help')
const createStore = require('./store')

let me = shortid()
let fullAddress = process.argv[2]
let store = createStore()

if (fullAddress) {
  console.log(`Connecting to ${fullAddress}`)
  
  let address = fullAddress.split(':')
  let client = new net.Socket()
  
  client.connect(address[1], address[0], () => {
    console.log(`Connected to ${address.join(':')}`)

    client.on('data', (data) => {
      data = data.toString()
      
      console.log(`client received ${data}`)
      
      // console.log(`recieved message ${data}`)
      let emitter
      if (data.startsWith('ID:')) {
        emitter = new EventEmitter()
        
        addPeer({
          id: data.split(':')[1],
          ip: address[0],
          port: address[1],
          write: msg => client.write(msg),
          event: emitter
        })
      } else {
        emitter.emit(data)
      }
    })
    
    client.on('error', (err) => {
      console.error(err)
    })
    
    client.write(`ID:${me}`)    
  })
}
// return
const port = help.random(1300, 1400)
// const port = 1404

createServer()
  .then(() => {
    console.log('Server Started')
  })

let peers = []

function addPeer(peer) {
  console.log(`Adding peer ${peer.id} ${peer.ip}:${peer.port}`)
  
  peer.event.on('msg', (data) => {
    console.log(`Received ${data}`)
    
    if (data.startsWith('HASH')) {
      let hash = data.split(':')[1]
      
      console.log('process hash')
      if (!store.saw(hash)) {
        console.log('didnt see')
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
      
      if (store.check(hash, blob)) {
        broadCast(`HASH:${hash}`)
      }
     }
  })
  
  peers.push(peer)
  
  let c = {
    id: peer.id,
    ip: peer.ip,
    port: peer.port,
  }
  
  broadCast(`HASH:${store.add(c)}`)
}

function broadCast(msg) {
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

      connection.on('data', (data) => {
        console.log(`Server received ${data}`)
        
        let emitter
        if (data.startsWith('ID:')) {
          emitter = new EventEmitter()
          
          addPeer({
            id: data.split(':')[1],
            ip: connection.remoteAddress.split(':')[3],
            port: connection.remotePort,
            write: msg => connection.write(msg),
            event: emitter
          })
          
          connection.write(`ID:${me}`)
        }
        
        if (emitter) {
          emitter.emit('msg', data)
        }
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