// Generate Arabic exercises - 100 unique exercises
const fs = require('fs');

const header = `import { CatalogueExercise } from '../types';

export const EXERCISES: CatalogueExercise[] = [`;

const footer = `];
`;

const exercises = [];
let id = 0;

// Helper to add exercise
function add(level, type, topic, grammar, data, xp) {
  id++;
  const typeMap = {
    'mc': 'multiple-choice',
    'fb': 'fill-blank',
    'wo': 'word-order',
    'tr': 'translate',
    'li': 'listening',
    'cv': 'conversation'
  };
  
  const levelMap = {
    'beginner': 'beg',
    'elementary': 'elem',
    'intermediate': 'int',
    'upper-intermediate': 'uint',
    'advanced': 'adv'
  };
  
  const ex = {
    id: `ar-${levelMap[level]}-${type}-${String(id).padStart(3, '0')}`,
    type: typeMap[type],
    language: 'ar',
    level,
    topic,
    grammar,
    ...data,
    xp
  };
  
  exercises.push(ex);
}

// BEGINNER - 20 exercises (mc:4, fb:4, wo:4, tr:4, li:2, cv:2)

// MC
add('beginner', 'mc', 'greetings', 'basic vocabulary', {
  prompt: 'How do you say "Hello" in Arabic?',
  options: ['مرحبا', 'شكرا', 'مع السلامة', 'صباح الخير'],
  correctIndex: 0,
  explanation: '"مرحبا" (marhaban) is the most common informal greeting in Modern Standard Arabic.'
}, 10);

add('beginner', 'mc', 'greetings', 'numbers', {
  prompt: 'What number is "ثلاثة"?',
  options: ['3', '2', '4', '5'],
  correctIndex: 0,
  explanation: '"ثلاثة" (thalātha) means three in Arabic. Numbers: واحد (1), اثنان (2), ثلاثة (3).'
}, 10);

add('beginner', 'mc', 'family', 'basic vocabulary', {
  prompt: 'What does "أب" mean?',
  options: ['Father', 'Mother', 'Brother', 'Sister'],
  correctIndex: 0,
  explanation: '"أب" (ab) means father. "أم" (umm) means mother.'
}, 10);

add('beginner', 'mc', 'food-drink', 'basic vocabulary', {
  prompt: 'What does "ماء" mean?',
  options: ['Water', 'Tea', 'Coffee', 'Juice'],
  correctIndex: 0,
  explanation: '"ماء" (mā\') means water. From root م-و-ء.'
}, 10);

// FB
add('beginner', 'fb', 'greetings', 'pronouns', {
  prompt: 'Complete: "___ طالب" (I am a student)',
  sentence: '___ طالب',
  blankOptions: ['أنا', 'أنت', 'هو', 'هي'],
  blankCorrectIndex: 0,
  correctAnswer: 'أنا',
  explanation: '"أنا" (anā) = I. The verb "to be" is omitted in present tense nominal sentences.'
}, 10);

add('beginner', 'fb', 'greetings', 'pronouns', {
  prompt: 'Complete: "___ معلم" (You are a teacher)',
  sentence: '___ معلم',
  blankOptions: ['أنت', 'أنا', 'هو', 'نحن'],
  blankCorrectIndex: 0,
  correctAnswer: 'أنت',
  explanation: '"أنت" (anta) = you (masculine singular).'
}, 10);

add('beginner', 'fb', 'food-drink', 'basic vocabulary', {
  prompt: 'Complete: "أريد ___" (I want water)',
  sentence: 'أريد ___',
  blankOptions: ['ماء', 'خبز', 'كتاب', 'قلم'],
  blankCorrectIndex: 0,
  correctAnswer: 'ماء',
  explanation: '"أريد ماء" (urīdu mā\') = I want water.'
}, 10);

add('beginner', 'fb', 'greetings', 'basic phrases', {
  prompt: 'Complete: "___ جزيلا" (Thank you very much)',
  sentence: '___ جزيلا',
  blankOptions: ['شكرا', 'مرحبا', 'أهلا', 'نعم'],
  blankCorrectIndex: 0,
  correctAnswer: 'شكرا',
  explanation: '"شكرا جزيلا" (shukran jazīlan) = thank you very much.'
}, 10);

// WO
add('beginner', 'wo', 'greetings', 'basic sentence structure', {
  prompt: 'Arrange: "My name is Ahmed"',
  words: ['اسمي', 'أحمد'],
  correctOrder: ['اسمي', 'أحمد'],
  explanation: '"اسمي أحمد" = My name is Ahmed. Possessive + name.'
}, 10);

add('beginner', 'wo', 'family', 'basic sentence structure', {
  prompt: 'Arrange: "This is my father"',
  words: ['هذا', 'أبي'],
  correctOrder: ['هذا', 'أبي'],
  explanation: '"هذا أبي" = This is my father. Demonstrative + noun.'
}, 10);

add('beginner', 'wo', 'daily-routine', 'basic sentence structure', {
  prompt: 'Arrange: "The house is big"',
  words: ['البيت', 'كبير'],
  correctOrder: ['البيت', 'كبير'],
  explanation: 'Nominal sentence: noun + adjective. "البيت كبير" = The house is big.'
}, 10);

add('beginner', 'wo', 'food-drink', 'basic sentence structure', {
  prompt: 'Arrange: "I eat bread"',
  words: ['آكل', 'خبزا'],
  correctOrder: ['آكل', 'خبزا'],
  explanation: '"آكل خبزا" = I eat bread. Verb + object (accusative).'
}, 10);

// TR
add('beginner', 'tr', 'greetings', 'basic phrases', {
  prompt: 'Translate to Arabic: "Good morning"',
  sourceText: 'Good morning',
  targetText: 'صباح الخير',
  acceptedAnswers: ['صباح الخير'],
  explanation: '"صباح الخير" (ṣabāḥ al-khayr) = morning of goodness. Response: "صباح النور".'
}, 10);

add('beginner', 'tr', 'greetings', 'basic phrases', {
  prompt: 'Translate to Arabic: "Yes"',
  sourceText: 'Yes',
  targetText: 'نعم',
  acceptedAnswers: ['نعم'],
  explanation: '"نعم" (na\'am) is the formal yes. Informal: "أيوه" (aywah).'
}, 10);

add('beginner', 'tr', 'greetings', 'basic phrases', {
  prompt: 'Translate to Arabic: "No"',
  sourceText: 'No',
  targetText: 'لا',
  acceptedAnswers: ['لا'],
  explanation: '"لا" (lā) = no. Also used for present tense negation.'
}, 10);

add('beginner', 'tr', 'greetings', 'basic phrases', {
  prompt: 'Translate to Arabic: "Goodbye"',
  sourceText: 'Goodbye',
  targetText: 'مع السلامة',
  acceptedAnswers: ['مع السلامة', 'وداعا'],
  explanation: '"مع السلامة" (ma\'a as-salāma) = with safety/peace.'
}, 10);

// LI
add('beginner', 'li', 'greetings', 'basic vocabulary', {
  prompt: 'Listen and select: "أهلا وسهلا"',
  options: ['أهلا وسهلا', 'مرحبا', 'شكرا', 'نعم'],
  correctIndex: 0,
  explanation: '"أهلا وسهلا" (ahlan wa sahlan) = welcome. Warm Arab greeting.'
}, 10);

add('beginner', 'li', 'food-drink', 'basic vocabulary', {
  prompt: 'Listen and identify: "قهوة"',
  options: ['قهوة', 'شاي', 'ماء', 'حليب'],
  correctIndex: 0,
  explanation: '"قهوة" (qahwa) = coffee. The word "coffee" comes from Arabic!'
}, 10);

// CV
add('beginner', 'cv', 'greetings', 'basic conversation', {
  prompt: 'Respond to: "كيف حالك؟"',
  aiMessage: 'كيف حالك؟',
  suggestedResponse: 'أنا بخير، شكرا',
  explanation: '"كيف حالك؟" = How are you? Reply: "أنا بخير، شكرا" = I\'m fine, thank you.'
}, 10);

add('beginner', 'cv', 'greetings', 'basic conversation', {
  prompt: 'Introduce yourself',
  aiMessage: 'ما اسمك؟',
  suggestedResponse: 'اسمي...',
  explanation: '"ما اسمك؟" = What is your name? Reply: "اسمي + [name]".'
}, 10);

// ELEMENTARY - 20 exercises

// MC
add('elementary', 'mc', 'travel', 'past tense', {
  prompt: 'Past tense "he wrote":',
  options: ['كتب', 'يكتب', 'اكتب', 'كاتب'],
  correctIndex: 0,
  explanation: '"كتب" (kataba) = he wrote. Root: ك-ت-ب.'
}, 15);

add('elementary', 'mc', 'work', 'gender markers', {
  prompt: 'Feminine "teacher":',
  options: ['معلمة', 'معلم', 'طالب', 'كاتب'],
  correctIndex: 0,
  explanation: '"معلمة" has ة (tā\' marbūṭa) feminine marker.'
}, 15);

add('elementary', 'mc', 'daily-routine', 'past tense', {
  prompt: '"She studied":',
  options: ['درست', 'يدرس', 'ادرس', 'دارس'],
  correctIndex: 0,
  explanation: '"درست" (darasat) = she studied. ت ending for feminine 3rd person.'
}, 15);

add('elementary', 'mc', 'family', 'noun-adjective agreement', {
  prompt: 'Adjective for "الطالبة" (female student):',
  options: ['ذكية', 'ذكي', 'ذكيون', 'ذكيات'],
  correctIndex: 0,
  explanation: '"ذكية" (dhakiyya) is feminine singular, matching "الطالبة".'
}, 15);

// FB
add('elementary', 'fb', 'travel', 'past tense', {
  prompt: 'Complete: "أنا ___ إلى المدرسة" (I went)',
  sentence: 'أنا ___ إلى المدرسة',
  blankOptions: ['ذهبت', 'ذهب', 'يذهب', 'اذهب'],
  blankCorrectIndex: 0,
  correctAnswer: 'ذهبت',
  explanation: '"ذهبت" (dhahabtu) = I went. 1st person past has ت.'
}, 15);

add('elementary', 'fb', 'food-drink', 'past tense', {
  prompt: 'Complete: "نحن ___ الطعام" (We ate)',
  sentence: 'نحن ___ الطعام',
  blankOptions: ['أكلنا', 'أكل', 'آكل', 'أكلت'],
  blankCorrectIndex: 0,
  correctAnswer: 'أكلنا',
  explanation: '"أكلنا" (akalnā) = we ate. نا ending for 1st person plural.'
}, 15);

add('elementary', 'fb', 'work', 'gender agreement', {
  prompt: 'Complete: "الطالبة ___" (The female student is intelligent)',
  sentence: 'الطالبة ___',
  blankOptions: ['ذكية', 'ذكي', 'صغير', 'جميل'],
  blankCorrectIndex: 0,
  correctAnswer: 'ذكية',
  explanation: 'Feminine noun needs feminine adjective with ة.'
}, 15);

add('elementary', 'fb', 'family', 'possessive', {
  prompt: 'Complete: "هذا ___ الجديد" (This is my new book)',
  sentence: 'هذا ___ الجديد',
  blankOptions: ['كتابي', 'كتابك', 'كتابه', 'كتاب'],
  blankCorrectIndex: 0,
  correctAnswer: 'كتابي',
  explanation: '"كتابي" (kitābī) = my book. ي suffix = my.'
}, 15);

// WO
add('elementary', 'wo', 'travel', 'past tense sentence', {
  prompt: 'Arrange: "I traveled to Egypt"',
  words: ['سافرت', 'إلى', 'مصر'],
  correctOrder: ['سافرت', 'إلى', 'مصر'],
  explanation: '"سافرت إلى مصر" = I traveled to Egypt.'
}, 15);

add('elementary', 'wo', 'daily-routine', 'adjective agreement', {
  prompt: 'Arrange: "The beautiful house"',
  words: ['البيت', 'الجميل'],
  correctOrder: ['البيت', 'الجميل'],
  explanation: 'Both take "ال": "البيت الجميل" = the beautiful house.'
}, 15);

add('elementary', 'wo', 'work', 'sentence structure', {
  prompt: 'Arrange: "The teacher wrote the lesson"',
  words: ['كتب', 'المعلم', 'الدرس'],
  correctOrder: ['كتب', 'المعلم', 'الدرس'],
  explanation: 'VSO order: "كتب المعلم الدرس".'
}, 15);

add('elementary', 'wo', 'family', 'possessive construction', {
  prompt: 'Arrange: "The student\'s book"',
  words: ['كتاب', 'الطالب'],
  correctOrder: ['كتاب', 'الطالب'],
  explanation: 'Iḍāfa: "كتاب الطالب". First noun loses "ال".'
}, 15);

// TR
add('elementary', 'tr', 'travel', 'past tense', {
  prompt: 'Translate: "I visited the museum"',
  sourceText: 'I visited the museum',
  targetText: 'زرت المتحف',
  acceptedAnswers: ['زرت المتحف'],
  explanation: '"زرت المتحف" (zurtu al-matḥaf).'
}, 15);

add('elementary', 'tr', 'food-drink', 'past tense', {
  prompt: 'Translate: "We drank tea"',
  sourceText: 'We drank tea',
  targetText: 'شربنا الشاي',
  acceptedAnswers: ['شربنا الشاي', 'شربنا شاي'],
  explanation: '"شربنا الشاي" (sharibnā ash-shāy).'
}, 15);

add('elementary', 'tr', 'daily-routine', 'past tense', {
  prompt: 'Translate: "She read a book"',
  sourceText: 'She read a book',
  targetText: 'قرأت كتابا',
  acceptedAnswers: ['قرأت كتابا', 'قرأت كتاب'],
  explanation: '"قرأت كتابا" (qara\'at kitāban). Root: ق-ر-أ.'
}, 15);

add('elementary', 'tr', 'work', 'nominal sentence', {
  prompt: 'Translate: "The doctor is busy"',
  sourceText: 'The doctor is busy',
  targetText: 'الطبيب مشغول',
  acceptedAnswers: ['الطبيب مشغول'],
  explanation: 'Nominal sentence: "الطبيب مشغول" (no verb needed).'
}, 15);

// LI
add('elementary', 'li', 'travel', 'past tense', {
  prompt: 'Listen: "ذهبت إلى السوق"',
  options: ['ذهبت إلى السوق', 'ذهب إلى المدرسة', 'رجعت من البيت', 'سافرت إلى لندن'],
  correctIndex: 0,
  explanation: '"ذهبت إلى السوق" = I went to the souk/market.'
}, 15);

add('elementary', 'li', 'family', 'possessive', {
  prompt: 'Listen: "أخي الصغير"',
  options: ['أخي الصغير', 'أختي الكبيرة', 'أبي الطبيب', 'أمي المعلمة'],
  correctIndex: 0,
  explanation: '"أخي الصغير" = my younger brother. Iḍāfa + adjective.'
}, 15);

// CV
add('elementary', 'cv', 'food-drink', 'past conversation', {
  prompt: 'Respond to: "ماذا أكلت اليوم؟"',
  aiMessage: 'ماذا أكلت اليوم؟',
  suggestedResponse: 'أكلت الأرز والدجاج',
  explanation: '"What did you eat today?" Sample: rice and chicken.'
}, 15);

add('elementary', 'cv', 'travel', 'past conversation', {
  prompt: 'Respond to: "أين ذهبت أمس؟"',
  aiMessage: 'أين ذهبت أمس؟',
  suggestedResponse: 'ذهبت إلى المكتبة',
  explanation: '"Where did you go yesterday?" "أمس" = yesterday.'
}, 15);

// INTERMEDIATE - 20 exercises

// MC
add('intermediate', 'mc', 'work', 'present tense', {
  prompt: 'Present "I write":',
  options: ['أكتب', 'كتب', 'يكتب', 'تكتب'],
  correctIndex: 0,
  explanation: '"أكتب" (aktubu). "أ" prefix = 1st person.'
}, 20);

add('intermediate', 'mc', 'daily-routine', 'dual form', {
  prompt: 'Dual of "كتاب" (book):',
  options: ['كتابان', 'كتب', 'كتابين', 'كتاب'],
  correctIndex: 0,
  explanation: '"كتابان" (kitābān) = two books (nominative dual).'
}, 20);

add('intermediate', 'mc', 'education', 'broken plural', {
  prompt: 'Broken plural of "كتاب":',
  options: ['كتب', 'كتابان', 'كتابات', 'كتاب'],
  correctIndex: 0,
  explanation: '"كتب" (kutub) = books (broken plural, internal vowel change).'
}, 20);

add('intermediate', 'mc', 'work', 'particles', {
  prompt: 'Particle for emphasis:',
  options: ['إن', 'في', 'من', 'على'],
  correctIndex: 0,
  explanation: '"إن" and sisters (إن، أن، كأن، لكن، ليت، لعل) add emphasis.'
}, 20);

// FB
add('intermediate', 'fb', 'travel', 'present tense', {
  prompt: 'Complete: "هم ___ في المكتبة" (They study)',
  sentence: 'هم ___ في المكتبة',
  blankOptions: ['يدرسون', 'درسوا', 'ادرس', 'تدرس'],
  blankCorrectIndex: 0,
  correctAnswer: 'يدرسون',
  explanation: '"يدرسون" (yadrusūna) = they study. ي+root+ون.'
}, 20);

add('intermediate', 'fb', 'family', 'dual form', {
  prompt: 'Complete: "عندي ___ جديدان" (two new books)',
  sentence: 'عندي ___ جديدان',
  blankOptions: ['كتابان', 'كتاب', 'كتب', 'كتابين'],
  blankCorrectIndex: 0,
  correctAnswer: 'كتابان',
  explanation: 'Dual nominative: "كتابان جديدان".'
}, 20);

add('intermediate', 'fb', 'work', 'present tense', {
  prompt: 'Complete: "أنت ___ اللغة العربية" (You learn Arabic)',
  sentence: 'أنت ___ اللغة العربية',
  blankOptions: ['تتعلم', 'يتعلم', 'أتعلم', 'نتعلم'],
  blankCorrectIndex: 0,
  correctAnswer: 'تتعلم',
  explanation: '"تتعلم" (tata\'allamu). ت prefix = 2nd person.'
}, 20);

add('intermediate', 'fb', 'daily-routine', 'negation', {
  prompt: 'Complete: "___ أفهم السؤال" (I don\'t understand)',
  sentence: '___ أفهم السؤال',
  blankOptions: ['لا', 'لم', 'لن', 'ما'],
  blankCorrectIndex: 0,
  correctAnswer: 'لا',
  explanation: '"لا" negates present. "لم"=didn\'t, "لن"=won\'t.'
}, 20);

// WO
add('intermediate', 'wo', 'education', 'present sentence', {
  prompt: 'Arrange: "The students study every day"',
  words: ['يدرس', 'الطلاب', 'كل', 'يوم'],
  correctOrder: ['يدرس', 'الطلاب', 'كل', 'يوم'],
  explanation: 'VSO: "يدرس الطلاب كل يوم".'
}, 20);

add('intermediate', 'wo', 'work', 'dual construction', {
  prompt: 'Arrange: "Two intelligent teachers"',
  words: ['معلمان', 'ذكيان'],
  correctOrder: ['معلمان', 'ذكيان'],
  explanation: 'Both dual: "معلمان ذكيان".'
}, 20);

add('intermediate', 'wo', 'travel', 'compound sentence', {
  prompt: 'Arrange: "I went and saw the pyramids"',
  words: ['ذهبت', 'و', 'رأيت', 'الأهرامات'],
  correctOrder: ['ذهبت', 'و', 'رأيت', 'الأهرامات'],
  explanation: '"و" connects clauses: "ذهبت ورأيت الأهرامات".'
}, 20);

add('intermediate', 'wo', 'daily-routine', 'object pronoun', {
  prompt: 'Arrange: "I saw him at the market"',
  words: ['رأيته', 'في', 'السوق'],
  correctOrder: ['رأيته', 'في', 'السوق'],
  explanation: 'Pronoun attaches: "رأيته في السوق". ه=him.'
}, 20);

// TR
add('intermediate', 'tr', 'education', 'present tense', {
  prompt: 'Translate: "They are studying Arabic literature"',
  sourceText: 'They are studying Arabic literature',
  targetText: 'يدرسون الأدب العربي',
  acceptedAnswers: ['يدرسون الأدب العربي', 'هم يدرسون الأدب العربي'],
  explanation: '"يدرسون الأدب العربي". "الأدب" from root أ-د-ب.'
}, 20);

add('intermediate', 'tr', 'work', 'present tense', {
  prompt: 'Translate: "She works in a hospital"',
  sourceText: 'She works in a hospital',
  targetText: 'تعمل في مستشفى',
  acceptedAnswers: ['تعمل في مستشفى', 'هي تعمل في مستشفى'],
  explanation: '"تعمل في مستشفى". "مستشفى" from root ش-ف-ي (heal).'
}, 20);

add('intermediate', 'tr', 'family', 'dual form', {
  prompt: 'Translate: "Two new cars"',
  sourceText: 'Two new cars',
  targetText: 'سيارتان جديدتان',
  acceptedAnswers: ['سيارتان جديدتان'],
  explanation: 'Feminine dual: "سيارتان جديدتان".'
}, 20);

add('intermediate', 'tr', 'travel', 'negation', {
  prompt: 'Translate: "I don\'t know the answer"',
  sourceText: 'I don\'t know the answer',
  targetText: 'لا أعرف الجواب',
  acceptedAnswers: ['لا أعرف الجواب', 'لا أعرف الإجابة'],
  explanation: '"لا أعرف الجواب" (lā a\'rifu al-jawāb).'
}, 20);

// LI
add('intermediate', 'li', 'education', 'present tense', {
  prompt: 'Listen: "نحن ندرس اللغة العربية"',
  options: ['نحن ندرس اللغة العربية', 'هم يدرسون الأدب', 'أنا أتعلم الفرنسية', 'هي تكتب الدرس'],
  correctIndex: 0,
  explanation: '"We study the Arabic language".'
}, 20);

add('intermediate', 'li', 'work', 'verbs of motion', {
  prompt: 'Listen: "أذهب إلى العمل كل يوم"',
  options: ['أذهب إلى العمل كل يوم', 'أعمل في المستشفى', 'أدرس في الجامعة', 'أسافر إلى دبي'],
  correctIndex: 0,
  explanation: '"I go to work every day".'
}, 20);

// CV
add('intermediate', 'cv', 'travel', 'present conversation', {
  prompt: 'Respond to: "ماذا تفعل في وقت فراغك؟"',
  aiMessage: 'ماذا تفعل في وقت فراغك؟',
  suggestedResponse: 'أقرأ الكتب وأشاهد الأفلام',
  explanation: '"What do you do in your free time?" Sample: I read books and watch films.'
}, 20);

add('intermediate', 'cv', 'daily-routine', 'present conversation', {
  prompt: 'Respond to: "كيف تذهب إلى المدرسة؟"',
  aiMessage: 'كيف تذهب إلى المدرسة؟',
  suggestedResponse: 'أذهب بالحافلة',
  explanation: '"How do you go to school?" "بالحافلة" = by bus.'
}, 20);

// UPPER-INTERMEDIATE - 20 exercises

// MC
add('upper-intermediate', 'mc', 'work', 'passive voice', {
  prompt: 'Passive "was written":',
  options: ['كُتِبَ', 'كَتَبَ', 'يُكتَب', 'كاتب'],
  correctIndex: 0,
  explanation: '"كُتِبَ" (kutiba) = was written. Passive: u-i vowel pattern.'
}, 30);

add('upper-intermediate', 'mc', 'education', 'case endings', {
  prompt: 'Nominative case marker:',
  options: ['ـُ (damma)', 'ـَ (fatha)', 'ـِ (kasra)', 'ـْ (sukūn)'],
  correctIndex: 0,
  explanation: 'Nominative (المرفوع): ـُ damma. Subject/predicate marker.'
}, 30);

add('upper-intermediate', 'mc', 'daily-routine', 'verbal noun', {
  prompt: 'المصدر of كَتَبَ:',
  options: ['كِتابة', 'كاتب', 'مكتوب', 'مكتب'],
  correctIndex: 0,
  explanation: '"كِتابة" (kitāba) = writing (verbal noun/المصدر from ك-ت-ب).'
}, 30);

add('upper-intermediate', 'mc', 'work', 'conditionals', {
  prompt: 'Conditional "if":',
  options: ['إذا', 'لأن', 'لكن', 'عندما'],
  correctIndex: 0,
  explanation: '"إذا" (idhā) = if (for real conditions). "لو" for hypothetical.'
}, 30);

// FB
add('upper-intermediate', 'fb', 'education', 'passive voice', {
  prompt: 'Complete: "___ الكتاب في المكتبة" (The book was found)',
  sentence: '___ الكتاب في المكتبة',
  blankOptions: ['وُجِدَ', 'وَجَدَ', 'يَجِد', 'واجد'],
  blankCorrectIndex: 0,
  correctAnswer: 'وُجِدَ',
  explanation: '"وُجِدَ" (wujida) = was found. Passive of وَجَدَ.'
}, 30);

add('upper-intermediate', 'fb', 'work', 'genitive plural', {
  prompt: 'Complete: "رأيت مجموعة من ___" (I saw a group of students)',
  sentence: 'رأيت مجموعة من ___',
  blankOptions: ['الطلاب', 'الطالب', 'طالب', 'طلاب'],
  blankCorrectIndex: 0,
  correctAnswer: 'الطلاب',
  explanation: '"من + genitive plural": "من الطلاب".'
}, 30);

add('upper-intermediate', 'fb', 'daily-routine', 'participles', {
  prompt: 'Complete: "الرجل ___ من السفر" (The man returning from travel)',
  sentence: 'الرجل ___ من السفر',
  blankOptions: ['العائد', 'عائد', 'رجع', 'يرجع'],
  blankCorrectIndex: 0,
  correctAnswer: 'العائد',
  explanation: '"العائد" (al-\'ā\'id) = the one returning. Active participle + ال.'
}, 30);

add('upper-intermediate', 'fb', 'education', 'case ending', {
  prompt: 'Complete: "درست في ___ الكبيرة" (I studied at the big university)',
  sentence: 'درست في ___ الكبيرة',
  blankOptions: ['الجامعة', 'الجامعةُ', 'جامعة', 'جامعةٌ'],
  blankCorrectIndex: 0,
  correctAnswer: 'الجامعة',
  explanation: 'After "في" (in), noun is in genitive (though often not marked in unvoweled text).'
}, 30);

// WO
add('upper-intermediate', 'wo', 'work', 'passive sentence', {
  prompt: 'Arrange: "The letter was sent yesterday"',
  words: ['أُرسِلَت', 'الرسالة', 'أمس'],
  correctOrder: ['أُرسِلَت', 'الرسالة', 'أمس'],
  explanation: 'Passive VSO: "أُرسِلَت الرسالة أمس".'
}, 30);

add('upper-intermediate', 'wo', 'education', 'relative clause', {
  prompt: 'Arrange: "The student who studies is successful"',
  words: ['الطالب', 'الذي', 'يدرس', 'ناجح'],
  correctOrder: ['الطالب', 'الذي', 'يدرس', 'ناجح'],
  explanation: '"الطالب الذي يدرس ناجح". "الذي" = who (masculine relative pronoun).'
}, 30);

add('upper-intermediate', 'wo', 'daily-routine', 'conditional sentence', {
  prompt: 'Arrange: "If you study, you will succeed"',
  words: ['إذا', 'درست', 'ستنجح'],
  correctOrder: ['إذا', 'درست', 'ستنجح'],
  explanation: '"إذا درست ستنجح". س prefix = future marker.'
}, 30);

add('upper-intermediate', 'wo', 'work', 'complex sentence', {
  prompt: 'Arrange: "He said that the work is important"',
  words: ['قال', 'إن', 'العمل', 'مهم'],
  correctOrder: ['قال', 'إن', 'العمل', 'مهم'],
  explanation: '"قال إن العمل مهم". "إن" introduces reported statement.'
}, 30);

// TR
add('upper-intermediate', 'tr', 'education', 'passive voice', {
  prompt: 'Translate: "The lesson was explained"',
  sourceText: 'The lesson was explained',
  targetText: 'شُرِحَ الدرس',
  acceptedAnswers: ['شُرِحَ الدرس', 'تم شرح الدرس'],
  explanation: '"شُرِحَ الدرس" (shurniḥa ad-dars). Passive form.'
}, 30);

add('upper-intermediate', 'tr', 'work', 'verbal noun', {
  prompt: 'Translate: "Learning Arabic is important"',
  sourceText: 'Learning Arabic is important',
  targetText: 'تعلم العربية مهم',
  acceptedAnswers: ['تعلم العربية مهم', 'تعلم اللغة العربية مهم'],
  explanation: '"تعلم" (ta\'allum) is المصدر (verbal noun) of تعلّم.'
}, 30);

add('upper-intermediate', 'tr', 'daily-routine', 'complex sentence', {
  prompt: 'Translate: "I want to travel to Morocco next month"',
  sourceText: 'I want to travel to Morocco next month',
  targetText: 'أريد أن أسافر إلى المغرب الشهر القادم',
  acceptedAnswers: ['أريد أن أسافر إلى المغرب الشهر القادم', 'أريد السفر إلى المغرب الشهر القادم'],
  explanation: '"أريد أن أسافر..." Uses "أن + subjunctive".'
}, 30);

add('upper-intermediate', 'tr', 'education', 'genitive construction', {
  prompt: 'Translate: "The professors of the university are excellent"',
  sourceText: 'The professors of the university are excellent',
  targetText: 'أساتذة الجامعة ممتازون',
  acceptedAnswers: ['أساتذة الجامعة ممتازون'],
  explanation: '"أساتذة الجامعة" is iḍāfa. "ممتازون" plural adjective.'
}, 30);

// LI
add('upper-intermediate', 'li', 'work', 'passive voice', {
  prompt: 'Listen: "كُتِبَ التقرير بعناية"',
  options: ['كُتِبَ التقرير بعناية', 'كَتَبَ المدير التقرير', 'يكتب الموظف الرسالة', 'تمت الموافقة على المشروع'],
  correctIndex: 0,
  explanation: '"The report was written carefully." Passive construction.'
}, 30);

add('upper-intermediate', 'li', 'education', 'relative clause', {