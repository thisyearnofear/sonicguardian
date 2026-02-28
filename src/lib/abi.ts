export const abi = [
    {
        "name": "ISonicGuardian",
        "type": "interface",
        "items": [
            {
                "name": "register_guardian",
                "type": "function",
                "inputs": [
                    {
                        "name": "btc_address",
                        "type": "core::felt252"
                    },
                    {
                        "name": "commitment",
                        "type": "core::felt252"
                    },
                    {
                        "name": "blinding_commitment",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "verify_recovery",
                "type": "function",
                "inputs": [
                    {
                        "name": "btc_address",
                        "type": "core::felt252"
                    },
                    {
                        "name": "dna_hash",
                        "type": "core::felt252"
                    },
                    {
                        "name": "blinding",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::bool"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "authorize_btc_recovery",
                "type": "function",
                "inputs": [
                    {
                        "name": "btc_address",
                        "type": "core::felt252"
                    },
                    {
                        "name": "dna_hash",
                        "type": "core::felt252"
                    },
                    {
                        "name": "blinding",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::felt252"
                    }
                ],
                "state_mutability": "external"
            },
            {
                "name": "get_commitment",
                "type": "function",
                "inputs": [
                    {
                        "name": "btc_address",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::felt252"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "get_guardian_count",
                "type": "function",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "view"
            }
        ]
    }
];
