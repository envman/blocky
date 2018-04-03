lords = function() {
  let update
  let color = getRandomColor()
  
  setInterval(() => {
    fetch('/view')
      .then(r => r.json())
      .then(data => {
        console.log(data)
        if (update) {
          update(data)
        }
      })
  }, 5000)
  
  return {
    update: (cb) => update = cb,
    
    select: (x, y) => {
      var request = new Request('/move', {
        method: 'post',
      	headers: new Headers({
      		'Content-Type': 'application/json'
      	}),
        body: JSON.stringify({x: x, y: y, color: color})
      })
      
      fetch(request)
        .then(() => {
          console.log('happy')
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