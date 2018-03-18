const EventEmitter = require('events')
const net = require('net')
const sha256 = require('sha256')

const Peer = require('./Peer')
const createStore = require('./store')

const Network = function(opts) {
  opts = opts || {}

  this.peers = []
  this.pendingBlocks = []
  this.store = createStore()

  opts.tcp = opts.tcp || {
    createServer: net.createServer,
    createSocket: () => new net.Socket(),
  }

  this.createServer = opts.tcp.createServer
  this.createSocket = opts.tcp.createSocket
}

Network.prototype.__proto__ = EventEmitter.prototype

Network.prototype.start = function(opts) {
  return new Promise((fulfill, reject) => {
    let server = this.createServer()

    server.on('connection', (connection) => {
      let address = connection.remoteAddress + ':' + connection.remotePort

      connection.setEncoding('utf8')

      this.addPeer(new Peer(connection))
    })

    server.listen(opts.port, function() {
      console.log(`Server Started On Port ${server.address().port}`)

      fulfill()
    })
  })
}

Network.prototype.addPeer = function(peer) {
  peer.on('close', () => {
    this.peers.splice(this.peers.indexOf(peer), 1)
  })

  this.peers.push(peer)

  peer.on('HASH', (msg) => {
    if (!this.store.saw(msg.value)) {
      peer.send({
        type: 'DATA',
        value: msg.value
      })
    }
  })

  peer.on('DATA', (msg) => {
    let hash = msg.value

    if (this.store.saw(hash)) {
      peer.send({
        type: 'BLOB',
        value: hash,
        body: this.store.get(hash)
      })
    }
  })

  peer.on('BLOB', (msg) => {
    let hash = msg.value
    let blob = msg.body

    if (this.store.get(hash)) return

    let obj = this.store.check(hash, blob)

    if (obj) {
      this.broadCast({
        type: 'HASH',
        value: hash,
      })

      if (obj.type == 'block') {
        this.pendingBlocks.push(obj)
        this.store.add(obj) // Does peer do?

        if (obj.previous != '0000000000000000000000000000000000000000000000000000000000000000') {
          if (!this.store.get(obj.previous)) {
            peer.send({
              type: 'DATA',
              value: obj.previous,
            })
          }
        }

        for (let pending of this.pendingBlocks) {
          if (this.inChain(pending)) {
            this.emit('block', {
              hash: sha256.x2(JSON.stringify(obj)),
              block: obj,
            })
          }
        }
      } else if (obj.type == 'action') {
        this.emit('action', obj)
      }
    }
  })
}

Network.prototype.inChain = function(block) {
  while (block.previous != '0000000000000000000000000000000000000000000000000000000000000000') {

    block = this.store.get(block.previous)

    if (!block) {
      return false
    }
  }

  return true
}

Network.prototype.connect = function(fullAddress) {
  return new Promise((fulfill, reject) => {
    let address = fullAddress.split(':')
    let client = this.createSocket()

    client.setEncoding('utf8')

    client.connect(address[1], address[0], () => {
      console.log(`Network Joined ${fullAddress}`)

      let peer = new Peer(client)

      this.addPeer(peer)

      fulfill()
    })
  })
}

Network.prototype.publish = function(obj) {
  let hash = this.store.add(obj)

  this.broadCast({
    type: 'HASH',
    value: hash
  })
  
  if (obj.type == 'action') {
    this.emit('action', obj)
  }
}

Network.prototype.get = function(hash) {
  return this.store.get(hash)
}

Network.prototype.broadCast = function(msg) {
  if (!msg.value) throw new Error('No Message Value')

  this.peers.map(p => p.send(msg))
}

module.exports = Network
