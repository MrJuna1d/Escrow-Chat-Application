# MinimalAccount - ERC-4337 Smart Contract Wallet Guide

## Overview

This guide shows you how to build and use a **MinimalAccount** - a smart contract wallet from scratch that can interact with the `AddingNumber` contract while having gas fees sponsored by a paymaster.

## Architecture

```
Your EOA (Anvil Account #0)
    |
    | owns & signs
    ↓
MinimalAccount (Smart Contract Wallet)
    |
    | executes
    ↓
AddingNumber.increment()

Gas paid by → SimplePaymaster
All coordinated through → EntryPoint (ERC-4337)
```

## Key Contracts

### 1. **MinimalAccount.sol** (`src/MinimalAccount.sol`)

A minimal ERC-4337 compliant smart contract wallet with:
- ✅ Owner-based access control (uses OpenZeppelin's `Ownable`)
- ✅ `execute()` function to call other contracts
- ✅ EIP-191 signature validation (`eth_sign` format)
- ✅ EntryPoint integration for account abstraction

**Key Features:**
```solidity
// Execute any transaction
function execute(address dest, uint256 value, bytes calldata functionData)

// Validate UserOperation (called by EntryPoint)
function validateUserOp(PackedUserOperation calldata userOp, ...)

// Signature validation uses EIP-191 format
function _validateSignature(...)  // Uses MessageHashUtils.toEthSignedMessageHash
```

### 2. **MinimalAccountFactory.sol** (`src/MinimalAccountFactory.sol`)

Factory contract that deploys MinimalAccount instances using **CREATE2** for deterministic addresses:
```solidity
// Deploy a new account (or return existing)
function createAccount(address owner, uint256 salt) returns (address)

// Calculate address before deployment
function getAddress(address owner, uint256 salt) returns (address)
```

### 3. **SimplePaymaster.sol** (`src/SimplePaymaster.sol`)

Sponsors gas fees for any UserOperation (for testing):
```solidity
// Validates all UserOperations (accepts everything)
function _validatePaymasterUserOp(...) returns (bytes memory context, uint256 validationData)
```

## How It Works

### Step 1: Deployment

```bash
# Deploy EntryPoint, Paymaster, AddingNumber, and fund paymaster
forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast
```

**What gets deployed:**
1. `EntryPoint` - ERC-4337 entry point
2. `SimplePaymaster` - Gas sponsor (funded with 1 ETH)
3. `AddingNumber` - Target contract with `increment()` function

### Step 2: Create Your MinimalAccount

Your smart contract wallet address is **computed deterministically** but not deployed yet:

```solidity
address wallet = factory.getAddress(owner, 0);
// Returns: 0x810DF98B2d86118942CCF08230d4a75D23e5fEF5 (example)
// Code size: 0 (doesn't exist yet)
```

### Step 3: Send First UserOperation

Run the interaction script:
```bash
forge script script/InteractMinimal.s.sol:InteractMinimalScript --rpc-url http://localhost:8545 --broadcast
```

**What happens:**

1. **Build UserOperation**
   ```solidity
   PackedUserOperation {
       sender: walletAddress,           // Your MinimalAccount
       nonce: 0,                        // First transaction
       initCode: <factory + owner>,     // Deploy wallet
       callData: execute(AddingNumber, 0, increment()),
       accountGasLimits: ...,
       paymasterAndData: <paymaster>,   // Paymaster pays
       signature: <your signature>
   }
   ```

2. **Sign with EIP-191 Format** (Important!)
   ```solidity
   bytes32 userOpHash = entryPoint.getUserOpHash(userOp);

   // MinimalAccount uses eth_sign format
   bytes32 ethSignedMessageHash = keccak256(
       abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash)
   );

   (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, ethSignedMessageHash);
   userOp.signature = abi.encodePacked(r, s, v);
   ```

3. **Submit to EntryPoint**
   ```solidity
   entryPoint.handleOps([userOp], beneficiary);
   ```

4. **EntryPoint Processes**
   ```
   EntryPoint receives UserOp
       ↓
   1. Deploys MinimalAccount via factory (from initCode)
       ↓
   2. Calls wallet.validateUserOp()
       - Verifies signature matches owner
       - Pays gas to EntryPoint
       ↓
   3. Calls paymaster.validatePaymasterUserOp()
       - Paymaster agrees to sponsor
       ↓
   4. Executes: wallet.execute(AddingNumber, 0, increment())
       ↓
   5. AddingNumber.number() increments from 0 → 1
       ↓
   6. Paymaster refunds gas costs
   ```

## Key Differences: MinimalAccount vs SimpleAccount

| Feature | MinimalAccount | SimpleAccount |
|---------|----------------|---------------|
| Base Contract | `IAccount` + `Ownable` | `BaseAccount` |
| Signature Format | **EIP-191** (`eth_sign`) | **Raw ECDSA** |
| Deployment | CREATE2 via Factory | CREATE2 via Factory + Proxy |
| Upgradeability | ❌ Not upgradeable | ✅ UUPS Upgradeable |
| Complexity | Minimal (~200 lines) | Full-featured (~300+ lines) |

### Signature Difference (IMPORTANT!)

**MinimalAccount:**
```solidity
// Uses EIP-191 format (adds prefix)
bytes32 hash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
address signer = ECDSA.recover(hash, signature);
```

**SimpleAccount:**
```solidity
// Uses raw ECDSA (no prefix)
address signer = ECDSA.recover(userOpHash, signature);
```

## Testing

Run all tests:
```bash
# Test MinimalAccount
forge test --match-contract MinimalAccountTest -vv

# Test SimpleAccount
forge test --match-contract AccountAbstractionTest -vv
```

## Cast Commands for Verification

```bash
# Check AddingNumber current value
cast call 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 "number()(uint256)" --rpc-url http://localhost:8545

# Check if your MinimalAccount is deployed
cast code <YOUR_WALLET_ADDRESS> --rpc-url http://localhost:8545

# Check paymaster balance
cast call 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 "getDeposit()(uint256)" --rpc-url http://localhost:8545
```

## Contract Addresses (Anvil)

After running `Deploy.s.sol`:
```
EntryPoint:          0x5FbDB2315678afecb367f032d93F642f64180aa3
SimplePaymaster:     0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
AddingNumber:        0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
```

Your MinimalAccount address is computed based on:
- Factory address
- Owner address (your EOA)
- Salt (0)

## Understanding the Flow

### Traditional Transaction
```
You (EOA) → AddingNumber.increment()
- You sign transaction
- You pay gas in ETH
```

### Account Abstraction with MinimalAccount
```
You (EOA) → Sign UserOp → EntryPoint → MinimalAccount → AddingNumber.increment()
                                            ↑
                                    Paymaster pays gas
```

**Benefits:**
- ✅ Gas abstraction (paymaster pays)
- ✅ Batch transactions
- ✅ Sponsored transactions
- ✅ Flexible validation logic
- ✅ Custom wallet logic

## Code Structure

```
src/
├── MinimalAccount.sol           # Your smart contract wallet
├── MinimalAccountFactory.sol    # Factory for deploying wallets
├── SimplePaymaster.sol          # Gas sponsor
└── AddingNumber.sol             # Target contract

script/
├── Deploy.s.sol                 # Deploy infrastructure
└── InteractMinimal.s.sol        # Interact with MinimalAccount

test/
├── MinimalAccount.t.sol         # Tests for MinimalAccount
└── AccountAbstraction.t.sol     # Tests for SimpleAccount
```

## Next Steps

1. **Customize validation logic** - Add custom rules in `_validateSignature()`
2. **Add session keys** - Allow temporary keys with limited permissions
3. **Implement recovery** - Add social recovery mechanisms
4. **Gas optimization** - Optimize for lower gas costs
5. **Production paymaster** - Build a real paymaster with verification logic

## Resources

- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Account Abstraction Documentation](https://github.com/eth-infinitism/account-abstraction)
- [Foundry Book](https://book.getfoundry.sh/)

---

**Built by Eggwae** - A minimal, educational implementation of ERC-4337 Account Abstraction
