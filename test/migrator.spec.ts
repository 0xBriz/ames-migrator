import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { JsonRpcSigner } from "@ethersproject/providers/lib/json-rpc-provider";

const LP_HOLDER = "0x891eFc56f5CD6580b2fEA416adC960F2A6156494";

const poolAddress = "0x9AA867870d5775A3C155325DB0cb0B116bbF4b6a";
const poolId = "0x9aa867870d5775a3c155325db0cb0b116bbf4b6a000200000000000000000002";

describe("Migrator", () => {
  let migrator: Contract;
  let pair: Contract;
  let account: any;
  let pool: Contract;

  beforeEach(async () => {
    await helpers.impersonateAccount(LP_HOLDER);
    account = await ethers.provider.getSigner(LP_HOLDER);

    const Migrator = await ethers.getContractFactory("Migrator");
    migrator = await Migrator.deploy();
    migrator = await migrator.deployed();

    pair = await ethers.getContractAt(
      [
        "function balanceOf(address) public view returns (uint256)",
        "function approve(address, uint256) external",
        "function allowance(address, address) public view returns (uint256)",
      ],
      "0x81722a6457e1825050B999548a35E30d9f11dB5c"
    );

    pool = await ethers.getContractAt(
      ["function balanceOf(address) public view returns (uint256)"],
      poolAddress
    );
  });

  it("Should migrate cake LP to APT", async () => {
    const amount = parseEther("2");
    await pair.connect(account).approve(migrator.address, ethers.constants.MaxUint256);
    await migrator.connect(account).migrate(amount);
    console.log(formatEther(await pool.balanceOf(LP_HOLDER)));
  });
});
