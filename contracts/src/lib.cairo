//! SonicGuardian — ZK sonic identity with zero-knowledge acoustic signatures.
//!
//! Design: Only a Pedersen commitment and a Stark Curve public key are stored on-chain.
//! The blinding factor, DNA hash, and musical pattern never leave the browser.
//!
//! v1.4.0: `authorize_with_acoustic_signature` binds the signed message to
//! `Poseidon(btc_address, end_of_current_15min_window)`, recomputed from
//! `block.timestamp` — intercepted signatures are replayable only until their
//! window closes (THREAT_MODEL_REVIEW.md R7).
//!
//! Deprecated entrypoints (removed from contract but kept in ABI for backwards compat):
//! - `verify_recovery` / `authorize_btc_recovery` — legacy, requires revealing DNA hash.
//! - `create_onchain_gift` / `claim_onchain_gift` — feature-creep removed.

#[starknet::interface]
trait ISonicGuardian<TContractState> {
    fn register_guardian(
        ref self: TContractState,
        btc_address: felt252,
        commitment: felt252,
        blinding_commitment: felt252,
        acoustic_key: felt252
    );
    fn verify_acoustic_signature(
        self: @TContractState,
        btc_address: felt252,
        message_hash: felt252,
        signature_r: felt252,
        signature_s: felt252
    ) -> bool;
    fn authorize_with_acoustic_signature(
        ref self: TContractState,
        btc_address: felt252,
        message_hash: felt252,
        signature_r: felt252,
        signature_s: felt252
    ) -> felt252;

    fn get_commitment(self: @TContractState, btc_address: felt252) -> felt252;
    fn get_acoustic_key(self: @TContractState, btc_address: felt252) -> felt252;
    fn get_guardian_count(self: @TContractState) -> u256;
    fn get_version(self: @TContractState) -> felt252;
}

#[starknet::contract]
mod SonicGuardian {
    use core::hash::HashStateTrait;
    use core::poseidon::PoseidonTrait;
    use starknet::{get_caller_address, get_block_timestamp, ContractAddress};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use core::ecdsa::check_ecdsa_signature;
    use super::ISonicGuardian;

    #[storage]
    struct Storage {
        // BTC address -> Pedersen commitment
        commitments: Map::<felt252, felt252>,
        // BTC address -> Acoustic Public Key (ZK-proof anchor on Stark Curve)
        acoustic_keys: Map::<felt252, felt252>,
        // BTC address -> Starknet owner (caller who paid for registration)
        owners: Map::<felt252, ContractAddress>,
        // Total guardians registered (key 0 = global count)
        guardian_count: Map::<felt252, u256>,
    }

    #[event]
    #[derive(starknet::Event, Drop)]
    enum Event {
        GuardianRegistered: GuardianRegistered,
        AcousticAuthorized: AcousticAuthorized,
    }

    #[derive(Drop, starknet::Event)]
    struct GuardianRegistered {
        btc_address: felt252,
        owner: ContractAddress,
        commitment: felt252,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct AcousticAuthorized {
        btc_address: felt252,
        verifier: ContractAddress,
        timestamp: u64,
    }

    #[abi(embed_v0)]
    impl SonicGuardianImpl of ISonicGuardian<ContractState> {
        fn register_guardian(
            ref self: ContractState,
            btc_address: felt252,
            commitment: felt252,
            blinding_commitment: felt252,
            acoustic_key: felt252
        ) {
            let caller = get_caller_address();
            assert(self.commitments.read(btc_address) == 0, 'Guardian already registered');

            self.commitments.write(btc_address, commitment);
            self.acoustic_keys.write(btc_address, acoustic_key);
            self.owners.write(btc_address, caller);

            let count = self.guardian_count.read(0);
            self.guardian_count.write(0, count + 1);

            self.emit(GuardianRegistered {
                btc_address,
                owner: caller,
                commitment,
                timestamp: get_block_timestamp(),
            });
        }

        fn verify_acoustic_signature(
            self: @ContractState,
            btc_address: felt252,
            message_hash: felt252,
            signature_r: felt252,
            signature_s: felt252
        ) -> bool {
            let public_key = self.acoustic_keys.read(btc_address);
            if public_key == 0 { return false; }
            check_ecdsa_signature(message_hash, public_key, signature_r, signature_s)
        }

        fn authorize_with_acoustic_signature(
            ref self: ContractState,
            btc_address: felt252,
            message_hash: felt252,
            signature_r: felt252,
            signature_s: felt252
        ) -> felt252 {
            // R7 replay bound (THREAT_MODEL_REVIEW.md): the signed message
            // must be Poseidon(btc_address, end_of_current_window). The
            // deadline is recomputed from block.timestamp — no calldata
            // changes and no nonce store. An intercepted (message_hash,
            // signature) pair re-emits AcousticAuthorized only until the
            // window it was signed in closes, never indefinitely, and cannot
            // be extended (the deadline is inside the signed hash).
            // 15-min window — keep in sync with AUTHORIZATION_WINDOW_SECONDS
            // in src/lib/sonic-authorization.ts.
            let window: u64 = 900;
            let now = get_block_timestamp();
            let deadline: felt252 = (((now / window) + 1) * window).into();
            // Mirrors starknetjs hash.computePoseidonHashOnElements([btc, deadline])
            // — verified against corelib's own golden vector
            // (update(1).update(2).finalize() == 0x0371cb…f0e7); see
            // contracts/tests/test_poseidon_binding.cairo.
            let expected = PoseidonTrait::new().update(btc_address).update(deadline).finalize();
            assert(message_hash == expected, 'SIG_EXPIRED');

            let is_valid = self.verify_acoustic_signature(
                btc_address, message_hash, signature_r, signature_s
            );
            assert(is_valid, 'Invalid acoustic signature');

            self.emit(AcousticAuthorized {
                btc_address,
                verifier: get_caller_address(),
                timestamp: get_block_timestamp(),
            });

            'AUTHORIZED'
        }

        fn get_commitment(self: @ContractState, btc_address: felt252) -> felt252 {
            self.commitments.read(btc_address)
        }

        fn get_acoustic_key(self: @ContractState, btc_address: felt252) -> felt252 {
            self.acoustic_keys.read(btc_address)
        }

        fn get_guardian_count(self: @ContractState) -> u256 {
            self.guardian_count.read(0)
        }

        fn get_version(self: @ContractState) -> felt252 {
            'v1.4.0-replay-bound'
        }
    }
}

mod recovery_helper;
