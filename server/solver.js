const sha256 = require('sha256')

let running = true
let currentBlock

process.on('message', (msg) => {
  console.log('got message')
  
  if (msg.type == 'block') {
    console.log('update current block')
    currentBlock = msg.body
    // solve(msg.body)
  }
  
  if (msg.type == 'kill') {
    running = false
  }
})

function run() {
  // console.log('run')
  if (currentBlock) {
    let attempt = hash(currentBlock)
    // console.log(`Attempt ${attempt}`)
    
    if (isSolution(attempt, currentBlock.difficulty)) {
      process.send(currentBlock)
      
      currentBlock = undefined
    } else {
      currentBlock.nonce++
    }
  }
  
  if (running) {
    // process.nextTick(() => {
    setTimeout(run, 1)
    // })
  }
}

setTimeout(run, 1)
// 
// function solve(block) {  
//   do_solve(block, 1)
// }
// 
// function do_solve(block, number) {
//   let limit = block.difficulty + number
//   let attempt = hash(block)
// 
//   while (!isSolution(attempt, block.difficulty)) {
//     if (block.difficulty > limit) {
//       if (running) {
//         process.nextTick(() => {
//           do_solve(block, number)
//         })
//       }
// 
//       return
//     }
// 
//     block.nonce++
//     attempt = hash(block)
//   }
// 
//   process.send(block)
// }

function isSolution(attempt, difficulty) {
  return attempt.startsWith(Array(difficulty + 1).join("0"))
}

function hash(block) {
  return sha256.x2(JSON.stringify(block))
}