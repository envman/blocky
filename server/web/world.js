lords = function() {
  let update
  let color = getRandomColor()
  
  setInterval(() => {
    fetch('/world')
      .then(r => r.json())
      .then(data => {
        console.log(data)
        if (update) {
          update(data)
        }
      })
  }, 1000)
  
  return {
    update: (cb) => update = cb,
    
    select: (x, y) => {
      fetch('https://api.github.com/gists', {
        method: 'post',
        body: JSON.stringify({x: x, y: y, color: color})
      })
    }
  }
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}