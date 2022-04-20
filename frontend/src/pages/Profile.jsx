import React, { useState, useEffect, useContext } from 'react'
import { Outlet, Link, useParams, useNavigate } from "react-router-dom"
import { ethers } from 'ethers'
import { Context, getContract, getAbi, getSymbol, getNetwork, Qavah } from '../utils'

function Profile () {
  const { chainId, userAddress } = useParams()
  const navigate = useNavigate()
  const { store, updateStore } = useContext(Context)

  const [ contributions, setContributions ] = useState([])
  const [ campaigns, setCampaigns ] = useState([])

  useEffect(() => {
    setTimeout(async () => {
      try {
        const _projects = await window.contract.getProjectsByUser(userAddress)
        const projects = _projects.filter((p, i, a) => i === a.findIndex(p2 => p2.id === p.id)).reverse()
        setContributions(await Promise.all(
          projects.filter(p => +p.creator !== +userAddress)
          .map(p => {
            const qavah = new ethers.Contract(p.qavah, Qavah.abi, window.provider)
            return p.donators.map((d, i) => +d === +userAddress &&
              qavah.tokenURI(i).then(q => JSON.parse(atob(q.split(',')[1])))
            ).filter(Boolean).reverse()
          }).flat()
        ))
        setCampaigns(projects.filter(p => +p.creator === +userAddress))
      } catch (error) {
        console.error(error)
        updateStore({ message: error.data?.message || error.message })
      }
    })
  }, [userAddress])

  return (
    <div className='Profile'>
      {/* {!!contributions.length && ( */}
        <div className="contributions">
          <h2>{+userAddress === +window.ethereum.selectedAddress ? 'My contributions' : 'Public contributions'}</h2>
          <div className="projects">
            {contributions.map((p, i) => {
              const link = '/' + p.description.split('/').slice(3).join('/')
              return (
                <Link to={link} className={`Project plain ${+window.ethereum.selectedAddress === +p.creator && 'mine'}`} key={p.name}>
                  <object data={p.image} type="image/svg+xml" />
                </Link>
              )
            })}
          </div>
        </div>
      {/* )}
      {!!campaigns.length && ( */}
        <div className="campaigns">
          <h2>{+userAddress === +window.ethereum.selectedAddress ? 'My campaigns' : 'Campaigns created'}</h2>
          <div className="projects">
            {campaigns.map((p, i) => {
              const percentage = p.fundedAmount.mul(10*10).div(p.requestedAmount).toNumber()
              return (
                <Link to={`/${chainId}/${p.id}`} className={`Project plain ${+window.ethereum.selectedAddress === +p.creator && 'mine'}`} key={p.id}>
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
        </div>
      {/* )} */}
    </div>
  )
}

export default Profile
