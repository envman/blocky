# BLOCKY

Prototype for a multiplayer game based on a blockchain...

## Testing

Start one client (genesis, username: first, port: 2000, difficulty: 3)
node index.js -g -u first -p 2000 -d 3

Start second client (username: second, server: 127.0.0.1:2000, apiPort: 8001, difficulty: 2)
node index.js -u second -s 127.0.0.1:2000 --apiPort 8001 -d 2

difficulty will be removed duh!