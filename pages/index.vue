<template>
  <div class="container">
    <section class="columns is-multiline is-desktop">
      <div class="column">
        <div class="card">
          <div class="card-header">
            <div class="card-header-icon">
              <Icon icon="tachometer-alt" fixedWidth />
            </div>
            <h3 class="card-header-title">
              {{ $t('misc.network_statistics') }}
            </h3>
          </div>
          <div class="card-body">
            <p class="information">
              <span class="key">{{ $t('blockchain.blockchain_height') }}</span>:
              <span class="value">{{ blockchain.height.toLocaleString() }}</span>
            </p>
            <p class="information">
              <span class="key">{{ $t('blockchain.network_weight') }}</span>:
              <span class="value">{{ netStakeWeight | htmlcoin(8) }}</span>
            </p>
            <p class="information">
              <span class="key">{{ $t('blockchain.fee_rate') }}</span>:
              <span class="value">{{ feeRate }} HTMLCOIN/kB</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="columns is-multiline is-desktop">
      <div class="column is-half">
        <div class="card">
          <div class="card-header">
            <div class="card-header-icon">
              <Icon icon="cubes" fixedWidth />
            </div>
            <h3 class="card-header-title">
              {{ $tc('blockchain.block', 2) }}
            </h3>
            <nuxt-link to="/block" class="card-header-button button is-htmlcoin is-outlined">
              {{ $t('action.view_all') }}
            </nuxt-link>
          </div>
          <div class="card-body">
            <div v-for="block in recentBlocks" class="htmlcoin-block is-size-7" :key="block.hash">
              <div class="level">
                <div class="level-left">
                  <nuxt-link :to="{name: 'block-id', params: {id: block.height}}"
                    class="level-item htmlcoin-block-box has-text-centered">
                    {{ $tc('blockchain.block', 1) }} #{{ block.height }}
                    <FromNow :timestamp="block.timestamp" />
                  </nuxt-link>
                  <div class="level-item">
                    <div>
                      <i18n path="block.brief.address">
                        <AddressLink :address="block.miner" />
                      </i18n>
                      <br>
                      {{ $t('block.brief.transaction', [block.transactionCount, block.interval]) }}
                      <br>
                      <span class="monospace">
                        {{ $t('block.brief.reward') }} {{ block.reward | htmlcoin }} HTMLCOIN
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="column is-half">
        <div class="card">
          <div class="card-header">
            <div class="card-header-icon">
              <Icon icon="list-alt" fixedWidth />
            </div>
            <h3 class="card-header-title">
              {{ $tc('blockchain.transaction', 2) }}
            </h3>
          </div>
          <div class="card-body">
            <div v-for="transaction in recentTransactions" :key="transaction.id" class="is-size-7 transaction">
              <div class="level">
                <TransactionLink :transaction="transaction.id" class="level-left" />
                <span class="level-right">{{ transaction.outputValue | htmlcoin }} HTMLCOIN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
  import Block from "@/models/block"
  import Transaction from "@/models/transaction"
  import Misc from '@/models/misc'
  import {RequestError} from '@/services/htmlcoininfo-api'

  export default {
    head() {
      return {
        title: 'htmlcoin.info',
        titleTemplate: null
      }
    },
    data() {
      return {
        recentBlocks: [],
        recentTransactions: [],
        netStakeWeight: 0,
        feeRate: 0
      }
    },
    async asyncData({req, error}) {
      try {
        let [recentBlocks, recentTransactions, {netStakeWeight, feeRate}] = await Promise.all([
          Block.getRecentBlocks({ip: req && req.ip}),
          Transaction.getRecentTransactions({ip: req && req.ip}),
          Misc.info({ip: req && req.ip})
        ])
        return {recentBlocks, recentTransactions, netStakeWeight, feeRate}
      } catch (err) {
        if (err instanceof RequestError) {
          error({statusCode: err.code, message: err.message})
        } else {
          error({statusCode: 500, message: err.message})
        }
      }
    },
    computed: {
      blockchain() {
        return this.$store.state.blockchain
      }
    },
    methods: {
      async onBlock(block) {
        if (block.height === this.recentBlocks[0].height + 1) {
          block.transactionCount = block.transactions.length
          this.recentBlocks.unshift(block)
          this.recentBlocks.pop()
        } else {
          this.recentBlocks = await Block.getRecentBlocks()
        }
      },
      onMempoolTransaction(transaction) {
        this.recentTransactions.unshift(transaction)
        if (this.recentTransactions.length > 27) {
          this.recentTransactions.pop()
        }
      }
    },
    mounted() {
      this._onBlock = this.onBlock.bind(this)
      this._onMempoolTransaction = this.onMempoolTransaction.bind(this)
      this.$websocket.on('block', this._onBlock)
      this.$websocket.on('mempool/transaction', this._onMempoolTransaction)
      this.$interval = setInterval(async () => {
        try {
          let {netStakeWeight, feeRate} = await Misc.info()
          this.netStakeWeight = netStakeWeight
          this.feeRate = feeRate
        } catch (err) {
          if (!(err instanceof RequestError)) {
            throw err
          }
        }
      }, 10 * 60 * 1000)
    },
    beforeDestroy() {
      this.$websocket.off('block', this._onBlock)
      this.$websocket.off('mempool/transaction', this._onMempoolTransaction)
      clearInterval(this.$interval)
    }
  }
</script>

<style lang="less" scoped>
  @import '../styles/variables.less';

  .columns.is-desktop {
    margin: 0;
  }

  .htmlcoin-block {
    padding: 1em;
    border-top: 1px solid #eee;
    &:first-child {
      border-top: none;
    }
  }

  .htmlcoin-block-box {
    flex-direction: column;
    min-width: 11em;
    padding: 1em;
    background-color: #eee;
    color: inherit;
    &:hover {
      outline: 1px solid @htmlcoin;
    }
  }

  .information {
    padding: 0.1em 1em;
    &:first-child {
      padding-top: 0.5em;
    }
    &:last-child {
      padding-bottom: 0.5em;
    }
    .value {
      font-family: monospace
    }
  }

  .transaction {
    padding: 0.5em 1em;
    border-top: 1px solid #eee;
    &:first-child {
      border-top: none;
    }
    font-family: monospace;
  }
</style>
