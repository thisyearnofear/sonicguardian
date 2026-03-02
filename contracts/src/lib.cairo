use starknet::ContractAddress;

#[starknet::interface]
trait IERC20<TContractState> {
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
}

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
    
    // New On-Chain Gifting Functions
    fn create_onchain_gift(
        ref self: TContractState,
        vault_id: felt252,
        commitment: felt252,
        amount: u256,
        token_address: ContractAddress
    );
    
    fn claim_onchain_gift(
        ref self: TContractState,
        vault_id: felt252,
        dna_hash: felt252,
        blinding: felt252,
        recipient: ContractAddress
    );

    fn get_commitment(self: @TContractState, btc_address: felt252) -> felt252;
    fn get_vault_commitment(self: @TContractState, vault_id: felt252) -> felt252;
    fn get_guardian_count(self: @TContractState) -> u256;
    fn get_version(self: @TContractState) -> felt252;
}

#[starknet::contract]
mod SonicGuardian {
    use starknet::{get_caller_address, get_block_timestamp, get_contract_address};
    use starknet::ContractAddress;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::pedersen::pedersen;
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};

    #[storage]
    struct Storage {
        // Map BTC address to Pedersen commitment
        commitments: Map::<felt252, felt252>,
        // Map BTC address to Starknet owner
        owners: Map::<felt252, ContractAddress>,
        // Map BTC address to blinding commitment
        blinding_commitments: Map::<felt252, felt252>,
        // Total guardians registered
        guardian_count: u256,

        // NEW: On-chain Gift Vaults
        // vault_id -> commitment
        vault_commitments: Map::<felt252, felt252>,
        // vault_id -> amount
        vault_amounts: Map::<felt252, u256>,
        // vault_id -> token address
        vault_tokens: Map::<felt252, ContractAddress>,
        // vault_id -> sender
        vault_senders: Map::<felt252, ContractAddress>,
        // vault_id -> status (0: None, 1: Locked, 2: Claimed)
        vault_status: Map::<felt252, u8>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        GuardianRegistered: GuardianRegistered,
        RecoveryVerified: RecoveryVerified,
        VaultCreated: VaultCreated,
        VaultClaimed: VaultClaimed,
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
    struct VaultCreated {
        vault_id: felt252,
        sender: ContractAddress,
        amount: u256,
        token: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct VaultClaimed {
        vault_id: felt252,
        recipient: ContractAddress,
        amount: u256,
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
            let existing = self.commitments.read(btc_address);
            assert(existing == 0, 'Guardian already registered');
            
            self.commitments.write(btc_address, commitment);
            self.owners.write(btc_address, caller);
            self.blinding_commitments.write(btc_address, blinding_commitment);
            
            let count = self.guardian_count.read();
            self.guardian_count.write(count + 1);
            
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
            if stored_commitment == 0 { return false; }
            let computed_commitment = pedersen(dna_hash, blinding);
            stored_commitment == computed_commitment
        }

        fn authorize_btc_recovery(
            ref self: ContractState,
            btc_address: felt252,
            dna_hash: felt252,
            blinding: felt252
        ) -> felt252 {
            let is_valid = self.verify_recovery(btc_address, dna_hash, blinding);
            assert(is_valid, 'Invalid recovery proof');
            
            self.emit(RecoveryVerified {
                btc_address,
                verifier: get_caller_address(),
                timestamp: get_block_timestamp(),
            });
            
            // Return a simple success token
            'AUTHORIZED'
        }

        // --- NEW: On-chain Gifting Logic ---

        fn create_onchain_gift(
            ref self: ContractState,
            vault_id: felt252,
            commitment: felt252,
            amount: u256,
            token_address: ContractAddress
        ) {
            let caller = get_caller_address();
            let contract_address = get_contract_address();
            
            // 1. Transfer tokens from sender to this contract (Escrow)
            let token = IERC20Dispatcher { contract_address: token_address };
            let success = token.transfer_from(caller, contract_address, amount);
            assert(success, 'Transfer failed');

            // 2. Store vault details
            self.vault_commitments.write(vault_id, commitment);
            self.vault_amounts.write(vault_id, amount);
            self.vault_tokens.write(vault_id, token_address);
            self.vault_senders.write(vault_id, caller);
            self.vault_status.write(vault_id, 1); // 1 = Locked

            self.emit(VaultCreated {
                vault_id,
                sender: caller,
                amount,
                token: token_address
            });
        }

        fn claim_onchain_gift(
            ref self: ContractState,
            vault_id: felt252,
            dna_hash: felt252,
            blinding: felt252,
            recipient: ContractAddress
        ) {
            // 1. Check status
            let status = self.vault_status.read(vault_id);
            assert(status == 1, 'Vault not locked or not found');

            // 2. Verify Musical DNA
            let stored_commitment = self.vault_commitments.read(vault_id);
            let computed_commitment = pedersen(dna_hash, blinding);
            assert(stored_commitment == computed_commitment, 'Invalid musical signature');

            // 3. Mark as claimed to prevent re-entry
            self.vault_status.write(vault_id, 2); // 2 = Claimed

            // 4. Transfer funds to recipient
            let amount = self.vault_amounts.read(vault_id);
            let token_address = self.vault_tokens.read(vault_id);
            let token = IERC20Dispatcher { contract_address: token_address };
            
            let success = token.transfer(recipient, amount);
            assert(success, 'Claim transfer failed');

            self.emit(VaultClaimed {
                vault_id,
                recipient,
                amount
            });
        }

        fn get_commitment(self: @ContractState, btc_address: felt252) -> felt252 {
            self.commitments.read(btc_address)
        }

        fn get_vault_commitment(self: @ContractState, vault_id: felt252) -> felt252 {
            self.vault_commitments.read(vault_id)
        }

        fn get_guardian_count(self: @ContractState) -> u256 {
            self.guardian_count.read()
        }

        fn get_version(self: @ContractState) -> felt252 {
            'v1.1.0-gift-escrow'
        }
    }
}

