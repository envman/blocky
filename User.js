const { randomBytes } = require('crypto')
const secp256k1 = require('secp256k1')
const sha256 = require('sha256')
const path = require('path')

const User = function(opts) {
  opts = opts || {}
  this.fs = opts.fs || require('fs')
  
  this.name = opts.name || 'dummy'
  this.keyFile = path.join(__dirname, `${this.name}.key`)
  
  if (this.fs.existsSync(this.keyFile)) {
    this.key = this.fs.readFileSync(this.keyFile)
  }
}

User.prototype.exists = function() {
  return !!this.key
}

User.prototype.create = function() {
  let privKey
  do {
    privKey = randomBytes(32)
  } while (!secp256k1.privateKeyVerify(privKey))

  this.key = privKey
  this.fs.writeFileSync(this.keyFile, this.key)
}

User.prototype.public = function() {
  let publicRecord = {
    type: 'user',
    name: this.name,
    key: secp256k1.publicKeyCreate(this.key).toString('hex'),
  }
  
  let hash = sha256.x2(JSON.stringify(publicRecord))
  
  return {
    hash: hash,
    value: {
      record: publicRecord,
      signature: this.sign(hash).toString('hex'),
    } 
  }
}

User.prototype.sign = function(hash) {  
  let buf = Buffer.from(hash, 'hex')
  const msg = randomBytes(32)
  
  return secp256k1.sign(buf, this.key).signature
}

module.exports = User
module.exports.verify = function(hash, sig, pub) {
  return secp256k1.verify(Buffer.from(hash, 'hex'), Buffer.from(sig, 'hex'), Buffer.from(pub, 'hex'))
}