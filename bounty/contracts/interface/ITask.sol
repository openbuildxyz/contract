// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

struct TaskInfo {
    address issuer;
    address worker;
    address token;
    uint amount;
    bool withdrawn;
}

interface ITask {
    function createTask(
        uint _taskId,
        address _worker,
        address _token,
        uint _amount
    ) external;

    function withdraw(
        uint taskId,
        uint amount,
        uint deadline,
        bytes memory signature
    ) external;

    function arbitrate(
        uint taskId,
        uint amount,
        uint sigAmount,
        uint sigDeadline,
        bytes memory signature
    ) external;

    function getTaskInfo(
        uint256 taskId
    ) external view returns (TaskInfo memory);
}
