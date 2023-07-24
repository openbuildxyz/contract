const hre = require("hardhat");

async function main() {
  const OpenBuildNFTv1 = await hre.ethers.deployContract("OpenBuildNFTv1");
  await OpenBuildNFTv1.waitForDeployment();

  console.log("OpenBuildNFTv1 was deployed to:", OpenBuildNFTv1.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
