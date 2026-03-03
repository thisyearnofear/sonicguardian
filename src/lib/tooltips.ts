/**
 * Tooltip definitions for Sonic Guardian
 * Provides contextual help for technical terms and concepts
 */

export interface TooltipDefinition {
  id: string;
  text: string;
  category: 'technical' | 'concept' | 'process' | 'security' | 'ui';
  trigger?: string; // Optional trigger text
}

export const TOOLTIP_DEFINITIONS: TooltipDefinition[] = [
  // Technical Terms
  {
    id: 'pedersen-commitment',
    text: 'A cryptographic commitment scheme that allows you to commit to a value without revealing it. Later, you can prove you know the original value without exposing it to anyone else.',
    category: 'technical'
  },
  {
    id: 'zero-knowledge-proof',
    text: 'A cryptographic method where one party can prove they know a value without revealing the value itself. Like proving you know a password without typing it.',
    category: 'technical'
  },
  {
    id: 'starknet',
    text: 'A Layer 2 blockchain that provides fast, low-cost transactions with strong privacy features using STARK proofs for scalability.',
    category: 'technical'
  },
  {
    id: 'strudel',
    text: 'A live coding music environment that uses JavaScript to create generative music patterns. Think of it as coding music in real-time.',
    category: 'technical'
  },
  {
    id: 'entropy',
    text: 'Randomness used to generate secure cryptographic keys. Higher entropy means more security - like having a longer, more complex password.',
    category: 'technical'
  },
  {
    id: 'blinding-factor',
    text: 'A random value added to cryptographic operations to hide the original data while still allowing verification. Like putting a letter in an envelope.',
    category: 'technical'
  },
  {
    id: 'musical-dna',
    text: 'A unique fingerprint extracted from your musical pattern. The same pattern always generates the same DNA hash, creating your on-chain identity signature.',
    category: 'technical'
  },
  {
    id: 'mini-notation',
    text: 'Strudel\'s compact syntax for describing rhythms and melodies. For example: "bd*4" means bass drum repeated 4 times, "[~ sd]" means rest then snare.',
    category: 'technical'
  },

  // Concepts
  {
    id: 'secure-generation',
    text: 'Uses cryptographically secure random number generation to create your musical pattern. This provides maximum security but requires memorizing chunks.',
    category: 'concept'
  },
  {
    id: 'custom-vibe',
    text: 'Allows you to describe your desired musical style in natural language. AI will generate a pattern based on your description, but with less cryptographic security.',
    category: 'concept'
  },
  {
    id: 'musical-chunks',
    text: 'Your musical pattern broken down into memorable pieces. Each chunk represents a part of your pattern that you can recall for recovery.',
    category: 'concept'
  },
  {
    id: 'seed-phrase',
    text: 'A human-readable representation of your musical pattern, similar to cryptocurrency seed phrases but based on musical concepts.',
    category: 'concept'
  },
  {
    id: 'on-chain-commitment',
    text: 'Your musical DNA hash is stored on Starknet blockchain, creating a permanent, verifiable record that can be checked without revealing your pattern.',
    category: 'concept'
  },
  {
    id: 'recovery-process',
    text: 'When you forget your pattern, you can recreate it by describing your musical chunks. The system verifies this matches your on-chain commitment.',
    category: 'process'
  },

  // Security
  {
    id: 'bitcoin-address-validation',
    text: 'We validate Bitcoin addresses to ensure they follow the correct format (bc1q for SegWit, 1 for legacy, 3 for P2SH). Invalid addresses cannot receive funds.',
    category: 'security'
  },
  {
    id: 'gas-fees',
    text: 'Ethereum transactions require gas fees paid in ETH. These fees compensate network validators for processing your transactions.',
    category: 'security'
  },
  {
    id: 'wallet-connection',
    text: 'Connecting your wallet allows you to interact with the blockchain. We never access your private keys - you remain in full control.',
    category: 'security'
  },
  {
    id: 'data-privacy',
    text: 'Your musical pattern and Bitcoin address are never stored on our servers. Only cryptographic hashes are stored on-chain for verification.',
    category: 'security'
  },

  // UI Elements
  {
    id: 'visualizer',
    text: 'Real-time visualization of your musical pattern. Each particle represents a note or sound event in your composition.',
    category: 'ui'
  },
  {
    id: 'pattern-library',
    text: 'A collection of pre-made musical patterns you can explore and use as inspiration for your own guardian pattern.',
    category: 'ui'
  },
  {
    id: 'interactive-tutorial',
    text: 'Step-by-step guide that walks you through creating your first musical guardian. Perfect for first-time users.',
    category: 'ui'
  },
  {
    id: 'help-modal',
    text: 'Comprehensive help system with quick start guide and frequently asked questions about the platform.',
    category: 'ui'
  }
];

/**
 * Get tooltip definition by ID
 */
export function getTooltip(id: string): TooltipDefinition | undefined {
  return TOOLTIP_DEFINITIONS.find(t => t.id === id);
}

/**
 * Get all tooltips by category
 */
export function getTooltipsByCategory(category: TooltipDefinition['category']): TooltipDefinition[] {
  return TOOLTIP_DEFINITIONS.filter(t => t.category === category);
}

/**
 * Get tooltip text by ID
 */
export function getTooltipText(id: string): string {
  const tooltip = getTooltip(id);
  return tooltip?.text || '';
}