lords = function() {
  let update
  let color = getRandomColor()

  setInterval(() => {
    fetch('/view')
      .then(r => r.json())
      .then(data => {

        if (update) {
          update(data)
        }
      })
  }, 1000)

  // _ = function(cmd) {
  //   var request = new Request('/cmd', {
  //     method: 'post',
  //     headers: new Headers({
  //       'Content-Type': 'application/json'
  //     }),
  //     body: JSON.stringify({ cmd })
  //   })
  //
  //   fetch(request)
  //     .then(() => {
  //       console.log('done')
  //     })
  // }

  return {
    update: (cb) => update = cb,

    // TESTING!
    give: (name) => {

    },

    difficulty: (num) => {

    },
    // END TESTING

    action: (action) => {
      var request = new Request('/action', {
        method: 'post',
      	headers: new Headers({
      		'Content-Type': 'application/json'
      	}),
        body: JSON.stringify(action)
      })

      fetch(request)
        .then(() => {
          console.log('done')
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
