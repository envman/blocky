function first(cycle) {
  let x = 2 * cycle - 1
  
  return x * x
}

function cycle(index) {
  return Math.floor((isqrt(index) + 1) / 2)
}


function length(cycle) {
  return 8 * cycle
}
    
function sector(index) {
  let c = cycle(index)
  let offset = index - first(c)
  let n = length(c)
  
  return Math.floor(4 * offset / n)
}

function position(index) {
  if (index == 0) {
    return coord(0, 0)
  }
  
  let c = cycle(index)
  let s = sector(index)
  
  let offset = Math.floor(index - first(c) - Math.floor(s * length(c) / 4))
  
  if (s < 0.5) {
    return coord(-c, -c + offset + 1)
  }
      
  if (s < 1.5) {
    return coord(-c + offset + 1, c)
  } 
    
  if (s < 2.5) {
    return coord(c, c - offset - 1)
  }
  
  return coord(c - offset - 1, -c)
}
    

function isqrt(x) {
  if (x == 0) return 0
  
  let n = Math.floor(x / 2) + 1
  let n1 = Math.floor((n + Math.floor(x / n)) / 2)
  
  while (n1 < n) {
    n = n1
    n1 = Math.floor((n + Math.floor(x / n)) / 2)
  }
  
  return n
}

function coord(y, x) {
  return {x: x, y: y}
}

module.exports = position