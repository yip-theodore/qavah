import React, { useState, useEffect } from 'react'
import { Outlet, Link, useParams, useNavigate } from "react-router-dom"
import { ethers } from 'ethers'
import { Context, getContract, getAbi, getSymbol, getNetwork } from './utils'
import './index.css'

function App () {
  const { chainId } = useParams()
  const navigate = useNavigate()
  const [ store, setStore ] = useState({})

  const [ projects, setProjects ] = useState([])

  const updateStore = update => setStore({ ...store, ...update })

  const getProjects = async () => {
    try {
      window.projects = await window.contract.getProjects()
      setProjects([ ...window.projects ].reverse())
      updateStore({ message: '' })
    } catch (error) {
      console.error(error)
      updateStore({ message: `Make sure you’re on ${getNetwork(chainId)}! Then reload the page.`, disabled: true })
    }
  }

  useEffect(() => {
    if (window.ethereum === undefined) {
      return updateStore({ message: 'Please make sure you have MetaMask! Then reload the page.', disabled: true })
    }
    window.provider = new ethers.providers.Web3Provider(window.ethereum)
    window.contract = new ethers.Contract(getContract(chainId), getAbi(), window.provider)
    getProjects()
    window.contract.on('ProjectCreated', getProjects)
    window.contract.on('FundsDonated', getProjects)
    window.contract.on('FundsClaimed', getProjects)
    return () => {
      window.contract.off('ProjectCreated', getProjects)
      window.contract.off('FundsDonated', getProjects)
      window.contract.off('FundsClaimed', getProjects)
    }
  }, [])

  return (
    <Context.Provider value={{ store, updateStore }}>
      <main>
        <header>
          <h1>qavah</h1>
          <Link to='new' className={store.disabled && 'disabled'}>New project</Link>
        </header>
        <h2>All projects</h2>
        <div className="projects">
          {projects.map((p, i) => {
            const percentage = p.fundedAmount.mul(10*10).div(p.requestedAmount).toNumber()
            return (
              <Link to={p.id} className={`Project ${+window.ethereum.selectedAddress === +p.creator && 'mine'}`} key={i}>
                <img className='img' src={p.encodedImage} alt="" />
                <div className="content">
                  <div className="title">
                    <h3>{p.title}</h3>
                  </div>
                  <p className='description'>{p.description}</p>
                  <div className="bottom">
                    <div>
                      <div className='progress'><div style={{ width: percentage + '%' }} /></div>
                      <span className='amounts'>{percentage}% funded of <b>{ethers.utils.formatEther(p.requestedAmount)} {getSymbol(chainId)}</b></span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        <div className='Outlet'>
          <Outlet />
          <div className="overlay" onClick={() => navigate(`/${chainId}`)} />
        </div>
        {store.message && (
          <div className='Message'>
            <span>{store.message}</span>
            <button onClick={() => store.disabled ? window.location.reload() : updateStore({ message: '' })}>x</button>
          </div>
        )}
      </main>
    </Context.Provider>
  )
}

export default App
