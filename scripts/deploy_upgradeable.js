const { ethers, upgrades } = require('hardhat');

async function main () {
  const Contract = await ethers.getContractFactory('Contract');
  const contract = await upgrades.deployProxy(Contract);
  await contract.deployed();
  console.log('Contract deployed to:', contract.address);
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
