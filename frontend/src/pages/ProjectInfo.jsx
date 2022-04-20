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
  const getBalance = useBalance(chainId)

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
        window.qavah = new ethers.Contract(project.qavah, Qavah.abi, provider)
        setQavahs(await Promise.all([...Array(project.donators.length)].map((_, i) => 
          window.qavah.tokenURI(i).then(q => JSON.parse(atob(q.split(',')[1]))).catch(() => '')
        )))
        setProject(project)
      } catch (error) {
        console.error(error)
        updateStore({ message: error.data?.message || error.message, disabled: true })
      }
    }
    getProject()
    contract.on(contract.filters.FundsDonated(projectId), getProject)
    contract.on(contract.filters.FundsClaimed(projectId), getProject)
    // getBalance()
    return () => {
      contract.off(contract.filters.FundsDonated(projectId), getProject)
      contract.off(contract.filters.FundsClaimed(projectId), getProject)
    }
  }, [])

  if (!project) return null

  const percentage = project.fundedAmount.mul(100).div(project.requestedAmount).toNumber()
  const toClaim = ethers.utils.formatUnits(project.fundedAmount.sub(project.claimedAmount), 18)
  const requested = ethers.utils.formatUnits(project.requestedAmount, 18)

  return (
    <div className='ProjectInfo'>
      <div className='bar'>
        <div className="top">
          <Link to={`/${chainId}`}>Back</Link>
          <span className='amounts'>{percentage}% funded of <b>{requested} cUSD</b></span>
        </div>
        <div className='progress'><div style={{ width: percentage + '%' }} /></div>
      </div>
      <img className='img' src={project.image} alt="" />
      <div className="content">
        <div className="title">
          <h3>{project.title}</h3>
        </div>
        {+window.ethereum.selectedAddress !== +project.creator && (
          <div className='creator'>
            <span className='small'>by</span> <Link to={`/${chainId}/user/${project.creator.toLowerCase()}`} className='userAddress' style={{ maxWidth: 'none' }}>{project.creator}</Link>
          </div>
        )}
        <p className='description'>{project.description}</p>
        <ul>
          {project.donators.map((d, i) =>
            <li key={`${i}_${d}`}>
              {+window.ethereum.selectedAddress === +d ? (
                <span>You</span>
              ) : (
                <Link to={`/${chainId}/user/${d.toLowerCase()}`} className='userAddress'>{d}</Link>
              )} donated {qavahs[i].amount} cUSD
              {/* {qavahs[i] && <object data={qavahs[i].image} type="image/svg+xml" />} */}
            </li>
          )}
        </ul>
        <div className="interact">
          {store.balance !== null ? (
            <p className='connect'>{store.balance} cUSD</p>
          ) : (
            <button onClick={() => getBalance(true)} className='connect'>Connect</button>
          )}
          {+window.ethereum.selectedAddress === +project.creator ? (
            +toClaim ? (
              <button className='claim' onClick={async () => {
                try {
                  updateStore({ message: 'Please wait…' })
                  await window.ethereum.request({ method: "eth_requestAccounts" })
                  
                  const provider = new ethers.providers.Web3Provider(window.ethereum)
                  const signer = provider.getSigner()
                  const contract = new ethers.Contract(getContract(chainId), getAbi(), signer)

                  const tx = await contract.claimProjectFunds(projectId)
                  await tx.wait()
                  updateStore({ message: '' })
                  getBalance()
                  
                } catch (error) {
                  console.error(error)
                  updateStore({ message: error.data?.message || error.message })
                }
              }}>
                Claim {toClaim} cUSD
              </button>
            ) : (
              <span>Nothing to claim for now</span>
            )
          ) : project.fundedAmount.lt(project.requestedAmount) ? (
            <>
              <button className='plain' onClick={() => {
                input.current.value = Math.max(+input.current.value - requested / 100, requested / 100)
              }}>-</button>
              <input ref={input} name="amount" defaultValue={requested / 100} />
              <button className='plain' onClick={() => {
                input.current.value = Math.min(+input.current.value + requested / 100, requested)
              }}>+</button>
              <button className='donate' onClick={async () => {
                try {
                  updateStore({ message: 'Please wait…' })
                  await window.ethereum.request({ method: "eth_requestAccounts" })
  
                  const provider = new ethers.providers.Web3Provider(window.ethereum)
                  const signer = provider.getSigner()
                  const contract = new ethers.Contract(getContract(chainId), getAbi(), signer)
                  const cUSD = await getCUSDContract(chainId, signer)
                  
                  const value = ethers.utils.parseUnits(input.current.value, 18)
                  await cUSD.approve(getContract(chainId), value)
                  const tx = await contract.donateToProject(projectId, value)
                  await tx.wait()
                  updateStore({ message: '' })
                  navigate(`/${chainId}/user/${window.ethereum.selectedAddress}`)
                  
                } catch (error) {
                  console.error(error)
                  updateStore({ message: error.data?.message || error.message })
                }
              }}>
                Donate
              </button>
            </>
          ) : (
            <span>The campaign is closed</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectInfo