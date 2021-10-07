/**
 * Pricecaster Service.
 *
 * Fetcher backend component.
 *
 * (c) 2021 Randlabs, Inc.
 */

import { IPriceFetcher } from './IPriceFetcher'
import { IStrategy } from './strategy/strategy'
import { getPythProgramKeyForCluster, PriceData, Product, PythConnection } from '@pythnetwork/client'
import { Cluster, clusterApiUrl, Connection } from '@solana/web3.js'
import { PriceTicker } from './PriceTicker'
const settings = require('../settings')

export class PythPriceFetcher implements IPriceFetcher {
  private strategy: IStrategy
  private symbol: string
  private pythConnection: PythConnection

  constructor (symbol: string, strategy: IStrategy) {
    const SOLANA_CLUSTER_NAME: Cluster = settings.pyth.solanaClusterName as Cluster
    const connection = new Connection(clusterApiUrl(SOLANA_CLUSTER_NAME))
    const pythPublicKey = getPythProgramKeyForCluster(SOLANA_CLUSTER_NAME)
    this.pythConnection = new PythConnection(connection, pythPublicKey)
    this.strategy = strategy
    this.symbol = symbol
  }

  start (): void {
    this.pythConnection.start()
    this.pythConnection.onPriceChange((product: Product, price: PriceData) => {
      if (product.symbol === this.symbol) {
        this.onPriceChange(price)
      }
    })
  }

  stop (): void {
    throw new Error('Method not implemented.')
  }

  setStrategy (s: IStrategy) {
    this.strategy = s
  }

  queryTicker (): PriceTicker {
    return this.strategy.getPrice()
  }

  private onPriceChange (price: PriceData) {
    const pt: PriceTicker = new PriceTicker(price.priceComponent,
      price.confidenceComponent, price.exponent, price.publishSlot)
    this.strategy.put(pt)
  }
}