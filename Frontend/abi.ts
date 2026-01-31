// export const Abi = [{"type":"function","name":"contractsIdentifier","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"createContract","inputs":[{"name":"_investor","type":"address","internalType":"address"},{"name":"_founder","type":"address","internalType":"address"},{"name":"_data","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"},{"name":"","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"getAllContracts","inputs":[],"outputs":[{"name":"","type":"address[]","internalType":"address[]"}],"stateMutability":"view"},{"type":"function","name":"getContractById","inputs":[{"name":"_contractId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"getContractDetails","inputs":[{"name":"_contractId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"contractAddress","type":"address","internalType":"address"},{"name":"investor","type":"address","internalType":"address"},{"name":"founder","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"getTotalContractsCount","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getUserContracts","inputs":[{"name":"_user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"view"},{"type":"event","name":"ContractDeployed","inputs":[{"name":"contractId","type":"uint256","indexed":true,"internalType":"uint256"},{"name":"contractAddress","type":"address","indexed":true,"internalType":"address"},{"name":"creator","type":"address","indexed":true,"internalType":"address"},{"name":"investor","type":"address","indexed":false,"internalType":"address"},{"name":"founder","type":"address","indexed":false,"internalType":"address"},{"name":"timestamp","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"error","name":"ContractFactory__InvalidAddress","inputs":[]}] as const;

export const Abi = [
	{
		"inputs": [],
		"name": "ContractFactory__InvalidAddress",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "contractId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "contractAddress",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "investor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "founder",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "releaseDate",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "ContractDeployed",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_investor",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_founder",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_data",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_releaseDate",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_amount",
				"type": "uint256"
			}
		],
		"name": "createContract",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "contractsIdentifier",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllContracts",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_contractId",
				"type": "uint256"
			}
		],
		"name": "getContractById",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_contractId",
				"type": "uint256"
			}
		],
		"name": "getContractDetails",
		"outputs": [
			{
				"internalType": "address",
				"name": "contractAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "investor",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "founder",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_contractId",
				"type": "uint256"
			}
		],
		"name": "getFullContractDetails",
		"outputs": [
			{
				"internalType": "address",
				"name": "contractAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "investor",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "founder",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "dataHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "createdAt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "releaseDate",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "released",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalContractsCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getUserContracts",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
] as const;