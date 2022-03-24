const { ethers, upgrades, artifacts, network } = require('hardhat')
const fs = require('fs').promises

async function main () {
  const Contract = await ethers.getContractFactory('Contract')
  const contract = await upgrades.deployProxy(Contract)
  await contract.deployed()
  console.log('Contract deployed to:', contract.address)
  await saveFrontendFiles(contract)
}

async function saveFrontendFiles (contract) {
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
}

main()
