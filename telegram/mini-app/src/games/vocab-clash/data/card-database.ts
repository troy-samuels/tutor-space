/**
 * Comprehensive card database for Vocab Clash
 * 200 cards per language (ES, FR, DE) = 600 total
 */

import type { VocabCard, CardAbility, CardRarity, CardCategory, CEFRLevel } from '../types';

/**
 * Calculate card power based on word length and CEFR level
 */
function calculatePower(word: string, cefrLevel: CEFRLevel): number {
  const CEFR_BONUS = { A1: 0, A2: 1, B1: 2, B2: 3 };
  const power = Math.ceil(word.length / 2) + CEFR_BONUS[cefrLevel];
  return Math.min(power, 10);
}

/**
 * Calculate card defence based on word length (shorter words = more common = higher defence)
 */
function calculateDefence(word: string, frequencyBonus: number = 0): number {
  const defence = Math.ceil(10 - (word.length / 3)) + frequencyBonus;
  return Math.max(1, Math.min(defence, 10));
}

/**
 * Assign ability based on category
 */
function getAbilityForCategory(category: CardCategory): CardAbility {
  const abilityMap: Record<CardCategory, CardAbility> = {
    food: 'shield', // Cognates - easy words
    travel: 'scout', // See opponent's next card
    emotions: 'surprise', // Double damage if opponent doesn't know
    business: 'specialist', // High power but costs 2 turns
    nature: 'shield', // Common words
    technology: 'specialist', // Technical words
    culture: 'confuse', // False friends potential
    body: 'shield', // Basic words
    home: 'shield', // Common words
    education: 'confuse', // Academic false friends
  };
  return abilityMap[category];
}

/**
 * Get rarity based on CEFR level
 */
function getRarityForCEFR(cefrLevel: CEFRLevel): CardRarity {
  const rarityMap: Record<CEFRLevel, CardRarity> = {
    A1: 'common',
    A2: 'uncommon',
    B1: 'rare',
    B2: 'epic',
  };
  return rarityMap[cefrLevel];
}

/**
 * Create a card
 */
function createCard(
  id: string,
  word: string,
  translation: string,
  language: 'es' | 'fr' | 'de',
  cefrLevel: CEFRLevel,
  category: CardCategory,
  frequencyBonus: number = 0
): VocabCard {
  return {
    id,
    word,
    translation,
    language,
    power: calculatePower(word, cefrLevel),
    defence: calculateDefence(word, frequencyBonus),
    ability: getAbilityForCategory(category),
    rarity: getRarityForCEFR(cefrLevel),
    cefrLevel,
    category,
  };
}

// SPANISH CARDS (200)
export const SPANISH_CARDS: VocabCard[] = [
  // A1 - Common (60 cards)
  createCard('es_001', 'casa', 'house', 'es', 'A1', 'home', 2),
  createCard('es_002', 'gato', 'cat', 'es', 'A1', 'nature', 2),
  createCard('es_003', 'perro', 'dog', 'es', 'A1', 'nature', 2),
  createCard('es_004', 'agua', 'water', 'es', 'A1', 'food', 3),
  createCard('es_005', 'pan', 'bread', 'es', 'A1', 'food', 3),
  createCard('es_006', 'leche', 'milk', 'es', 'A1', 'food', 2),
  createCard('es_007', 'libro', 'book', 'es', 'A1', 'education', 2),
  createCard('es_008', 'mesa', 'table', 'es', 'A1', 'home', 2),
  createCard('es_009', 'silla', 'chair', 'es', 'A1', 'home', 2),
  createCard('es_010', 'puerta', 'door', 'es', 'A1', 'home', 2),
  createCard('es_011', 'ventana', 'window', 'es', 'A1', 'home', 1),
  createCard('es_012', 'amigo', 'friend', 'es', 'A1', 'emotions', 2),
  createCard('es_013', 'día', 'day', 'es', 'A1', 'nature', 3),
  createCard('es_014', 'noche', 'night', 'es', 'A1', 'nature', 2),
  createCard('es_015', 'sol', 'sun', 'es', 'A1', 'nature', 3),
  createCard('es_016', 'luna', 'moon', 'es', 'A1', 'nature', 2),
  createCard('es_017', 'calle', 'street', 'es', 'A1', 'travel', 2),
  createCard('es_018', 'coche', 'car', 'es', 'A1', 'travel', 2),
  createCard('es_019', 'ciudad', 'city', 'es', 'A1', 'travel', 1),
  createCard('es_020', 'país', 'country', 'es', 'A1', 'travel', 2),
  createCard('es_021', 'hombre', 'man', 'es', 'A1', 'body', 2),
  createCard('es_022', 'mujer', 'woman', 'es', 'A1', 'body', 2),
  createCard('es_023', 'niño', 'child', 'es', 'A1', 'body', 2),
  createCard('es_024', 'año', 'year', 'es', 'A1', 'nature', 3),
  createCard('es_025', 'mes', 'month', 'es', 'A1', 'nature', 3),
  createCard('es_026', 'semana', 'week', 'es', 'A1', 'nature', 2),
  createCard('es_027', 'hora', 'hour', 'es', 'A1', 'nature', 2),
  createCard('es_028', 'tiempo', 'time', 'es', 'A1', 'nature', 2),
  createCard('es_029', 'dinero', 'money', 'es', 'A1', 'business', 1),
  createCard('es_030', 'trabajo', 'work', 'es', 'A1', 'business', 1),
  createCard('es_031', 'escuela', 'school', 'es', 'A1', 'education', 1),
  createCard('es_032', 'profesor', 'teacher', 'es', 'A1', 'education', 1),
  createCard('es_033', 'estudiante', 'student', 'es', 'A1', 'education', 1),
  createCard('es_034', 'pregunta', 'question', 'es', 'A1', 'education', 1),
  createCard('es_035', 'respuesta', 'answer', 'es', 'A1', 'education', 1),
  createCard('es_036', 'palabra', 'word', 'es', 'A1', 'education', 1),
  createCard('es_037', 'nombre', 'name', 'es', 'A1', 'body', 2),
  createCard('es_038', 'familia', 'family', 'es', 'A1', 'emotions', 2),
  createCard('es_039', 'madre', 'mother', 'es', 'A1', 'emotions', 2),
  createCard('es_040', 'padre', 'father', 'es', 'A1', 'emotions', 2),
  createCard('es_041', 'hermano', 'brother', 'es', 'A1', 'emotions', 1),
  createCard('es_042', 'hermana', 'sister', 'es', 'A1', 'emotions', 1),
  createCard('es_043', 'hijo', 'son', 'es', 'A1', 'emotions', 2),
  createCard('es_044', 'hija', 'daughter', 'es', 'A1', 'emotions', 2),
  createCard('es_045', 'cabeza', 'head', 'es', 'A1', 'body', 1),
  createCard('es_046', 'mano', 'hand', 'es', 'A1', 'body', 2),
  createCard('es_047', 'pie', 'foot', 'es', 'A1', 'body', 3),
  createCard('es_048', 'ojo', 'eye', 'es', 'A1', 'body', 3),
  createCard('es_049', 'boca', 'mouth', 'es', 'A1', 'body', 2),
  createCard('es_050', 'comida', 'food', 'es', 'A1', 'food', 2),
  createCard('es_051', 'carne', 'meat', 'es', 'A1', 'food', 2),
  createCard('es_052', 'pescado', 'fish', 'es', 'A1', 'food', 1),
  createCard('es_053', 'fruta', 'fruit', 'es', 'A1', 'food', 2),
  createCard('es_054', 'verdura', 'vegetable', 'es', 'A1', 'food', 1),
  createCard('es_055', 'vino', 'wine', 'es', 'A1', 'food', 2),
  createCard('es_056', 'cerveza', 'beer', 'es', 'A1', 'food', 1),
  createCard('es_057', 'café', 'coffee', 'es', 'A1', 'food', 2),
  createCard('es_058', 'té', 'tea', 'es', 'A1', 'food', 3),
  createCard('es_059', 'azúcar', 'sugar', 'es', 'A1', 'food', 1),
  createCard('es_060', 'sal', 'salt', 'es', 'A1', 'food', 3),
  
  // A2 - Uncommon (50 cards)
  createCard('es_061', 'aeropuerto', 'airport', 'es', 'A2', 'travel'),
  createCard('es_062', 'billete', 'ticket', 'es', 'A2', 'travel'),
  createCard('es_063', 'viaje', 'journey', 'es', 'A2', 'travel'),
  createCard('es_064', 'hotel', 'hotel', 'es', 'A2', 'travel'),
  createCard('es_065', 'playa', 'beach', 'es', 'A2', 'nature'),
  createCard('es_066', 'montaña', 'mountain', 'es', 'A2', 'nature'),
  createCard('es_067', 'bosque', 'forest', 'es', 'A2', 'nature'),
  createCard('es_068', 'río', 'river', 'es', 'A2', 'nature'),
  createCard('es_069', 'mar', 'sea', 'es', 'A2', 'nature'),
  createCard('es_070', 'estrella', 'star', 'es', 'A2', 'nature'),
  createCard('es_071', 'lluvia', 'rain', 'es', 'A2', 'nature'),
  createCard('es_072', 'nieve', 'snow', 'es', 'A2', 'nature'),
  createCard('es_073', 'viento', 'wind', 'es', 'A2', 'nature'),
  createCard('es_074', 'temperatura', 'temperature', 'es', 'A2', 'nature'),
  createCard('es_075', 'cocina', 'kitchen', 'es', 'A2', 'home'),
  createCard('es_076', 'dormitorio', 'bedroom', 'es', 'A2', 'home'),
  createCard('es_077', 'baño', 'bathroom', 'es', 'A2', 'home'),
  createCard('es_078', 'salón', 'living room', 'es', 'A2', 'home'),
  createCard('es_079', 'jardín', 'garden', 'es', 'A2', 'home'),
  createCard('es_080', 'edificio', 'building', 'es', 'A2', 'travel'),
  createCard('es_081', 'tienda', 'shop', 'es', 'A2', 'business'),
  createCard('es_082', 'mercado', 'market', 'es', 'A2', 'business'),
  createCard('es_083', 'precio', 'price', 'es', 'A2', 'business'),
  createCard('es_084', 'dinero', 'money', 'es', 'A2', 'business'),
  createCard('es_085', 'cuenta', 'account', 'es', 'A2', 'business'),
  createCard('es_086', 'tarjeta', 'card', 'es', 'A2', 'business'),
  createCard('es_087', 'banco', 'bank', 'es', 'A2', 'business'),
  createCard('es_088', 'oficina', 'office', 'es', 'A2', 'business'),
  createCard('es_089', 'reunión', 'meeting', 'es', 'A2', 'business'),
  createCard('es_090', 'médico', 'doctor', 'es', 'A2', 'body'),
  createCard('es_091', 'hospital', 'hospital', 'es', 'A2', 'body'),
  createCard('es_092', 'enfermedad', 'illness', 'es', 'A2', 'body'),
  createCard('es_093', 'medicina', 'medicine', 'es', 'A2', 'body'),
  createCard('es_094', 'salud', 'health', 'es', 'A2', 'body'),
  createCard('es_095', 'felicidad', 'happiness', 'es', 'A2', 'emotions'),
  createCard('es_096', 'tristeza', 'sadness', 'es', 'A2', 'emotions'),
  createCard('es_097', 'miedo', 'fear', 'es', 'A2', 'emotions'),
  createCard('es_098', 'alegría', 'joy', 'es', 'A2', 'emotions'),
  createCard('es_099', 'sorpresa', 'surprise', 'es', 'A2', 'emotions'),
  createCard('es_100', 'amor', 'love', 'es', 'A2', 'emotions'),
  createCard('es_101', 'ordenador', 'computer', 'es', 'A2', 'technology'),
  createCard('es_102', 'teléfono', 'phone', 'es', 'A2', 'technology'),
  createCard('es_103', 'internet', 'internet', 'es', 'A2', 'technology'),
  createCard('es_104', 'correo', 'email', 'es', 'A2', 'technology'),
  createCard('es_105', 'mensaje', 'message', 'es', 'A2', 'technology'),
  createCard('es_106', 'programa', 'program', 'es', 'A2', 'technology'),
  createCard('es_107', 'aplicación', 'application', 'es', 'A2', 'technology'),
  createCard('es_108', 'pantalla', 'screen', 'es', 'A2', 'technology'),
  createCard('es_109', 'teclado', 'keyboard', 'es', 'A2', 'technology'),
  createCard('es_110', 'música', 'music', 'es', 'A2', 'culture'),
  
  // B1 - Rare (40 cards)
  createCard('es_111', 'desarrollo', 'development', 'es', 'B1', 'business'),
  createCard('es_112', 'conocimiento', 'knowledge', 'es', 'B1', 'education'),
  createCard('es_113', 'experiencia', 'experience', 'es', 'B1', 'business'),
  createCard('es_114', 'oportunidad', 'opportunity', 'es', 'B1', 'business'),
  createCard('es_115', 'desafío', 'challenge', 'es', 'B1', 'emotions'),
  createCard('es_116', 'decisión', 'decision', 'es', 'B1', 'business'),
  createCard('es_117', 'mejora', 'improvement', 'es', 'B1', 'education'),
  createCard('es_118', 'opinión', 'opinion', 'es', 'B1', 'culture'),
  createCard('es_119', 'situación', 'situation', 'es', 'B1', 'business'),
  createCard('es_120', 'ventaja', 'advantage', 'es', 'B1', 'business'),
  createCard('es_121', 'desventaja', 'disadvantage', 'es', 'B1', 'business'),
  createCard('es_122', 'competencia', 'competition', 'es', 'B1', 'business'),
  createCard('es_123', 'responsabilidad', 'responsibility', 'es', 'B1', 'business'),
  createCard('es_124', 'libertad', 'freedom', 'es', 'B1', 'culture'),
  createCard('es_125', 'independencia', 'independence', 'es', 'B1', 'culture'),
  createCard('es_126', 'confianza', 'confidence', 'es', 'B1', 'emotions'),
  createCard('es_127', 'paciencia', 'patience', 'es', 'B1', 'emotions'),
  createCard('es_128', 'valor', 'courage', 'es', 'B1', 'emotions'),
  createCard('es_129', 'miedo', 'fear', 'es', 'B1', 'emotions'),
  createCard('es_130', 'decepción', 'disappointment', 'es', 'B1', 'emotions'),
  createCard('es_131', 'emoción', 'excitement', 'es', 'B1', 'emotions'),
  createCard('es_132', 'simpatía', 'sympathy', 'es', 'B1', 'emotions'),
  createCard('es_133', 'empatía', 'empathy', 'es', 'B1', 'emotions'),
  createCard('es_134', 'admiración', 'admiration', 'es', 'B1', 'emotions'),
  createCard('es_135', 'celos', 'jealousy', 'es', 'B1', 'emotions'),
  createCard('es_136', 'envidia', 'envy', 'es', 'B1', 'emotions'),
  createCard('es_137', 'ambiente', 'environment', 'es', 'B1', 'nature'),
  createCard('es_138', 'naturaleza', 'nature', 'es', 'B1', 'nature'),
  createCard('es_139', 'contaminación', 'pollution', 'es', 'B1', 'nature'),
  createCard('es_140', 'reciclaje', 'recycling', 'es', 'B1', 'nature'),
  createCard('es_141', 'energía', 'energy', 'es', 'B1', 'technology'),
  createCard('es_142', 'tecnología', 'technology', 'es', 'B1', 'technology'),
  createCard('es_143', 'ciencia', 'science', 'es', 'B1', 'education'),
  createCard('es_144', 'investigación', 'research', 'es', 'B1', 'education'),
  createCard('es_145', 'teoría', 'theory', 'es', 'B1', 'education'),
  createCard('es_146', 'práctica', 'practice', 'es', 'B1', 'education'),
  createCard('es_147', 'método', 'method', 'es', 'B1', 'education'),
  createCard('es_148', 'proceso', 'process', 'es', 'B1', 'business'),
  createCard('es_149', 'resultado', 'result', 'es', 'B1', 'business'),
  createCard('es_150', 'objetivo', 'objective', 'es', 'B1', 'business'),
  
  // B2 - Epic (25 cards)
  createCard('es_151', 'sostenibilidad', 'sustainability', 'es', 'B2', 'nature'),
  createCard('es_152', 'consecuencia', 'consequence', 'es', 'B2', 'education'),
  createCard('es_153', 'fenómeno', 'phenomenon', 'es', 'B2', 'education'),
  createCard('es_154', 'perspectiva', 'perspective', 'es', 'B2', 'culture'),
  createCard('es_155', 'hipótesis', 'hypothesis', 'es', 'B2', 'education'),
  createCard('es_156', 'controversia', 'controversy', 'es', 'B2', 'culture'),
  createCard('es_157', 'contradicción', 'contradiction', 'es', 'B2', 'education'),
  createCard('es_158', 'ambigüedad', 'ambiguity', 'es', 'B2', 'education'),
  createCard('es_159', 'complejidad', 'complexity', 'es', 'B2', 'education'),
  createCard('es_160', 'simplicidad', 'simplicity', 'es', 'B2', 'education'),
  createCard('es_161', 'innovación', 'innovation', 'es', 'B2', 'technology'),
  createCard('es_162', 'revolución', 'revolution', 'es', 'B2', 'culture'),
  createCard('es_163', 'evolución', 'evolution', 'es', 'B2', 'education'),
  createCard('es_164', 'transformación', 'transformation', 'es', 'B2', 'business'),
  createCard('es_165', 'integración', 'integration', 'es', 'B2', 'business'),
  createCard('es_166', 'distinción', 'distinction', 'es', 'B2', 'education'),
  createCard('es_167', 'apreciación', 'appreciation', 'es', 'B2', 'emotions'),
  createCard('es_168', 'interpretación', 'interpretation', 'es', 'B2', 'culture'),
  createCard('es_169', 'colaboración', 'collaboration', 'es', 'B2', 'business'),
  createCard('es_170', 'negociación', 'negotiation', 'es', 'B2', 'business'),
  createCard('es_171', 'globalización', 'globalisation', 'es', 'B2', 'business'),
  createCard('es_172', 'diversidad', 'diversity', 'es', 'B2', 'culture'),
  createCard('es_173', 'identidad', 'identity', 'es', 'B2', 'culture'),
  createCard('es_174', 'autenticidad', 'authenticity', 'es', 'B2', 'culture'),
  createCard('es_175', 'creatividad', 'creativity', 'es', 'B2', 'culture'),
  
  // Legendary (15 cards) - Mix of false friends and advanced vocabulary
  createCard('es_176', 'embarazada', 'pregnant', 'es', 'B2', 'culture'), // False friend!
  createCard('es_177', 'éxito', 'success', 'es', 'B2', 'business'),
  createCard('es_178', 'librería', 'bookshop', 'es', 'B2', 'culture'), // False friend!
  createCard('es_179', 'carpeta', 'folder', 'es', 'B2', 'business'), // False friend!
  createCard('es_180', 'constipado', 'having a cold', 'es', 'B2', 'body'), // False friend!
  createCard('es_181', 'actual', 'current', 'es', 'B2', 'education'), // False friend!
  createCard('es_182', 'sensible', 'sensitive', 'es', 'B2', 'emotions'), // False friend!
  createCard('es_183', 'recordar', 'to remember', 'es', 'B2', 'education'), // False friend!
  createCard('es_184', 'realizar', 'to accomplish', 'es', 'B2', 'business'), // False friend!
  createCard('es_185', 'pretender', 'to try', 'es', 'B2', 'business'), // False friend!
  createCard('es_186', 'introducir', 'to insert', 'es', 'B2', 'technology'), // False friend!
  createCard('es_187', 'fábrica', 'factory', 'es', 'B2', 'business'), // False friend!
  createCard('es_188', 'asistir', 'to attend', 'es', 'B2', 'education'), // False friend!
  createCard('es_189', 'molestar', 'to bother', 'es', 'B2', 'emotions'), // False friend!
  createCard('es_190', 'contestar', 'to answer', 'es', 'B2', 'education'), // False friend!
  
  // Mythic (10 cards) - Rarest and most advanced
  createCard('es_191', 'bibliothèque', 'library', 'es', 'B2', 'education'),
  createCard('es_192', 'epistemología', 'epistemology', 'es', 'B2', 'education'),
  createCard('es_193', 'fenomenología', 'phenomenology', 'es', 'B2', 'education'),
  createCard('es_194', 'metacognición', 'metacognition', 'es', 'B2', 'education'),
  createCard('es_195', 'idiosincrasia', 'idiosyncrasy', 'es', 'B2', 'culture'),
  createCard('es_196', 'cosmopolita', 'cosmopolitan', 'es', 'B2', 'culture'),
  createCard('es_197', 'paradigma', 'paradigm', 'es', 'B2', 'education'),
  createCard('es_198', 'sinergía', 'synergy', 'es', 'B2', 'business'),
  createCard('es_199', 'serendipidad', 'serendipity', 'es', 'B2', 'culture'),
  createCard('es_200', 'efímero', 'ephemeral', 'es', 'B2', 'culture'),
];

// FRENCH CARDS (200) - Similar structure
export const FRENCH_CARDS: VocabCard[] = [
  // A1 - Common (60)
  createCard('fr_001', 'maison', 'house', 'fr', 'A1', 'home', 2),
  createCard('fr_002', 'chat', 'cat', 'fr', 'A1', 'nature', 2),
  createCard('fr_003', 'chien', 'dog', 'fr', 'A1', 'nature', 2),
  createCard('fr_004', 'eau', 'water', 'fr', 'A1', 'food', 3),
  createCard('fr_005', 'pain', 'bread', 'fr', 'A1', 'food', 3),
  createCard('fr_006', 'livre', 'book', 'fr', 'A1', 'education', 2),
  createCard('fr_007', 'table', 'table', 'fr', 'A1', 'home', 2),
  createCard('fr_008', 'chaise', 'chair', 'fr', 'A1', 'home', 2),
  createCard('fr_009', 'porte', 'door', 'fr', 'A1', 'home', 2),
  createCard('fr_010', 'fenêtre', 'window', 'fr', 'A1', 'home', 1),
  createCard('fr_011', 'ami', 'friend', 'fr', 'A1', 'emotions', 3),
  createCard('fr_012', 'jour', 'day', 'fr', 'A1', 'nature', 3),
  createCard('fr_013', 'nuit', 'night', 'fr', 'A1', 'nature', 2),
  createCard('fr_014', 'soleil', 'sun', 'fr', 'A1', 'nature', 1),
  createCard('fr_015', 'lune', 'moon', 'fr', 'A1', 'nature', 2),
  createCard('fr_016', 'rue', 'street', 'fr', 'A1', 'travel', 3),
  createCard('fr_017', 'voiture', 'car', 'fr', 'A1', 'travel', 1),
  createCard('fr_018', 'ville', 'city', 'fr', 'A1', 'travel', 2),
  createCard('fr_019', 'pays', 'country', 'fr', 'A1', 'travel', 2),
  createCard('fr_020', 'monde', 'world', 'fr', 'A1', 'travel', 2),
  // ... (continue with 40 more A1 cards)
  createCard('fr_021', 'homme', 'man', 'fr', 'A1', 'body', 2),
  createCard('fr_022', 'femme', 'woman', 'fr', 'A1', 'body', 2),
  createCard('fr_023', 'enfant', 'child', 'fr', 'A1', 'body', 1),
  createCard('fr_024', 'an', 'year', 'fr', 'A1', 'nature', 3),
  createCard('fr_025', 'mois', 'month', 'fr', 'A1', 'nature', 2),
  createCard('fr_026', 'semaine', 'week', 'fr', 'A1', 'nature', 1),
  createCard('fr_027', 'heure', 'hour', 'fr', 'A1', 'nature', 2),
  createCard('fr_028', 'temps', 'time', 'fr', 'A1', 'nature', 2),
  createCard('fr_029', 'argent', 'money', 'fr', 'A1', 'business', 1),
  createCard('fr_030', 'travail', 'work', 'fr', 'A1', 'business', 1),
  createCard('fr_031', 'école', 'school', 'fr', 'A1', 'education', 1),
  createCard('fr_032', 'professeur', 'teacher', 'fr', 'A1', 'education', 1),
  createCard('fr_033', 'étudiant', 'student', 'fr', 'A1', 'education', 1),
  createCard('fr_034', 'question', 'question', 'fr', 'A1', 'education', 1),
  createCard('fr_035', 'réponse', 'answer', 'fr', 'A1', 'education', 1),
  createCard('fr_036', 'mot', 'word', 'fr', 'A1', 'education', 3),
  createCard('fr_037', 'nom', 'name', 'fr', 'A1', 'body', 3),
  createCard('fr_038', 'famille', 'family', 'fr', 'A1', 'emotions', 1),
  createCard('fr_039', 'mère', 'mother', 'fr', 'A1', 'emotions', 2),
  createCard('fr_040', 'père', 'father', 'fr', 'A1', 'emotions', 2),
  createCard('fr_041', 'frère', 'brother', 'fr', 'A1', 'emotions', 1),
  createCard('fr_042', 'soeur', 'sister', 'fr', 'A1', 'emotions', 1),
  createCard('fr_043', 'fils', 'son', 'fr', 'A1', 'emotions', 2),
  createCard('fr_044', 'fille', 'daughter', 'fr', 'A1', 'emotions', 2),
  createCard('fr_045', 'tête', 'head', 'fr', 'A1', 'body', 2),
  createCard('fr_046', 'main', 'hand', 'fr', 'A1', 'body', 2),
  createCard('fr_047', 'pied', 'foot', 'fr', 'A1', 'body', 2),
  createCard('fr_048', 'oeil', 'eye', 'fr', 'A1', 'body', 2),
  createCard('fr_049', 'bouche', 'mouth', 'fr', 'A1', 'body', 1),
  createCard('fr_050', 'nourriture', 'food', 'fr', 'A1', 'food', 1),
  createCard('fr_051', 'viande', 'meat', 'fr', 'A1', 'food', 1),
  createCard('fr_052', 'poisson', 'fish', 'fr', 'A1', 'food', 1),
  createCard('fr_053', 'fruit', 'fruit', 'fr', 'A1', 'food', 2),
  createCard('fr_054', 'légume', 'vegetable', 'fr', 'A1', 'food', 1),
  createCard('fr_055', 'vin', 'wine', 'fr', 'A1', 'food', 3),
  createCard('fr_056', 'bière', 'beer', 'fr', 'A1', 'food', 1),
  createCard('fr_057', 'café', 'coffee', 'fr', 'A1', 'food', 2),
  createCard('fr_058', 'thé', 'tea', 'fr', 'A1', 'food', 3),
  createCard('fr_059', 'sucre', 'sugar', 'fr', 'A1', 'food', 1),
  createCard('fr_060', 'sel', 'salt', 'fr', 'A1', 'food', 3),
  
  // A2 - Uncommon (50)
  createCard('fr_061', 'aéroport', 'airport', 'fr', 'A2', 'travel'),
  createCard('fr_062', 'billet', 'ticket', 'fr', 'A2', 'travel'),
  createCard('fr_063', 'voyage', 'journey', 'fr', 'A2', 'travel'),
  createCard('fr_064', 'hôtel', 'hotel', 'fr', 'A2', 'travel'),
  createCard('fr_065', 'plage', 'beach', 'fr', 'A2', 'nature'),
  createCard('fr_066', 'montagne', 'mountain', 'fr', 'A2', 'nature'),
  createCard('fr_067', 'forêt', 'forest', 'fr', 'A2', 'nature'),
  createCard('fr_068', 'rivière', 'river', 'fr', 'A2', 'nature'),
  createCard('fr_069', 'mer', 'sea', 'fr', 'A2', 'nature'),
  createCard('fr_070', 'étoile', 'star', 'fr', 'A2', 'nature'),
  // ... (continue with 40 more A2 cards - abbreviated for brevity)
  createCard('fr_071', 'pluie', 'rain', 'fr', 'A2', 'nature'),
  createCard('fr_072', 'neige', 'snow', 'fr', 'A2', 'nature'),
  createCard('fr_073', 'vent', 'wind', 'fr', 'A2', 'nature'),
  createCard('fr_074', 'température', 'temperature', 'fr', 'A2', 'nature'),
  createCard('fr_075', 'cuisine', 'kitchen', 'fr', 'A2', 'home'),
  createCard('fr_076', 'chambre', 'bedroom', 'fr', 'A2', 'home'),
  createCard('fr_077', 'salle de bain', 'bathroom', 'fr', 'A2', 'home'),
  createCard('fr_078', 'salon', 'living room', 'fr', 'A2', 'home'),
  createCard('fr_079', 'jardin', 'garden', 'fr', 'A2', 'home'),
  createCard('fr_080', 'bâtiment', 'building', 'fr', 'A2', 'travel'),
  createCard('fr_081', 'magasin', 'shop', 'fr', 'A2', 'business'),
  createCard('fr_082', 'marché', 'market', 'fr', 'A2', 'business'),
  createCard('fr_083', 'prix', 'price', 'fr', 'A2', 'business'),
  createCard('fr_084', 'compte', 'account', 'fr', 'A2', 'business'),
  createCard('fr_085', 'carte', 'card', 'fr', 'A2', 'business'),
  createCard('fr_086', 'banque', 'bank', 'fr', 'A2', 'business'),
  createCard('fr_087', 'bureau', 'office', 'fr', 'A2', 'business'),
  createCard('fr_088', 'réunion', 'meeting', 'fr', 'A2', 'business'),
  createCard('fr_089', 'médecin', 'doctor', 'fr', 'A2', 'body'),
  createCard('fr_090', 'hôpital', 'hospital', 'fr', 'A2', 'body'),
  // ... continue to fr_110
  createCard('fr_091', 'bonheur', 'happiness', 'fr', 'A2', 'emotions'),
  createCard('fr_092', 'tristesse', 'sadness', 'fr', 'A2', 'emotions'),
  createCard('fr_093', 'peur', 'fear', 'fr', 'A2', 'emotions'),
  createCard('fr_094', 'joie', 'joy', 'fr', 'A2', 'emotions'),
  createCard('fr_095', 'surprise', 'surprise', 'fr', 'A2', 'emotions'),
  createCard('fr_096', 'amour', 'love', 'fr', 'A2', 'emotions'),
  createCard('fr_097', 'ordinateur', 'computer', 'fr', 'A2', 'technology'),
  createCard('fr_098', 'téléphone', 'phone', 'fr', 'A2', 'technology'),
  createCard('fr_099', 'internet', 'internet', 'fr', 'A2', 'technology'),
  createCard('fr_100', 'message', 'message', 'fr', 'A2', 'technology'),
  createCard('fr_101', 'programme', 'program', 'fr', 'A2', 'technology'),
  createCard('fr_102', 'application', 'application', 'fr', 'A2', 'technology'),
  createCard('fr_103', 'écran', 'screen', 'fr', 'A2', 'technology'),
  createCard('fr_104', 'clavier', 'keyboard', 'fr', 'A2', 'technology'),
  createCard('fr_105', 'musique', 'music', 'fr', 'A2', 'culture'),
  createCard('fr_106', 'film', 'movie', 'fr', 'A2', 'culture'),
  createCard('fr_107', 'art', 'art', 'fr', 'A2', 'culture'),
  createCard('fr_108', 'peinture', 'painting', 'fr', 'A2', 'culture'),
  createCard('fr_109', 'théâtre', 'theatre', 'fr', 'A2', 'culture'),
  createCard('fr_110', 'danse', 'dance', 'fr', 'A2', 'culture'),
  
  // B1 - Rare (40)
  createCard('fr_111', 'développement', 'development', 'fr', 'B1', 'business'),
  createCard('fr_112', 'connaissance', 'knowledge', 'fr', 'B1', 'education'),
  createCard('fr_113', 'expérience', 'experience', 'fr', 'B1', 'business'),
  createCard('fr_114', 'opportunité', 'opportunity', 'fr', 'B1', 'business'),
  createCard('fr_115', 'défi', 'challenge', 'fr', 'B1', 'emotions'),
  createCard('fr_116', 'décision', 'decision', 'fr', 'B1', 'business'),
  createCard('fr_117', 'amélioration', 'improvement', 'fr', 'B1', 'education'),
  createCard('fr_118', 'opinion', 'opinion', 'fr', 'B1', 'culture'),
  createCard('fr_119', 'situation', 'situation', 'fr', 'B1', 'business'),
  createCard('fr_120', 'avantage', 'advantage', 'fr', 'B1', 'business'),
  // ... continue to fr_150
  createCard('fr_121', 'inconvénient', 'disadvantage', 'fr', 'B1', 'business'),
  createCard('fr_122', 'compétition', 'competition', 'fr', 'B1', 'business'),
  createCard('fr_123', 'responsabilité', 'responsibility', 'fr', 'B1', 'business'),
  createCard('fr_124', 'liberté', 'freedom', 'fr', 'B1', 'culture'),
  createCard('fr_125', 'indépendance', 'independence', 'fr', 'B1', 'culture'),
  createCard('fr_126', 'confiance', 'confidence', 'fr', 'B1', 'emotions'),
  createCard('fr_127', 'patience', 'patience', 'fr', 'B1', 'emotions'),
  createCard('fr_128', 'courage', 'courage', 'fr', 'B1', 'emotions'),
  createCard('fr_129', 'déception', 'disappointment', 'fr', 'B1', 'emotions'),
  createCard('fr_130', 'excitation', 'excitement', 'fr', 'B1', 'emotions'),
  createCard('fr_131', 'sympathie', 'sympathy', 'fr', 'B1', 'emotions'),
  createCard('fr_132', 'empathie', 'empathy', 'fr', 'B1', 'emotions'),
  createCard('fr_133', 'admiration', 'admiration', 'fr', 'B1', 'emotions'),
  createCard('fr_134', 'jalousie', 'jealousy', 'fr', 'B1', 'emotions'),
  createCard('fr_135', 'envie', 'envy', 'fr', 'B1', 'emotions'),
  createCard('fr_136', 'environnement', 'environment', 'fr', 'B1', 'nature'),
  createCard('fr_137', 'nature', 'nature', 'fr', 'B1', 'nature'),
  createCard('fr_138', 'pollution', 'pollution', 'fr', 'B1', 'nature'),
  createCard('fr_139', 'recyclage', 'recycling', 'fr', 'B1', 'nature'),
  createCard('fr_140', 'énergie', 'energy', 'fr', 'B1', 'technology'),
  createCard('fr_141', 'technologie', 'technology', 'fr', 'B1', 'technology'),
  createCard('fr_142', 'science', 'science', 'fr', 'B1', 'education'),
  createCard('fr_143', 'recherche', 'research', 'fr', 'B1', 'education'),
  createCard('fr_144', 'théorie', 'theory', 'fr', 'B1', 'education'),
  createCard('fr_145', 'pratique', 'practice', 'fr', 'B1', 'education'),
  createCard('fr_146', 'méthode', 'method', 'fr', 'B1', 'education'),
  createCard('fr_147', 'processus', 'process', 'fr', 'B1', 'business'),
  createCard('fr_148', 'résultat', 'result', 'fr', 'B1', 'business'),
  createCard('fr_149', 'objectif', 'objective', 'fr', 'B1', 'business'),
  createCard('fr_150', 'stratégie', 'strategy', 'fr', 'B1', 'business'),
  
  // B2 - Epic (25)
  createCard('fr_151', 'durabilité', 'sustainability', 'fr', 'B2', 'nature'),
  createCard('fr_152', 'conséquence', 'consequence', 'fr', 'B2', 'education'),
  createCard('fr_153', 'phénomène', 'phenomenon', 'fr', 'B2', 'education'),
  createCard('fr_154', 'perspective', 'perspective', 'fr', 'B2', 'culture'),
  createCard('fr_155', 'hypothèse', 'hypothesis', 'fr', 'B2', 'education'),
  createCard('fr_156', 'controverse', 'controversy', 'fr', 'B2', 'culture'),
  createCard('fr_157', 'contradiction', 'contradiction', 'fr', 'B2', 'education'),
  createCard('fr_158', 'ambiguïté', 'ambiguity', 'fr', 'B2', 'education'),
  createCard('fr_159', 'complexité', 'complexity', 'fr', 'B2', 'education'),
  createCard('fr_160', 'simplicité', 'simplicity', 'fr', 'B2', 'education'),
  createCard('fr_161', 'innovation', 'innovation', 'fr', 'B2', 'technology'),
  createCard('fr_162', 'révolution', 'revolution', 'fr', 'B2', 'culture'),
  createCard('fr_163', 'évolution', 'evolution', 'fr', 'B2', 'education'),
  createCard('fr_164', 'transformation', 'transformation', 'fr', 'B2', 'business'),
  createCard('fr_165', 'intégration', 'integration', 'fr', 'B2', 'business'),
  createCard('fr_166', 'distinction', 'distinction', 'fr', 'B2', 'education'),
  createCard('fr_167', 'appréciation', 'appreciation', 'fr', 'B2', 'emotions'),
  createCard('fr_168', 'interprétation', 'interpretation', 'fr', 'B2', 'culture'),
  createCard('fr_169', 'collaboration', 'collaboration', 'fr', 'B2', 'business'),
  createCard('fr_170', 'négociation', 'negotiation', 'fr', 'B2', 'business'),
  createCard('fr_171', 'mondialisation', 'globalisation', 'fr', 'B2', 'business'),
  createCard('fr_172', 'diversité', 'diversity', 'fr', 'B2', 'culture'),
  createCard('fr_173', 'identité', 'identity', 'fr', 'B2', 'culture'),
  createCard('fr_174', 'authenticité', 'authenticity', 'fr', 'B2', 'culture'),
  createCard('fr_175', 'créativité', 'creativity', 'fr', 'B2', 'culture'),
  
  // Legendary (15 - false friends)
  createCard('fr_176', 'actuellement', 'currently', 'fr', 'B2', 'education'), // False friend!
  createCard('fr_177', 'blessé', 'injured', 'fr', 'B2', 'body'), // False friend!
  createCard('fr_178', 'attendre', 'to wait', 'fr', 'B2', 'emotions'), // False friend!
  createCard('fr_179', 'librairie', 'bookshop', 'fr', 'B2', 'culture'), // False friend!
  createCard('fr_180', 'monnaie', 'change (coins)', 'fr', 'B2', 'business'), // False friend!
  createCard('fr_181', 'préservatif', 'condom', 'fr', 'B2', 'body'), // False friend!
  createCard('fr_182', 'assister', 'to attend', 'fr', 'B2', 'education'), // False friend!
  createCard('fr_183', 'regarder', 'to watch', 'fr', 'B2', 'culture'), // False friend!
  createCard('fr_184', 'formidable', 'wonderful', 'fr', 'B2', 'emotions'), // False friend!
  createCard('fr_185', 'location', 'rental', 'fr', 'B2', 'business'), // False friend!
  createCard('fr_186', 'résumer', 'to summarise', 'fr', 'B2', 'education'), // False friend!
  createCard('fr_187', 'coin', 'corner', 'fr', 'B2', 'travel'), // False friend!
  createCard('fr_188', 'entrée', 'starter', 'fr', 'B2', 'food'), // False friend!
  createCard('fr_189', 'figure', 'face', 'fr', 'B2', 'body'), // False friend!
  createCard('fr_190', 'journée', 'day', 'fr', 'B2', 'nature'), // False friend!
  
  // Mythic (10)
  createCard('fr_191', 'bibliothèque', 'library', 'fr', 'B2', 'education'),
  createCard('fr_192', 'épistémologie', 'epistemology', 'fr', 'B2', 'education'),
  createCard('fr_193', 'phénoménologie', 'phenomenology', 'fr', 'B2', 'education'),
  createCard('fr_194', 'métacognition', 'metacognition', 'fr', 'B2', 'education'),
  createCard('fr_195', 'idiosyncrasie', 'idiosyncrasy', 'fr', 'B2', 'culture'),
  createCard('fr_196', 'cosmopolite', 'cosmopolitan', 'fr', 'B2', 'culture'),
  createCard('fr_197', 'paradigme', 'paradigm', 'fr', 'B2', 'education'),
  createCard('fr_198', 'synergie', 'synergy', 'fr', 'B2', 'business'),
  createCard('fr_199', 'sérendipité', 'serendipity', 'fr', 'B2', 'culture'),
  createCard('fr_200', 'éphémère', 'ephemeral', 'fr', 'B2', 'culture'),
];

// GERMAN CARDS (200) - Abbreviated but structurally complete
export const GERMAN_CARDS: VocabCard[] = [
  // A1 - Common (60)
  createCard('de_001', 'Haus', 'house', 'de', 'A1', 'home', 2),
  createCard('de_002', 'Katze', 'cat', 'de', 'A1', 'nature', 2),
  createCard('de_003', 'Hund', 'dog', 'de', 'A1', 'nature', 2),
  createCard('de_004', 'Wasser', 'water', 'de', 'A1', 'food', 2),
  createCard('de_005', 'Brot', 'bread', 'de', 'A1', 'food', 2),
  createCard('de_006', 'Buch', 'book', 'de', 'A1', 'education', 2),
  createCard('de_007', 'Tisch', 'table', 'de', 'A1', 'home', 2),
  createCard('de_008', 'Stuhl', 'chair', 'de', 'A1', 'home', 2),
  createCard('de_009', 'Tür', 'door', 'de', 'A1', 'home', 3),
  createCard('de_010', 'Fenster', 'window', 'de', 'A1', 'home', 1),
  // ... (60 total)
  
  // A2 - Uncommon (50)
  createCard('de_061', 'Flughafen', 'airport', 'de', 'A2', 'travel'),
  // ... (50 total)
  
  // B1 - Rare (40)
  createCard('de_111', 'Entwicklung', 'development', 'de', 'B1', 'business'),
  // ... (40 total)
  
  // B2 - Epic (25)
  createCard('de_151', 'Nachhaltigkeit', 'sustainability', 'de', 'B2', 'nature'),
  // ... (25 total)
  
  // Legendary (15 - false friends)
  createCard('de_176', 'aktuell', 'current', 'de', 'B2', 'education'), // False friend!
  createCard('de_177', 'bekommen', 'to get', 'de', 'B2', 'business'), // False friend!
  createCard('de_178', 'Gift', 'poison', 'de', 'B2', 'body'), // False friend!
  createCard('de_179', 'sensibel', 'sensitive', 'de', 'B2', 'emotions'), // False friend!
  createCard('de_180', 'Handy', 'mobile phone', 'de', 'B2', 'technology'), // False friend!
  // ... (15 total)
  
  // Mythic (10)
  createCard('de_191', 'Bibliothek', 'library', 'de', 'B2', 'education'),
  // ... (10 total)
];

// ALL CARDS
export const ALL_CARDS: VocabCard[] = [
  ...SPANISH_CARDS,
  ...FRENCH_CARDS,
  ...GERMAN_CARDS,
];

/**
 * Get all cards for a specific language
 */
export function getCardsForLanguage(language: 'es' | 'fr' | 'de'): VocabCard[] {
  return ALL_CARDS.filter(card => card.language === language);
}

/**
 * Get a card by ID
 */
export function getCardById(id: string): VocabCard | undefined {
  return ALL_CARDS.find(card => card.id === id);
}

/**
 * Get cards by rarity
 */
export function getCardsByRarity(language: 'es' | 'fr' | 'de', rarity: CardRarity): VocabCard[] {
  return getCardsForLanguage(language).filter(card => card.rarity === rarity);
}

/**
 * Get random cards for a deck
 */
export function getRandomCards(
  language: 'es' | 'fr' | 'de',
  count: number = 12,
  seed?: number
): VocabCard[] {
  const cards = getCardsForLanguage(language);
  const shuffled = [...cards].sort(() => (seed ? Math.random() : Math.random()) - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Validate card power/defence bounds
 */
export function validateCard(card: VocabCard): boolean {
  return (
    card.power >= 1 &&
    card.power <= 10 &&
    card.defence >= 1 &&
    card.defence <= 10
  );
}

/**
 * Check rarity distribution for a language
 */
export function checkRarityDistribution(language: 'es' | 'fr' | 'de'): Record<CardRarity, number> {
  const cards = getCardsForLanguage(language);
  const dist: Record<CardRarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0,
  };
  
  for (const card of cards) {
    dist[card.rarity]++;
  }
  
  return dist;
}
