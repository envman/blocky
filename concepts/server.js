const createNetwork = require('./network')

module.exports = function createServer() {

  return new Promise((fulfill, reject) => {
    createNetwork()
      .then(network => {
        fulfill({
          pull: function pull() {
            network.sendToRandom('PULL')
          }
        })
      })
  })
}