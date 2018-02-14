const sha256 = require('sha256')

module.exports = function createStore() {
  let data = {}
  
  return {
    add: function add(obj) {
      let hash = sha256.x2(JSON.stringify(obj))
      
      data[hash] = obj
      
      return hash
    },
    
    saw: function saw(hash) {
      
      if (data[hash]) {
        return data[hash]
      }
      
      console.log(`I dun saw ${hash}`)
      data[hash] = undefined
    },
    
    check: function check(hash, obj) {
      
      if (hash == sha256.x2(obj)) {
        console.log(`I dun got ${hash}`)
        
        return data[hash] = JSON.parse(obj)
      }
    }
  }
}