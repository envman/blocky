const BlockChain = require('./BlockChain')
const helpers = require('./help')

var argv = require('minimist')(process.argv.slice(2))

let blockChain = new BlockChain({
  difficulty: argv.d
})

blockChain.on('block', event => {
  console.log(`New Block ${event.hash} from ${event.source}`)
})

let opts = {
  genesis: !!argv.g,
  port: argv.p || helpers.random(2000, 100),
  server: argv.s
}

console.log(opts)

blockChain.join(opts)