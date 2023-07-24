require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({path:__dirname+'/.env'});

module.exports = {
  solidity: "0.8.18",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC,
      accounts: [process.env.SEPOLIA_PVK],
    },
    arbitrumGoerli: {
      url: process.env.ARB_GOERLI_RPC,
      chainId: 421613,
      accounts: [process.env.ARB_GOERLI_PVK]
    }
  }
};
