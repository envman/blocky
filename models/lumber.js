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

    },

    'log-shed': {

    },
  },

  skills: {
    'cut-trees': {

    },

    'cut-logs': {

    }
  },

  items: {
    'tree': {

    },

    'log': {

    },

    'plank': {

    },

    'tree-seeds': {

    },
  },

  resources: {
    'tree' : {

    },
  },
}
