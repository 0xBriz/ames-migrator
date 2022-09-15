import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { JsonRpcSigner } from "@ethersproject/providers/lib/json-rpc-provider";

const LP_HOLDER = "0x891eFc56f5CD6580b2fEA416adC960F2A6156494";

const amesPoolAddress = "0x9AA867870d5775A3C155325DB0cb0B116bbF4b6a";
const poolId = "0x9aa867870d5775a3c155325db0cb0b116bbf4b6a000200000000000000000002";

describe("Migrator", () => {
  let migrator: Contract;
  let amesCakePair: Contract;
  let ashareCakePair: Contract;
  let account: any;
  let amesPool: Contract;
  let asharePool: Contract;

  beforeEach(async () => {
    await helpers.impersonateAccount(LP_HOLDER);
    account = await ethers.provider.getSigner(LP_HOLDER);

    const Migrator = await ethers.getContractFactory("Migrator");
    migrator = await Migrator.deploy();
    migrator = await migrator.deployed();

    amesCakePair = await ethers.getContractAt(
      [
        "function balanceOf(address) public view returns (uint256)",
        "function approve(address, uint256) external",
        "function allowance(address, address) public view returns (uint256)",
      ],
      "0x81722a6457e1825050B999548a35E30d9f11dB5c"
    );

    ashareCakePair = await ethers.getContractAt(
      [
        "function balanceOf(address) public view returns (uint256)",
        "function approve(address, uint256) external",
        "function allowance(address, address) public view returns (uint256)",
      ],
      "0x91da56569559b0629f076dE73C05696e34Ee05c1"
    );

    amesPool = await ethers.getContractAt(
      ["function balanceOf(address) public view returns (uint256)"],
      amesPoolAddress
    );

    asharePool = await ethers.getContractAt(
      ["function balanceOf(address) public view returns (uint256)"],
      "0x74154c70F113C2B603aa49899371D05eeEDd1E8c"
    );
  });

  it("Should migrate AMES cake LP to APT", async () => {
    const amount = parseEther("2");
    await amesCakePair.connect(account).approve(migrator.address, ethers.constants.MaxUint256);
    await migrator.connect(account).migrate(amount, 0);
    console.log(formatEther(await amesPool.balanceOf(LP_HOLDER)));
  });

  it("Should migrate ASHARE cake LP to APT", async () => {
    await ashareCakePair.connect(account).approve(migrator.address, ethers.constants.MaxUint256);
    await migrator.connect(account).migrate(await ashareCakePair.balanceOf(LP_HOLDER), 1);
    console.log(formatEther(await asharePool.balanceOf(LP_HOLDER)));
  });
});
