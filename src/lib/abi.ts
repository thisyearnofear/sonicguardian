export const abi = [
    {
        "name": "ISonicGuardian",
        "type": "interface",
        "items": [
            {
                "name": "register_guardian",
                "type": "function",
                "inputs": [
                    { "name": "btc_address", "type": "core::felt252" },
                    { "name": "commitment", "type": "core::felt252" },
                    { "name": "blinding_commitment", "type": "core::felt252" },
                    { "name": "acoustic_key", "type": "core::felt252" }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "verify_recovery",
                "type": "function",
                "inputs": [
                    { "name": "btc_address", "type": "core::felt252" },
                    { "name": "dna_hash", "type": "core::felt252" },
                    { "name": "blinding", "type": "core::felt252" }
                ],
                "outputs": [{ "type": "core::bool" }],
                "state_mutability": "view"
            },
            {
                "name": "verify_acoustic_signature",
                "type": "function",
                "inputs": [
                    { "name": "btc_address", "type": "core::felt252" },
                    { "name": "message_hash", "type": "core::felt252" },
                    { "name": "signature_r", "type": "core::felt252" },
                    { "name": "signature_s", "type": "core::felt252" }
                ],
                "outputs": [{ "type": "core::bool" }],
                "state_mutability": "view"
            },
            {
                "name": "authorize_btc_recovery",
                "type": "function",
                "inputs": [
                    { "name": "btc_address", "type": "core::felt252" },
                    { "name": "dna_hash", "type": "core::felt252" },
                    { "name": "blinding", "type": "core::felt252" }
                ],
                "outputs": [{ "type": "core::felt252" }],
                "state_mutability": "external"
            },
            {
                "name": "authorize_with_acoustic_signature",
                "type": "function",
                "inputs": [
                    { "name": "btc_address", "type": "core::felt252" },
                    { "name": "message_hash", "type": "core::felt252" },
                    { "name": "signature_r", "type": "core::felt252" },
                    { "name": "signature_s", "type": "core::felt252" }
                ],
                "outputs": [{ "type": "core::felt252" }],
                "state_mutability": "external"
            },
            {
                "name": "create_onchain_gift",
                "type": "function",
                "inputs": [
                    { "name": "vault_id", "type": "core::felt252" },
                    { "name": "commitment", "type": "core::felt252" },
                    { "name": "amount", "type": "core::integer::u256" },
                    { "name": "token_address", "type": "core::starknet::contract_address" }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "claim_onchain_gift",
                "type": "function",
                "inputs": [
                    { "name": "vault_id", "type": "core::felt252" },
                    { "name": "dna_hash", "type": "core::felt252" },
                    { "name": "blinding", "type": "core::felt252" },
                    { "name": "recipient", "type": "core::starknet::contract_address" }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "get_commitment",
                "type": "function",
                "inputs": [{ "name": "btc_address", "type": "core::felt252" }],
                "outputs": [{ "type": "core::felt252" }],
                "state_mutability": "view"
            },
            {
                "name": "get_acoustic_key",
                "type": "function",
                "inputs": [{ "name": "btc_address", "type": "core::felt252" }],
                "outputs": [{ "type": "core::felt252" }],
                "state_mutability": "view"
            },
            {
                "name": "get_vault_commitment",
                "type": "function",
                "inputs": [{ "name": "vault_id", "type": "core::felt252" }],
                "outputs": [{ "type": "core::felt252" }],
                "state_mutability": "view"
            },
            {
                "name": "get_guardian_count",
                "type": "function",
                "inputs": [],
                "outputs": [{ "type": "core::integer::u256" }],
                "state_mutability": "view"
            },
            {
                "name": "get_version",
                "type": "function",
                "inputs": [],
                "outputs": [{ "type": "core::felt252" }],
                "state_mutability": "view"
            }
        ]
    },
    {
        "name": "IERC20",
        "type": "interface",
        "items": [
            {
                "name": "transfer",
                "type": "function",
                "inputs": [
                    { "name": "recipient", "type": "core::starknet::contract_address" },
                    { "name": "amount", "type": "core::integer::u256" }
                ],
                "outputs": [{ "type": "core::bool" }],
                "state_mutability": "external"
            },
            {
                "name": "approve",
                "type": "function",
                "inputs": [
                    { "name": "spender", "type": "core::starknet::contract_address" },
                    { "name": "amount", "type": "core::integer::u256" }
                ],
                "outputs": [{ "type": "core::bool" }],
                "state_mutability": "external"
            },
            {
                "name": "balance_of",
                "type": "function",
                "inputs": [{ "name": "account", "type": "core::starknet::contract_address" }],
                "outputs": [{ "type": "core::integer::u256" }],
                "state_mutability": "view"
            }
        ]
    }
];
