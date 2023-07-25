const { ethers } = require("ethers");

// 连接到以太坊网络提供者
const provider = new ethers.providers.JsonRpcProvider("https://polygon-mumbai-bor.publicnode.com"); // 替换为实际的RPC节点

// 通过交易哈希获取交易对象
const transactionHash = "0x9668ddb2722e400128bdb969d43b10c083c5367b3852fc58e4b8460b488c46dd"; // 替换为实际的交易哈希
provider.getTransactionReceipt(transactionHash)
    .then((receipt) => {
        // 检查交易是否成功
        if (receipt && receipt.status === 1) {
            // 解析交易的输入数据
            const abi = require(`../deployments/abi/Task.json`); // 合约 ABI 路径
            const iface = new ethers.utils.Interface(abi);
            receipt.logs.forEach((log) => {
                try {
                    const parsedLog = iface.parseLog(log);
                    // 检查是否为特定的事件
                    if (parsedLog && parsedLog.name === "TaskCreated") {
                        console.log("Event received:", parsedLog.args);
                    }
                } catch {
                    return null
                }
            });
        } else {
            console.log("Transaction failed");
        }
    })
    .catch((error) => {
        console.error("Error retrieving transaction:", error);
    });