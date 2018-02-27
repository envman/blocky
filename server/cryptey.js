// const { randomBytes } = require('crypto')
// const secp256k1 = require('secp256k1')
// 
// // const msg = randomBytes(32)
// let msg = Buffer.from('11111111111111112222222222222222', 'utf8');
// console.log(msg)
// 
// let privKey
// do {
//   privKey = randomBytes(32)
// } while (!secp256k1.privateKeyVerify(privKey))
// 
// const pubKey = secp256k1.publicKeyCreate(privKey)
// 
// const sigObj = secp256k1.sign(msg, privKey)
// 
// console.log(secp256k1.verify(msg, sigObj.signature, pubKey))
// 

const { randomBytes } = require('crypto')
const secp256k1 = require('secp256k1')
const fs = require('fs')
const path = require('path')

module.exports = function createUser() {
  let keyFile = path.join(__dirname, 'private.key')
  let key

  if (fs.existsSync(keyFile)) {
    key = fs.readFileSync(keyFile)
  }

  return {
    exists: () => !!key,
    create: () => {
      let privKey
      do {
        privKey = randomBytes(32)
      } while (!secp256k1.privateKeyVerify(privKey))

      key = privKey
      fs.writeFileSync(keyFile, key)
    },
    public: () => secp256k1.publicKeyCreate(key),
    sign: hash => secp256k1.sign(Buffer.from(hash, 'utf8'), key).signature,
  }
}

module.exports.verify = function verify(hash, sig, pub) {
  return secp256k1.verify(Buffer.from(hash, 'utf8'), sig, pub)
}