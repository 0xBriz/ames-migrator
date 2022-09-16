import { BigNumber, Contract, ethers } from "ethers";
import { ERC20_ABI } from "./abi/ERC20_ABI";
import { UNI_ROUTER_ABI } from "./abi/UniRouterABI";

export const ASHARE_BALANCEOF_SLOT = 0;
export const BUSD_BALANCEOF_SLOT = 1;
export const USDC_BALANCEOF_SLOT = 1;
export const AMES_BALANCEOF_SLOT = 0;

export function getUniRouter(address: string, signer: any) {
  return new Contract(address, UNI_ROUTER_ABI, signer);
}

export function getERC20(address: string, signer: any) {
  return new Contract(address, ERC20_ABI, signer);
}

export const toBytes32 = (bn: BigNumber) => {
  return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
};

export const prepStorageSlotWrite = (tokenReceiverAddress: string, storageSlot: number) => {
  return ethers.utils.solidityKeccak256(
    ["uint256", "uint256"], // Need to be uint256 for
    [tokenReceiverAddress, storageSlot] // key, slot - solidity mappings storage = keccak256(mapping key value, value at that key)
  );
};

export const setStorageAt = async (
  provider: ethers.providers.JsonRpcProvider,
  contractAddress: string,
  slotMappingIndexHash: string,
  value: BigNumber
) => {
  await provider.send("hardhat_setStorageAt", [
    contractAddress,
    slotMappingIndexHash,
    toBytes32(value).toString(),
  ]);
  await provider.send("evm_mine", []); // Just mines to the next block
};

export async function setTokenBalance(
  provider: ethers.providers.JsonRpcProvider,
  tokenAddress: string,
  amount: BigNumber,
  tokenReceiverAddress: string,
  storageSlot: number
) {
  const slotData = prepStorageSlotWrite(tokenReceiverAddress, storageSlot);
  await setStorageAt(provider, tokenAddress, slotData, amount);
}
