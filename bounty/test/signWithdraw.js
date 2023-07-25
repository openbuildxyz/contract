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

module.exports = {
    signWithdraw,
}