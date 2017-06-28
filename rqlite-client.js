var debug = require('debug')('rqlite')
var _ = require('lodash')
var https = require('https')
var keepAliveAgent = new https.Agent({ keepAlive: true })
var request = require('request-promise').defaults({ agent: keepAliveAgent })

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
      this.serverStatus = await request({ uri: this.apiUri, auth: this.basicAuth, json: true })
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
        var formatedAddr = this._formatAddr(sApiAddr)
        await request({
          uri: `${formatedAddr}/status`,
          json: true,
          auth: this.basicAuth
        })
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

module.exports = RqliteClinet
