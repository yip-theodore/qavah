import React, { useState, useEffect } from 'react'
import { Outlet, Link, useParams, useNavigate } from "react-router-dom"
import { ethers } from 'ethers'
import { Context, getContract, getAbi, getSymbol, Huffman, decode } from './utils'
import './index.css'

function App () {
  const { chainId } = useParams()
  const navigate = useNavigate()
  const [ store, setStore ] = useState({})

  const [ projects, setProjects ] = useState([])

  const updateStore = update => setStore({ ...store, ...update })

  const getProjects = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(getContract(chainId), getAbi(), provider)
      window.projects = await contract.getProjects()
      console.log(projects)
      setProjects(window.projects)
      updateStore({ message: '' })
    } catch (error) {
      console.error(error)
      updateStore({ message: 'Make sure you’re on the right network! Then reload the page.', disabled: true })
    }
  }

  useEffect(() => {
    if (window.ethereum === undefined) {
      return updateStore({ message: 'Please make sure you have MetaMask! Then reload the page.', disabled: true })
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const contract = new ethers.Contract(getContract(chainId), getAbi(), provider)
    getProjects()
    contract.on('ProjectCreated', getProjects)
    contract.on('FundsDonated', getProjects)
    contract.on('FundsClaimed', getProjects)
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
            const huffman2 = Huffman.Tree.decodeTree(JSON.parse(p.imageMeta).tree)
            const decodedOnce = huffman2.decode(p.encodedImage)
            const percentage = p.fundedAmount.mul(10*10).div(p.requestedAmount).toNumber()
            return (
              <Link to={p.id} className='Project' key={i}>
                <pre className='image'>{decode(decodedOnce).replaceAll('W', ' ').replaceAll('B', '•').match(/.{1,80}/g).join('\n')}</pre>
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
