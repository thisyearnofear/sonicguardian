//! STRK20 anonymizer: privately invoke Sonic Guardian acoustic recovery authorization.
//! The pool withdraws STRK to this helper, which calls `authorize_with_acoustic_signature`
//! and returns STRK to an open note — atomic, unlinkable to the user.

use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Debug)]
pub struct OpenNoteDeposit {
    pub note_id: felt252,
    pub token: ContractAddress,
    pub amount: u128,
}

#[starknet::interface]
pub trait IErc20Helper<TContractState> {
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
}

#[starknet::interface]
pub trait ISonicGuardianAuthorize<TContractState> {
    fn authorize_with_acoustic_signature(
        ref self: TContractState,
        btc_address: felt252,
        message_hash: felt252,
        signature_r: felt252,
        signature_s: felt252,
    ) -> felt252;
}

#[starknet::interface]
pub trait IRecoveryInvokeHelper<TContractState> {
    fn privacy_invoke(
        ref self: TContractState,
        guardian: ContractAddress,
        btc_address: felt252,
        message_hash: felt252,
        signature_r: felt252,
        signature_s: felt252,
        token: ContractAddress,
        pool_address: ContractAddress,
        note_id: felt252,
    ) -> Span<OpenNoteDeposit>;
    fn get_invoke_count(self: @TContractState) -> u64;
}

#[starknet::contract]
pub mod RecoveryInvokeHelper {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use super::{
        IErc20HelperDispatcher, IErc20HelperDispatcherTrait, ISonicGuardianAuthorizeDispatcher,
        ISonicGuardianAuthorizeDispatcherTrait, OpenNoteDeposit,
    };

    mod errors {
        pub const BAD_POOL: felt252 = 'BAD_POOL';
        pub const NO_INPUT: felt252 = 'NO_INPUT';
        pub const AMOUNT_OVERFLOW: felt252 = 'AMOUNT_OVERFLOW';
    }

    #[storage]
    struct Storage {
        invoke_count: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PrivateRecoveryAuthorized: PrivateRecoveryAuthorized,
    }

    #[derive(Drop, starknet::Event)]
    struct PrivateRecoveryAuthorized {
        #[key]
        btc_address: felt252,
        message_hash: felt252,
        note_id: felt252,
    }

    #[abi(embed_v0)]
    impl RecoveryInvokeHelperImpl of super::IRecoveryInvokeHelper<ContractState> {
        fn privacy_invoke(
            ref self: ContractState,
            guardian: ContractAddress,
            btc_address: felt252,
            message_hash: felt252,
            signature_r: felt252,
            signature_s: felt252,
            token: ContractAddress,
            pool_address: ContractAddress,
            note_id: felt252,
        ) -> Span<OpenNoteDeposit> {
            assert(get_caller_address() == pool_address, errors::BAD_POOL);

            let sonic = ISonicGuardianAuthorizeDispatcher { contract_address: guardian };
            sonic.authorize_with_acoustic_signature(
                btc_address, message_hash, signature_r, signature_s,
            );

            let erc20 = IErc20HelperDispatcher { contract_address: token };
            let balance: u256 = erc20.balance_of(get_contract_address());
            let amount: u128 = balance.try_into().expect(errors::AMOUNT_OVERFLOW);
            assert(amount != 0, errors::NO_INPUT);

            erc20.approve(pool_address, balance);

            self.invoke_count.write(self.invoke_count.read() + 1);
            self.emit(PrivateRecoveryAuthorized { btc_address, message_hash, note_id });

            array![OpenNoteDeposit { note_id, token, amount }].span()
        }

        fn get_invoke_count(self: @ContractState) -> u64 {
            self.invoke_count.read()
        }
    }
}
