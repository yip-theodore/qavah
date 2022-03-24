import React, { useContext } from 'react'
import { Link, useParams, useNavigate } from "react-router-dom"
import { ethers } from 'ethers'
import DitherJS from 'ditherjs'
import { Context, getContract, getAbi, Huffman, encode } from '../utils'

function NewProject () {
  const { chainId } = useParams()
  const navigate = useNavigate()
  const { updateStore } = useContext(Context)

  return (
    <form className='NewProject' onSubmit={async e => {
      try {
        e.preventDefault()
        const { elements } = e.target

        await window.ethereum.request({ method: "eth_requestAccounts" })

        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(getContract(chainId), getAbi(), signer)

        const tx = await contract.createProject(
          elements['title'].value,
          elements['description'].value,
          ethers.utils.parseEther(elements['requestedAmount'].value),
          window.encoded,
          JSON.stringify({ tree: window.huffman.encodeTree(), _w: 80 }),
        )
        await tx.wait()
        updateStore({ message: 'Loading…' })
        navigate(-1)

      } catch (error) {
        console.error(error)
        updateStore({ message: error.message })
      }
    }}>
      <textarea name="title" placeholder='Your project title' rows="2"></textarea>
      <textarea name="description" placeholder='Give it some context…' rows="10"></textarea>
      <div className='flex'>
        <input type='file' name='image' onChange={onFileSelected} />
        <input name='requestedAmount' type='number' step='0.001' placeholder='Amount' />
      </div>
      <div className='action'>
        <Link to={-1}>Back</Link>
        <button type='submit'>Create project</button>
      </div>
    </form>
  )
}

export default NewProject

function onFileSelected(event) {
  var selectedFile = event.target.files[0]
  var reader = new FileReader()
  if (!selectedFile) return

  const img = document.createElement('img')
  img.width = 80
  img.title = selectedFile.name
  document.body.appendChild(img)

  const ditherjs = new DitherJS({
    "step": 1,
    "palette": [ [0, 0, 0], [255, 255, 255] ],
    "algorithm": "atkinson" // one of ["ordered", "diffusion", "atkinson"]
  })
  reader.onload = function(event) {
    img.src = event.target.result
    setTimeout(async () => {
      ditherjs.dither(img)
      const canvas = document.querySelector('canvas:last-child')
      const ctx = canvas.getContext('2d')
      const data = ctx.getImageData(0, 0 * canvas.width / 16 / 2, canvas.width, 9 * canvas.width / 16).data
      const out = [...data].map(x => x ? 'W' : 'B').join('').match(/.{1,4}/g).map(x => x[0]).join('')
      const e = encode(out)
      
      window.huffman = Huffman.treeFromText(e)
      window.encoded = window.huffman.encode(e)
    })
  }
  reader.readAsDataURL(selectedFile)
}
