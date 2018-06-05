const buildings = require('./buildings')

module.exports = {

  // Build a building on a space
  'build': (action, context) => {
    const building = buildings[action.building]
    const tile = context.land[position]

    if (building.canDeploy(tile)) {
      context.contracts.building(action.position, action.building, building.requirements, context.index, building.duration)
      context.land[action.position].contract = true
    }

    // TODO: what do we do if its invalid?
  },


  'spawn': (action, context) => {
    

    context.people.push({
      owner: '',
      name: '',
      position: '',
    })
  },

  // Move an amount of items from x to y
  'move': (action, context) => {
    const from = action.from
    const to = action.to
  },

  'transfer': (action, context) => {

  },

  'create-user': (action, context) => {

  },

  'plough': (action, context) => {

  },

  'harvest': (action, context) => {

  },
}
