const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')

const BlockChain = require('./BlockChain')
const helpers = require('./help')

var argv = require('minimist')(process.argv.slice(2))

let blockChain = new BlockChain({
  difficulty: argv.d,
  username: argv.u,
})

blockChain.on('block', event => {
  console.log(`New Block ${event.hash} from ${event.source}`)
})

let opts = {
  genesis: !!argv.g,
  port: argv.p || helpers.random(2000, 100),
  server: argv.s,
}

blockChain.join(opts)

const app = express()

app.use(bodyParser.json())

app.use('/web', express.static(path.join(__dirname, 'web')))
app.use('/packages', express.static(path.join(__dirname, 'node_modules')))

let apiPort = argv.apiPort || 8080
app.listen(apiPort, () => {
  console.log(`API on ${apiPort}`)
})