import { createContext } from 'react'
import contractAddresses from './contracts/contract-address.json'
import Contract from './contracts/Contract.json'
import { create as ipfsHttpClient } from "ipfs-http-client"
import _Qavah from './contracts/Qavah.json'

export const Context = createContext()

export const getContract = chainId => contractAddresses[chainId]
export const getAbi = () => Contract.abi
export const getSymbol = chainId => ({
  4: 'ETH',
  97: 'BNB',
  1337: 'ETH',
  44787: 'CELO',
})[chainId]
export const getNetwork = chainId => ({
  4: 'Rinkeby Test Network',
  97: 'BSC Testnet',
  1337: 'localhost',
  44787: 'Celo Alfajores Testnet',
})[chainId]

export const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0")
export const Qavah = _Qavah
