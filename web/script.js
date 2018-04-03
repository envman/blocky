let size = 50
let offset = { x:0, y:0 }
let btnheight = 40

let land
let me
let selected
let lastWorld

document.addEventListener("DOMContentLoaded", function(event) {
  var elem = document.getElementById('myCanvas'),
    elemLeft = elem.offsetLeft,
    elemTop = elem.offsetTop,
    context = elem.getContext('2d'),
    elements = [];

  let world = lords()

  let grid = []

  for (let x = 0; x < 10; x++) {
    grid[x] = []
    for (let y = 0; y < 10; y++) {
      grid[x][y] = {
        color: "black"
      }
    }
  }

  document.addEventListener("keyup", (e) => {
    // console.log(e.keyCode)
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
        let opts = available(lastWorld.land[selected], lastWorld.land[selected].owner == me)
        let index = Math.floor((fullY - 200) / btnheight)

        console.log(opts[index])
      }
    } else {
      let x = Math.floor(fullX / size) - offset.x
      let y = Math.floor(fullY / size) - offset.y

      selected = `${x}:${y}`
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
  for (let x = -10; x < 10; x++) {
    grid[x] = []
    for (let y = -10; y < 10; y++) {
      grid[x][y] = {
        color: "black"
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

    if (key == selected) {
      grid[x][y].border = 'white'
    } else if (land[key].owner == me) {
      grid[x][y].border = 'green'
      // color = '#f97639'
    } else {
      grid[x][y].border = 'black'
      // color = '#e3ffe0'
    }

    grid[x][y].color = colors[land[key].type]
  }
}

function available(land, owner) {
  if (!owner) return []

  if (land.type == 'grass') {
    return [
      'Build Farm',
      'Build Road'
    ]
  }

  return ['Build Road']
}

function draw(context, grid) {
  context.clearRect(0, 0, 500, 500)

  for (let row of grid) {
    for (let cell of row) {

      let x = grid.indexOf(row)
      let y = row.indexOf(cell)
      let left = x * size
      let top = y * size

      context.fillStyle = cell && cell.border || 'black'
      context.fillRect(left, top, size, size)

      context.fillStyle = cell.color
      context.fillRect(left + 1, top + 1, size - 2, size - 2)
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
}
