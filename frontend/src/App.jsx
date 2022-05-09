import React, { useState, useEffect } from 'react'
import { Outlet, Link, useParams, useNavigate } from "react-router-dom"
import { useQuery } from '@apollo/client'
import { ethers, BigNumber } from 'ethers'
import { Context, getContract, getAbi, getNetwork } from './utils'
import Header from './components/Header'
import './index.css'
import { ALL_PROJECTS } from './graphql'

function App () {
  const { chainId } = useParams()
  const navigate = useNavigate()
  const [ store, setStore ] = useState({
    balance: null,
  })

  const [ _projects, setProjects ] = useState([])
  const { loading, error, data: { projects = [] } = {} } = useQuery(ALL_PROJECTS)

  const updateStore = update => setStore({ ...store, ...update })

  const getProjects = async () => {
    try {
      if (window.ethereum.chainId && +window.ethereum.chainId !== +chainId) throw Error('wrong chain!')
      window.projects = await window.contract.getProjects()
      setProjects([ ...window.projects ].reverse())

    } catch (error) {
      console.error(error)
      updateStore({ message: `Make sure you’re on ${getNetwork(chainId)}! Then reload the page.`, disabled: true })
    }
  }

  useEffect(() => {
    // if (window.ethereum === undefined) {
    //   return updateStore({ message: 'Please make sure you have MetaMask! Then reload the page.', disabled: true })
    // }
    // window.provider = new ethers.providers.Web3Provider(window.ethereum)
    // window.contract = new ethers.Contract(getContract(chainId), getAbi(), window.provider)
    // getProjects()
    // window.contract.on('ProjectCreated', getProjects)
    // window.contract.on('FundsDonated', getProjects)
    // window.contract.on('FundsClaimed', getProjects)
    // return () => {
    //   window.contract.off('ProjectCreated', getProjects)
    //   window.contract.off('FundsDonated', getProjects)
    //   window.contract.off('FundsClaimed', getProjects)
    // }
  }, [])

  return (
    <Context.Provider value={{ store, updateStore }}>
      <main>
        <Header />
        <h2>All campaigns</h2>
        <div className="projects">
          {projects.map((p, i) => {
            const percentage = BigNumber.from(p.fundedAmount).mul?.(100).div(p.requestedAmount).toNumber()
            return (
              <Link to={p.id} className={`Project plain ${+window.ethereum?.selectedAddress === +p.creator && 'mine'}`} key={p.id}>
                <img className='img' src={p.image} alt="" />
                <div className="content">
                  <div className="title">
                    <h3>{p.title}</h3>
                  </div>
                  <p className='description'>{p.description}</p>
                  <div className="bottom">
                    <div>
                      <div className='progress'><div style={{ width: percentage + '%' }} /></div>
                      <span className='amounts'>{percentage}% funded of <b>{ethers.utils.formatUnits(p.requestedAmount, 18)} cUSD</b></span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        <div className='Outlet'>
          <Outlet />
          <div className="overlay" />
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
