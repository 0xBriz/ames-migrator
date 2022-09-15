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
    IERC20 constant ASHARE = IERC20(0xFa4b16b0f63F5A6D0651592620D585D308F749A4);

    IERC20 constant AMES_LP = IERC20(0x81722a6457e1825050B999548a35E30d9f11dB5c);
    IERC20 constant ASHARE_LP = IERC20(0x91da56569559b0629f076dE73C05696e34Ee05c1);

    IVault public constant vault = IVault(0xEE1c8DbfBf958484c6a4571F5FB7b99B74A54AA7);

    bytes32 constant AMES_POOL_ID =
        0x9aa867870d5775a3c155325db0cb0b116bbf4b6a000200000000000000000002;

    bytes32 constant ASHARE_POOL_ID =
        0x74154c70f113c2b603aa49899371d05eeedd1e8c000200000000000000000003;

    enum PoolType {
        AMES,
        ASHARE
    }

    constructor() {}

    function migrate(uint256 amount, PoolType _poolType) external {
        if (_poolType == PoolType.AMES) {
            _handleAmesMigration(amount);
        } else {
            _handleAshareMigration(amount);
        }
    }

    function _handleAmesMigration(uint256 amount) internal {
        require(AMES_LP.transferFrom(msg.sender, address(this), amount), "ERR TRANSFER FROM");

        // AMES is token0
        _removeLiquidity(AMES_LP, address(AMES), address(BUSD));

        // Need to be in sorted order for vault
        address[] memory tokens = new address[](2);
        tokens[0] = address(AMES);
        tokens[1] = address(BUSD);

        uint256[] memory balances = new uint256[](2);
        balances[0] = AMES.balanceOf(address(this));
        balances[1] = BUSD.balanceOf(address(this));

        _pairLiquidity(msg.sender, balances, AMES_POOL_ID, tokens);
    }

    function _handleAshareMigration(uint256 amount) internal {
        require(ASHARE_LP.transferFrom(msg.sender, address(this), amount), "ERR TRANSFER FROM");
        // Share is token1
        _removeLiquidity(ASHARE_LP, address(BUSD), address(ASHARE));

        // Need to be in sorted order for vault
        address[] memory tokens = new address[](2);
        tokens[0] = address(BUSD);
        tokens[1] = address(ASHARE);

        uint256[] memory balances = new uint256[](2);
        balances[0] = BUSD.balanceOf(address(this));
        balances[1] = ASHARE.balanceOf(address(this));

        _pairLiquidity(msg.sender, balances, ASHARE_POOL_ID, tokens);
    }

    function _removeLiquidity(
        IERC20 _lpToken,
        address _token0,
        address _token1
    ) internal {
        _lpToken.approve(address(router), _lpToken.balanceOf(address(this)));
        router.removeLiquidity(
            _token0,
            _token1,
            _lpToken.balanceOf(address(this)),
            0,
            0,
            address(this),
            block.timestamp + 100
        );
    }

    function _pairLiquidity(
        address _lpTokenRecipient,
        uint256[] memory _initialBalances,
        bytes32 _poolId,
        address[] memory _tokens
    ) internal {
        require(
            _tokens.length == _initialBalances.length,
            "tokens.length != _initialBalances.length"
        );

        for (uint256 i = 0; i < _initialBalances.length; i++) {
            // Need to approve the vault first to pull the tokens
            IERC20(_tokens[i]).approve(address(vault), type(uint256).max);
        }

        // Put together a JoinPoolRequest type
        JoinPoolRequest memory joinRequest;
        joinRequest.tokens = _tokens;
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
        vault.joinPool(_poolId, sender, _lpTokenRecipient, joinRequest);
    }
}
