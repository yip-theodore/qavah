import React, { useState, useEffect } from 'react'
import { Outlet, Link } from "react-router-dom"
import { ethers } from 'ethers'
import { Contract } from './contracts/contract-address.json'
import { abi } from './contracts/Contract.json'
import './index.css'
var Huffman;Huffman={treeFromText:function(b){var a;a=new Huffman.TreeBuilder(b);return a.build()}};Huffman.CoreHelpers={isArray:function(a){return !!(a&&a.constructor===Array)},lpad:function(a,b){b=b||8;while(a.length<b){a="0"+a}return a}};Huffman.Tree=function(a){this.root=a;this.root=this.root||new Huffman.Tree.Node();return this};Huffman.Tree.prototype.encode=function(a){return this.bitStringToString(this.encodeBitString(a))};Huffman.Tree.prototype.decode=function(j){var g,f,e,a,c,i,h,b;a=this.stringToBitString(j);i="";b=this.root;f=a.split("");for(g=0,e=f.length;g<e;g++){h=f[g];c=h==="0"?"left":"right";b=b[c];if(b.isLeaf()){i+=b.value;b=this.root}}return i};Huffman.Tree.prototype.encodeBitString=function(f){var c,b,a,d,e;e="";b=f.split("");for(c=0,a=b.length;c<a;c++){d=b[c];e+=this.bitValue(d)}return e};Huffman.Tree.prototype.bitStringToString=function(a){var d,b,f,c,e;e=8-a.length%8;for(c=0;(0<=e?c<e:c>e);(0<=e?c+=1:c-=1)){a+="0"}f=(function(){d=[];b=a.length;for(c=0;(0<=b?c<b:c>b);c+=8){d.push(String.fromCharCode(parseInt(a.substr(c,8),2)))}return d})();return f.join("")+e.toString()};Huffman.Tree.prototype.stringToBitString=function(c){var e,d,b,a,f,h,g;g=c.split("");h=parseInt(g.pop());g=(function(){e=[];b=g;for(d=0,a=b.length;d<a;d++){f=b[d];e.push(Huffman.CoreHelpers.lpad(f.charCodeAt(0).toString(2)))}return e})();g=g.join("");return g.substr(0,g.length-h)};Huffman.Tree.prototype.bitValue=function(b){var a;if(!((typeof(a=this.leafCache)!=="undefined"&&a!==null))){this.generateLeafCache()}return this.leafCache[b]};Huffman.Tree.prototype.generateLeafCache=function(a,b){this.leafCache=(typeof this.leafCache!=="undefined"&&this.leafCache!==null)?this.leafCache:{};a=a||this.root;b=b||"";if(a.isLeaf()){return(this.leafCache[a.value]=b)}else{this.generateLeafCache(a.left,b+"0");return this.generateLeafCache(a.right,b+"1")}};Huffman.Tree.prototype.encodeTree=function(){return this.root.encode()};Huffman.Tree.decodeTree=function(a){return new Huffman.Tree(Huffman.Tree.parseNode(a))};Huffman.Tree.parseNode=function(b){var a;a=new Huffman.Tree.Node();if(Huffman.CoreHelpers.isArray(b)){a.left=Huffman.Tree.parseNode(b[0]);a.right=Huffman.Tree.parseNode(b[1])}else{a.value=b}return a};Huffman.Tree.Node=function(){this.left=(this.right=(this.value=null));return this};Huffman.Tree.Node.prototype.isLeaf=function(){return(this.left===this.right)&&(this.right===null)};Huffman.Tree.Node.prototype.encode=function(){return this.value?this.value:[this.left.encode(),this.right.encode()]};var __hasProp=Object.prototype.hasOwnProperty;Huffman.TreeBuilder=function(a){this.text=a;return this};Huffman.TreeBuilder.prototype.build=function(){var a,b;b=this.buildFrequencyTable();a=this.combineTable(b);return Huffman.Tree.decodeTree(this.compressCombinedTable(a))};Huffman.TreeBuilder.prototype.buildFrequencyTable=function(){var d,c,b,a,e,h,f,g;g={};c=this.text.split("");for(d=0,b=c.length;d<b;d++){e=c[d];g[e]=(typeof g[e]!=="undefined"&&g[e]!==null)?g[e]:0;g[e]+=1}f=[];a=g;for(e in a){if(!__hasProp.call(a,e)){continue}h=a[e];f.push([h,e])}f.sort(this.frequencySorter);return f};Huffman.TreeBuilder.prototype.frequencySorter=function(d,c){return d[0]>c[0]?1:(d[0]<c[0]?-1:0)};Huffman.TreeBuilder.prototype.combineTable=function(b){var c,a;while(b.length>1){c=b.shift();a=b.shift();b.push([c[0]+a[0],[c,a]]);b.sort(this.frequencySorter)}return b[0]};Huffman.TreeBuilder.prototype.compressCombinedTable=function(a){var b;b=a[1];return Huffman.CoreHelpers.isArray(b)?[this.compressCombinedTable(b[0]),this.compressCombinedTable(b[1])]:b};
export const decode = (text) => text.replace(/(\d+)([ \w])/g, (_, count, chr) => chr.repeat(count));

function App () {

  const [ balance, setBalance ] = useState('')
  const [ error, setError ] = useState('')
  const [ projects, setProjects ] = useState([])

  const symbol = {
    1337: 'CELO',
  }[window.ethereum.networkVersion]

  const getProjects = async () => {
    try {
      if (window.ethereum === undefined) {
        return setError('Please make sure you have MetaMask! Then reload the page.')
      }
      window.provider = new ethers.providers.Web3Provider(window.ethereum)
      window.signer = window.provider.getSigner()
      window.contract = new ethers.Contract(Contract, abi, window.signer)
  
      const [ account ] = await window.ethereum.request({ method: "eth_accounts" })
      console.log(account)
      const balance = await window.provider.getBalance(account)
      console.log(ethers.utils.formatEther(balance))
      setBalance(ethers.utils.formatEther(balance))

      window.projects = await window.contract.getProjects()
      console.log(window.projects)
      setProjects(window.projects)
    } catch (error) {
      console.log(error.message)
      if (error.message.startsWith('Internal JSON-RPC error') || error.message.startsWith('call revert exception')) {
        return setError('Make sure you’re on the right network! Then reload the page.')
      }
    }
  }

  useEffect(() => {
    getProjects()
  }, [])

  if (error) {
    return error
  }

  if (!balance) {
    return (
      <button onClick={async () => {
        try {
          const [ account ] = await window.ethereum.request({ method: "eth_requestAccounts" })
          console.log(account)
          const balance = await window.provider.getBalance(account)
          setBalance(ethers.utils.formatEther(balance))
        } catch (error) {
          console.log(error)            
        }
      }}>Connect wallet</button>
    )
  }

  return (
    <main>
      <header>
        <h1>qavah</h1>
        <Link to='/new'>New project</Link>
      </header>
      <h2>All projects</h2>
      <div className="projects">
        {projects.map((p, i) => {
          window.huffman2 = Huffman.Tree.decodeTree(JSON.parse(p.imageMeta).tree)
          const decodedOnce = window.huffman2.decode(p.encodedImage)
          const percentage = p.fundedAmount.mul(10*10).div(p.requestedAmount).toNumber()
          const toClaim = ethers.utils.formatEther(p.fundedAmount.sub(p.claimedAmount))
          return (
            <Link to={'/' + p.id} className='Project' key={i}>
              <pre className='image'>{decode(decodedOnce).replaceAll('W', ' ').replaceAll('B', '•').match(/.{1,80}/g).join('\n')}</pre>
              <div className="content">
                <div className="title">
                  <h3>{p.title}</h3>
                </div>
                <p className='description'>{p.description}</p>
                <div className="bottom">
                  <div>
                    <div className='progress'><div style={{ width: percentage + '%' }} /></div>
                    <span className='amounts'>{percentage}% funded of <span><b>{ethers.utils.formatEther(p.requestedAmount)} {symbol}</b></span></span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      <div className='Outlet'>
        <Outlet />
      </div>
    </main>
  )
}

export default App
