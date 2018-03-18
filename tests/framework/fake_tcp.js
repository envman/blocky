const EventEmitter = require('events')

function createFakeyNetwork() {
  let servers = {}

  return {
    createServer: function() {
      let address

      let server = new EventEmitter()
      server.address = () => (address)
      server.listen = (port, cb) => {
        address = {port: port}
        servers[port] = server
        cb()
      }

      return server
    },

    createSocket: function() {
      let socket = new EventEmitter()

      socket.setEncoding = enc => socket.encoding = enc
      socket.connect = (port, ip, cb) => {
        let server = servers[port]
        let connection = new EventEmitter()
        connection.setEncoding = enc => connection.encoding = enc
        connection.remoteAddress = '192.168.0.11'
        connection.remotePort = port

        connection.write = msg => socket.emit('data', msg)
        socket.write = msg => connection.emit('data', msg)

        server.emit('connection', connection)

        cb()
      }
      return socket
    }
  }
}

module.exports = createFakeyNetwork
