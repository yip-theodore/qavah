const { ethers, upgrades, artifacts, network } = require('hardhat')
const fs = require('fs').promises

async function main() {
  const qavahNFTFactory = await ethers.getContractFactory('Qavah')
  const qavahNFT = await qavahNFTFactory.deploy()
  await qavahNFT.deployed()

  const cUSDContractAddress = network.name === "localhost" ? "0xc351628EB244ec633d5f21fBD6621e1a683B1181" : "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
  const contractFactory = await ethers.getContractFactory('Contract')
  // const contract = await upgrades.deployProxy(Contract, network.name === 'localhost'
  //   ? ['0xc351628EB244ec633d5f21fBD6621e1a683B1181', 'http://localhost:3000/1337/']
  //   : ['0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', 'https://qavah.me/44787/'])
  const siteUrl = network.name === 'localhost' ? 'http://localhost:3000/1337/' : 'https://qavah.me/44787/'

  const contract = await contractFactory.deploy(cUSDContractAddress, siteUrl, qavahNFT.address)
  await contract.deployed()
  console.log('Contract deployed to:', contract.address)
  console.log('NFT address deployed to: ', qavahNFT.address)
  await saveFrontendFiles(contract)
  await saveAddress(qavahNFT.address, "qavah")
}

async function saveAddress(address, name) {
  await fs.writeFile(
    `${__dirname}/../frontend/src/contracts/${name}-address.json`,
    JSON.stringify({ Address: address }, undefined, 2)
  )
}

async function saveFrontendFiles(contract) {
  await fs.access(`${__dirname}/../frontend/src/contracts`)
    .catch(() => fs.mkdir(`${__dirname}/../frontend/src/contracts`))

  const contractAddresses = await fs.readFile(`${__dirname}/../frontend/src/contracts/contract-address.json`)
    .catch(() => '{}')
  await fs.writeFile(
    `${__dirname}/../frontend/src/contracts/contract-address.json`,
    JSON.stringify({
      ...JSON.parse(contractAddresses),
      [network.config.chainId]: contract.address,
    }, undefined, 2)
  )

  const contractArtifact = await artifacts.readArtifact('Contract')
  await fs.writeFile(
    `${__dirname}/../frontend/src/contracts/Contract.json`,
    JSON.stringify(contractArtifact, null, 2)
  )

  const qavahArtifact = await artifacts.readArtifact('Qavah')
  await fs.writeFile(
    `${__dirname}/../frontend/src/contracts/Qavah.json`,
    JSON.stringify(qavahArtifact, null, 2)
  )

  const cUSDArtifact = await artifacts.readArtifact('CUSD')
  await fs.writeFile(
    `${__dirname}/../frontend/src/contracts/CUSD.json`,
    JSON.stringify(cUSDArtifact, null, 2)
  )
}

main()
