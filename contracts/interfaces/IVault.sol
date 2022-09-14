// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct JoinPoolRequest {
    address[] tokens;
    uint256[] maxAmountsIn;
    bytes userData;
    bool fromInternalBalance;
}

interface IVault {
    function joinPool(
        bytes32 poolId,
        address sender,
        address recipient,
        JoinPoolRequest memory joinPoolRequest
    ) external payable;
}
