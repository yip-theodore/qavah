const { expect } = require("chai");

describe("Contract", function () {

  let Contract, contract, creator, donator

  beforeEach(async function () {
    Contract = await ethers.getContractFactory("Contract");
    [creator, donator] = await ethers.getSigners();
    contract = await Contract.deploy();
    await contract.deployed();
  })

  it("should enable creators to create a project", async function () {
    const tx = await contract.createProject(
      "A project title",
      "A project description. It can be a few sentences, or it can be long paragraphs. I'll keep mine real short.",
      ethers.utils.parseEther("100"),
      "$'ËËËÏ>|ùóçÏ>|ùóçÏ>|\u001c¼¼eÌ\\\u0010r8ùyöIO>|ùóäq>^OçÁËÏËÄùä9yóçÏ.'ÁÇËËËq#\u0012\\ù\u001cIrðm)óçÏÏÃåâ{q>|GÇËÃãåí¹óçÂçÇÄ\\\u001cFÎO\u001f'ÇÃãáóÎ\u000ey,ùð÷#ÇÂãáë=Û·dPùò8||\u001c¼.^Üù{ví9x\\øøÁË¹óçÛ·câ^>#ãàÖ^î}ø\\ùð¸øøøø9îãÝ»´ãçÁÏÇÄ\\{rîÝ»D|.$¸8ùyy\u001b=ËÎ{¹ðùxù>Oç­­»$ çÈàâ\u000e\u0017/.íÏ\u000bwnÑ'ÏËÏ·sÝXO\u0007>\u001f\u0012\\\u001cO>ÝÚÙ\u0014\u001c¼|¼.\u001f\u0007//=Ï¹îzÜ÷g>\u000e>\u0017/\u001f\u000fÁ»>Åkn>\rË¸ËÁÃçÇ÷h³ÃãàåàäøãÜºÏµ·>|¼¼\u000bÈçÃãÉÚÂçÏ\u0012\\^^O>Ü»µµ·\u001eáòññò8Ë¹îÖÖÜ|{\u001f\u000bËÁÇÁÜõ´â\u001f/>\"äqðqñî=ÚÛ>|øøáñ\u000f=ØçÄùx|øù\u001c¼¼ø\\ùîÂÖ\u000e|ø9òñ>$¹\u001c¼\u001c¼ñKÉîFâKÇËÇ¹ça#>^|>|Iqñ#·c\u0010q\u0007>$¹òññóÝÖ|ùóãç¹ðq\u0017'ËÈÜ¹\"O¸\u0007>|¼¼=gË§/>\u001f#\\|¼\u001aÏ#'ËËËÁÄ·=m\u0016)òòñò8øçÏ;röA\u0012\\ø8/>|Ia=Ï[vE>|,2",
      "{\"tree\":[[[[\"5\",[\"8\",\"7\"]],[\"1\",\"4\"]],[[[\"6\",[\"0\",\"9\"]],\"3\"],\"2\"]],[\"B\",\"W\"]],\"_w\":80}",
    )
    await tx.wait()
    const projects = await contract.getProjects()
    console.log(projects)
    expect(projects.length).to.not.equal(0)
  })

})
