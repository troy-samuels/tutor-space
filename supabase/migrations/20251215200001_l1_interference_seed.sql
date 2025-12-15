-- L1 Interference Patterns Seed Data
-- Migration: 20251215200001_l1_interference_seed.sql
--
-- Seeds common L1→L2 interference patterns for major language pairs
-- Based on linguistic research and common learner errors

-- =============================================================================
-- JAPANESE → ENGLISH
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
-- Article omission (most common)
('ja', 'en', 'article_omission', 'Missing Articles',
 'Japanese has no articles, so speakers often omit "a", "an", "the"',
 ARRAY['the', 'a', 'an'],
 '[{"wrong": "I go to store", "correct": "I go to the store"}, {"wrong": "She is teacher", "correct": "She is a teacher"}, {"wrong": "I saw movie yesterday", "correct": "I saw a movie yesterday"}]',
 'English requires articles before nouns. Use "the" for specific items and "a/an" for general ones.',
 1, 'hard'),

-- Preposition confusion
('ja', 'en', 'preposition_confusion', 'Preposition Errors',
 'Japanese uses different particle system, causing preposition confusion',
 ARRAY['in', 'on', 'at', 'to', 'for'],
 '[{"wrong": "I arrived to the station", "correct": "I arrived at the station"}, {"wrong": "I went in Japan", "correct": "I went to Japan"}]',
 'English prepositions follow different patterns than Japanese particles. "At" is used for specific locations.',
 2, 'medium'),

-- Subject omission
('ja', 'en', 'subject_omission', 'Missing Subject',
 'Japanese allows subject omission, but English requires explicit subjects',
 ARRAY['I', 'you', 'he', 'she', 'it', 'we', 'they'],
 '[{"wrong": "Is raining", "correct": "It is raining"}, {"wrong": "Went to school", "correct": "I went to school"}]',
 'English sentences require a subject. Use "it" for weather and time expressions.',
 3, 'medium'),

-- Plural marking
('ja', 'en', 'plural_marking', 'Missing Plurals',
 'Japanese nouns do not change for plural, so speakers forget -s/-es',
 ARRAY['s', 'es', 'many', 'few', 'several'],
 '[{"wrong": "I have three book", "correct": "I have three books"}, {"wrong": "Many student came", "correct": "Many students came"}]',
 'English nouns need -s or -es when plural. Always add plural markers after numbers.',
 4, 'easy'),

-- R/L confusion
('ja', 'en', 'r_l_confusion', 'R/L Sound Confusion',
 'Japanese has one liquid consonant, making R and L difficult to distinguish',
 ARRAY['r', 'l'],
 '[{"wrong": "I like lice (rice)", "correct": "I like rice"}, {"wrong": "right/light confusion", "correct": "context-dependent"}]',
 'R and L are different sounds in English. Practice minimal pairs like "right/light" and "read/lead".',
 5, 'hard'),

-- Word order in questions
('ja', 'en', 'question_word_order', 'Question Word Order',
 'Japanese questions keep statement word order; English inverts subject and auxiliary',
 ARRAY['do', 'does', 'did', 'is', 'are', 'was', 'were'],
 '[{"wrong": "You like coffee?", "correct": "Do you like coffee?"}, {"wrong": "She is coming?", "correct": "Is she coming?"}]',
 'English questions require auxiliary verbs and subject-verb inversion.',
 6, 'medium')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- =============================================================================
-- CHINESE (MANDARIN) → ENGLISH
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
('zh', 'en', 'article_omission', 'Missing Articles',
 'Chinese has no articles, causing systematic omission',
 ARRAY['the', 'a', 'an'],
 '[{"wrong": "I bought book", "correct": "I bought a book"}, {"wrong": "Sun is bright", "correct": "The sun is bright"}]',
 'English requires articles. Use "a/an" for countable singular nouns and "the" for specific references.',
 1, 'hard'),

('zh', 'en', 'tense_marking', 'Missing Tense Markers',
 'Chinese verbs do not conjugate for tense, leading to unmarked verbs',
 ARRAY['ed', 'was', 'were', 'will', 'have', 'has'],
 '[{"wrong": "Yesterday I go to school", "correct": "Yesterday I went to school"}, {"wrong": "She already finish", "correct": "She has already finished"}]',
 'English verbs must be conjugated to show time. Past actions need -ed or irregular past forms.',
 2, 'medium'),

('zh', 'en', 'plural_marking', 'Missing Plural Markers',
 'Chinese nouns do not change for number',
 ARRAY['s', 'es'],
 '[{"wrong": "Two apple", "correct": "Two apples"}, {"wrong": "The child are playing", "correct": "The children are playing"}]',
 'English countable nouns need plural markers. Some have irregular plurals (child → children).',
 3, 'easy'),

('zh', 'en', 'copula_omission', 'Missing "Be" Verb',
 'Chinese does not require copula in some constructions',
 ARRAY['is', 'am', 'are', 'was', 'were', 'be'],
 '[{"wrong": "She very happy", "correct": "She is very happy"}, {"wrong": "I teacher", "correct": "I am a teacher"}]',
 'English requires "be" verbs to link subjects with adjectives or nouns.',
 4, 'medium'),

('zh', 'en', 'th_sound', 'TH Sound Difficulty',
 'Chinese has no "th" sounds, often substituted with s/z or d/t',
 ARRAY['th', 'the', 'this', 'that', 'think', 'thank'],
 '[{"wrong": "I sink so (think)", "correct": "I think so"}, {"wrong": "de book (the)", "correct": "the book"}]',
 'The "th" sound is made by placing tongue between teeth. Practice with "the", "think", "that".',
 5, 'hard')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- =============================================================================
-- SPANISH → ENGLISH
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
('es', 'en', 'adjective_order', 'Adjective Position',
 'Spanish places adjectives after nouns; English places them before',
 ARRAY[],
 '[{"wrong": "The house white", "correct": "The white house"}, {"wrong": "A car red", "correct": "A red car"}]',
 'In English, adjectives come before nouns: "the white house" not "the house white".',
 1, 'easy'),

('es', 'en', 'false_friends', 'False Cognates',
 'Spanish-English false friends cause vocabulary confusion',
 ARRAY['actually', 'sensible', 'embarrassed', 'library'],
 '[{"wrong": "Actually I am here (currently)", "correct": "Currently I am here"}, {"wrong": "I am embarrassed (pregnant)", "correct": "I am pregnant"}]',
 'Be careful with similar-looking words. "Actually" means "in fact", not "currently".',
 2, 'medium'),

('es', 'en', 'subject_pronoun_redundancy', 'Redundant Subject Pronouns',
 'Spanish often omits subject pronouns; when learning English, speakers may overcorrect',
 ARRAY['I', 'you', 'he', 'she', 'we', 'they'],
 '[{"wrong": "Is raining", "correct": "It is raining"}]',
 'English always requires an explicit subject, including "it" for weather.',
 3, 'easy'),

('es', 'en', 'b_v_confusion', 'B/V Sound Confusion',
 'Spanish B and V are pronounced the same, causing spelling errors',
 ARRAY['b', 'v'],
 '[{"wrong": "I was bery tired", "correct": "I was very tired"}, {"wrong": "I have a bat (vat)", "correct": "context-dependent"}]',
 'In English, B is a stop sound (lips together) and V is a fricative (teeth on lip).',
 4, 'medium'),

('es', 'en', 'present_perfect_misuse', 'Present Perfect Usage',
 'Spanish and English use present perfect differently with time expressions',
 ARRAY['have', 'has', 'yet', 'already', 'just'],
 '[{"wrong": "I have seen him yesterday", "correct": "I saw him yesterday"}, {"wrong": "I did not eat yet", "correct": "I have not eaten yet"}]',
 'In English, use simple past (not present perfect) with specific past times like "yesterday".',
 5, 'medium'),

('es', 'en', 'double_negative', 'Double Negative',
 'Spanish uses double negatives; English typically does not',
 ARRAY['not', 'no', 'never', 'nothing', 'nobody'],
 '[{"wrong": "I do not want nothing", "correct": "I do not want anything"}, {"wrong": "I never see nobody", "correct": "I never see anybody"}]',
 'Standard English uses only one negative. "Not...anything" instead of "not...nothing".',
 6, 'medium')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- =============================================================================
-- KOREAN → ENGLISH
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
('ko', 'en', 'article_omission', 'Missing Articles',
 'Korean has no articles',
 ARRAY['the', 'a', 'an'],
 '[{"wrong": "I want to buy car", "correct": "I want to buy a car"}]',
 'English requires articles before singular countable nouns.',
 1, 'hard'),

('ko', 'en', 'word_order_sov', 'SOV Word Order Transfer',
 'Korean is SOV; English is SVO',
 ARRAY[],
 '[{"wrong": "I yesterday movie watched", "correct": "I watched a movie yesterday"}]',
 'English follows Subject-Verb-Object order. Verbs come before objects.',
 2, 'medium'),

('ko', 'en', 'relative_clause_order', 'Relative Clause Position',
 'Korean relative clauses precede nouns; English ones follow',
 ARRAY['who', 'which', 'that'],
 '[{"wrong": "The yesterday I bought book", "correct": "The book that I bought yesterday"}]',
 'English relative clauses come after the noun they modify.',
 3, 'medium'),

('ko', 'en', 'f_p_confusion', 'F/P Sound Confusion',
 'Korean has no F sound',
 ARRAY['f', 'p'],
 '[{"wrong": "I have a pen (fan)", "correct": "I have a fan"}, {"wrong": "copee (coffee)", "correct": "coffee"}]',
 'F is made by placing upper teeth on lower lip and blowing air.',
 4, 'medium')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- =============================================================================
-- GERMAN → ENGLISH
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
('de', 'en', 'word_order_v2', 'V2 Word Order Transfer',
 'German places verb in second position; English word order differs',
 ARRAY[],
 '[{"wrong": "Yesterday went I to school", "correct": "Yesterday I went to school"}]',
 'English keeps SVO order even when sentence starts with time expression.',
 1, 'medium'),

('de', 'en', 'false_friends', 'German-English False Friends',
 'False cognates between German and English',
 ARRAY['become', 'gift', 'chef', 'kind'],
 '[{"wrong": "I become a book (get)", "correct": "I get a book"}, {"wrong": "The chef cooked (boss)", "correct": "The boss managed"}]',
 '"Become" means "to start to be", not "bekommen" (to receive).',
 2, 'medium'),

('de', 'en', 'w_v_confusion', 'W/V Sound Confusion',
 'German W is pronounced like English V',
 ARRAY['w', 'v'],
 '[{"wrong": "I vant vater (want water)", "correct": "I want water"}]',
 'English W is made by rounding lips. V uses teeth on lip.',
 3, 'easy'),

('de', 'en', 'present_for_future', 'Present Tense for Future',
 'German often uses present tense for future; English prefers will/going to',
 ARRAY['will', 'going to'],
 '[{"wrong": "Tomorrow I go to Berlin", "correct": "Tomorrow I will go to Berlin"}]',
 'English typically uses "will" or "going to" for future actions.',
 4, 'easy')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- =============================================================================
-- FRENCH → ENGLISH
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
('fr', 'en', 'adjective_order', 'Adjective Position',
 'French adjectives typically follow nouns; English ones precede',
 ARRAY[],
 '[{"wrong": "A dress beautiful", "correct": "A beautiful dress"}]',
 'In English, most adjectives come before the noun.',
 1, 'easy'),

('fr', 'en', 'false_friends', 'French-English False Friends',
 'Common false cognates',
 ARRAY['actually', 'sensible', 'attend', 'demand'],
 '[{"wrong": "I attend my friend (wait for)", "correct": "I wait for my friend"}, {"wrong": "I demand information (ask)", "correct": "I ask for information"}]',
 '"Attend" means "to be present at", not "attendre" (to wait).',
 2, 'medium'),

('fr', 'en', 'h_aspiration', 'H Sound Omission',
 'French H is silent; English H is aspirated',
 ARRAY['h'],
 '[{"wrong": "I am appy (happy)", "correct": "I am happy"}, {"wrong": "e has (he has)", "correct": "he has"}]',
 'English H is pronounced with a puff of air. Practice: "house", "happy", "help".',
 3, 'medium'),

('fr', 'en', 'continuous_overuse', 'Present Continuous Overuse',
 'French uses simple present where English uses continuous',
 ARRAY['ing', 'am', 'is', 'are'],
 '[{"wrong": "I am living in Paris since 2020", "correct": "I have lived in Paris since 2020"}]',
 'Use present perfect (have lived), not continuous, for situations continuing from past to present.',
 4, 'medium')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- =============================================================================
-- PORTUGUESE → ENGLISH
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
('pt', 'en', 'adjective_order', 'Adjective Position',
 'Portuguese adjectives often follow nouns',
 ARRAY[],
 '[{"wrong": "The car blue", "correct": "The blue car"}]',
 'English adjectives come before nouns: "blue car" not "car blue".',
 1, 'easy'),

('pt', 'en', 'false_friends', 'Portuguese-English False Friends',
 'Common false cognates between Portuguese and English',
 ARRAY['actually', 'pretend', 'push', 'fabric'],
 '[{"wrong": "I pretend to study (intend)", "correct": "I intend to study"}, {"wrong": "He pushed the door (pulled)", "correct": "He pulled the door"}]',
 '"Pretend" means "to act as if", not "pretender" (to intend).',
 2, 'medium'),

('pt', 'en', 'preposition_confusion', 'Preposition Errors',
 'Portuguese preposition system differs from English',
 ARRAY['in', 'on', 'at', 'to', 'for'],
 '[{"wrong": "I live in this street", "correct": "I live on this street"}, {"wrong": "I arrived to home", "correct": "I arrived home"}]',
 'English uses "on" for streets, "at" for addresses, "in" for cities/countries.',
 3, 'medium'),

('pt', 'en', 'th_sound', 'TH Sound Difficulty',
 'Portuguese has no "th" sounds',
 ARRAY['th'],
 '[{"wrong": "I tink (think)", "correct": "I think"}, {"wrong": "de book (the)", "correct": "the book"}]',
 'Place your tongue between your teeth for "th" sounds.',
 4, 'hard')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- =============================================================================
-- ARABIC → ENGLISH
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
('ar', 'en', 'article_system', 'Article System Differences',
 'Arabic uses different article rules (al-)',
 ARRAY['the', 'a', 'an'],
 '[{"wrong": "The life is good", "correct": "Life is good"}, {"wrong": "I like the football", "correct": "I like football"}]',
 'English does not use "the" with abstract nouns or general concepts.',
 1, 'medium'),

('ar', 'en', 'copula_issues', 'Missing "Be" Verb',
 'Arabic does not use copula in present tense',
 ARRAY['is', 'am', 'are'],
 '[{"wrong": "He tall", "correct": "He is tall"}, {"wrong": "The book on table", "correct": "The book is on the table"}]',
 'English requires "be" verbs in the present tense.',
 2, 'medium'),

('ar', 'en', 'p_b_confusion', 'P/B Sound Confusion',
 'Arabic has no P sound',
 ARRAY['p', 'b'],
 '[{"wrong": "I like bizza (pizza)", "correct": "I like pizza"}]',
 'P is an unvoiced sound (no vibration). B is voiced. Practice "pit/bit" pairs.',
 3, 'medium'),

('ar', 'en', 'pronoun_resumption', 'Resumptive Pronouns',
 'Arabic uses resumptive pronouns in relative clauses',
 ARRAY['who', 'which', 'that'],
 '[{"wrong": "The man who I saw him", "correct": "The man who I saw"}]',
 'English relative clauses do not repeat the object pronoun.',
 4, 'medium')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- =============================================================================
-- RUSSIAN → ENGLISH
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
('ru', 'en', 'article_omission', 'Missing Articles',
 'Russian has no articles',
 ARRAY['the', 'a', 'an'],
 '[{"wrong": "I saw cat", "correct": "I saw a cat"}, {"wrong": "Cat is on table", "correct": "The cat is on the table"}]',
 'English requires articles before most singular countable nouns.',
 1, 'hard'),

('ru', 'en', 'copula_omission', 'Missing "Be" Verb',
 'Russian omits copula in present tense',
 ARRAY['is', 'am', 'are'],
 '[{"wrong": "She doctor", "correct": "She is a doctor"}, {"wrong": "This good", "correct": "This is good"}]',
 'English requires "be" verbs to connect subjects with descriptions.',
 2, 'medium'),

('ru', 'en', 'th_sound', 'TH Sound Difficulty',
 'Russian has no "th" sound',
 ARRAY['th'],
 '[{"wrong": "I sink (think)", "correct": "I think"}, {"wrong": "ze book (the)", "correct": "the book"}]',
 'The "th" sound requires placing your tongue between your teeth.',
 3, 'hard'),

('ru', 'en', 'aspect_confusion', 'Aspect Usage',
 'Russian aspect system differs from English tense system',
 ARRAY['have', 'has', 'been', 'ing'],
 '[{"wrong": "I read this book" (completed action)', "correct": "I have read this book"}]',
 'English uses perfect tenses for completed actions with present relevance.',
 4, 'hard')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- =============================================================================
-- ITALIAN → ENGLISH
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
('it', 'en', 'adjective_order', 'Adjective Position',
 'Italian adjectives often follow nouns',
 ARRAY[],
 '[{"wrong": "A house big", "correct": "A big house"}]',
 'English adjectives precede nouns in most cases.',
 1, 'easy'),

('it', 'en', 'present_perfect_usage', 'Present Perfect vs Simple Past',
 'Italian uses present perfect differently',
 ARRAY['have', 'has', 'did'],
 '[{"wrong": "I have seen him yesterday", "correct": "I saw him yesterday"}]',
 'Use simple past, not present perfect, with specific past time expressions.',
 2, 'medium'),

('it', 'en', 'h_aspiration', 'H Sound',
 'Italian H is silent',
 ARRAY['h'],
 '[{"wrong": "I am appy (happy)", "correct": "I am happy"}]',
 'Pronounce H with a puff of air at the start of words.',
 3, 'easy'),

('it', 'en', 'double_consonants', 'Double Consonant Pronunciation',
 'Italian has meaningful double consonants; English does not',
 ARRAY[],
 '[{"wrong": "Prolonged consonant sounds in English words", "correct": "Normal single consonant sounds"}]',
 'English double letters are not pronounced longer. "Dinner" = one N sound.',
 4, 'easy')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- =============================================================================
-- HINDI → ENGLISH
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
('hi', 'en', 'article_usage', 'Article Confusion',
 'Hindi has no definite article, uses different system',
 ARRAY['the', 'a', 'an'],
 '[{"wrong": "I am going to office", "correct": "I am going to the office"}]',
 'English requires articles in many contexts where Hindi does not.',
 1, 'medium'),

('hi', 'en', 'progressive_overuse', 'Progressive Tense Overuse',
 'Hindi progressive is used more broadly',
 ARRAY['ing'],
 '[{"wrong": "I am knowing the answer", "correct": "I know the answer"}, {"wrong": "She is liking pizza", "correct": "She likes pizza"}]',
 'Stative verbs (know, like, want) do not use progressive form in English.',
 2, 'medium'),

('hi', 'en', 'word_order', 'SOV to SVO',
 'Hindi is SOV; English is SVO',
 ARRAY[],
 '[{"wrong": "I apple eat", "correct": "I eat an apple"}]',
 'English follows Subject-Verb-Object order.',
 3, 'medium'),

('hi', 'en', 'w_v_confusion', 'W/V Sound Confusion',
 'Hindi W and V are similar',
 ARRAY['w', 'v'],
 '[{"wrong": "I vant vater (want water)", "correct": "I want water"}]',
 'W is made with rounded lips. V uses teeth on lower lip.',
 4, 'easy')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- =============================================================================
-- SPANISH → FRENCH (example of non-English target)
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
('es', 'fr', 'false_friends', 'Spanish-French False Friends',
 'False cognates between Spanish and French',
 ARRAY[],
 '[{"wrong": "embarazada = embarrassed", "correct": "enceinte = pregnant"}]',
 'Though Spanish and French share Latin roots, many words have shifted meanings.',
 1, 'medium'),

('es', 'fr', 'gender_transfer', 'Grammatical Gender Transfer',
 'Some nouns have different genders in Spanish and French',
 ARRAY['le', 'la'],
 '[{"wrong": "la mer (Spanish: el mar)", "correct": "la mer is correct in French"}]',
 'Memorize French genders separately; they often differ from Spanish.',
 2, 'medium')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- =============================================================================
-- ENGLISH → SPANISH (for English speakers learning Spanish)
-- =============================================================================
INSERT INTO l1_interference_patterns (native_language, target_language, pattern_type, pattern_name, description, detection_keywords, example_errors, explanation_template, frequency_rank, difficulty_to_correct)
VALUES
('en', 'es', 'ser_estar_confusion', 'Ser vs Estar',
 'English uses one "be" verb; Spanish has two',
 ARRAY['ser', 'estar', 'soy', 'estoy', 'es', 'está'],
 '[{"wrong": "Soy cansado", "correct": "Estoy cansado"}, {"wrong": "Estoy doctor", "correct": "Soy doctor"}]',
 'Use "ser" for permanent characteristics and "estar" for temporary states and locations.',
 1, 'hard'),

('en', 'es', 'gender_agreement', 'Noun-Adjective Gender Agreement',
 'English has no grammatical gender',
 ARRAY['o', 'a', 'os', 'as'],
 '[{"wrong": "La casa blanco", "correct": "La casa blanca"}, {"wrong": "El problema nuevo", "correct": "El problema nuevo (correct - irregular)"}]',
 'Adjectives must agree in gender and number with the noun they modify.',
 2, 'medium'),

('en', 'es', 'subject_pronoun_overuse', 'Unnecessary Subject Pronouns',
 'English requires subject pronouns; Spanish often omits them',
 ARRAY['yo', 'tú', 'él', 'ella', 'nosotros'],
 '[{"wrong": "Yo tengo yo hambre", "correct": "Tengo hambre"}]',
 'Spanish verb conjugations show the subject, so pronouns are often unnecessary.',
 3, 'easy'),

('en', 'es', 'false_friends', 'English-Spanish False Friends',
 'Words that look similar but have different meanings',
 ARRAY['actual', 'embarazada', 'sensible'],
 '[{"wrong": "actualmente = actually", "correct": "actualmente = currently"}, {"wrong": "sensible = sensible", "correct": "sensible = sensitive"}]',
 '"Actualmente" means "currently", not "actually". "Sensible" means "sensitive".',
 4, 'medium')
ON CONFLICT (native_language, target_language, pattern_type) DO NOTHING;

-- Add more language pairs as needed...
