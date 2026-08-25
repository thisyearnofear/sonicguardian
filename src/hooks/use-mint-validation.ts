import { useEffect, useState } from 'react';
import { isValidBtcAddress } from '@/lib/crypto';
import type { SecretMode } from '@/components/MintWizard';

export type ValidationState = {
  isValid: boolean;
  message: string;
  type: 'error' | 'warning' | 'success';
};

export function useMintValidation(
  btcAddress: string,
  secretVibe: string,
  secretMode: SecretMode,
) {
  const [validationStates, setValidationStates] = useState<Map<string, ValidationState>>(
    () => new Map(),
  );

  useEffect(() => {
    if (btcAddress.trim() === '') {
      setValidationStates((prev) =>
        new Map(
          prev.set('btc-address', {
            isValid: true,
            message: 'Paste, connect, or use Demo address — no wallet required to try',
            type: 'success',
          }),
        ),
      );
      return;
    }

    if (!isValidBtcAddress(btcAddress)) {
      setValidationStates((prev) =>
        new Map(
          prev.set('btc-address', {
            isValid: false,
            message: 'Invalid Bitcoin address format. Please enter a valid bc1q, 1, or 3 address.',
            type: 'error',
          }),
        ),
      );
    } else {
      setValidationStates((prev) =>
        new Map(
          prev.set('btc-address', {
            isValid: true,
            message: 'Valid Bitcoin address format',
            type: 'success',
          }),
        ),
      );
    }
  }, [btcAddress]);

  useEffect(() => {
    if (secretMode === 'vibe' && secretVibe.trim() !== '') {
      if (secretVibe.trim().length < 10) {
        setValidationStates((prev) =>
          new Map(
            prev.set('custom-vibe', {
              isValid: false,
              message: 'Describe your vibe in at least 10 characters',
              type: 'warning',
            }),
          ),
        );
      } else if (secretVibe.trim().length > 200) {
        setValidationStates((prev) =>
          new Map(
            prev.set('custom-vibe', {
              isValid: false,
              message: 'Keep the vibe under 200 characters',
              type: 'warning',
            }),
          ),
        );
      } else {
        setValidationStates((prev) =>
          new Map(
            prev.set('custom-vibe', {
              isValid: true,
              message: 'Good vibe description for AI synthesis',
              type: 'success',
            }),
          ),
        );
      }
    } else {
      setValidationStates((prev) =>
        new Map(
          prev.set('custom-vibe', {
            isValid: true,
            message:
              secretMode === 'random'
                ? 'Using secure random generation'
                : 'Select a library pattern or use random mode',
            type: 'success',
          }),
        ),
      );
    }
  }, [secretVibe, secretMode]);

  return validationStates;
}
