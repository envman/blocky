const Contracts = function() {
  this.contracts = []
}

Contracts.prototype.add = function(contract) {
  this.contracts.push(contract)
}

Contracts.prototype.execute = function(opts) {

  for (let contract of this.contracts) {
    let context = {
      contract: contract,
      index: opts.index,
      sq: opts.land[contract.pos],
      land: opts.land,
    }

    if (contract.type == 'condition') {
      if (contract.check(context)) {
        contract.done(opts.land[contract.pos])
        delete opts.land[contract.pos].contract
        contract.completed = true
      }
    } else if (contract.type == 'step') {
      if (contract.check(context)) {
        if (!contract.complete(context)) {
          contract.step(context)
        } else {
          contract.done(context)
          delete opts.land[contract.pos].contract
          contract.completed = true
        }
      }
    }
  }

  this.contracts = this.contracts.filter(c => !c.completed)
}

Contracts.prototype.building = function(pos, type, resources, start, duration) {

  this.add({
    type: 'condition',
    view: () => ({ type, resources }),
    pos: pos,
    done: (sq) => {
      for (let resource of Object.getOwnPropertyNames(resources)) {
        sq[resource] -= resources[resource]
      }

      sq.building = type
    },
    start: start,
    check: ctx => {
      for (let resource of Object.getOwnPropertyNames(resources)) {
        if ((ctx.sq[resource] || 0) < resources[resource]) {
          return false
        }

        return ctx.index > ctx.contract.start + duration
      }
    }
  })
}

Contracts.prototype.move = function(pos, resource, target) {
  this.add({
    type: 'step',
    view: () => ({ type: `move-${resource}` }),
    pos: pos,
    done: ctx => {
      delete ctx.land[pos].pending
    },
    // start: start,
    check: ctx => {
      return true
    },
    complete: ctx => !ctx.land[pos][resource] || ctx.land[pos][resource] == 0,
    step: ctx => {
      ctx.land[pos].pending = true
      ctx.land[pos][resource]--

      if (!ctx.land[target][resource]) {
        ctx.land[target][resource] = 0
      }

      ctx.land[target][resource]++
    }
  })
}

Contracts.prototype.view = function() {
  let contracts = {}

  this.contracts.map(c => contracts[c.pos] = c.view())

  return contracts
}

module.exports = Contracts
