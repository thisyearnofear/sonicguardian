#[starknet::interface]
trait ISonicGuardian<TContractState> {
    fn register_identity(ref self: TContractState, commitment: felt252);
    fn verify_identity(self: @TContractState, user: starknet::ContractAddress, proof_hash: felt252) -> bool;
    fn get_commitment(self: @TContractState, user: starknet::ContractAddress) -> felt252;
}

#[starknet::contract]
mod SonicGuardian {
    use starknet::get_caller_address;
    use starknet::ContractAddress;

    #[storage]
    struct Storage {
        commitments: LegacyMap::<ContractAddress, felt252>,
    }

    #[abi(embed_v0)]
    impl SonicGuardianImpl of super::ISonicGuardian<ContractState> {
        fn register_identity(ref self: ContractState, commitment: felt252) {
            let caller = get_caller_address();
            // In a real ZK implementation, we'd verify a proof here
            // For the hackathon MVP, we store the commitment (hash of DNA)
            self.commitments.write(caller, commitment);
        }

        fn verify_identity(self: @ContractState, user: ContractAddress, proof_hash: felt252) -> bool {
            let stored_commitment = self.commitments.read(user);
            stored_commitment == proof_hash
        }

        fn get_commitment(self: @ContractState, user: ContractAddress) -> felt252 {
            self.commitments.read(user)
        }
    }
}
