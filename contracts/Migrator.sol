// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IVault.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract Migrator {
    IUniswapV2Router02 constant router =
        IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E);

    IERC20 constant BUSD = IERC20(0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56);
    IERC20 constant AMES = IERC20(0xb9E05B4C168B56F73940980aE6EF366354357009);

    IERC20 constant LP = IERC20(0x81722a6457e1825050B999548a35E30d9f11dB5c);

    address[] tokens;

    IVault public constant vault = IVault(0xEE1c8DbfBf958484c6a4571F5FB7b99B74A54AA7);

    bytes32 constant poolID = 0x9aa867870d5775a3c155325db0cb0b116bbf4b6a000200000000000000000002;

    constructor() {
        tokens = new address[](2);
        tokens[0] = address(BUSD);
        tokens[1] = address(AMES);
    }

    function migrate(uint256 amount) external {
        require(LP.transferFrom(msg.sender, address(this), amount), "ERR TRANSFER FROM");

        _removeLiquidity();

        uint256[] memory nums = new uint256[](2);
        nums[0] = BUSD.balanceOf(address(this));
        nums[1] = AMES.balanceOf(address(this));

        _pairLiquidity(msg.sender, nums);

        delete nums;
    }

    function _removeLiquidity() internal {
        LP.approve(address(router), LP.balanceOf(address(this)));
        router.removeLiquidity(
            address(BUSD),
            address(AMES),
            LP.balanceOf(address(this)),
            0,
            0,
            address(this),
            block.timestamp + 100
        );
    }

    function _pairLiquidity(address _lpTokenRecipient, uint256[] memory _initialBalances) internal {
        require(
            tokens.length == _initialBalances.length,
            "tokens.length != _initialBalances.length"
        );

        for (uint256 i = 0; i < _initialBalances.length; i++) {
            // Need to approve the vault first to pull the tokens
            IERC20(tokens[i]).approve(address(vault), type(uint256).max);
        }

        // Put together a JoinPoolRequest type
        JoinPoolRequest memory joinRequest;
        joinRequest.tokens = tokens;
        joinRequest.maxAmountsIn = _initialBalances;
        // In this case we do not need to be concerned with internal balances
        joinRequest.fromInternalBalance = false;

        uint256 joinKind = 1; // INIT_JOIN
        // User data needs to be encoded
        // Different join types require different parameters to be encoded
        bytes memory userJoinDataEncoded = abi.encode(joinKind, _initialBalances);
        joinRequest.userData = userJoinDataEncoded;

        // Tokens are pulled from sender (Or could be an approved relayer)
        address sender = address(this);
        vault.joinPool(poolID, sender, _lpTokenRecipient, joinRequest);
    }
}
