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