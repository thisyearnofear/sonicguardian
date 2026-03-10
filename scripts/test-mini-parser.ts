
import { mini } from '@strudel/mini';

const patterns = [
  'bd*4',
  'bd bd bd bd',
  '[bd sd]*2',
  'bd(3,8)',
  '<bd sd hh>',
  'bd?0.5'
];

patterns.forEach(p => {
  console.log(`--- Pattern: ${p} ---`);
  try {
    const parsed = mini(p);
    // Print a simplified view of the parsed structure
    // In Strudel, mini returns a Pattern object or an AST-like structure
    console.log(JSON.stringify(parsed, (key, value) => {
      if (key === 'parent' || key === 'repl') return undefined;
      return value;
    }, 2));
  } catch (e: any) {
    console.error(`Failed to parse ${p}:`, e.message);
  }
  console.log('\n');
});
