const { ethers, network } = require("hardhat");
const { expect } = require('chai');
const { signWithdraw } = require("./signWithdraw.js");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

let task, mockUSDT, owner, manager, issuer, worker, other;
const INVALID_SIG = '0xbba42b3d0af3d44ce510e7b6720750510dab05d6158de272cc06f91994c9dbf02ddee04c3697120ce7ca953978aef6bfb08edeaea38567dd0079f1da7582ccb71c';
async function init() {
  accounts = await ethers.getSigners();
  owner = accounts[0];
  manager = accounts[1];
  issuer = accounts[2];
  worker = accounts[3];
  other = accounts[4];
  const Task = await ethers.getContractFactory("Task");
  task = await Task.deploy();

  const USDT = await ethers.getContractFactory("USDT");
  mockUSDT = await USDT.deploy();
  await mockUSDT.deployed();

  let tx = await mockUSDT.transfer(issuer.address, 1000000000);
  await tx.wait()

  let tx2 = await task.setManager(manager.address, true);
  await tx2.wait()
}

describe("Task", () => {

  beforeEach(async () => {
    await init();
  })

  describe('createTask', () => {
    it("createTask should succeed", async () => {
      let taskID = 1;
      let amount = 1000;
      const balanceBefore = await mockUSDT.balanceOf(issuer.address);
      // need approve
      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);

      await expect(
        task.connect(issuer).createTask(taskID, worker.address, mockUSDT.address, amount)
      ).emit(task, 'TaskCreated').withArgs(1, worker.address, mockUSDT.address, amount);

      const balanceAfter = await mockUSDT.balanceOf(issuer.address);

      expect(balanceBefore - balanceAfter).to.equal(amount);
      expect(await mockUSDT.balanceOf(task.address)).to.equal(amount);

      let taskInfo = await task.getTaskInfo(1);
      expect(taskInfo.issuer).to.equal(issuer.address);
      expect(taskInfo.worker).to.equal(worker.address);
      expect(taskInfo.token).to.equal(mockUSDT.address);
      expect(taskInfo.amount).to.equal(amount);
      expect(taskInfo.withdrawn).to.equal(false);
    });

    it("not approve should revert", async () => {
      let taskID = 1;
      let amount = 1000;
      const balanceBefore = await mockUSDT.balanceOf(issuer.address);
      await expect(
        task.connect(issuer).createTask(taskID, worker.address, mockUSDT.address, amount)
      ).to.be.revertedWith('ERC20: insufficient allowance');
    });

    it("not enought balance should revert", async () => {
      let taskID = 1;
      let amount = 1000;
      await mockUSDT.connect(other).approve(task.address, ethers.constants.MaxUint256);
      await expect(
        task.connect(other).createTask(taskID, worker.address, mockUSDT.address, amount)
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it("taskID repeat should revert", async () => {
      let taskID = 1;
      let amount = 1000;
      const balanceBefore = await mockUSDT.balanceOf(issuer.address);
      // need approve
      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);

      task.connect(issuer).createTask(taskID, worker.address, mockUSDT.address, amount);

      await expect(
        task.connect(issuer).createTask(taskID, worker.address, mockUSDT.address, amount)
      ).to.be.revertedWithCustomError(task, 'AlreadyExists');
    });
  });

  describe('withdraw', () => {
    it("withdraw should succeed", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let withdrawAmount = 200;
      let deadline = "99999999999"
      let taskId = 1;

      const balanceBeforeIssuer = await mockUSDT.balanceOf(issuer.address);
      const balanceBeforeWorker = await mockUSDT.balanceOf(worker.address);
      const balanceBeforeContract = await mockUSDT.balanceOf(task.address);

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        withdrawAmount,
        deadline,
      );
      await task.connect(worker).withdraw(taskId, withdrawAmount, deadline, sig);

      const balanceAfterIssuer = await mockUSDT.balanceOf(issuer.address);
      const balanceAfterWorker = await mockUSDT.balanceOf(worker.address);
      const balanceAfterContract = await mockUSDT.balanceOf(task.address);

      expect(balanceBeforeIssuer - balanceAfterIssuer).to.equal(withdrawAmount);
      expect(balanceAfterWorker - balanceBeforeWorker).to.equal(withdrawAmount);
      expect(balanceBeforeContract - balanceAfterContract).to.equal(0);

      let taskInfo = await task.getTaskInfo(taskId);
      expect(taskInfo.withdrawn).to.equal(true);
    });

    it("withdraw zero should succeed", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let withdrawAmount = 0;
      let deadline = "99999999999"
      let taskId = 1;

      const balanceBeforeIssuer = await mockUSDT.balanceOf(issuer.address);
      const balanceBeforeWorker = await mockUSDT.balanceOf(worker.address);
      const balanceBeforeContract = await mockUSDT.balanceOf(task.address);

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        withdrawAmount,
        deadline,
      );
      await task.connect(worker).withdraw(taskId, withdrawAmount, deadline, sig);

      const balanceAfterIssuer = await mockUSDT.balanceOf(issuer.address);
      const balanceAfterWorker = await mockUSDT.balanceOf(worker.address);
      const balanceAfterContract = await mockUSDT.balanceOf(task.address);

      expect(balanceBeforeIssuer - balanceAfterIssuer).to.equal(withdrawAmount);
      expect(balanceAfterWorker - balanceBeforeWorker).to.equal(withdrawAmount);
      expect(balanceBeforeContract - balanceAfterContract).to.equal(0);

      let taskInfo = await task.getTaskInfo(taskId);
      expect(taskInfo.withdrawn).to.equal(true);
    });

    it("withdraw all should succeed", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let withdrawAmount = 1000;
      let deadline = "99999999999"
      let taskId = 1;

      const balanceBeforeIssuer = await mockUSDT.balanceOf(issuer.address);
      const balanceBeforeWorker = await mockUSDT.balanceOf(worker.address);
      const balanceBeforeContract = await mockUSDT.balanceOf(task.address);

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        withdrawAmount,
        deadline,
      );
      await task.connect(worker).withdraw(taskId, withdrawAmount, deadline, sig);

      const balanceAfterIssuer = await mockUSDT.balanceOf(issuer.address);
      const balanceAfterWorker = await mockUSDT.balanceOf(worker.address);
      const balanceAfterContract = await mockUSDT.balanceOf(task.address);

      expect(balanceBeforeIssuer - balanceAfterIssuer).to.equal(withdrawAmount);
      expect(balanceAfterWorker - balanceBeforeWorker).to.equal(withdrawAmount);
      expect(balanceBeforeContract - balanceAfterContract).to.equal(0);

      let taskInfo = await task.getTaskInfo(taskId);
      expect(taskInfo.withdrawn).to.equal(true);
    });


    it("worker sign and withdraw should revert", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let withdrawAmount = 200;
      let deadline = "99999999999"
      let taskId = 1;

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        worker,
        taskId,
        withdrawAmount,
        deadline,
      );
      await expect(
        task.connect(worker).withdraw(taskId, withdrawAmount, deadline, sig)
      ).to.be.revertedWithCustomError(task, 'InvalidSigner');
    });

    it("issuer sign and withdraw should revert", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let withdrawAmount = 200;
      let deadline = "99999999999"
      let taskId = 1;

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        withdrawAmount,
        deadline,
      );
      await expect(
        task.connect(issuer).withdraw(taskId, withdrawAmount, deadline, sig)
      ).to.be.revertedWithCustomError(task, 'InvalidSigner');
    });

    it("issuer sign and other withdraw should revert", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let withdrawAmount = 200;
      let deadline = "99999999999"
      let taskId = 1;

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        withdrawAmount,
        deadline,
      );
      await expect(
        task.connect(other).withdraw(taskId, withdrawAmount, deadline, sig)
      ).to.be.revertedWithCustomError(task, 'Unauthorized');
    });

    it("other sign and worker should revert", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let withdrawAmount = 200;
      let deadline = "99999999999"
      let taskId = 1;

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        other,
        taskId,
        withdrawAmount,
        deadline,
      );
      await expect(
        task.connect(worker).withdraw(taskId, withdrawAmount, deadline, sig)
      ).to.be.revertedWithCustomError(task, 'InvalidSigner');
    });

    it("amount too more should revert", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let withdrawAmount = 1001;
      let deadline = "99999999999"
      let taskId = 1;
      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        withdrawAmount,
        deadline,
      );
      await expect(
        task.connect(worker).withdraw(taskId, withdrawAmount, deadline, sig)
      ).to.be.revertedWithCustomError(task, 'AmountError');
    });

    it("sign expired should revert", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let withdrawAmount = 1000;
      let deadline = "1689035633"
      let taskId = 1;

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        withdrawAmount,
        deadline,
      );
      await expect(
        task.connect(worker).withdraw(taskId, withdrawAmount, deadline, sig)
      ).to.be.revertedWithCustomError(task, 'Expired');
    });

    it("withdraw twice should revert", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let withdrawAmount = 200;
      let deadline = "99999999999"
      let taskId = 1;

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        withdrawAmount,
        deadline,
      );
      await task.connect(worker).withdraw(taskId, withdrawAmount, deadline, sig);

      await expect(
        task.connect(worker).withdraw(taskId, withdrawAmount, deadline, sig)
      ).to.be.revertedWithCustomError(task, 'AlreadyWithdrawn');
    });
  });

  describe('arbitrate', () => {
    it.only("arbitrate should succeed", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let toAmount = 300;
      let sigAmount = 200;
      let deadline = "1689035633" // expired
      let taskId = 10110;
      const balanceBeforeIssuer = await mockUSDT.balanceOf(issuer.address);
      const balanceBeforeWorker = await mockUSDT.balanceOf(worker.address);
      const balanceBeforeContract = await mockUSDT.balanceOf(task.address);

      // await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      // await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        "0x6F6852B7C579Eccc46637d546628029C952aC1Dd",
        owner,
        taskId,
        sigAmount,
        deadline,
      );
      console.log(sig)
      // await expect(
      //   task.connect(manager).arbitrate(taskId, toAmount, sigAmount, deadline, sig)
      // ).emit(task, 'Arbitrated').withArgs(taskId, mockUSDT.address, toAmount);

      // const balanceAfterIssuer = await mockUSDT.balanceOf(issuer.address);
      // const balanceAfterWorker = await mockUSDT.balanceOf(worker.address);
      // const balanceAfterContract = await mockUSDT.balanceOf(task.address);

      // expect(balanceBeforeIssuer - balanceAfterIssuer).to.equal(toAmount);
      // expect(balanceAfterWorker - balanceBeforeWorker).to.equal(toAmount);
      // expect(balanceBeforeContract - balanceAfterContract).to.equal(0);
    });

    it("arbitrate zero should succeed", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let toAmount = 0;
      let sigAmount = 200;
      let deadline = "1689035633" // expired
      let taskId = 1;
      const balanceBeforeIssuer = await mockUSDT.balanceOf(issuer.address);
      const balanceBeforeWorker = await mockUSDT.balanceOf(worker.address);
      const balanceBeforeContract = await mockUSDT.balanceOf(task.address);

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        sigAmount,
        deadline,
      );
      await expect(
        task.connect(manager).arbitrate(taskId, toAmount, sigAmount, deadline, sig)
      ).emit(task, 'Arbitrated').withArgs(taskId, mockUSDT.address, toAmount);

      const balanceAfterIssuer = await mockUSDT.balanceOf(issuer.address);
      const balanceAfterWorker = await mockUSDT.balanceOf(worker.address);
      const balanceAfterContract = await mockUSDT.balanceOf(task.address);

      expect(balanceBeforeIssuer - balanceAfterIssuer).to.equal(toAmount);
      expect(balanceAfterWorker - balanceBeforeWorker).to.equal(toAmount);
      expect(balanceBeforeContract - balanceAfterContract).to.equal(0);
    });

    it("arbitrate all should succeed", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let toAmount = 1000;
      let sigAmount = 200;
      let deadline = "1689035633" // expired
      let taskId = 1;
      const balanceBeforeIssuer = await mockUSDT.balanceOf(issuer.address);
      const balanceBeforeWorker = await mockUSDT.balanceOf(worker.address);
      const balanceBeforeContract = await mockUSDT.balanceOf(task.address);

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        sigAmount,
        deadline,
      );
      await expect(
        task.connect(manager).arbitrate(taskId, toAmount, sigAmount, deadline, sig)
      ).emit(task, 'Arbitrated').withArgs(taskId, mockUSDT.address, toAmount);

      const balanceAfterIssuer = await mockUSDT.balanceOf(issuer.address);
      const balanceAfterWorker = await mockUSDT.balanceOf(worker.address);
      const balanceAfterContract = await mockUSDT.balanceOf(task.address);

      expect(balanceBeforeIssuer - balanceAfterIssuer).to.equal(toAmount);
      expect(balanceAfterWorker - balanceBeforeWorker).to.equal(toAmount);
      expect(balanceBeforeContract - balanceAfterContract).to.equal(0);
    });

    it("arbitrate more task amount should revert", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let toAmount = 1001;
      let sigAmount = 200;
      let deadline = "1689035633" // expired
      let taskId = 1;

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        sigAmount,
        deadline,
      );
      await expect(
        task.connect(manager).arbitrate(taskId, toAmount, sigAmount, deadline, sig)
      ).to.be.revertedWithCustomError(task, 'AmountError');
    });

    it("not manager should revert", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let toAmount = 300;
      let sigAmount = 200;
      let deadline = "1689035633" // expired
      let taskId = 1;

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        sigAmount,
        deadline,
      );
      await expect(
        task.connect(issuer).arbitrate(taskId, toAmount, sigAmount, deadline, sig)
      ).to.be.revertedWithCustomError(task, 'Unauthorized');
    });

    it("sig not expired should revert", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let toAmount = 300;
      let sigAmount = 200;
      let deadline = "99999999999"
      let taskId = 1;

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        sigAmount,
        deadline,
      );
      await expect(
        task.connect(manager).arbitrate(taskId, toAmount, sigAmount, deadline, sig)
      ).to.be.revertedWithCustomError(task, 'NotExpired');
    });

    it("invalid sig should revert", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let toAmount = 300;
      let sigAmount = 200;
      let deadline = "1689035633" // expired
      let taskId = 1;

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      await expect(
        task.connect(manager).arbitrate(taskId, toAmount, sigAmount, deadline, INVALID_SIG)
      ).to.be.revertedWithCustomError(task, 'InvalidSigner');
    });

    it("already withdraw should revert", async () => {
      let { chainId } = await ethers.provider.getNetwork();
      let amount = 1000;
      let toAmount = 300;
      let sigAmount = 200;
      let deadline = "99999999999"
      let taskId = 1;

      await mockUSDT.connect(issuer).approve(task.address, ethers.constants.MaxUint256);
      await task.connect(issuer).createTask(taskId, worker.address, mockUSDT.address, amount);

      const sig = await signWithdraw(
        chainId,
        task.address,
        issuer,
        taskId,
        toAmount,
        deadline,
      );
      await task.connect(worker).withdraw(taskId, toAmount, deadline, sig);

      await expect(
        task.connect(manager).arbitrate(taskId, toAmount, sigAmount, deadline, sig)
      ).to.be.revertedWithCustomError(task, 'AlreadyWithdrawn');
    });
  })
  describe('setManager', () => {
    it("setManager should succeed", async () => {
      await expect(
        task.connect(owner).setManager(other.address, true)
      ).emit(task, 'SetManager').withArgs(other.address, true);

      let enabled = await task.connect(manager).managers(other.address);
      expect(enabled).to.be.equal(true);
    });

    it("not owner should revert", async () => {
      await expect(
        task.connect(other).setManager(other.address, true)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });
})