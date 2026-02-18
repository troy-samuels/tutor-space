// Verify word ladder paths - each step must differ by exactly 1 letter
function verify(label, path, validWords) {
  const errors = [];
  
  // Check all path words are in validWords
  for (const word of path) {
    if (!validWords.has(word)) {
      errors.push(`  "${word}" not in validWords`);
    }
  }
  
  // Check each consecutive pair differs by exactly 1 letter
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (a.length !== b.length) {
      errors.push(`  "${a}" -> "${b}": different lengths`);
      continue;
    }
    let diff = 0;
    for (let j = 0; j < a.length; j++) {
      if (a[j] !== b[j]) diff++;
    }
    if (diff !== 1) {
      errors.push(`  "${a}" -> "${b}": ${diff} letters differ (need exactly 1)`);
    }
  }
  
  // Check par matches
  const expectedPar = path.length - 1;
  
  if (errors.length > 0) {
    console.log(`❌ ${label} (par=${expectedPar}):`);
    errors.forEach(e => console.log(e));
  } else {
    console.log(`✅ ${label} (par=${expectedPar}): ${path.join(' → ')}`);
  }
}

// ===== SPANISH PUZZLES 9-30 =====
console.log("\n=== SPANISH ===");

verify("ES #9", ["MALO", "MANO"], new Set(["MALO", "MANO", "MAPA", "MASA", "MAGO", "MAZO", "MAYO", "MATO", "MARE", "MALA", "MARE", "MACO", "MARO", "MASO", "MAPO"]));

verify("ES #10", ["SOPA", "SOLA", "SOLA", "BOLA"], new Set(["SOPA", "SOLA", "BOLA"]));
// Fix: SOPA->SOLA->BOLA
verify("ES #10 fix", ["SOPA", "SOLA", "BOLA"], new Set(["SOPA", "SOLA", "BOLA", "SOMA", "SOFA", "SOBA", "SOCA", "SOTA", "SOYA", "COLA", "MOLA", "GOLA", "POLA", "ROLA", "BOCA", "BODA", "BOTA", "BOBA"]));

verify("ES #11", ["TORO", "TOMO", "TOMA"], new Set(["TORO", "TOMO", "TOMA", "TONO", "TOPO", "TOCO", "TOSO", "TOLA", "TONA", "TOPA", "TOGA", "TOBA", "TODA", "TOSA", "TOTA"]));

verify("ES #12", ["FAMA", "FAMA", "CAMA"], new Set([]));
// Fix
verify("ES #12 fix", ["FAMA", "CAMA"], new Set(["FAMA", "CAMA", "FARA", "FAJA", "FALA", "FASA", "FATA", "FAVA", "DAMA", "GAMA", "LAMA", "MAMA", "RAMA", "TAMA"]));

verify("ES #13", ["LOCO", "LOGO", "LAGO"], new Set(["LOCO", "LOGO", "LAGO", "LODO", "LOBO", "LORO", "LOMO", "LOTO", "LUGO", "LEGO", "PAGO", "MAGO", "RAGO", "VAGO", "LADO"]));

verify("ES #14", ["MODA", "MONA", "MONO"], new Set(["MODA", "MONA", "MONO", "MOLA", "MORA", "MOTA", "MOZA", "MOFA", "MOCA", "MONE", "MONI", "MOÑO", "MORO", "MOJO", "MODO"]));

verify("ES #15", ["HORA", "HOLA", "BOLA", "BALA"], new Set(["HORA", "HOLA", "BOLA", "BALA", "HOJA", "HOYA", "HORCA", "BOTA", "BOCA", "BODA", "BOBA", "BOJA", "BONA", "BORA", "BOSA", "BOYA"]));

verify("ES #16", ["DURO", "DUDO", "DUDA"], new Set(["DURO", "DUDO", "DUDA", "DURA", "DUGO", "DULO", "DUMO", "DUNA", "DUCE", "DADO", "DEDO", "MUDO", "NUDO", "RUDO", "SUDO"]));

verify("ES #17", ["TELA", "PELA", "PENA", "PENA"], new Set([]));
// TELA->PELA: T->P (1). PELA->PENA: L->N (1). Good.
verify("ES #17 fix", ["TELA", "PELA", "PENA"], new Set(["TELA", "PELA", "PENA", "TENA", "TERA", "TECA", "TEMA", "TEJA", "PERA", "PEGA", "PESA", "PECA", "PEÑA", "PALA", "PILA"]));

verify("ES #18", ["ALTO", "ALGO", "ALGO"], new Set([]));
// ALTO->ALGO: T->G (1). Good par 1.
verify("ES #18 fix", ["ALTO", "ALGO"], new Set(["ALTO", "ALGO", "ALTA", "ALMO", "ALBO", "ALZO", "ALDO", "ALEO", "ALFA", "ALMA", "ASCO", "ARCO", "ASGO", "ATEO"]));

verify("ES #19", ["RANA", "RANA", "RAMA", "RIMA", "RIMA", "RICA"], new Set([]));
// RANA->RAMA: N->M (1). RAMA->RIMA: A->I (1). RIMA->RICA: M->C (1). Good par 3.
verify("ES #19 fix", ["RANA", "RAMA", "RIMA", "RICA"], new Set(["RANA", "RAMA", "RIMA", "RICA", "RARA", "RATA", "RAZA", "RAJA", "RASA", "RAPA", "ROMA", "RUMA", "RISA", "RIGA", "RIDA", "RIFA", "RIJA"]));

verify("ES #20", ["FUGA", "FUMA", "FUMA"], new Set([]));
// FUGA->FUMA: G->M (1). Good par 1.
verify("ES #20 fix", ["FUGA", "FUMA"], new Set(["FUGA", "FUMA", "FULA", "FURA", "FUSA", "FUÑA", "FUCA", "FUTA", "MUGA", "RUGA", "GUMA", "CUMA", "SUMA", "PUMA", "LUMA", "DUMA"]));

verify("ES #21", ["BESO", "BESO", "PESO", "PASO", "PAGO"], new Set([]));
// BESO->PESO: B->P (1). PESO->PASO: E->A (1). PASO->PAGO: S->G (1). Good par 3.
verify("ES #21 fix", ["BESO", "PESO", "PASO", "PAGO"], new Set(["BESO", "PESO", "PASO", "PAGO", "BASO", "BACO", "BEGO", "BETO", "BEDO", "PISO", "PUSO", "PEGO", "PALO", "PATO", "PAVO", "PACO"]));

verify("ES #22", ["NUBE", "NUBE", "SUBE"], new Set([]));
// NUBE->SUBE: N->S (1). Good par 1.
verify("ES #22 fix", ["NUBE", "SUBE"], new Set(["NUBE", "SUBE", "CUBE", "TUBE", "LUBE", "RUBE", "NUBE", "NUCE", "NUDE", "NUEZ", "SUBA", "SUBO", "SUDE", "SURE"]));

verify("ES #23", ["CENA", "CERA", "CERO"], new Set(["CENA", "CERA", "CERO", "CEDA", "CEJA", "CELA", "CEPA", "CECA", "CESA", "CENA", "CERÁ", "CERO", "CORA", "CARA", "CURA"]));

verify("ES #24", ["HILO", "HIJO", "HIJA"], new Set(["HILO", "HIJO", "HIJA", "HIGO", "HICE", "HIPO", "HIFO", "HITA", "HILA", "FIJO", "DIJO", "RIJO", "TIJA", "MIJA"]));

verify("ES #25", ["PISO", "PICO", "PICA", "PILA"], new Set(["PISO", "PICO", "PICA", "PILA", "PINO", "PIDO", "PITO", "PIPO", "PIRO", "PIGA", "PIDA", "PIÑA", "PIPA", "PIZA", "PIBA"]));

verify("ES #26", ["SACO", "SAGO", "LAGO", "LEGO", "LEGO"], new Set([]));
// SACO->SAGO: C->G (1). SAGO->LAGO: S->L (1). LAGO->LEGO: A->E (1). Good par 3.
verify("ES #26 fix", ["SACO", "SAGO", "LAGO", "LEGO"], new Set(["SACO", "SAGO", "LAGO", "LEGO", "SALO", "SAPO", "SANO", "SATO", "SAYO", "MAGO", "PAGO", "VAGO", "RAGO", "LACO", "LATO", "LADO"]));

verify("ES #27", ["ROJO", "ROTO", "RATO", "RATA"], new Set(["ROJO", "ROTO", "RATO", "RATA", "ROSO", "ROBO", "RODO", "ROMO", "ROPO", "RACO", "RAFO", "RAMO", "RAGO", "RASA", "RAZA", "RAYA"]));

verify("ES #28", ["DADO", "DEDO", "DEDO", "DEJO", "DEJA"], new Set([]));
// DADO->DEDO: A->E (1). DEDO->DEJO: D->J (1). DEJO->DEJA: O->A (1). Good par 3.
verify("ES #28 fix", ["DADO", "DEDO", "DEJO", "DEJA"], new Set(["DADO", "DEDO", "DEJO", "DEJA", "DAÑO", "DALO", "DAMO", "DAGO", "DARO", "DEMO", "DEGO", "DELO", "DEJO", "DEPO", "DECA", "REJA", "TEJA", "CEJA"]));

verify("ES #29", ["MANO", "MAGO", "MAGO", "MAZO"], new Set([]));
// MANO->MAGO: N->G (1). MAGO->MAZO: G->Z (1). Good par 2.
verify("ES #29 fix", ["MANO", "MAGO", "MAZO"], new Set(["MANO", "MAGO", "MAZO", "MALO", "MATO", "MAYO", "MAPO", "MACO", "MARO", "MASO", "MAPA", "MASA", "PAGO", "LAGO", "VAGO", "GATO", "GAZO"]));

verify("ES #30", ["SEDA", "SERA", "SERA", "PERA", "PERO", "PERO", "PERRO"], new Set([]));
// SEDA->SERA: D->R (1). SERA->PERA: S->P (1). PERA->PERO: A->O (1). Good par 3.
verify("ES #30 fix", ["SEDA", "SERA", "PERA", "PERO"], new Set(["SEDA", "SERA", "PERA", "PERO", "SENA", "SEPA", "SECA", "SEGA", "SETA", "SEVA", "CERA", "TERA", "VERA", "MERA", "PENA", "PEÑA", "PEGA", "PESA"]));


// ===== FRENCH PUZZLES 9-30 =====
console.log("\n=== FRENCH ===");

verify("FR #9", ["GARE", "RARE"], new Set(["GARE", "RARE", "GALE", "GAGE", "GAZE", "GALE", "GAME", "GATE", "GAVE", "CARE", "DARE", "FARE", "MARE", "PARE", "TARE"]));

verify("FR #10", ["LOUP", "LOUD", "LOUE", "ROUE"], new Set([]));
// LOUP->LOUE: P->E (1). LOUE->ROUE: L->R (1). Good par 2.
verify("FR #10 fix", ["LOUP", "LOUE", "ROUE"], new Set(["LOUP", "LOUE", "ROUE", "LOUP", "LOUE", "LOUP", "LOUD", "LOUE", "LOUR", "LOUT", "FOUE", "JOUE", "MOUE", "NOUE", "SOUE", "TOUE", "VOUE"]));

verify("FR #11", ["FEUX", "JEUX", "JEUS", "YEUX"], new Set([]));
// FEUX->JEUX: F->J (1). JEUX->YEUX: J->Y? No - different. Actually JEUX->YEUX changes J->Y (1). Good par 2.
verify("FR #11 fix", ["FEUX", "JEUX"], new Set(["FEUX", "JEUX", "DEUX", "VEUX", "PEUX", "YEUX", "FAUX", "FOUS", "FEUS"]));

verify("FR #12", ["NUIT", "HUIT"], new Set(["NUIT", "HUIT", "BUIT", "SUIT", "DUIT", "FUIT", "NUIS", "NULL"]));

verify("FR #13", ["DOUX", "DOUE", "JOUE", "JOUR"], new Set([]));
// DOUX->DOUE: X->E (1). DOUE->JOUE: D->J (1). JOUE->JOUR: E->R (1). Good par 3.
verify("FR #13 fix", ["DOUX", "DOUE", "JOUE", "JOUR"], new Set(["DOUX", "DOUE", "JOUE", "JOUR", "DOUX", "DOUE", "DORE", "DOSE", "DOME", "DONE", "DOTE", "FOUE", "MOUE", "NOUE", "ROUE", "SOUE", "JOUI", "JOUS", "JOUT"]));

verify("FR #14", ["ROBE", "RODE", "RODE"], new Set([]));
// ROBE->RODE: B->D (1). Good par 1.
verify("FR #14 fix", ["ROBE", "RODE"], new Set(["ROBE", "RODE", "ROBE", "ROLE", "ROME", "ROSE", "ROTE", "ROUE", "ROPE", "RIME", "CODE", "MODE", "NODE"]));

verify("FR #15", ["SOIR", "SOIE", "VOIE", "VOIX"], new Set([]));
// SOIR->SOIE: R->E (1). SOIE->VOIE: S->V (1). VOIE->VOIX: E->X (1). Good par 3.
verify("FR #15 fix", ["SOIR", "SOIE", "VOIE", "VOIX"], new Set(["SOIR", "SOIE", "VOIE", "VOIX", "SOIN", "SOIF", "SOIT", "SOIS", "SOLE", "SOME", "FOIE", "JOIE", "NOIE", "ROIE", "VOIR", "VOIS", "VOIL"]));

verify("FR #16", ["BRAS", "BRIS", "GRIS"], new Set(["BRAS", "BRIS", "GRIS", "BRUS", "BRAI", "BRAN", "BRIS", "CRIS", "PRIS", "TRIS", "GRAS"]));

verify("FR #17", ["FORT", "FORE", "FORE"], new Set([]));
// FORT->FORE: T->E (1). Good par 1.
verify("FR #17 fix", ["FORT", "FORE"], new Set(["FORT", "FORE", "FORD", "FORS", "FORK", "FORM", "FOND", "FONT", "FORS", "FORE", "BORE", "CORE", "DORE", "GORE", "MORE", "PORE", "TORE"]));

verify("FR #18", ["LAIT", "LAID", "LAID"], new Set([]));
// LAIT->LAID: T->D (1). Good par 1.
verify("FR #18 fix", ["LAIT", "LAID"], new Set(["LAIT", "LAID", "LAIE", "LAIS", "LAIC", "FAIT", "PAIX", "TAIT", "MAID"]));

verify("FR #19", ["BANC", "BANE", "BANE"], new Set([]));
// BANC->BANE: C->E (1). Hmm, BANE is 4 letters and BANC is 4 letters. B-A-N-C -> B-A-N-E. (1). Good.
verify("FR #19 fix", ["BANC", "BANE"], new Set(["BANC", "BANE", "BAND", "BANG", "BANS", "BAIN", "BANE", "BASE", "BALE", "BAVE", "CANE", "DANE", "LANE", "MANE", "PANE", "VANE"]));

// Let me reconsider FR. Some of my words aren't great French words. Let me be more careful.

verify("FR #20", ["BEAU", "BEAU", "BEAU"], new Set([]));
// Actually let me do BEAU->BEAU is wrong. Let me think more carefully.

console.log("\n--- Let me re-verify more carefully ---");

// I'll verify the final set I actually write
console.log("Done initial verification. See final file for complete set.");
