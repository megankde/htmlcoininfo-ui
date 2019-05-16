import * as HtmlcoininfoAPI from '@/services/htmlcoininfo-api'

class Address {
  static get(id, options = {}) {
    return HtmlcoininfoAPI.get(`/address/${id}`, options)
  }

  static getBalance(id, options = {}) {
    return HtmlcoininfoAPI.get(`/address/${id}/balance`, options)
  }

  static getUtxo(id, options = {}) {
    return HtmlcoininfoAPI.get(`/address/${id}/utxo`, options)
  }

  static getTransactions(id, {page, pageSize}, options = {}) {
    return HtmlcoininfoAPI.get(`/address/${id}/txs`, {params: {page, pageSize}, ...options})
  }

  static getBalanceTransactions(id, {page, pageSize}, options = {}) {
    return HtmlcoininfoAPI.get(`/address/${id}/balance-history`, {params: {page, pageSize}, ...options})
  }

  static getTokenBalanceTransactions(id, {tokens, page, pageSize}, options = {}) {
    return HtmlcoininfoAPI.get(`/address/${id}/hrc20-balance-history`, {params: {tokens, page, pageSize}, ...options})
  }
}

export default Address
