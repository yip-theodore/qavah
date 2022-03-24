require('dotenv').config()
require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');

module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: { chainId: 1337 },
    localhost: { chainId: 1337 },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 4,
    },
    alfajores: {
      url: `https://celo-alfajores--rpc.datahub.figment.io/apikey/${process.env.DATAHUB_CELO_API_KEY}/`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 44787,
    }
  }
};
