import React, { useRef, useState, useEffect, useContext } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import { Context, getContract, getAbi, getSymbol, Huffman, decode } from '../utils'

function ProjectInfo () {
  const { chainId, projectId } = useParams()
  const navigate = useNavigate()
  const { store, updateStore } = useContext(Context)
  
  const [ project, setProject ] = useState(null)
  const [ balance, setBalance ] = useState('')
  const input = useRef()

  const getBalance = async force => {
    if (force) {
      await window.ethereum.request({ method: "eth_requestAccounts" })
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const [ account ] = await window.ethereum.request({ method: "eth_accounts" })
    const balance = await provider.getBalance(account)
    setBalance(ethers.utils.formatEther(balance))
  }

  useEffect(() => {
    if (window.ethereum === undefined) {
      return updateStore({ message: 'Please make sure you have MetaMask! Then reload the page.' })
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const contract = new ethers.Contract(getContract(chainId), getAbi(), provider)
    const getProject = async () => {
      try {
        const project = await contract.getProject(projectId)
        if (!project.title) return
        setProject(project)
      } catch (error) {
        console.error(error)
        updateStore({ message: error.message, disabled: true })
      }
    }
    getProject()
    contract.on(contract.filters.FundsDonated(projectId), getProject)
    contract.on(contract.filters.FundsClaimed(projectId), getProject)
    getBalance()
    return () => {
      contract.off(contract.filters.FundsDonated(projectId), getProject)
      contract.off(contract.filters.FundsClaimed(projectId), getProject)
    }
  }, [])

  if (!project) return null

  const huffman2 = Huffman.Tree.decodeTree(JSON.parse(project.imageMeta).tree)
  const decodedOnce = huffman2.decode(project.encodedImage)
  const percentage = project.fundedAmount.mul(10*10).div(project.requestedAmount).toNumber()
  const toClaim = ethers.utils.formatEther(project.fundedAmount.sub(project.claimedAmount))
  
  return (
    <div className='ProjectInfo'>
      <div className='bar'>
        <div className="top">
          <Link to={`/${chainId}`}>Back</Link>
          <span className='amounts'>{percentage}% funded of <b>{ethers.utils.formatEther(project.requestedAmount)} {getSymbol(chainId)}</b></span>
        </div>
        <div className='progress'><div style={{ width: percentage + '%' }} /></div>
      </div>
      <pre className='image'>{decode(decodedOnce).replaceAll('W', ' ').replaceAll('B', '•').match(/.{1,80}/g).join('\n')}</pre>
      <div className="content">
        <div className="title">
          <h3>{project.title}</h3>
        </div>
        <p className='description'>{project.description}</p>
        <ul>
          {project.donators.map((d, i) =>
            <li key={'li' + i}>
              {+window.ethereum.selectedAddress === +d ? (
                <b>You</b>
              ) : (
                <span>{d}</span>
              )} donated {ethers.utils.formatEther(project.donatedAmounts[i])} {getSymbol(chainId)}
            </li>
          )}
        </ul>
        <div className="interact">
          {balance ? (
            <p className='connect'>{Math.floor(balance * 100) / 100} {getSymbol(chainId)}</p>
          ) : (
            <button onClick={() => getBalance(true)} className='connect'>Connect</button>
          )}
          {+window.ethereum.selectedAddress === +project.creator ? (
            +toClaim ? (
              <button className='claim' onClick={async () => {
                try {
                  await window.ethereum.request({ method: "eth_requestAccounts" })
                  
                  const provider = new ethers.providers.Web3Provider(window.ethereum)
                  const signer = provider.getSigner()
                  const contract = new ethers.Contract(getContract(chainId), getAbi(), signer)

                  const tx = await contract.claimProjectFunds(projectId)
                  updateStore({ message: 'Please wait…' })
                  await tx.wait()
                  
                } catch (error) {
                  console.error(error)
                  updateStore({ message: error.message })
                }
              }}>
                Claim {toClaim} {getSymbol(chainId)}
              </button>
            ) : (
              <span>Nothing to claim for now</span>
            )
          ) : (
            <>
              <span>I wish to help with</span>
              <input ref={input} type="number" name="amount" placeholder='1.0' />
              <button className='donate' onClick={async () => {
                try {
                  await window.ethereum.request({ method: "eth_requestAccounts" })
  
                  const provider = new ethers.providers.Web3Provider(window.ethereum)
                  const signer = provider.getSigner()
                  const contract = new ethers.Contract(getContract(chainId), getAbi(), signer)
    
                  const value = ethers.utils.parseEther(input.current.value)
                  const tx = await contract.donateToProject(projectId, { value })
                  updateStore({ message: 'Please wait…' })
                  await tx.wait()
                  
                } catch (error) {
                  console.error(error)
                  updateStore({ message: error.message })
                }
              }}>
                Donate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectInfo