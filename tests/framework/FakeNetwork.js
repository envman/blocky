const EventEmitter = require('events')

const FakeNetwork = function() {
  this.data = {}
}

FakeNetwork.prototype.__proto__ = EventEmitter.prototype

FakeNetwork.prototype.start = function(opts) {
  this.started = true
  this.startOpts = opts

  return Promise.resolve(true)
}

FakeNetwork.prototype.get = function(hash) {
  return this.data[hash]
}

FakeNetwork.prototype.publish = function(data) {
  this.lastAdded = data
}

module.exports = FakeNetwork
