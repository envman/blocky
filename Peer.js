const EventEmitter = require('events')

const Peer = function(connection) {
  this.connection = connection

  this.connection.on('data', (data) => {
    data.split('__')
      .filter(p => p.length > 0)
      .map(p => {
        let message = JSON.parse(p)
        this.emit(message.type, message)
      })
  })

  this.connection.once('close', () => {
    this.emit('close')
  })

  this.connection.on('error', () => {
    this.emit('close')
  })
}

Peer.prototype.__proto__ = EventEmitter.prototype

Peer.prototype.send = function(msg) {
  this.connection.write(JSON.stringify(msg) + '__')
}

module.exports = Peer
