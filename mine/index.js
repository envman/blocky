const sha256 = require('sha256')

let block = {
  zone: '',
  size: 10,
  previous: '0000000000000000000000000000000000000000000000000000000000000000',
  version: '0.1',
  turn: 1, // required?
  difficulty: 4,
  timeStamp: '?',
  nonce: 1,
  actions: [
    {player: 'g', move: { x: 1, y: 2 }, unitId: '12a'}
  ],
}

solve(block)

function solve(block) {
  let data = compileBlock(block)
  let nonce = 1
  
  let attempt = hash(data.header, data.body, nonce)
  
  while (!isSolution(attempt, block.difficulty)) {
    attempt = hash(data.header, data.body, nonce)    
    nonce = nonce + 1
  }
  
  console.log(`Solved with ${attempt}`)
}

function isSolution(attempt, difficulty) {
  return attempt.startsWith(Array(difficulty + 1).join("0"))
}

function hash(header, body, nonce) {
  return sha256.x2(header + nonce + body)
}

function compileBlock(block) {
  let header = `${block.zone}:${block.previous}:${block.version}:${block.difficulty}:`
  
  let body = compileActions(block.actions)
  
  return {
    header,
    body,
  }
}

function compileActions(actions) {
  let full = ''
  
  for (let action of actions) {
    let comp = `${action.player}:${action.move.x}:${action.move.y}:${action.unitId}`
    full += comp
  }
  
  return full
}

function validate(block) {
  for (let move of block.actions) {
    if (!checkMove(move)) {
      return false
    }
  }
  
  return true
}

function checkMove(move) {
  let unit = world.units.find(u => u.id == move.unitId)
  
  return true
}

let world = {
  units: [
    { id: '12a', owner: 'g', position: { x: 1, y: 1 } }
  ]
}