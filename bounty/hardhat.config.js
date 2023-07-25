
require('dotenv').config();
require("@nomiclabs/hardhat-etherscan");
require('hardhat-abi-exporter');
require("@nomiclabs/hardhat-solhint");
require("@nomicfoundation/hardhat-chai-matchers")
require('solidity-coverage')


const defaultNetwork = "hardhat";
const mnemonic = process.env.MNEMONIC
const scankey = process.env.ETHERSCAN_API_KEY

module.exports = {
  defaultNetwork,
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: {
        mnemonic
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: {
        mnemonic
      },
    },
    bnb: {
      url: `https://rpc.ankr.com/bsc`,
      accounts: {
        mnemonic
      },
      chainId: 56,
    },
    testbsc: {
      url: "https://rpc.ankr.com/bsc_testnet_chapel",
      chainId: 97,
      accounts: {
        mnemonic: mnemonic,
      }
    },
    mumbai: {
      url: 'https://rpc-mumbai.maticvigil.com',
      gasPrice: 30000000000,
      accounts: {
        mnemonic: mnemonic,
      },
      chainId: 80001,
    },
    arbitrum: {
      url: 'https://arb-mainnet-public.unifra.io',
      accounts: {
        mnemonic: mnemonic,
      },
      chainId: 42161,
    },
    testarb: {
      url: 'https://arbitrum-goerli.public.blastapi.io',
      accounts: {
        mnemonic: mnemonic,
      },
      chainId: 421613,
    },
  },
  solidity: {
    compilers: [{
      version: "0.8.17",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
    {
      version: "0.7.6",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
    {
      version: "0.6.7",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
    ],
  },
  etherscan: {
    // Your API key for Etherscan
    apiKey: scankey
  },
  abiExporter: {
    path: './deployments/abi',
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
    pretty: false,
  },
};