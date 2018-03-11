let size = 50

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
        color: "#FFFFFF"
      }
    }
  }
  
  draw(context, grid)
  
  world.update(world => {
    for (let key of Object.getOwnPropertyNames(world)) {
      let parts = key.split('-')
      
      let x = parts[0]
      let y = parts[1]
      let color = world[key]
      
      grid[x][y].color = color
    }
    
    draw(context, grid)
  })
  
  elem.addEventListener('click', function(event) {
    var fullX = event.pageX - elemLeft,
        fullY = event.pageY - elemTop

    let x = Math.floor(fullX / size)
    let y = Math.floor(fullY / size)
      
    world.select(x, y)

  }, false);
})

function draw(context, grid) {
  context.clearRect(0, 0, 500, 500)
  
  for (let row of grid) {
    for (let cell of row) {
      context.fillStyle = cell.color
      let x = grid.indexOf(row)
      let y = row.indexOf(cell)
      let left = x * size
      let top = y * size
      
      context.fillRect(left, top, size, size)
    }
  }
}