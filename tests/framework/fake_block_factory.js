const sha256 = require('sha256')

let nonce = 0

module.exports = function(last) {  
  let block =  {
    type: 'block',
    actions: [],
    previous: last && last.hash || '0000000000000000000000000000000000000000000000000000000000000000',
    nonce: nonce++,
  }
  
  return {
    hash: sha256.x2(JSON.stringify(block)),
    block: block
  }
}