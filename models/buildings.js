module.exports = {
  'house': {
    requirements: { logs: 4 },
    duration: 4,
    canDeploy: (tile) => !tile.building,
  },

  'log-cutter': {
    requirements: { logs: 4 },
    duration: 4,
    canDeploy: tile => !tile.building,
    enable: {
      'cut-logs': {

      }
    }
  },
}
