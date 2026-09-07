/**
 * Sonic Guardian ABI — v1.4.0-replay-bound
 *
 * This matches the deployed contract at ISonicGuardian. Interface is unchanged
 * since v1.3.0; v1.4.0 adds a behavior change in `authorize_with_acoustic_signature`:
 * the message_hash must equal Poseidon(btc_address, end of the current 15-min
 * window) — see sonic-authorization.ts (THREAT_MODEL_REVIEW.md R7).
 * Dead functions have been removed:
 *   - verify_recovery (deprecated — requires DNA reveal)
 *   - authorize_btc_recovery (deprecated — requires DNA reveal)
 *   - create_onchain_gift / claim_onchain_gift (feature-creep removed)
 *   - get_vault_commitment (gifting abandoned)
 *   - IERC20 (unused in this contract)
 */
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
    }
];
