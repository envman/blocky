const genesisCode = '0000000000000000000000000000000000000000000000000000000000000000'

const BlockFactory = function(opts) {
  this.difficulty = opts.difficulty || 4
}

BlockFactory.prototype.create(previous, difficulty) {
  return {
    type: 'block',
    previous: previous || genesisCode,
    difficulty: difficulty || this.difficulty,
    nonce: 0,
  }
}