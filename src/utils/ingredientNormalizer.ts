// Intelligent Ingredient Normalizer & Canonical Matcher for SmartBite
// Provides culinary-aware cleaning, stemming, synonym mapping, and token-safe matching.

const MEASUREMENT_UNITS = new Set([
    'cup', 'cups', 'c',
    'tbsp', 'tablespoon', 'tablespoons', 'tbs',
    'tsp', 'teaspoon', 'teaspoons',
    'oz', 'ounce', 'ounces',
    'lb', 'lbs', 'pound', 'pounds',
    'g', 'gram', 'grams',
    'kg', 'kilogram', 'kilograms',
    'ml', 'milliliter', 'milliliters',
    'l', 'liter', 'liters', 'litre', 'litres',
    'pt', 'pint', 'pints',
    'qt', 'quart', 'quarts',
    'gal', 'gallon', 'gallons',
    'pinch', 'pinches',
    'dash', 'dashes',
    'clove', 'cloves',
    'can', 'cans', 'tin', 'tins',
    'slice', 'slices',
    'piece', 'pieces', 'pcs', 'pc',
    'bunch', 'bunches',
    'stalk', 'stalks',
    'sprig', 'sprigs',
    'head', 'heads',
    'pack', 'package', 'packages', 'pkg', 'pkgs', 'packet', 'packets',
    'bottle', 'bottles',
    'jar', 'jars',
    'stick', 'sticks',
    'handful', 'handfuls',
    'drop', 'drops',
    'sheet', 'sheets'
]);

const PREP_DESCRIPTORS = new Set([
    'chopped', 'diced', 'minced', 'sliced', 'grated', 'shredded', 'crushed',
    'pureed', 'mashed', 'ground', 'powdered', 'peeled', 'trimmed', 'melted',
    'toasted', 'roasted', 'boiled', 'fried', 'baked', 'steamed', 'cooked',
    'uncooked', 'raw', 'fresh', 'dried', 'dry', 'frozen', 'canned', 'warm',
    'cold', 'hot', 'lean', 'extra', 'virgin', 'boneless', 'skinless',
    'halved', 'quartered', 'softened', 'beaten', 'whisked', 'sifted',
    'packed', 'large', 'medium', 'small', 'thick', 'thin', 'finely',
    'coarsely', 'roughly', 'organic', 'seedless', 'pitted', 'deveined',
    'ripe', 'unripe', 'sweet', 'sour', 'plain', 'salted', 'unsalted'
]);

// Canonical culinary synonym mapping (maps variations to canonical base form)
const SYNONYM_MAP: Record<string, string> = {
    // Peppers & Capsicum
    'capsicum': 'bell pepper',
    'capsicums': 'bell pepper',
    'green capsicum': 'bell pepper',
    'red capsicum': 'bell pepper',
    'yellow capsicum': 'bell pepper',
    'sweet pepper': 'bell pepper',
    'sweet peppers': 'bell pepper',
    'bell peppers': 'bell pepper',
    'peppers': 'bell pepper',
    'green pepper': 'bell pepper',
    'red pepper': 'bell pepper',

    // Herbs & Greens
    'cilantro': 'coriander',
    'fresh cilantro': 'coriander',
    'chinese parsley': 'coriander',
    'coriander leaves': 'coriander',
    'fresh coriander': 'coriander',

    // Alliums
    'scallion': 'green onion',
    'scallions': 'green onion',
    'spring onion': 'green onion',
    'spring onions': 'green onion',
    'green onions': 'green onion',
    'shallot': 'shallot',
    'shallots': 'shallot',
    'red onion': 'onion',
    'red onions': 'onion',
    'yellow onion': 'onion',
    'yellow onions': 'onion',
    'white onion': 'onion',
    'white onions': 'onion',
    'brown onion': 'onion',
    'brown onions': 'onion',
    'sweet onion': 'onion',
    'sweet onions': 'onion',

    // Nightshades
    'aubergine': 'eggplant',
    'aubergines': 'eggplant',
    'brinjal': 'eggplant',
    'eggplants': 'eggplant',

    // Squash
    'courgette': 'zucchini',
    'courgettes': 'zucchini',
    'zucchinis': 'zucchini',

    // Meat cuts
    'beef mince': 'ground beef',
    'minced beef': 'ground beef',
    'hamburger meat': 'ground beef',
    'pork mince': 'ground pork',
    'minced pork': 'ground pork',
    'chicken mince': 'ground chicken',
    'minced chicken': 'ground chicken',
    'chicken breasts': 'chicken breast',
    'chicken thighs': 'chicken thigh',

    // Chilies
    'chilli': 'chili',
    'chillies': 'chili',
    'chiles': 'chili',
    'chile': 'chili',
    'green chillies': 'green chili',
    'green chili': 'green chili',
    'red chillies': 'red chili',
    'red chili': 'red chili',

    // Legumes & Pulses
    'garbanzo': 'chickpea',
    'garbanzo bean': 'chickpea',
    'garbanzo beans': 'chickpea',
    'chickpeas': 'chickpea',
    'chana': 'chickpea',

    // Condiments & Sauces
    'soya sauce': 'soy sauce',
    'soya': 'soy sauce',

    // Snacks
    'lays': 'potato chips',
    'lays chips': 'potato chips',
    'potato chips': 'potato chips',
    'chips': 'potato chips',
    'crisps': 'potato chips',

    // Dairy
    'curd': 'yogurt',
    'yoghurt': 'yogurt',
    'greek yogurt': 'yogurt',
    'paneer': 'cottage cheese',
    'single cream': 'cream',
    'heavy cream': 'cream',
    'double cream': 'cream',
    'whipping cream': 'cream'
};

// Common word stems / irregular plurals
function stemWord(word: string): string {
    if (word.length <= 3) return word;

    // Irregular / specific plurals
    if (word.endsWith('berries')) return word.slice(0, -7) + 'berry';
    if (word.endsWith('cherries')) return word.slice(0, -8) + 'cherry';
    if (word.endsWith('tomatoes')) return 'tomato';
    if (word.endsWith('potatoes')) return 'potato';
    if (word.endsWith('leaves')) return 'leaf';
    if (word.endsWith('loaves')) return 'loaf';
    if (word.endsWith('knives')) return 'knife';
    if (word.endsWith('halves')) return 'half';
    if (word.endsWith('spices')) return 'spice';
    if (word.endsWith('cheeses')) return 'cheese';

    // Standard plurals - avoid false stripping on 'ss' (grass), 'us' (citrus)
    if (word.endsWith('ies') && word.length > 4) {
        return word.slice(0, -3) + 'y';
    }
    if (word.endsWith('es') && !word.endsWith('ses') && !word.endsWith('ches') && !word.endsWith('shes') && word.length > 4) {
        return word.slice(0, -1);
    }
    if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us') && !word.endsWith('is')) {
        return word.slice(0, -1);
    }

    return word;
}

/**
 * Normalizes an ingredient string by:
 * 1. Lowercasing & trimming
 * 2. Removing numbers, fractions (e.g. 1/2), and special punctuation
 * 3. Removing common units of measure (cup, tbsp, g, ml, etc.)
 * 4. Removing preparation descriptors (chopped, fresh, diced, boneless, etc.)
 * 5. Stemming plurals to singular forms
 * 6. Mapping culinary synonyms to a canonical base term
 */
export function normalizeIngredient(raw: string): string {
    if (!raw || typeof raw !== 'string') return '';

    let cleaned = raw
        .toLowerCase()
        // Replace fractions and numbers
        .replace(/[0-9]+\/[0-9]+/g, ' ')
        .replace(/[0-9]+(\.[0-9]+)?/g, ' ')
        // Remove parenthetical notes like (optional), (about 2 cups)
        .replace(/\([^)]*\)/g, ' ')
        // Replace punctuation with spaces
        .replace(/[,.;:!?"'’`\\/_\-~#%&*+=[\]{}|]/g, ' ')
        .trim();

    // Check direct synonym match before tokenizing
    const directSynonym = SYNONYM_MAP[cleaned];
    if (directSynonym) return directSynonym;

    // Tokenize into words
    const tokens = cleaned
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

    // Filter out measurement units and preparation descriptors
    const meaningfulTokens = tokens
        .filter(token => !MEASUREMENT_UNITS.has(token) && !PREP_DESCRIPTORS.has(token))
        .map(token => stemWord(token));

    const result = meaningfulTokens.join(' ').trim();

    // Check synonym map on filtered string
    if (SYNONYM_MAP[result]) {
        return SYNONYM_MAP[result];
    }

    // If all words were filtered out (e.g. "fresh"), fall back to the first stemmed original token
    if (!result && tokens.length > 0) {
        return stemWord(tokens[0]);
    }

    return result;
}

/**
 * Extracts a set of clean word tokens from an ingredient for semantic comparison.
 */
export function getIngredientTokens(ingredient: string): Set<string> {
    const normalized = normalizeIngredient(ingredient);
    return new Set(
        normalized
            .split(/\s+/)
            .map(t => stemWord(t))
            .filter(t => t.length >= 2)
    );
}

/**
 * Checks whether an inventory ingredient matches a recipe ingredient with high precision.
 * Prevents false positives (e.g. "ice" will NOT match "rice", "ham" will NOT match "champagne").
 * Handles synonyms (e.g. "capsicum" matches "bell pepper").
 * Handles hierarchical terms (e.g. "chicken breast" matches "chicken").
 */
export function isIngredientMatch(inventoryItem: string, recipeIngredient: string): boolean {
    if (!inventoryItem || !recipeIngredient) return false;

    const normInv = normalizeIngredient(inventoryItem);
    const normRec = normalizeIngredient(recipeIngredient);

    // 1. Exact canonical match
    if (normInv === normRec) return true;

    // 2. Direct synonym match
    const synInv = SYNONYM_MAP[normInv] || normInv;
    const synRec = SYNONYM_MAP[normRec] || normRec;
    if (synInv === synRec) return true;

    // 3. Token-set analysis (Boundary safe)
    const invTokens = getIngredientTokens(normInv);
    const recTokens = getIngredientTokens(normRec);

    if (invTokens.size === 0 || recTokens.size === 0) return false;

    // Prohibit known deceptive substring collisions
    const deceptivePairs: [string, string][] = [
        ['ice', 'rice'],
        ['pea', 'peanut'],
        ['pea', 'spearmint'],
        ['ham', 'graham'],
        ['ham', 'champagne'],
        ['corn', 'popcorn'],
        ['corn', 'cornstarch'],
        ['egg', 'eggplant'],
        ['butter', 'buttermilk'],
        ['butter', 'peanut butter'],
        ['milk', 'buttermilk'],
        ['milk', 'coconut milk'],
        ['cream', 'sour cream'],
        ['oil', 'boil']
    ];

    for (const [a, b] of deceptivePairs) {
        if ((normInv === a && normRec.includes(b)) || (normRec === a && normInv.includes(b))) {
            return false;
        }
    }

    // Check if one token set is entirely contained within the other
    // e.g. Inventory: "chicken" -> tokens {"chicken"}
    //      Recipe: "chicken breast" -> tokens {"chicken", "breast"}
    // "chicken" is contained in recipe -> MATCH!
    let allInvInRec = true;
    for (const token of invTokens) {
        if (!recTokens.has(token)) {
            // Check if any recipe token stems to or shares synonym with this token
            let hasSyn = false;
            for (const rToken of recTokens) {
                if (SYNONYM_MAP[token] === rToken || SYNONYM_MAP[rToken] === token || stemWord(token) === stemWord(rToken)) {
                    hasSyn = true;
                    break;
                }
            }
            if (!hasSyn) {
                allInvInRec = false;
                break;
            }
        }
    }
    if (allInvInRec) return true;

    // e.g. Inventory: "boneless chicken breast" -> tokens {"chicken", "breast"}
    //      Recipe: "chicken" -> tokens {"chicken"}
    // Key ingredient "chicken" is present in both -> MATCH!
    let allRecInInv = true;
    for (const token of recTokens) {
        if (!invTokens.has(token)) {
            let hasSyn = false;
            for (const iToken of invTokens) {
                if (SYNONYM_MAP[token] === iToken || SYNONYM_MAP[iToken] === token || stemWord(token) === stemWord(iToken)) {
                    hasSyn = true;
                    break;
                }
            }
            if (!hasSyn) {
                allRecInInv = false;
                break;
            }
        }
    }
    if (allRecInInv) return true;

    // Check significant primary noun match (e.g. "red onion" and "yellow onion" both have primary noun "onion")
    const commonTokens = [...invTokens].filter(t => recTokens.has(t));
    const isSingleCommonPrimary = commonTokens.length === 1 &&
        !['oil', 'powder', 'sauce', 'paste', 'water', 'salt', 'pepper', 'sugar', 'flour'].includes(commonTokens[0]);

    if (isSingleCommonPrimary && (invTokens.size <= 2 && recTokens.size <= 2)) {
        return true;
    }

    return false;
}
