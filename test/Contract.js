const { expect } = require("chai");

describe("Contract", function () {

  let cUSD, contract, qavah, addr1, addr2, p

  beforeEach(async function () {
    [ creator, addr1, addr2 ] = await ethers.getSigners()
    p = (amount) => ethers.utils.parseUnits((amount * 100).toString(), 18)

    const CUSD = await ethers.getContractFactory('CUSD')
    cUSD = await CUSD.deploy(p(1000))
    await cUSD.deployed()

    const Contract = await ethers.getContractFactory("Contract")
    contract = await upgrades.deployProxy(Contract, [ cUSD.address, 'http://localhost:3000/1337/' ])
    await contract.deployed()
    console.log(contract.address)

    const qavahArtifact = await artifacts.readArtifact('Qavah')
    qavah = (address) => new ethers.Contract(address, qavahArtifact.abi, creator)
  })

  it("should be good", async function () {
    const tx = await contract.createProject(
      "A project title",
      "A project description. It can be a few sentences, or it can be long paragraphs. I'll keep mine real short.",
      p(400),
      "https://ipfs.infura.io/ipfs/QmP64siF2nZZJJJnC5Rcfraxw6zmcaAG1X1S9XfZkNcVqD",
    )
    await tx.wait()
    const projects = await contract.getProjects()
    console.log(projects)

    await cUSD.transfer(addr1.address, p(400))
    await cUSD.connect(addr1).approve(contract.address, p(400))
    await expect(contract.connect(addr1).donateToProject(projects[0].id, p(0.10))).to.be.reverted
    await contract.connect(addr1).donateToProject(projects[0].id, p(300.90))

    await cUSD.transfer(addr2.address, p(200))
    await cUSD.connect(addr2).approve(contract.address, p(200))
    await contract.connect(addr2).donateToProject(projects[0].id, p(100))
    await expect(contract.connect(addr2).donateToProject(projects[0].id, p(50))).to.be.reverted

    const project = await contract.getProject(projects[0].id)
    expect(project.fundedAmount).to.equal(p(400))

    const owner1 = await qavah(project.qavah).ownerOf(0)
    expect(owner1).to.equal(addr1.address)
    const tokenURI1 = await qavah(project.qavah).tokenURI(0)
    const token1 = JSON.parse(atob(tokenURI1.split(',')[1]))
    console.log(token1)
    expect(token1.amount / 100).to.equal(300)

    const owner2 = await qavah(project.qavah).ownerOf(1)
    expect(owner2).to.equal(addr2.address)
  })

})
