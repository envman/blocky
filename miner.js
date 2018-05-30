const sha256 = require('sha256')

let running = true
let currentBlock

process.on('message', (msg) => {
  if (msg.type == 'block') {
    currentBlock = msg.body
  }

  if (msg.type == 'kill') {
    running = false
  }
})

function run() {
  if (currentBlock) {
    let attempt = hash(currentBlock)

    if (isSolution(attempt, currentBlock.difficulty)) {
      process.send({
        hash: attempt,
        block: currentBlock,
      })

      currentBlock = undefined
    } else {
      currentBlock.nonce++
    }
  }

  if (running) {
    setTimeout(run, 1)
  }
}

setTimeout(run, 1)

function isSolution(attempt, difficulty) {
  return attempt.startsWith(Array(difficulty + 1).join("0"))
}

function hash(block) {
  return sha256.x2(JSON.stringify(block))
}
