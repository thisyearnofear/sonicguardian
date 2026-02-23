#[starknet::interface]
trait ISonicGuardian<TContractState> {
    fn register_guardian(
        ref self: TContractState,
        btc_address: felt252,
        commitment: felt252,
        blinding_commitment: felt252
    );
    fn verify_recovery(
        self: @TContractState,
        btc_address: felt252,
        dna_hash: felt252,
        blinding: felt252
    ) -> bool;
    fn authorize_btc_recovery(
        ref self: TContractState,
        btc_address: felt252,
        dna_hash: felt252,
        blinding: felt252
    ) -> felt252;
    fn get_commitment(self: @TContractState, btc_address: felt252) -> felt252;
    fn get_guardian_count(self: @TContractState) -> u256;
}

#[starknet::contract]
mod SonicGuardian {
    use starknet::{get_caller_address, get_block_timestamp};
    use starknet::ContractAddress;
    use core::pedersen::pedersen;

    #[storage]
    struct Storage {
        // Map BTC address to Pedersen commitment
        commitments: LegacyMap::<felt252, felt252>,
        // Map BTC address to Starknet owner
        owners: LegacyMap::<felt252, ContractAddress>,
        // Map BTC address to blinding commitment (for verification)
        blinding_commitments: LegacyMap::<felt252, felt252>,
        // Recovery authorization tokens
        recovery_tokens: LegacyMap::<felt252, felt252>,
        // Total guardians registered
        guardian_count: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        GuardianRegistered: GuardianRegistered,
        RecoveryVerified: RecoveryVerified,
        RecoveryAuthorized: RecoveryAuthorized,
    }

    #[derive(Drop, starknet::Event)]
    struct GuardianRegistered {
        btc_address: felt252,
        owner: ContractAddress,
        commitment: felt252,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct RecoveryVerified {
        btc_address: felt252,
        verifier: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct RecoveryAuthorized {
        btc_address: felt252,
        token: felt252,
        timestamp: u64,
    }

    #[abi(embed_v0)]
    impl SonicGuardianImpl of super::ISonicGuardian<ContractState> {
        fn register_guardian(
            ref self: ContractState,
            btc_address: felt252,
            commitment: felt252,
            blinding_commitment: felt252
        ) {
            let caller = get_caller_address();
            
            // Ensure BTC address not already registered
            let existing = self.commitments.read(btc_address);
            assert(existing == 0, 'Guardian already registered');
            
            // Store Pedersen commitment (hides DNA hash)
            self.commitments.write(btc_address, commitment);
            self.owners.write(btc_address, caller);
            self.blinding_commitments.write(btc_address, blinding_commitment);
            
            // Increment counter
            let count = self.guardian_count.read();
            self.guardian_count.write(count + 1);
            
            // Emit event
            self.emit(GuardianRegistered {
                btc_address,
                owner: caller,
                commitment,
                timestamp: get_block_timestamp(),
            });
        }

        fn verify_recovery(
            self: @ContractState,
            btc_address: felt252,
            dna_hash: felt252,
            blinding: felt252
        ) -> bool {
            let stored_commitment = self.commitments.read(btc_address);
            
            // Ensure guardian exists
            if stored_commitment == 0 {
                return false;
            }
            
            // Compute Pedersen commitment from provided values
            let computed_commitment = pedersen(dna_hash, blinding);
            
            // Zero-knowledge verification: does computed match stored?
            stored_commitment == computed_commitment
        }

        fn authorize_btc_recovery(
            ref self: ContractState,
            btc_address: felt252,
            dna_hash: felt252,
            blinding: felt252
        ) -> felt252 {
            // First verify the recovery proof
            let is_valid = self.verify_recovery(btc_address, dna_hash, blinding);
            assert(is_valid, 'Invalid recovery proof');
            
            // Generate authorization token (hash of btc_address + timestamp)
            let timestamp = get_block_timestamp();
            let token = pedersen(btc_address, timestamp.into());
            
            // Store token for sBTC/tBTC bridge verification
            self.recovery_tokens.write(btc_address, token);
            
            // Emit events
            self.emit(RecoveryVerified {
                btc_address,
                verifier: get_caller_address(),
                timestamp,
            });
            
            self.emit(RecoveryAuthorized {
                btc_address,
                token,
                timestamp,
            });
            
            token
        }

        fn get_commitment(self: @ContractState, btc_address: felt252) -> felt252 {
            self.commitments.read(btc_address)
        }

        fn get_guardian_count(self: @ContractState) -> u256 {
            self.guardian_count.read()
        }
    }
}
