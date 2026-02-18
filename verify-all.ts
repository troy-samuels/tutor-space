#!/usr/bin/env node
// Comprehensive verification of all word ladder puzzles

function diffCount(a, b) {
  if (a.length !== b.length) return -1;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) d++;
  }
  return d;
}

function verifyPuzzle(p) {
  const errors = [];
  
  // Check par is >= optimal path steps (par is target score, can be higher than minimum)
  const minSteps = p.optimalPath.length - 1;
  if (p.par < minSteps) {
    errors.push(`par=${p.par} is less than optimal path steps (${minSteps})`);
  }
  
  // Check start/end match
  if (p.optimalPath[0] !== p.startWord) {
    errors.push(`path starts with "${p.optimalPath[0]}" but startWord is "${p.startWord}"`);
  }
  if (p.optimalPath[p.optimalPath.length - 1] !== p.targetWord) {
    errors.push(`path ends with "${p.optimalPath[p.optimalPath.length - 1]}" but targetWord is "${p.targetWord}"`);
  }
  
  // Check all path words are in validWords
  for (const w of p.optimalPath) {
    if (!p.validWords.has(w)) {
      errors.push(`"${w}" in path but not in validWords`);
    }
  }
  
  // Check each step differs by exactly 1 letter
  for (let i = 0; i < p.optimalPath.length - 1; i++) {
    const a = p.optimalPath[i];
    const b = p.optimalPath[i + 1];
    const d = diffCount(a, b);
    if (d !== 1) {
      errors.push(`"${a}" → "${b}": ${d === -1 ? 'different lengths' : d + ' letters differ'}`);
    }
  }
  
  // Check all words same length
  const len = p.startWord.length;
  for (const w of p.validWords) {
    if (w.length !== len) {
      errors.push(`validWord "${w}" has length ${w.length}, expected ${len}`);
    }
  }
  
  return errors;
}

async function main() {
  const esModule = await import('./app/lib/games/data/word-ladder/puzzles-es.ts');
  const frModule = await import('./app/lib/games/data/word-ladder/puzzles-fr.ts');
  const deModule = await import('./app/lib/games/data/word-ladder/puzzles-de.ts');
  
  let totalErrors = 0;
  
  const allSets = [
    { name: 'ES', puzzles: esModule.PUZZLES_ES },
    { name: 'FR', puzzles: frModule.PUZZLES_FR },
    { name: 'DE', puzzles: deModule.PUZZLES_DE },
  ];
  
  for (const { name, puzzles } of allSets) {
    console.log(`\n=== ${name} (${puzzles.length} puzzles) ===`);
    for (const p of puzzles) {
      const errors = verifyPuzzle(p);
      if (errors.length > 0) {
        console.log(`❌ #${p.number} (${p.date}) ${p.startWord}→${p.targetWord}:`);
        errors.forEach(e => console.log(`   ${e}`));
        totalErrors += errors.length;
      } else {
        console.log(`✅ #${p.number} ${p.startWord}→${p.targetWord} (par ${p.par}): ${p.optimalPath.join('→')}`);
      }
    }
  }
  
  console.log(`\n${totalErrors === 0 ? '✅ ALL GOOD!' : `❌ ${totalErrors} errors found`}`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
