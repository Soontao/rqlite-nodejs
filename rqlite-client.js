var request = require('request-promise')
var debug = require('debug')('rqlite')
var _ = require('lodash')

/**
 * RqliteClinet
 * 
 * @class RqliteClinet
 */
class RqliteClinet {
  /**
   * Creates an instance of RqliteClinet.
   * @param {string} apiUri 
   * @param {string} [username=''] 
   * @param {string} [password=''] 
   * @memberof RqliteClinet
   */
  constructor (apiUri, username = '', password = '') {
    if (username && password) {
      this.useBasicAuth = true
      this.basicAuth = {
        username,
        password
      }
    }
    this.apiUri = apiUri
    this._refreshServerStatus()
  }

  async _refreshServerStatus () {
    try {
      this.serverStatus = new ServerStatus(
        (await request({
          uri: this.apiUri,
          auth: this.basicAuth,
          json: true
        }))
      )
      debug(`get server status from ${this.apiUri}`)
      await this._selectNode()
    } catch (error) {
      debug(`${error.message}`)
    }
  }

  _formatAddr (sAddr = '') {
    if (sAddr.startsWith('https://') || sAddr.startsWith('http://')) {
      return sAddr
    } else {
      return `http://${sAddr}`
    }
  }

  /**
   * Select the fastest node
   * 
   * @memberof RqliteClinet
   */
  async _selectNode () {
    this.apiUri = '' // delete previous api uri
    var aNodeAPIAddr = _.values(this.serverStatus.store.meta.APIPeers)
    _.map(aNodeAPIAddr, async sApiAddr => {
      try {
        var formatedAddr = this._formatAddr({
          uri: sApiAddr,
          json: true,
          auth: this.basicAuth
        })
        await request(`${formatedAddr}/status`)
        if (!this.apiUri) {
          this.apiUri = formatedAddr
          debug(`rqlite client api uri reset to ${formatedAddr}`)
        }
      } catch (error) {
        debug(`access ${formatedAddr} failed, the node maybe down !`)
        debug(`${error.message}`)
      }
    })
  }

  /**
   * query
   * 
   * @param {string} sSql 
   * @returns 
   * @memberof RqliteClinet
   */
  async query (sSql) {
    return request({
      uri: `${this.apiUri}/db/query?timings&q=${sSql}`,
      method: 'GET',
      json: true,
      auth: this.basicAuth
    })
  }

  /**
   * execute sqls
   * 
   * @param {Array<string>} aSql 
   * @returns 
   * @memberof RqliteClinet
   */
  async execute (aSql) {
    if (!Array.isArray(aSql)) {
      aSql = [aSql]
    }
    return request({
      uri: `${this.apiUri}/db/execute?timings`,
      method: 'POST',
      json: true,
      auth: this.basicAuth,
      body: aSql
    })
  }

  /**
   * transaction execute
   * 
   * @param {Array<string>} aSql 
   * @returns 
   * @memberof RqliteClinet
   */
  async transaction (aSql) {
    return request({
      uri: `${this.apiUri}/db/execute?timings&transaction`,
      method: 'POST',
      json: true,
      auth: this.basicAuth,
      body: aSql
    })
  }
}

class ServerStatus {
  constructor (status) {
    this.build = status.build
    this.http = status.http
    this.mux = status.mux
    this.node = status.node
    this.runtime = status.runtime
    this.store = {
      addr: status.store.addr,
      apply_timeout: status.store.apply_timeout,
      meta: {
        APIPeers: status.store.meta.APIPeers
      },
      peers: status.store.peers,
      raft: status.store.raft,
      leader: status.store.leader,
      sqlite3: status.store.sqlite3,
      db_conf: status.store.db_conf
    }
  }
}

module.exports = RqliteClinet
