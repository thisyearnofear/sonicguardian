/**
 * Fixed demo Bitcoin address for try-the-flow without a wallet installed.
 * Valid bech32 format; not intended for real funds.
 */
export const DEMO_BTC_ADDRESS =
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

export function isDemoBtcAddress(address: string): boolean {
  return address.trim() === DEMO_BTC_ADDRESS;
}
