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
      
      data[hash] = undefined
    },
    
    check: function check(hash, obj) {
      
      if (hash == sha256.x2(obj)) {        
        return data[hash] = JSON.parse(obj)
      }
    },
    
    get: function get(hash) {
      if (data[hash]) {
        return data[hash]
      }
      
      data[hash] = undefined
    },
    
    missing: function missing() {
      return Object.getOwnPropertyNames(data)
        .filter(f => !data[f])
    },
    
    all: function all() {
      return Object.getOwnPropertyNames(data)
        .map(p => ({hash: p, data: data[p]}))
    },
  }
}