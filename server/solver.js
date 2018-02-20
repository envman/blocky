const sha256 = require('sha256')

let running = true

process.on('message', (msg) => {
  if (msg.type == 'block') {
    solve(msg.body)
  }
  
  if (msg.type == 'kill') {
    running = false
  }
})

function solve(block) {  
  do_solve(block, 100)
}

function do_solve(block, number) {
  let limit = block.difficulty + number
  let attempt = hash(block)
  
  while (!isSolution(attempt, block.difficulty)) {
    if (block.difficulty > limit) {
      if (running) {
        process.nextTick(() => {
          do_solve(block, number)
        })
      }
      
      return
    }
    
    block.nonce++
    attempt = hash(block)
  }
  
  process.send(block)
}

function isSolution(attempt, difficulty) {
  return attempt.startsWith(Array(difficulty + 1).join("0"))
}

function hash(block) {
  return sha256.x2(JSON.stringify(block))
}