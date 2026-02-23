export const abi = [
    {
        "name": "ISonicGuardian",
        "type": "interface",
        "items": [
            {
                "name": "register_identity",
                "type": "function",
                "inputs": [
                    {
                        "name": "commitment",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "verify_identity",
                "type": "function",
                "inputs": [
                    {
                        "name": "user",
                        "type": "core::starknet::contract_address"
                    },
                    {
                        "name": "proof_hash",
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
                "name": "get_commitment",
                "type": "function",
                "inputs": [
                    {
                        "name": "user",
                        "type": "core::starknet::contract_address"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::felt252"
                    }
                ],
                "state_mutability": "view"
            }
        ]
    }
];
