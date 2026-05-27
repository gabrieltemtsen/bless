import type { Address } from 'viem';

/**
 * The person who built and maintains this miniapp. Surfaced in the UI as
 * a one-tap "Trust to start testing" CTA so visitors can hop the trust
 * barrier and try the app immediately.
 *
 * Hard-coded for v1 — if you fork, swap this for your own address.
 */
export const CREATOR: {
  address: Address;
  name: string;
  profileUrl: string;
} = {
  address: '0x5824cc598EeC4c1e006F83Ee8BE9BA981e983F0e',
  name: 'gabriel',
  profileUrl:
    'https://app.gnosis.io/p/0x5824cc598EeC4c1e006F83Ee8BE9BA981e983F0e',
};
