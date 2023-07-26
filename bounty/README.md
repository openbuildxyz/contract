# Task 合约

已部署到 Arbitrum Goerli 测试网合约地址: 0x0Be5C62Ad82222b5dB88BF87D8Bc3C7B46fe04d8
TEST BSC 部署在: 0xf7F9708434CcAc50627Cecb8a896e409f19Cd6d6
BSC 部署在: 0xf7F9708434CcAc50627Cecb8a896e409f19Cd6d6

主要方法：

创建Task：createTask

| 参数    | 说明      |
| ------- | --------- |
| _taskId | taskID  |
| _worker | 乙方地址  |
| _token  | token地址 |
| _amount | token数量 |

甲方/乙方完成Task： withdraw

| 参数    | 说明      |
| ------- | --------- |
| taskId | taskID  |
| amount  | 支付给乙方的token数量 |
| deadline | 签名有效期 |
| signature | EIP712签名 |

仲裁人员仲裁： arbitrate

| 参数    | 说明      |
| ------- | --------- |
| taskId | taskID  |
| amount  | 支付给乙方的token数量 |
| sigAmount | 签名的数量 |
| sigDeadline | 签名的有效期 |
| signature | 过期的签名 |

设置仲裁人员： setManager

| 参数    | 说明      |
| ------- | --------- |
| _manager | 仲裁人员地址  |
| enabled  | 是否启用 |

主要 Event 事件：

TaskCreated：  创建Task事件

| 参数    | 说明      |
| ------- | --------- |
| taskId | task id  |
| worker  | 乙方地址 |
| token  | token地址 |
| amount  | token数量 |

Withdrew： 乙方提取 token 事件

| 参数    | 说明      |
| ------- | --------- |
| taskId | task id  |
| to  | 乙方地址 |
| token  | token地址 |
| amount  | token数量 |

Refunded： 剩余 token 退回甲方事件

| 参数    | 说明      |
| ------- | --------- |
| taskId | task id  |
| to  | 甲方地址 |
| token  | token地址 |
| amount  | token数量 |

Arbitrated： 仲裁事件

| 参数    | 说明      |
| ------- | --------- |
| taskId | task id  |
| token  | token地址 |
| amount  | token数量 |

SetManager：  设置仲裁人员

| 参数    | 说明      |
| ------- | --------- |
| manager | 仲裁人员地址  |
| enabled  | 是否启用 |


## 构造EIP712签名

```
async function signWithdraw(
    chainId,
    contractAddress,
    singer,
    taskId,
    amount,
    deadline,
) {
    const domain = {
        name: "Task",
        version: "1",
        chainId,
        verifyingContract: contractAddress,
    };

    const types = {
        Withdraw: [
            { name: "taskId", type: "uint256" },
            { name: "amount", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };

    const sig = await singer._signTypedData(domain, types, {
        taskId: taskId,
        amount: amount,
        deadline: deadline,
    });

    return sig
}
```

## 事件解析

```
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
```

## 前端获取账号及合约实例
```
let provider = new ethers.providers.Web3Provider(window.ethereum);
await this.provider.send("eth_requestAccounts", []);
owner = this.provider.getSigner()
taskContract = new ethers.Contract(taskAddr,  ABI, owner);

let tx = await taskContract.createTask(owner.address, USDT_ADDRESS, 1000);
console.log(await tx.wait())
```

## 部署

### 修改配置
```
cp env_sample .env
```
修改 .env 文件里的如下参数
- MNEMONIC：生成用于部署合约的账号
- ETHERSCAN_API_KEY：用于在区块链浏览器上验证合约，可在 https://etherscan.io/ 申请

### 安装依赖
```
npm -i
```


### 运行测试用例
```
npx hardhat run test
```


### 部署合约
本地部署需运行harthat，非本地部署可跳过
```
npx hardhat run node
```

运行部署脚本
```
npx hardhat run scripts/deploy.js --network <network>
```
eg:

```sh
# 本地测试网
npx hardhat run scripts/deploy.js --network localhost
# mumbai 测试网 
npx hardhat run scripts/deploy.js --network mumbai
```

network 参见  [hardhat.config](./hardhat.config.js) networks 参数

### 调用合约

调用合约代码参考  scripts/example.js


### 代码验证
在区块链浏览器(etherscan)上验证合约
```
npx hardhat verify <contract_address> --network <network>
```
eg: 
```
npx hardhat verify 0x21506031E058A08b8efc4b4Ce0556A03265cb86F --network mumbai
```