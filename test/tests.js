var assert = require('assert')
var RqliteClient = require('../rqlite-client')

describe('Rqlite Client', function () {
  describe('create', function () {
    it('should get server status', function (done) {
      new RqliteClient('https://main.rqlite.stu.ecs.fornever.org/status')
    })
  })
})
