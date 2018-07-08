// Resources - natural things on a tile
// Area - things placed on a tile, maybe on the tiles to the side too? if same owner? I LIKE THIS! :D
// Items - things in an inventory

module.exports = {
  buildings: {
    'lumber-yard': {
      requirements: { logs: 4 },
      duration: 4,
      canDeploy: tile => !tile.building,
      enable: [
        'cut-trees'
      ]
    },

    'saw-mill': {
      requirements: { logs: 4 },
      duration: 4,
      canDeploy: tile => !tile.building,
      enable: [
        'cut-logs'
      ]
    },

    'log-shed': {
      requirements: { logs: 4 },
      duration: 4,
      canDeploy: tile => !tile.building,
      storage: { logs: 20 }
    },
  },

  actions: {
    'fell-tree': {
      input: { resources: { trees: 1 } },
      output: { area: { trees: 1 } },
    }

    'cut-trees': {
      input: { area: { trees: 1 } },
      output: { area: { logs: 2, 'tree-seeds': 2 } },
    },

    'cut-logs': {
      input: { area: { logs: 1 } },
      output: { area: { planks: 4 } },
    }
  },

  items: {
    'trees': {

    },

    'logs': {

    },

    'planks': {

    },

    'tree-seeds': {

    },
  },

  resources: {
    'trees' : {

    },
  },
}
