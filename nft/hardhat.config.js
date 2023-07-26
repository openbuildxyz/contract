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
    },
    bsc: {
      url: "https://bsc.blockpi.network/v1/rpc/public",
      chainId: 56,
      accounts: {
          mnemonic: process.env.BNB_Mnemonic,
      }
    },
    testbsc: {
      url: "https://rpc.ankr.com/bsc_testnet_chapel",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: {
          mnemonic: process.env.BNB_Mnemonic,
      }
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
