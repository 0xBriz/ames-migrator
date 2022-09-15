import { ethers } from "hardhat";

async function main() {
  const Migrator = await ethers.getContractFactory("Migrator");
  const migrate = await Migrator.deploy();
  await migrate.deployed();

  console.log(`Migrator deployed to ${migrate.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
