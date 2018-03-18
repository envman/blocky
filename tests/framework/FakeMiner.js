const EventEmitter = require('events')

const sha256 = require('sha256')

const FakeMiner = function() {

}

FakeMiner.prototype.__proto__ = EventEmitter.prototype

FakeMiner.prototype.send = function(msg) {
  if (msg.type == 'block') {
    this.block = msg.body
  }
  
  this.message = msg
}

FakeMiner.prototype._generate = function() {
  this.emit('message', {
    hash: sha256.x2(JSON.stringify(this.block)),
    block: this.block
  })
}

module.exports = FakeMiner
