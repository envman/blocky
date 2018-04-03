const createRandom = require('random-seed').create

function Random() {

}

Random.prototype.seed = function(hash) {
  this.generator = createRandom(hash)
}

Random.prototype.random = function(min, max) {
  let raw = this.generator(max - min)

  return raw + min
}

module.exports = Random
