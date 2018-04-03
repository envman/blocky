function FakeRandom(opts) {
 opts = opts || {}

 this.series = opts.series || []
}

FakeRandom.prototype.random = function(low, high) {
  return this.series.shift()
}

FakeRandom.prototype.setNext = function(number) {
  this.series.push(number)
}

FakeRandom.prototype.seed = function(seed) {
  this.lastSeed = seed
}

module.exports = FakeRandom
