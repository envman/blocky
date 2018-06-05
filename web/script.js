let size = 50
let offset = { x:0, y:0 }
let btnheight = 40

let land
let me
let selected
let lastWorld

let pendingAction

function image_set(name) {
  let set = {}
  for (let i = 1; i <= 8; i++) {
    set[i] = image(`${name}-${i}`, `resources/${name}`)
  }
  return set
}

let trees = image_set('trees')
let logs = image_set('logs')

function image(name, folder) {
  var img = new Image
  folder = folder || 'resources'

  img.src = `/${folder}/${name}.png`
  img.width = 50
  img.height = 50

  return img
}

let worker = image('worker')
let stones = image('stones')
let house = image('house')
let field = image('field')
let sign = image('sign')

document.addEventListener("DOMContentLoaded", function(event) {
  var elem = document.getElementById('myCanvas'),
    elemLeft = elem.offsetLeft,
    elemTop = elem.offsetTop,
    context = elem.getContext('2d'),
    elements = [];

  world = lords()

  let grid = []

  for (let x = 0; x < 10; x++) {
    grid[x] = []
    for (let y = 0; y < 10; y++) {
      grid[x][y] = {
        color: "white"
      }
    }
  }

  document.addEventListener("keyup", (e) => {
    if (e.keyCode == 37) { // left
      offset.x++
      render(grid, land, offset, me)
      draw(context, grid)
    } else if (e.keyCode == 38) { // up
      offset.y++
      render(grid, land, offset, me)
      draw(context, grid)
    } else if (e.keyCode == 39) { // right
      offset.x--
      render(grid, land, offset, me)
      draw(context, grid)
    } else if (e.keyCode == 40) { // down
      offset.y--
      render(grid, land, offset, me)
      draw(context, grid)
    }
  }, false);

  draw(context, grid)

  world.update(world => {
    me = world.me.record.key
    land = world.land
    lastWorld = world

    render(grid, land, offset, me)
    draw(context, grid)
    drawSideBar(context, lastWorld)
  })

  elem.addEventListener('click', function(event) {
    var fullX = event.pageX - elemLeft,
        fullY = event.pageY - elemTop

    if (fullX > 499) {
      if (fullY > 200) {
        if (pendingAction) return

        let opts = available(lastWorld.land[selected], lastWorld.land[selected].owner == me)
        let index = Math.floor((fullY - 200) / btnheight)

        if (opts[index] !== 'cut-trees' && opts[index] !== 'move-logs') {
          world.action({ pos: selected, action: opts[index]})
        } else {
          pendingAction = {
            pos: selected,
            action: opts[index],
          }
        }

        selected = undefined
      }
    } else {
      let x = Math.floor(fullX / size) - offset.x
      let y = Math.floor(fullY / size) - offset.y

      if (pendingAction) {
        pendingAction.to = `${x}:${y}`
        world.action(pendingAction)
        pendingAction = undefined
      } else {
        selected = `${x}:${y}`
      }
    }

    render(grid, land, offset, me)
    draw(context, grid)
    drawSideBar(context, lastWorld)

  }, false)
})

let colors = {
  grass: '#2b8436',
  stone: '#9fa3a0'
}

function render(grid, land, offset, me) {
  for (let x = 0; x < 10; x++) {
    grid[x] = []
    for (let y = 0; y < 10; y++) {
      grid[x][y] = {
        color: "white"
      }
    }
  }

  for (let key of Object.getOwnPropertyNames(land)) {
    let parts = key.split(':')

    let x = Number(parts[0]) + offset.x
    let y = Number(parts[1]) + offset.y

    let color

    if (!grid[x] || !grid[x][y]) {
      continue
    }

    grid[x][y] = land[key]
  }
}

let all_actions = [
  { action: 'cut-trees', available: l => l.trees > 0 },
  { action: 'build-house', available: l => l.type == 'grass' && !l.building && !l.contract },
  { action: 'plough', available: l => l.type == 'grass' && !l.building && !l.contract },
  { action: 'move-logs', available: l => l.logs > 0 },
  { action: 'harvest', available: l => l.plouged && l.ready },
  { action: 'build-shed', available: l => l.type == 'grass' && !l.building && !l.contract },

  // Testing
  { action: 'spawn', available: l => !l.building && !l.contract },
]

function available(land, owner) {
  if (!owner) return []

  return all_actions
    .filter(a => a.available(land))
    .map(a => a.action)
}

function draw(context, grid) {
  context.clearRect(0, 0, 500, 500)

  for (let row of grid) {
    for (let cell of row) {

      let x = grid.indexOf(row)
      let y = row.indexOf(cell)
      let left = x * size
      let top = y * size

      context.fillStyle = 'white'
      context.fillRect(left, top, size, size)

      if (cell.trees > 0) {
        context.drawImage(trees[cell.trees], left, top, size, size)
      }

      if (cell.logs > 0) {
        context.drawImage(logs[cell.logs], left, top, size, size)
      }

      if (cell.type == 'stone') {
        context.drawImage(stones, left, top, size, size)
      }

      if (cell.pending) {
        context.drawImage(worker, left, top, size, size)
      }

      if (cell.plouged) {
        context.drawImage(field, left, top, size, size)
      }

      if (cell.contract) {
        context.drawImage(sign, left, top, size, size)
      }

      if (cell.building == 'house') {
        context.drawImage(house, left, top, size, size)
      }
    }
  }
}

function drawSideBar(context, world) {
  let start = size * 10
  context.clearRect(start, 0, start + 200, 500)

  context.fillStyle = 'black'
  context.font = "20px Arial"
  context.fillText(`Money: ${world.cash}`, start, 30)

  if (!selected) return

  let opts = available(world.land[selected], world.land[selected].owner == me)

  for (let opt of opts) {
    let i = opts.indexOf(opt)
    let y = 200 + (btnheight * i)

    context.fillStyle = 'darkgrey'
    context.fillRect(start, y, 200, btnheight)

    context.fillStyle = 'lightgrey'
    context.fillRect(start + 1, y + 1, 198, btnheight - 2)

    context.fillStyle = 'black'
    context.fillText(opt, start, y + 30)
  }

  let contract = world.contracts[selected]

  if (contract) {
    context.fillText('Contract', start, 100)

    for (let resource of Object.getOwnPropertyNames(contract.resources)) {
      console.log(`${resource}:${contract.resources[resource]}`)
      context.fillText(`${resource}:${contract.resources[resource]}`, start, 130)
    }
  }
}
