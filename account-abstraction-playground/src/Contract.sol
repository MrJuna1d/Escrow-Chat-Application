// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Contract {

    error Contract__NotFounderOrInvestor();
    error Contract__InvalidAddress();
    error Contract__DeadlineNotReached();
    error Contract__AlreadyReleased();
    error Contract__InsufficientFunds();

    struct ContractDetails {
        address investorAddress;
        address founderAddress;
        string dataHash;
        uint256 createdAt;
        uint256 releaseDate; // When funds can be released
        uint256 amount; // Amount to be released
        bool released; // Track if funds were released
    }

    ContractDetails private s_contractDetails;
    address private immutable i_investorAddress;
    address private immutable i_founderAddress;
    string private i_dataHash;

    event ContractCreated(
        address indexed investor,
        address indexed founder,
        string dataHash,
        uint256 timestamp,
        uint256 releaseDate,
        uint256 amount
    );

    event FundsDeposited(
        address indexed from,
        uint256 amount,
        uint256 timestamp
    );

    event FundsReleased(
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );

    modifier checkFounderOrInvestor() {
        if(msg.sender != i_founderAddress && msg.sender != i_investorAddress) {
            revert Contract__NotFounderOrInvestor();
        }
        _;
    }

    constructor(
        address _investor, 
        address _founder, 
        string memory _data,
        uint256 _releaseDate,
        uint256 _amount
    ) payable {
        if(_investor == address(0) || _founder == address(0)) {
            revert Contract__InvalidAddress();
        }

        i_investorAddress = _investor;
        i_founderAddress = _founder;
        i_dataHash = _data;

        s_contractDetails = ContractDetails({
            investorAddress: _investor,
            founderAddress: _founder,
            dataHash: _data,
            createdAt: block.timestamp,
            releaseDate: _releaseDate,
            amount: _amount,
            released: false
        });

        emit ContractCreated(
            _investor, 
            _founder, 
            _data, 
            block.timestamp,
            _releaseDate,
            _amount
        );

        // If ETH was sent during deployment, emit deposit event
        if(msg.value > 0) {
            emit FundsDeposited(msg.sender, msg.value, block.timestamp);
        }
    }

    // Allow investor to deposit funds after deployment
    function depositFunds() external payable {
        if(msg.sender != i_investorAddress) {
            revert Contract__NotFounderOrInvestor();
        }
        emit FundsDeposited(msg.sender, msg.value, block.timestamp);
    }

    // Allow founder to withdraw funds after deadline
    function releaseFunds() external {
        if(msg.sender != i_founderAddress) {
            revert Contract__NotFounderOrInvestor();
        }

        if(block.timestamp < s_contractDetails.releaseDate) {
            revert Contract__DeadlineNotReached();
        }

        if(s_contractDetails.released) {
            revert Contract__AlreadyReleased();
        }

        uint256 balance = address(this).balance;
        if(balance == 0) {
            revert Contract__InsufficientFunds();
        }

        s_contractDetails.released = true;

        // Transfer funds to founder
        (bool success, ) = payable(i_founderAddress).call{value: balance}("");
        require(success, "Transfer failed");

        emit FundsReleased(i_founderAddress, balance, block.timestamp);
    }

    // Allow investor to refund if before deadline
    function refund() external {
        if(msg.sender != i_investorAddress) {
            revert Contract__NotFounderOrInvestor();
        }

        if(block.timestamp >= s_contractDetails.releaseDate) {
            revert Contract__DeadlineNotReached();
        }

        if(s_contractDetails.released) {
            revert Contract__AlreadyReleased();
        }

        uint256 balance = address(this).balance;
        if(balance == 0) {
            revert Contract__InsufficientFunds();
        }

        s_contractDetails.released = true;

        (bool success, ) = payable(i_investorAddress).call{value: balance}("");
        require(success, "Refund failed");

        emit FundsReleased(i_investorAddress, balance, block.timestamp);
    }

    function getData() public view checkFounderOrInvestor returns (string memory) {
        return i_dataHash;
    }

    function getContractDetails() public view checkFounderOrInvestor returns (ContractDetails memory) {
        return s_contractDetails;
    }

    function getInvestor() public view returns (address) {
        return i_investorAddress;
    }

    function getFounder() public view returns (address) {
        return i_founderAddress;
    }

    function getCreatedAt() public view returns (uint256) {
        return s_contractDetails.createdAt;
    }

    function getReleaseDate() public view returns (uint256) {
        return s_contractDetails.releaseDate;
    }

    function getDataHash() public view returns (string memory) {
        return i_dataHash;
    }

    function getAmount() public view returns (uint256) {
        return s_contractDetails.amount;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function isReleased() public view returns (bool) {
        return s_contractDetails.released;
    }
}
