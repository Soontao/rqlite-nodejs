var assert = require('assert')
var RqliteClient = require('../rqlite-client')
var rqliteClient = new RqliteClient(
  'https://node.1.rqlite.fornever.org/status'
)

describe('Rqlite Client', function () {
  describe('DB Tests', function () {
    it('create db', async () => {
      try {
        var res = await rqliteClient.execute(
          'CREATE TABLE foo (id INTEGER NOT NULL PRIMARY KEY, name TEXT);'
        )
        assert.ok(res)
      } catch (error) {
        assert.ok(error)
      }
    })
  })
})
