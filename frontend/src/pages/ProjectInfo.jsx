import React, { useRef, useState, useEffect, useContext } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import { Context, getContract, getAbi, Qavah, useBalance, getCUSDContract } from '../utils'

function ProjectInfo () {
  const { chainId, projectId } = useParams()
  const navigate = useNavigate()
  const { store, updateStore } = useContext(Context)
  
  const [ project, setProject ] = useState(null)
  const input = useRef()

  const [ qavahs, setQavahs ] = useState([])
  const { balance, getBalance } = useBalance()

  // const getBalance = async force => {
  //   if (force) {
  //     await window.ethereum.request({ method: "eth_requestAccounts" })
  //   }
  //   const provider = new ethers.providers.Web3Provider(window.ethereum)
  //   const [ account ] = await window.ethereum.request({ method: "eth_accounts" })
  //   const balance = await provider.getBalance(account)
  //   setBalance(ethers.utils.formatEther(balance))
  // }

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
        window.qavah = new ethers.Contract(project.qavah, Qavah.abi, provider.getSigner())
        setQavahs(await Promise.all([...Array(project.donators.length)].map((_, i) => 
          window.qavah.tokenURI(i).then(q => JSON.parse(atob(q.split(',')[1]))).catch(() => '')
        )))
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

  const percentage = project.fundedAmount.mul(100).div(project.requestedAmount).toNumber()
  const toClaim = ethers.utils.formatUnits(project.fundedAmount.sub(project.claimedAmount), 18) / 100
  
  return (
    <div className='ProjectInfo'>
      <div className='bar'>
        <div className="top">
          <Link to={`/${chainId}`}>Back</Link>
          <span className='amounts'>{percentage}% funded of <b>{ethers.utils.formatUnits(project.requestedAmount, 18) / 100} cUSD</b></span>
        </div>
        <div className='progress'><div style={{ width: percentage + '%' }} /></div>
      </div>
      <img className='img' src={project.image} alt="" />
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
              )} donated {qavahs[i].amount / 100} cUSD
              {qavahs[i] && <object data={qavahs[i].image} type="image/svg+xml" />}
            </li>
          )}
        </ul>
        <div className="interact">
          {balance ? (
            <p className='connect'>{(balance / 100).toFixed(2)} cUSD</p>
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
                  getBalance()
                  
                } catch (error) {
                  console.error(error)
                  updateStore({ message: error.message })
                }
              }}>
                Claim {toClaim} cUSD
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
                  const cUSD = getCUSDContract(signer)

                  const value = ethers.utils.parseUnits((input.current.value * 100).toString(), 18)
                  await cUSD.approve(getContract(chainId), value)
                  const tx = await contract.donateToProject(projectId, value)
                  updateStore({ message: 'Please wait…' })
                  await tx.wait()
                  getBalance()
                  
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