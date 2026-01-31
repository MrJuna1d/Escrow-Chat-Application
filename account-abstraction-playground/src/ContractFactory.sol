// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Contract} from "contracts/contract.sol";

contract ContractFactory {

    error ContractFactory__InvalidAddress();

    uint256 private s_contractIdCount = 0;

    mapping(uint256 => address) public contractsIdentifier;
    mapping(address => uint256[]) private s_userContracts;
    address[] private s_allContracts;

    event ContractDeployed(
        uint256 indexed contractId,
        address indexed contractAddress,
        address indexed creator,
        address investor,
        address founder,
        uint256 timestamp,
        uint256 releaseDate,
        uint256 amount
    );

    function createContract(
        address _investor, 
        address _founder, 
        string memory _data,
        uint256 _releaseDate,
        uint256 _amount
    ) public payable returns (uint256, address) {
        if(_investor == address(0) || _founder == address(0)) {
            revert ContractFactory__InvalidAddress();
        }

        // Deploy contract with ETH if sent
        Contract contractCreated = new Contract{value: msg.value}(
            _investor, 
            _founder, 
            _data,
            _releaseDate,
            _amount
        );
        address contractAddress = address(contractCreated);

        s_contractIdCount++;
        contractsIdentifier[s_contractIdCount] = contractAddress;
        s_allContracts.push(contractAddress);

        s_userContracts[_investor].push(s_contractIdCount);
        s_userContracts[_founder].push(s_contractIdCount);
        s_userContracts[msg.sender].push(s_contractIdCount);

        emit ContractDeployed(
            s_contractIdCount,
            contractAddress,
            msg.sender,
            _investor,
            _founder,
            block.timestamp,
            _releaseDate,
            _amount
        );

        return (s_contractIdCount, contractAddress);
    }

    function getContractById(uint256 _contractId) public view returns (address) {
        return contractsIdentifier[_contractId];
    }

    function getUserContracts(address _user) public view returns (uint256[] memory) {
        return s_userContracts[_user];
    }

    function getAllContracts() public view returns (address[] memory) {
        return s_allContracts;
    }

    function getTotalContractsCount() public view returns (uint256) {
        return s_contractIdCount;
    }

    function getContractDetails(uint256 _contractId) public view returns (
        address contractAddress,
        address investor,
        address founder
    ) {
        address contractAddr = contractsIdentifier[_contractId];
        require(contractAddr != address(0), "Contract does not exist");

        Contract deployedContract = Contract(contractAddr);

        return (
            contractAddr,
            deployedContract.getInvestor(),
            deployedContract.getFounder()
        );
    }

    function getFullContractDetails(uint256 _contractId) public view returns (
        address contractAddress,
        address investor,
        address founder,
        string memory dataHash,
        uint256 createdAt,
        uint256 releaseDate,
        uint256 amount,
        uint256 balance,
        bool released
    ) {
        address contractAddr = contractsIdentifier[_contractId];
        require(contractAddr != address(0), "Contract does not exist");

        Contract deployedContract = Contract(contractAddr);

        return (
            contractAddr,
            deployedContract.getInvestor(),
            deployedContract.getFounder(),
            deployedContract.getDataHash(),
            deployedContract.getCreatedAt(),
            deployedContract.getReleaseDate(),
            deployedContract.getAmount(),
            contractAddr.balance,
            deployedContract.isReleased()
        );
    }

}