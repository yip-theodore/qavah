const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("Contract", function () {
  let cUSD, contract, qavah, addr1, addr2, p;

  beforeEach(async function () {
    [creator, addr1, addr2] = await ethers.getSigners();
    p = (amount) => ethers.utils.parseUnits(amount.toString(), 18);

    const CUSD = await ethers.getContractFactory("CUSD");
    cUSD = await CUSD.deploy(p(1_000));
    await cUSD.deployed();

    const Contract = await ethers.getContractFactory("Contract");
    contract = await upgrades.deployProxy(Contract, [
      cUSD.address,
      "http://localhost:3000/1337/",
    ]);
    await contract.deployed();
    // console.log(contract.address);

    const qavahArtifact = await artifacts.readArtifact("Qavah");
    qavah = (address) =>
      new ethers.Contract(address, qavahArtifact.abi, creator);
  });

  /**
   * Test helpers start
   */
  const getProjectId = async (projectIndex) => {
    const projects = await contract.getProjects();
    return projects[projectIndex].id;
  };

  const getTokenData = async (qavahInstance, tokenId) => {
    const tokenURI = await qavah(qavahInstance).tokenURI(tokenId);
    return JSON.parse(atob(tokenURI.split(",")[1]));
  };

  const createCrowdFundingProject = async (
    owner,
    title = "default title",
    amount = p(100)
  ) => {
    const trx = await contract
      .connect(owner)
      .createProject(
        title,
        "We’re planning on provisioning several areas and villages with books, new clothes and shoes, for all children whose family cannot afford. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas eos soluta repudiandae. Soluta nisi iste maxime rerum porro aperiam explicabo quod cum, ipsam labore praesentium laboriosam aut voluptatum, a quo!",
        amount,
        "https://ipfs.infura.io/ipfs/QmP64siF2nZZJJJnC5Rcfraxw6zmcaAG1X1S9XfZkNcVqD"
      );
    await trx.wait();
  };

  const donateToCrowdFundingProject = async (projectId, donator, amount) => {
    // setup ERC20 contract to allow contract transfer donation
    // amount from sender
    await cUSD.transfer(donator.address, amount);
    await cUSD.connect(donator).approve(contract.address, amount);

    return contract.connect(donator).donateToProject(projectId, amount);
  };

  /**
   * Test helpers end
   */

  describe("createProject", () => {
    it("should create and fetch a new crowdfunding project", async () => {
      const projectTitle =
        "Delivering school supplies to kids in Central Ghana";
      const requestedAmount = p(400);

      await createCrowdFundingProject(creator, projectTitle, requestedAmount);

      const projects = await contract.getProjects();
      const project = await contract.getProject(projects[0].id);

      expect(project.title).to.equal(projectTitle);
      expect(project.requestedAmount).to.equal(requestedAmount);
    });
  });

  describe("getProjectsByUser", () => {
    it("should fetch projects a user is associated with", async () => {
      await createCrowdFundingProject(creator);

      const projects = await contract.getProjectsByUser(creator.address);
      expect(projects.length).to.equal(1);
    });

    it("should not fetch projects a user is not associated with", async () => {
      const projects = await contract
        .connect(creator)
        .getProjectsByUser(creator.address);
      expect(projects.length).to.equal(0);
    });
  });

  describe("donateToProject", () => {
    it("should mint a Qavah token to donator and emit donation event on successful donation", async () => {
      await createCrowdFundingProject(creator, "dummy title", p(100));

      const dollarAmount = 10;
      const donationAmount = p(dollarAmount);

      const projects = await contract.getProjects();
      const projectId = projects[0].id;
      const qavahInstance = projects[0].qavah;

      expect(
        await donateToCrowdFundingProject(projectId, addr1, donationAmount)
      )
        .to.emit(contract, "FundsDonated")
        .withArgs(projectId, addr1.address);

      const tokenId = 0;

      const owner1 = await qavah(qavahInstance).ownerOf(0);
      expect(owner1).to.equal(addr1.address);
      const tokenData = await getTokenData(qavahInstance, tokenId);
      expect(tokenData.amount).to.equal(dollarAmount);
    });

    it("should increase funded amount on successful donation", async () => {
      await createCrowdFundingProject(creator, "dummy title", p(100));

      const projectId = getProjectId(0);
      let project = await contract.getProject(projectId);
      expect(project.fundedAmount).to.equal(p(0));

      const donationAmount = p(50);
      await donateToCrowdFundingProject(projectId, addr1, donationAmount);

      project = await contract.getProject(projectId);
      expect(project.fundedAmount).to.equal(donationAmount);
    });

    it("should fail to donate to own project", async () => {
      await createCrowdFundingProject(creator, "dummy title", p(100));

      const projectId = await getProjectId(0);

      await expect(
        donateToCrowdFundingProject(projectId, creator, p(10))
      ).to.be.revertedWith("You cannot donate to yourself.");
    });

    it("should fail to donate less than 1% of requested amount", async () => {
      await createCrowdFundingProject(creator, "dummy title", p(100));

      const projectId = await getProjectId(0);

      await expect(
        donateToCrowdFundingProject(projectId, addr1, p(0.9))
      ).to.be.revertedWith("Amount too low.");
    });
  });

  describe("getQavahsCount", () => {
    it("should get the total number of qavahs minted across all crowdfunding projects", async () => {
      let totalQavahs = await contract.getQavahsCount();
      expect(totalQavahs).to.equal(0);

      const donationAmount = p(10);

      await Promise.all([
        createCrowdFundingProject(creator, "dummyTitle", p(100)),
        createCrowdFundingProject(creator, "dummyTitle", p(100)),
      ]);

      const projects = await contract.getProjects();

      await donateToCrowdFundingProject(projects[0].id, addr2, donationAmount);
      await donateToCrowdFundingProject(projects[1].id, addr2, donationAmount);
      await donateToCrowdFundingProject(projects[0].id, addr1, donationAmount);

      totalQavahs = await contract.getQavahsCount();
      expect(totalQavahs).to.equal(3);
    });
  });

  describe("claimProjectFunds", () => {
    it("should allow project owner to claim donated funds", async () => {
      const donationAmount = p(10);

      let projectOwnerBalance = await cUSD.balanceOf(addr1.address);
      expect(projectOwnerBalance).to.equal(p(0)); // owner balance starts at zero

      await createCrowdFundingProject(addr1, "dummyTitle", p(100));

      const projects = await contract.getProjects();
      const projectId = projects[0].id;

      await donateToCrowdFundingProject(projectId, addr2, donationAmount);

      expect(await contract.connect(addr1).claimProjectFunds(projectId))
        .to.emit(contract, "FundsClaimed")
        .withArgs(projectId, addr1.address);

      projectOwnerBalance = await cUSD.balanceOf(addr1.address);
      expect(projectOwnerBalance).to.equal(donationAmount);
    });
  });

  describe("mintQavah", () => {
    it("should add blocking squares on token image with frequency matching donation amount on successful donation", async () => {
      const donationAmount = p(15);
      const requestedAmount = p(150);
      const initialFundedAmount = p(0);

      await createCrowdFundingProject(addr1, "dummyTitle", requestedAmount);

      const projects = await contract.getProjects();
      const projectId = projects[0].id;

      await donateToCrowdFundingProject(projectId, addr2, donationAmount);

      const tokenURI = await qavah(projects[0].qavah).tokenURI(0);
      const token = JSON.parse(atob(tokenURI.split(",")[1]));
      const image = token.image; // atob(token2.image.split(',')[1])

      const donationPercentage = BigNumber.from(donationAmount)
        .mul(100)
        .div(requestedAmount);
      const fundedPercentage = BigNumber.from(initialFundedAmount)
        .mul(100)
        .div(requestedAmount);

      expect(image).to.contain(
        `:nth-of-type(n+${fundedPercentage
          .add(1)
          .toString()}):nth-of-type(-n+${fundedPercentage.add(
          donationPercentage
        )})`
      );
    });
  });
});
