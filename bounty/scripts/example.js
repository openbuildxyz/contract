const { ethers, network, upgrades } = require("hardhat");

const taskAddr = require(`../deployments/${network.name}/Task.json`)

async function main() {
    const USDT_Addrs = {
        'bsc': '0x55d398326f99059fF775485246999027B3197955',
        'mumbai': '0x05AdA7f138861dedF36894f667fB81900021d33E',
    }
    const USDT_ADDRESS = USDT_Addrs[network.name];
    let [owner] = await ethers.getSigners();
    taskContract = await ethers.getContractAt("Task", taskAddr.address, owner);

    // 前端获取账号及合约实例
    // let provider = new ethers.providers.Web3Provider(window.ethereum);
    // await this.provider.send("eth_requestAccounts", []);
    // owner = this.provider.getSigner()
    taskContract = new ethers.Contract(taskAddr,  ABI, owner);

    USDTContract = await ethers.getContractAt("USDT", USDT_ADDRESS, owner);
    // 授权
    let txApprove = await USDTContract.approve(taskAddr.address, ethers.constants.MaxUint256);
    await txApprove.wait();
    // 发起交易
    let tx = await taskContract.createTask(owner.address, USDT_ADDRESS, 1000);
    console.log(await tx.wait())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });