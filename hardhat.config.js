require("@nomiclabs/hardhat-waffle");
require('dotenv').config({ path: '.env' });

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const getEnv = (variable, optional = false) => {
  if (!process.env[variable]) {
    if (optional) {
      console.warn(`[@env]: Environmental variable for ${variable} is not supplied.`)
    } else {
      throw new Error(`You must create an environment variable for ${variable}`)
    }
  }

  return process.env[variable]?.replace(/\\n/gm, '\n')
}

// Your private key
const PRIVATE_KEY = getEnv("PRIVATE_KEY")

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: { chainId: 1337 },
    localhost: { chainId: 1337 },
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [process.env.PRIVATE_KEY, process.env.PRIVATE_KEY2, process.env.PRIVATE_KEY3],
      chainId: 44787,
    },
  },
};
