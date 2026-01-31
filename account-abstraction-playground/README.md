# Agreement Contract Deployment System

A blockchain-based smart contract system that enables users to deploy customizable agreement contracts between investors and founders. Each agreement is stored immutably on the blockchain as a smart contract.

## Overview

This system consists of two main smart contracts:
- **ContractFactory**: Deploys and manages agreement contracts
- **Contract**: Individual agreement contracts containing investor-founder deal terms

## Architecture

```
┌─────────────────────┐
│  ContractFactory    │
│  (Deployer)         │
└──────────┬──────────┘
           │
           │ deploys
           ▼
┌─────────────────────┐
│   Contract (1)      │
│   Agreement Data    │
└─────────────────────┘
           │
           │ deploys
           ▼
┌─────────────────────┐
│   Contract (2)      │
│   Agreement Data    │
└─────────────────────┘
           │
          ...
```

## Contract Details

### Contract.sol - Individual Agreement Contract

Each deployed Contract represents a single agreement between an investor and a founder.

#### State Variables
- `i_investorAddress` - Immutable address of the investor
- `i_founderAddress` - Immutable address of the founder
- `i_dataHash` - Immutable string containing agreement data/hash
- `s_contractDetails` - Struct containing all agreement details and creation timestamp

#### Key Features
- **Access Control**: Only investor and founder can view agreement details
- **Immutable Terms**: Agreement addresses and data cannot be changed after deployment
- **Timestamp Tracking**: Records exact creation time
- **Event Emission**: Emits `ContractCreated` event on deployment

#### Functions

##### `constructor(address _investor, address _founder, string memory _data)`
Initializes the agreement contract.
- Validates addresses are not zero addresses
- Stores investor, founder, and agreement data
- Records creation timestamp
- Emits ContractCreated event

**Parameters:**
- `_investor`: Address of the investor party
- `_founder`: Address of the founder party
- `_data`: Agreement data or hash of agreement document

**Reverts:**
- `Contract__InvalidAddress()` if investor or founder is zero address

##### `getData() → string`
Returns the agreement data.
- **Access**: Restricted to investor and founder only
- **Visibility**: Public view

##### `getContractDetails() → ContractDetails`
Returns complete contract details including addresses, data, and timestamp.
- **Access**: Restricted to investor and founder only
- **Visibility**: Public view

##### `getInvestor() → address`
Returns the investor's address.
- **Access**: Public
- **Visibility**: Public view

##### `getFounder() → address`
Returns the founder's address.
- **Access**: Public
- **Visibility**: Public view

##### `getCreatedAt() → uint256`
Returns the contract creation timestamp.
- **Access**: Public
- **Visibility**: Public view

#### Custom Errors
- `Contract__NotFounderOrInvestor()` - Thrown when unauthorized address attempts restricted action
- `Contract__InvalidAddress()` - Thrown when zero address provided

---

### ContractFactory.sol - Factory Contract

The factory contract handles deployment and tracking of all agreement contracts.

#### State Variables
- `s_contractIdCount` - Counter for assigning unique IDs to contracts
- `contractsIdentifier` - Maps contract IDs to deployed contract addresses
- `s_userContracts` - Maps user addresses to array of their associated contract IDs
- `s_allContracts` - Array containing all deployed contract addresses

#### Key Features
- **Unique ID Assignment**: Each contract gets a sequential ID
- **Multi-Party Tracking**: Tracks contracts for investor, founder, AND deployer
- **Complete History**: Maintains array of all deployed contracts
- **Event Logging**: Emits detailed deployment events

#### Functions

##### `createContract(address _investor, address _founder, string memory _data) → (uint256, address)`
Deploys a new agreement contract.

**Process:**
1. Validates investor and founder addresses
2. Deploys new Contract instance
3. Increments and assigns contract ID
4. Stores contract address in multiple mappings
5. Tracks contract for investor, founder, and deployer (msg.sender)
6. Emits ContractDeployed event
7. Returns contract ID and address

**Parameters:**
- `_investor`: Address of the investor
- `_founder`: Address of the founder
- `_data`: Agreement data or document hash

**Returns:**
- `uint256`: The unique contract ID
- `address`: The deployed contract address

**Reverts:**
- `ContractFactory__InvalidAddress()` if investor or founder is zero address

**Note:** Currently tracks the contract ID for three parties:
- The investor
- The founder
- The deployer (msg.sender)

This means if Alice deploys a contract where she's also the investor, her address will have the contract ID added twice.

##### `getContractById(uint256 _contractId) → address`
Returns the contract address for a given ID.

##### `getUserContracts(address _user) → uint256[]`
Returns array of all contract IDs associated with a user.

**Use Cases:**
- Get all contracts deployed by a user
- Get all contracts where user is an investor
- Get all contracts where user is a founder

##### `getAllContracts() → address[]`
Returns array of all deployed contract addresses.

##### `getTotalContractsCount() → uint256`
Returns total number of contracts deployed.

##### `getContractDetails(uint256 _contractId) → (address, address, address)`
Returns contract details by querying the deployed Contract instance.

**Returns:**
- `contractAddress`: The contract's address
- `investor`: The investor's address
- `founder`: The founder's address

**Reverts:**
- If contract ID doesn't exist (contract address is zero)

#### Custom Errors
- `ContractFactory__InvalidAddress()` - Thrown when zero address provided during contract creation

#### Events

##### `ContractDeployed`
```solidity
event ContractDeployed(
    uint256 indexed contractId,
    address indexed contractAddress,
    address indexed creator,
    address investor,
    address founder,
    uint256 timestamp
)
```

Emitted when a new agreement contract is deployed.

## Usage Examples

### Deploying a New Agreement Contract

```solidity
// Deploy factory (one-time)
ContractFactory factory = new ContractFactory();

// Create agreement contract
address investor = 0x123...;
address founder = 0x456...;
string memory agreementData = "QmHash..."; // IPFS hash or data

(uint256 contractId, address contractAddress) = factory.createContract(
    investor,
    founder,
    agreementData
);

// Contract is now deployed and tracked
```

### Retrieving User's Contracts

```solidity
// Get all contracts for a user
uint256[] memory myContracts = factory.getUserContracts(msg.sender);

// Loop through and get details
for (uint i = 0; i < myContracts.length; i++) {
    address contractAddr = factory.getContractById(myContracts[i]);

    (address contractAddress, address investor, address founder) =
        factory.getContractDetails(myContracts[i]);

    // Access individual contract
    Contract agreementContract = Contract(contractAddr);
    address investorCheck = agreementContract.getInvestor();
}
```

### Accessing Agreement Data (As Investor/Founder)

```solidity
// Get contract instance
Contract agreementContract = Contract(contractAddress);

// Only investor or founder can call these
string memory data = agreementContract.getData();
Contract.ContractDetails memory details = agreementContract.getContractDetails();

// Public getters work for anyone
address investor = agreementContract.getInvestor();
address founder = agreementContract.getFounder();
uint256 createdAt = agreementContract.getCreatedAt();
```

## Security Considerations

### Access Control
- Agreement data is **restricted** to investor and founder only
- Uses custom modifiers with revert-on-fail pattern
- Immutable addresses prevent ownership changes

### Input Validation
- Zero address checks on both contracts
- Prevents deployment with invalid parties

### Tracking Behavior
**Important**: The factory currently adds the same contract ID to the array for:
1. The investor
2. The founder
3. The deployer (msg.sender)

If the same address has multiple roles (e.g., deployer is also investor), the contract ID will appear multiple times in their `s_userContracts` array.

**Possible improvements:**
- Add deduplication logic
- Separate tracking for deployer vs parties
- Add role-specific getter functions

## Foundry Development

### Build

```shell
forge build
```

### Test

```shell
forge test
```

### Format

```shell
forge fmt
```

### Gas Snapshots

```shell
forge snapshot
```

### Anvil (Local Node)

```shell
anvil
```

### Deploy

```shell
forge script script/DeployFactory.s.sol:DeployFactory --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast (Blockchain Interaction)

```shell
cast <subcommand>
```

### Help

```shell
forge --help
anvil --help
cast --help
```

## Deployment Guide

### Prerequisites
- Solidity ^0.8.18
- Foundry installed
- Network access (testnet or mainnet)
- Private key with funds for deployment

### Deploy Factory Contract

```bash
# Deploy to local Anvil node
anvil  # In separate terminal
forge create src/ContractFactory.sol:ContractFactory --rpc-url http://localhost:8545 --private-key <anvil_key>

# Deploy to Sepolia testnet
forge create src/ContractFactory.sol:ContractFactory --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --verify

# Deploy to mainnet (be careful!)
forge create src/ContractFactory.sol:ContractFactory --rpc-url $MAINNET_RPC_URL --private-key $PRIVATE_KEY --verify
```

### Interact with Factory

```bash
# Call createContract function
cast send <FACTORY_ADDRESS> "createContract(address,address,string)" <INVESTOR> <FOUNDER> "agreement-data" --rpc-url <RPC_URL> --private-key <KEY>

# Get user contracts
cast call <FACTORY_ADDRESS> "getUserContracts(address)(uint256[])" <USER_ADDRESS> --rpc-url <RPC_URL>

# Get total contracts count
cast call <FACTORY_ADDRESS> "getTotalContractsCount()(uint256)" --rpc-url <RPC_URL>
```

## Gas Considerations

- **Contract Deployment**: ~500k-700k gas (varies with data size)
- **createContract()**: Deploys new contract + storage operations
- **View Functions**: No gas cost (read-only)

## Events for Frontend Integration

All contract deployments emit `ContractDeployed` events that can be indexed:

```javascript
// Listen for deployments using ethers.js
factory.on("ContractDeployed", (contractId, contractAddress, creator, investor, founder, timestamp) => {
    console.log(`New contract ${contractId} deployed at ${contractAddress}`);
    console.log(`Creator: ${creator}`);
    console.log(`Investor: ${investor}, Founder: ${founder}`);
});
```

## Future Enhancements

Potential improvements to consider:
- [ ] Add contract status (active/completed/cancelled)
- [ ] Implement signature requirements before finalization
- [ ] Add milestone tracking within agreements
- [ ] Support for multi-party agreements (>2 parties)
- [ ] Upgradeable contract pattern
- [ ] Add pause/emergency stop functionality
- [ ] Deduplicate contract tracking for users with multiple roles
- [ ] Add pagination for getUserContracts() with many contracts
- [ ] Implement contract templates
- [ ] Add dispute resolution mechanism
- [ ] Token-based escrow functionality

## Testing

Write comprehensive tests in `test/` directory:

```solidity
// test/ContractFactory.t.sol
pragma solidity ^0.8.18;

import "forge-std/Test.sol";
import "../src/ContractFactory.sol";

contract ContractFactoryTest is Test {
    ContractFactory factory;
    address investor = address(1);
    address founder = address(2);

    function setUp() public {
        factory = new ContractFactory();
    }

    function testCreateContract() public {
        (uint256 id, address addr) = factory.createContract(
            investor,
            founder,
            "test-data"
        );

        assertEq(id, 1);
        assertNotEq(addr, address(0));
    }
}
```

## License

MIT License

## Version

Solidity: ^0.8.18
Foundry: Latest

## Documentation

Full Foundry documentation: https://book.getfoundry.sh/
