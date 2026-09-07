use core::poseidon::PoseidonTrait;

/// Verifies the client↔contract Poseidon pairing used by the R7 replay bound:
/// the TS side computes `hash.computePoseidonHashOnElements([btcFelt, deadline])`
/// (starknetjs → @scure/starknet `poseidonHashMany`), the contract recomputes
/// the identical hash with corelib's sponge chain
/// (`PoseidonTrait::new().update(a).update(b).finalize()`). The algorithms
/// were compared source-level (absorb pairs, +1 finalize) and against
/// corelib's own golden vector — see
/// scripts/test-authorization-deadline.mjs for the executable JS-side check.
/// NOTE: requires snforge to execute (`scarb test`); not installed locally —
/// run in CI or after installing starknet-foundry.
#[test]
fn test_js_poseidon_pairing_matches_contract() {
    // corelib golden vector: update(1).update(2).finalize()
    // == 0x0371cb6995ea5e7effcd2e174de264b5b407027a75a231a70c2c8d196107f0e7
    // (starknetjs returns the same felt, leading-zero normalized).
    let golden: felt252 = 0x0371cb6995ea5e7effcd2e174de264b5b407027a75a231a70c2c8d196107f0e7;
    assert(PoseidonTrait::new().update(1).update(2).finalize() == golden, 'corelib golden vector');

    // starknetjs: computePoseidonHashOnElements([12345n, 1800230400n])
    let expected: felt252 = 0x78858eafd4b6e22b105d22e36e6227197a0c2b2d923d46c86552f1458d4f348;
    let actual = PoseidonTrait::new().update(12345).update(1800230400).finalize();
    assert(actual == expected, 'poseidon pairing mismatch');

    // Second vector: computePoseidonHashOnElements([0x1234n, 0x2n])
    let expected2: felt252 = 0x2ef448ff1cc8c0c48032f75da7ec6caaadf0b8920b5440947b99537e576c519;
    let actual2 = PoseidonTrait::new().update(0x1234).update(0x2).finalize();
    assert(actual2 == expected2, 'poseidon pairing mismatch 2');
}
