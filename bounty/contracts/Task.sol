// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interface/ITask.sol";
import "./Verifier.sol";

contract Task is Verifier, Ownable, ITask {
    error Unauthorized();
    error AmountError();
    error AlreadyWithdrawn();
    error Expired();
    error NotExpired();
    error InvalidSigner();
    error InvalidAddress();
    error AlreadyExists();

    using SafeERC20 for IERC20;

    mapping(address => bool) public managers;
    mapping(uint256 => TaskInfo) public tasks;

    event TaskCreated(uint taskId, address worker, address token, uint amount);
    event Withdrew(uint taskId, address to, address token, uint amount);
    event Refunded(uint taskId, address to, address token, uint amount);
    event SetManager(address manager, bool enabled);
    event Arbitrated(uint taskId, address token, uint amount);

    constructor() {}

    function createTask(
        uint _taskId,
        address _worker,
        address _token,
        uint _amount
    ) external override {
        if (_worker == address(0)) revert InvalidAddress();
        if (tasks[_taskId].worker != address(0)) revert AlreadyExists();
        
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        tasks[_taskId] = TaskInfo({
            issuer: msg.sender,
            worker: _worker,
            token: _token,
            amount: _amount,
            withdrawn: false
        });
        emit TaskCreated(_taskId, _worker, _token, _amount);
    }

    function withdraw(
        uint taskId,
        uint amount,
        uint deadline,
        bytes memory signature
    ) external override {
        TaskInfo storage task = tasks[taskId];
        if (msg.sender != task.worker && msg.sender != task.issuer)
            revert Unauthorized();
        if (amount > task.amount) revert AmountError();
        if (task.withdrawn) revert AlreadyWithdrawn();
        if (block.timestamp > deadline) revert Expired();

        address signer = recoverWithdraw(taskId, amount, deadline, signature);

        if (
            (signer != task.worker && signer != task.issuer) ||
            signer == msg.sender
        ) revert InvalidSigner();

        task.withdrawn = true;

        if (amount > 0) {
            IERC20(task.token).safeTransfer(task.worker, amount);
            emit Withdrew(taskId, task.worker, task.token, amount);
        }

        uint remainingAmount = task.amount - amount;
        if (remainingAmount > 0) {
            IERC20(task.token).safeTransfer(task.issuer, remainingAmount);
            emit Refunded(taskId, task.issuer, task.token, remainingAmount);
        }
    }

    function arbitrate(
        uint taskId,
        uint amount,
        uint sigAmount,
        uint sigDeadline,
        bytes memory signature
    ) external override {
        TaskInfo storage task = tasks[taskId];
        if (managers[msg.sender] != true) revert Unauthorized();
        if (amount > task.amount) revert AmountError();
        if (task.withdrawn) revert AlreadyWithdrawn();
        if (block.timestamp < sigDeadline) revert NotExpired();

        address signer = recoverWithdraw(
            taskId,
            sigAmount,
            sigDeadline,
            signature
        );

        if (signer != task.worker && signer != task.issuer)
            revert InvalidSigner();

        task.withdrawn = true;

        if (amount > 0) {
            IERC20(task.token).safeTransfer(task.worker, amount);
            emit Withdrew(taskId, task.worker, task.token, amount);
        }

        uint remainingAmount = task.amount - amount;
        if (remainingAmount > 0) {
            IERC20(task.token).safeTransfer(task.issuer, remainingAmount);
            emit Refunded(taskId, task.issuer, task.token, remainingAmount);
        }
        emit Arbitrated(taskId, task.token, amount);
    }

    function setManager(address _manager, bool enabled) external onlyOwner {
        managers[_manager] = enabled;
        emit SetManager(_manager, enabled);
    }

    function getTaskInfo(
        uint256 taskId
    ) external view override returns (TaskInfo memory) {
        return tasks[taskId];
    }
}
