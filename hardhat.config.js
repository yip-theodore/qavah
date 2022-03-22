require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');

// If you are using MetaMask, be sure to change the chainId to 1337
module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      chainId: 1337
    }
  }
};
