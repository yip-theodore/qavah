import React, { useState, useEffect, useContext } from 'react'
import { Outlet, Link, useParams, useNavigate } from "react-router-dom"
import { useQuery } from '@apollo/client'
import { BigNumber, ethers } from 'ethers'
import { Context, getContract, getAbi, getSymbol, getNetwork, Qavah } from '../utils'
import { PROFILE } from '../graphql'

function Profile () {
  const { chainId, userAddress } = useParams()
  const navigate = useNavigate()
  const { store, updateStore } = useContext(Context)

  const [ contributions, setContributions ] = useState([])
  const [ campaigns, setCampaigns ] = useState([])
  const { loading, error, data: { receipts = [], projects = [] } = {} } = useQuery(PROFILE, { variables: { userAddress } })

  useEffect(() => {
    // setTimeout(async () => {
    //   try {
    //     const _projects = await window.contract.getProjectsByUser(userAddress)
    //     const projects = _projects.filter((p, i, a) => i === a.findIndex(p2 => p2.id === p.id)).reverse()
    //     window.contributions = await Promise.all(
    //       projects.filter(p => +p.creator !== +userAddress)
    //       .map(p => {
    //         const qavah = new ethers.Contract(p.qavah, Qavah.abi, window.provider)
    //         return p.donators
    //           .map((d, i) => +d === +userAddress &&
    //             qavah.tokenURI(i).then(async q => {
    //               const qp = JSON.parse(atob(q.split(',')[1]))
    //               if (window.ReactNativeWebView) {
    //                 const blob = await fetch(p.image).then(r => r.blob())
    //                 const dataImg = await new Promise((resolve, reject) => {
    //                   const reader = new FileReader()
    //                   reader.onerror = reject
    //                   reader.onload = () => resolve(reader.result)
    //                   reader.readAsDataURL(blob)
    //                 })
    //                 qp['image'] = qp['image'].replace(p.image, dataImg)
    //               }
    //               return qp
    //             })
    //           ).filter(Boolean).reverse()
    //       }).flat()
    //     )
    //     setContributions(window.contributions)
    //     setCampaigns(projects.filter(p => +p.creator === +userAddress))
    //   } catch (error) {
    //     console.error(error)
    //     updateStore({ message: error.data?.message || error.message })
    //   }
    // })
  }, [userAddress])

  return (
    <div className='Profile'>
      {/* {!!contributions.length && ( */}
        <div className="contributions">
          <h2>{+userAddress === +window.ethereum?.selectedAddress ? 'My contributions' : 'Public contributions'}</h2>
          <div className="projects">
            {receipts.map((p, i) => {
              const link = '/' + p.description?.split('/').slice(3).join('/')
              return (
                <Link to={link} className={`Project plain ${+window.ethereum?.selectedAddress === +p.creator && 'mine'}`} key={p.name}>
                  {!window.ReactNativeWebView
                    ? <object data={p.image} type="image/svg+xml" />
                    : <img src={p.image} className="img" />}
                </Link>
              )
            })}
          </div>
        </div>
      {/* )}
      {!!campaigns.length && ( */}
        <div className="campaigns">
          <h2>{+userAddress === +window.ethereum?.selectedAddress ? 'My campaigns' : 'Campaigns created'}</h2>
          <div className="projects">
            {projects.map((p, i) => {
              const percentage = BigNumber.from(p.fundedAmount).mul(10*10).div(p.requestedAmount).toNumber()
              return (
                <Link to={`/${chainId}/${p.id}`} className={`Project plain ${+window.ethereum?.selectedAddress === +p.creator && 'mine'}`} key={p.id}>
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
