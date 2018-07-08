// Resources - natural things on a tile
// Area - things placed on a tile, maybe on the tiles to the side too? if same owner? I LIKE THIS! :D
// Items - things in an inventory

module.exports = {
  buildings: {
    'building': {
      requirements: { logs: 4 },
      duration: 4,
      canDeploy: tile => !tile.building,
      enable: [
        'cut-trees'
      ]
    },
  },

  actions: {
    'do-something': {
      input: { resources: { trees: 1 } },
      output: { area: { trees: 1 } },
    }
  },

  items: {
    'item': {

    },
  },

  resources: {
    'resource' : {

    },
  },
}
