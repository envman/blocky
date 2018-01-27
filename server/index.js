const net = require('net')

let address = process.argv[2]

console.log(`Connecting to ${address}`)

if (address) {
  let client = new net.Socket()
  
  
}


let peerList = []

function createServer() {
  return new Promise((fulfill, reject) => {
    let server = net.createServer()
    
    server.on('connection', (connection) => {
      let address = connection.remoteAddress + ':' + connection.remotePort
      console.log('new client connection from %s', address)

      connection.setEncoding('utf8')

      connection.on('data', (data) => {
        if (data.startsWith('T')) {
          connection.trackingAddress = data.replace('T', '')
        }

        console.log(`Recieved ${data} from ${address}`)
        // msg(connection, data)
      })

      connection.once('close', () => {
        console.log(`${address} Connection Closed`)
      })

      connection.on('error', (err) => {
        console.log(`Connection Error ${err} From ${address}`)
      })

      peers.push(connection)
    })
  })
}