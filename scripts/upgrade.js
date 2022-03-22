const { ethers, upgrades } = require('hardhat');
const contractAddress = require('../frontend/src/contracts/contract-address.json')

async function main () {
  const Contract = await ethers.getContractFactory('Contract');
  const contract = await upgrades.upgradeProxy(contractAddress.Contract, Contract);
  console.log('Contract upgraded');
  saveFrontendFiles(contract)
}

function saveFrontendFiles(contract) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../frontend/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify({ Contract: contract.address }, undefined, 2)
  );

  const ContractArtifact = artifacts.readArtifactSync("Contract");

  fs.writeFileSync(
    contractsDir + "/Contract.json",
    JSON.stringify(ContractArtifact, null, 2)
  );
}

main();
