import { createContext, useState, useEffect, useCallback } from 'react'
import contractAddresses from './contracts/contract-address.json'
import Contract from './contracts/Contract.json'
import { create as ipfsHttpClient } from "ipfs-http-client"
import _Qavah from './contracts/Qavah.json'
import { ethers } from 'ethers'
import CUSD from './contracts/CUSD.json'

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

// export const useContract = (abi, contractAddress) => {
//   const { getConnectedKit, address } = useContractKit();
//   const [contract, setContract] = useState(null);

//   const getContract = useCallback(async () => {
//     const kit = await getConnectedKit();
//     setContract(new kit.web3.eth.Contract(abi, contractAddress));
//   }, [getConnectedKit, abi, contractAddress]);

//   useEffect(() => {
//     if (address) getContract();
//   }, [address, getContract]);

//   return contract;
// };

// export const useMainContract = (chainId) =>
//   useContract(Contract.abi, contractAddresses[chainId]);

export const getCUSDContract = (signer) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const cUSD = new ethers.Contract('0x5FbDB2315678afecb367f032d93F642f64180aa3', CUSD.abi, signer || provider)
  return cUSD
}

export const useBalance = () => {
  const [balance, setBalance] = useState(0);
  
  const getBalance = useCallback(async () => {
    const cUSD = getCUSDContract()
    const value = await cUSD.balanceOf(window.ethereum.selectedAddress)
    setBalance(ethers.utils.formatUnits(value, 18));
  }, []);

  useEffect(() => {
    // if (address)
      getBalance();
  }, [getBalance]);

  return {
    balance,
    getBalance,
  }
};
