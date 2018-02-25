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
  // console.log(grid)
  
  // for (let row of grid) {
  //   for (let cell of row) {
  //     context.fillStyle = cell.color;
  //     let x = grid.indexOf(row)
  //     let y = row.indexOf(cell)
  //     let left = x * size
  //     let top = y * size
  // 
  //     context.stokeStyle = 'black'
  //     // context.fillRect(left, top, size, size)
  //     context.rect(left, top, size, size)
  //     context.fill()
  // 
  //     // context.beginPath();
  //     // context.moveTo(left, top + size);
  //     // context.lineTo(left + size, top + size);
  //     // context.lineTo(left + size, top);
  //     context.stroke();
  //   }
  // }
  
  world.update(world => {
    for (let key of Object.getOwnPropertyNames(world)) {
      // console.log(key, world[key])
      let parts = key.split('-')
      
      let x = parts[0]
      let y = parts[1]
      let color = world[key]
      
      grid[x][y].color = color
      // console.log(grid)
      
    }
    
    draw(context, grid)
  })
  

    
    // Add event listener for `click` events.
  elem.addEventListener('click', function(event) {
      var fullX = event.pageX - elemLeft,
          fullY = event.pageY - elemTop;

      let x = Math.floor(fullX / size)
      let y = Math.floor(fullY / size)
      
      world.select(x, y)

  }, false);
  
  // var c = document.getElementById("myCanvas");
  // var ctx = c.getContext("2d");
  // ctx.moveTo(0,0);
  // ctx.lineTo(200,100);
  // ctx.stroke();
})

function draw(context, grid) {
  context.clearRect(0, 0, 500, 500)
  console.log('====draw====')
  
  for (let row of grid) {
    for (let cell of row) {
      if (cell.color != '#FFFFFF') {
        console.log(cell.color)
      }
      
      context.fillStyle = cell.color
      let x = grid.indexOf(row)
      let y = row.indexOf(cell)
      let left = x * size
      let top = y * size
      
      // console.log(`${x}-${y}:${cell.color}`)
      
      // context.stokeStyle = 'black'
      // context.rect(left, top, size, size)
      // context.fill()
      
      context.fillRect(left, top, size, size)
      
      // context.stroke();
    }
  }
}