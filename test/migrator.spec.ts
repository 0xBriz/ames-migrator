import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { ERC20_ABI } from "./abi/ERC20_ABI";
import { ASHARE_BALANCEOF_SLOT, BUSD_BALANCEOF_SLOT, getUniRouter, setTokenBalance } from "./utils";
import { UNIV2_PAIR_ABI } from "./abi/UniV2Pair";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const LP_HOLDER = "0x891eFc56f5CD6580b2fEA416adC960F2A6156494";
export const PANCAKESWAP_ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const amesPoolAddress = "0x9AA867870d5775A3C155325DB0cb0B116bbF4b6a";
const asharePoolAddress = "0x74154c70F113C2B603aa49899371D05eeEDd1E8c";
const ASHARE_ADDY = "0xFa4b16b0f63F5A6D0651592620D585D308F749A4";
const AMES_ADDY = "0xb9E05B4C168B56F73940980aE6EF366354357009";
const BUSD_ADDY = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";

const ASHARE_BUSD_PAIR = "0x91da56569559b0629f076dE73C05696e34Ee05c1";

const amesPoolId = "0x9aa867870d5775a3c155325db0cb0b116bbf4b6a000200000000000000000002";

describe("Migrator", () => {
  let migrator: Contract;
  let amesCakePair: Contract;
  let ashareCakePair: Contract;
  let account: any;
  let amesPool: Contract;
  let asharePool: Contract;
  let cakeRouter: Contract;
  let ASHARE: Contract;
  let BUSD: Contract;

  beforeEach(async () => {
    await helpers.impersonateAccount(LP_HOLDER);
    account = await ethers.provider.getSigner(LP_HOLDER);

    const Migrator = await ethers.getContractFactory("Migrator");
    migrator = await Migrator.deploy();
    migrator = await migrator.deployed();

    await setTokenBalance(
      ethers.provider,
      ASHARE_ADDY,
      parseEther("10000"),
      LP_HOLDER,
      ASHARE_BALANCEOF_SLOT
    );

    await setTokenBalance(
      ethers.provider,
      BUSD_ADDY,
      parseEther("10000"),
      LP_HOLDER,
      BUSD_BALANCEOF_SLOT
    );

    cakeRouter = getUniRouter(PANCAKESWAP_ROUTER_ADDRESS, account);
    ASHARE = await ethers.getContractAt(ERC20_ABI, ASHARE_ADDY);
    BUSD = await ethers.getContractAt(ERC20_ABI, BUSD_ADDY);

    amesCakePair = await ethers.getContractAt(
      UNIV2_PAIR_ABI,
      "0x81722a6457e1825050B999548a35E30d9f11dB5c"
    );

    ashareCakePair = await ethers.getContractAt(UNIV2_PAIR_ABI, ASHARE_BUSD_PAIR);

    amesPool = await ethers.getContractAt(ERC20_ABI, amesPoolAddress);
    asharePool = await ethers.getContractAt(ERC20_ABI, asharePoolAddress);

    await addLiquidity();
  });

  async function addLiquidity() {
    // BUSD is token0
    const reserves = await ashareCakePair.getReserves();
    const busdIn = parseEther("10000");
    const quotedAshareOut = await cakeRouter.quote(busdIn, reserves[0], reserves[1]);

    console.log("quotedAshareOut: " + formatEther(quotedAshareOut));

    await BUSD.approve(cakeRouter.address, ethers.constants.MaxUint256);
    await ASHARE.approve(cakeRouter.address, ethers.constants.MaxUint256);

    await cakeRouter.addLiquidity(
      BUSD_ADDY,
      ASHARE_ADDY,
      busdIn,
      quotedAshareOut,
      0,
      0,
      LP_HOLDER,
      (await helpers.time.latest()) + 10000
    );

    console.log(formatEther(await ashareCakePair.balanceOf(LP_HOLDER)));
  }

  // it("Should migrate AMES cake LP to APT", async () => {
  //   const amount = parseEther("2");
  //   await amesCakePair.connect(account).approve(migrator.address, ethers.constants.MaxUint256);
  //   await migrator.connect(account).migrate(amount, 0);
  //   console.log(formatEther(await amesPool.balanceOf(LP_HOLDER)));
  // });

  it("Should migrate ASHARE cake LP to APT", async () => {
    await ashareCakePair.connect(account).approve(migrator.address, ethers.constants.MaxUint256);
    await migrator.connect(account).migrate(await ashareCakePair.balanceOf(LP_HOLDER), 1);
    console.log(formatEther(await asharePool.balanceOf(LP_HOLDER)));

    // It will accept the full amount of ashare and busd, but the price impact
    // Currently getting 373.015391248562245553 APT for $2k migration
    // Use swap or quote method to test price impact
  });

  // it("Should provide proper input amounts for ASHARE", async () => {
  //   expect(true).to.be.true;
  // });
});
