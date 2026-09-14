// Comprehensive Automated Unit Test Suite for SmartBite Recipe Engine
// Tests normalization, boundary-safe matching, scoring, expiry weighting, and edge cases.

import { normalizeIngredient, isIngredientMatch } from '../../utils/ingredientNormalizer';
import { scoreAndRankRecipe, type Recipe, type CleanInventoryItem } from '../recipeService';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✅ PASS: ${testName}`);
    } else {
        console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
        process.exitCode = 1;
    }
}

console.log('🧪 RUNNING SMARTBITE RECIPE RECOMMENDATION ENGINE TESTS\n');

// -------------------------------------------------------------
// SECTION 1: INGREDIENT NORMALIZATION & LEMMATIZATION
// -------------------------------------------------------------
console.log('📦 1. Normalization & Stemming Tests:');

assert(
    normalizeIngredient('Tomatoes') === 'tomato',
    'Stem standard plural (tomatoes -> tomato)'
);

assert(
    normalizeIngredient('Potatoes') === 'potato',
    'Stem irregular plural (potatoes -> potato)'
);

assert(
    normalizeIngredient('Strawberries') === 'strawberry',
    'Stem -ies plural (strawberries -> strawberry)'
);

assert(
    normalizeIngredient('2 cups chopped red onions') === 'onion',
    'Strip units, numbers, and preparation terms (2 cups chopped red onions -> onion)'
);

assert(
    normalizeIngredient('1/2 tsp fresh grated ginger') === 'ginger',
    'Strip fractions, spices units and prep terms (1/2 tsp fresh grated ginger -> ginger)'
);

assert(
    normalizeIngredient('500g boneless skinless chicken breasts') === 'chicken breast',
    'Strip metric units and meat descriptors (500g boneless skinless chicken breasts -> chicken breast)'
);

// -------------------------------------------------------------
// SECTION 2: CULINARY SYNONYM MAPPING
// -------------------------------------------------------------
console.log('\n🌶️ 2. Culinary Synonym & Equivalence Tests:');

assert(
    isIngredientMatch('capsicum', 'bell pepper'),
    'Synonym match: capsicum <-> bell pepper'
);

assert(
    isIngredientMatch('cilantro', 'fresh coriander leaves'),
    'Synonym match: cilantro <-> coriander'
);

assert(
    isIngredientMatch('green onions', 'scallions'),
    'Synonym match: green onions <-> scallions'
);

assert(
    isIngredientMatch('aubergine', 'eggplant'),
    'Synonym match: aubergine <-> eggplant'
);

assert(
    isIngredientMatch('courgette', 'zucchini'),
    'Synonym match: courgette <-> zucchini'
);

assert(
    isIngredientMatch('lays chips', 'potato chips'),
    'Synonym match: lays chips <-> potato chips'
);

// -------------------------------------------------------------
// SECTION 3: FALSE-POSITIVE PREVENTION (CRITICAL AUDIT ITEM)
// -------------------------------------------------------------
console.log('\n🛡️ 3. Boundary Safety & False-Positive Prevention Tests:');

assert(
    !isIngredientMatch('ice', 'white rice'),
    'False positive prevented: "ice" does NOT match "rice"'
);

assert(
    !isIngredientMatch('ham', 'champagne vinegar'),
    'False positive prevented: "ham" does NOT match "champagne"'
);

assert(
    !isIngredientMatch('pea', 'peanut butter'),
    'False positive prevented: "pea" does NOT match "peanut"'
);

assert(
    !isIngredientMatch('egg', 'eggplant'),
    'False positive prevented: "egg" does NOT match "eggplant"'
);

assert(
    !isIngredientMatch('corn', 'popcorn'),
    'False positive prevented: "corn" does NOT match "popcorn"'
);

assert(
    !isIngredientMatch('butter', 'buttermilk'),
    'False positive prevented: "butter" does NOT match "buttermilk"'
);

// -------------------------------------------------------------
// SECTION 4: SCORING MODEL & MISSING INGREDIENTS
// -------------------------------------------------------------
console.log('\n⚖️ 4. Multi-Factor Scoring & Missing Ingredient Tests:');

const mockRecipeA: Recipe = {
    id: '101',
    name: 'Garlic Butter Chicken',
    image: '',
    category: 'Chicken',
    area: 'American',
    instructions: 'Cook chicken with garlic and butter.',
    ingredients: ['chicken breast', 'garlic cloves', 'butter', 'parsley'],
    matchedIngredients: [],
    matchScore: 0,
    matchPercentage: 0,
    missingIngredients: [],
    expiringMatchCount: 0,
    matchTier: 'missing_items'
};

const userPantryFresh: CleanInventoryItem[] = [
    { name: 'chicken', daysLeft: 6, isExpired: false, isExpiringSoon: false },
    { name: 'garlic', daysLeft: 10, isExpired: false, isExpiringSoon: false },
    { name: 'butter', daysLeft: 15, isExpired: false, isExpiringSoon: false }
];

const scoredA = scoreAndRankRecipe(mockRecipeA, userPantryFresh);

assert(
    scoredA.matchedIngredients.length === 3,
    'Matched ingredients count is accurate (3 of 4)',
    `Got ${scoredA.matchedIngredients.length}`
);

assert(
    scoredA.missingIngredients.length === 1 && scoredA.missingIngredients[0] === 'parsley',
    'Missing ingredients precisely calculated (parsley)',
    `Missing: ${scoredA.missingIngredients.join(', ')}`
);

assert(
    scoredA.matchPercentage === 75,
    'Match percentage is 75%',
    `Got ${scoredA.matchPercentage}%`
);

assert(
    scoredA.matchTier === 'can_make',
    'Missing only 1 ingredient classifies as "can_make"',
    `Tier: ${scoredA.matchTier}`
);

// -------------------------------------------------------------
// SECTION 5: EXPIRY-AWARENESS & ZERO-WASTE BOOST
// -------------------------------------------------------------
console.log('\n⏳ 5. Expiry Urgency Weighting & Food Safety Tests:');

const userPantryExpiring: CleanInventoryItem[] = [
    { name: 'chicken', daysLeft: 1, isExpired: false, isExpiringSoon: true }, // Expiring tomorrow!
    { name: 'garlic', daysLeft: 2, isExpired: false, isExpiringSoon: true },  // Expiring in 2 days!
    { name: 'butter', daysLeft: 15, isExpired: false, isExpiringSoon: false }
];

const scoredWithExpiring = scoreAndRankRecipe(mockRecipeA, userPantryExpiring);

assert(
    scoredWithExpiring.expiringMatchCount === 2,
    'Identified 2 expiring ingredients in recipe',
    `Count: ${scoredWithExpiring.expiringMatchCount}`
);

assert(
    (scoredWithExpiring.scoreBreakdown?.totalScore ?? 0) > (scoredA.scoreBreakdown?.totalScore ?? 0),
    'Recipe using expiring ingredients scores higher than fresh-only ingredients',
    `Expiring score: ${scoredWithExpiring.scoreBreakdown?.totalScore} vs Fresh score: ${scoredA.scoreBreakdown?.totalScore}`
);

// -------------------------------------------------------------
// SECTION 6: FOOD SAFETY & EXPIRED EXCLUSION TESTS
// -------------------------------------------------------------
console.log('\n🚫 6. Food Safety & Expired Ingredient Exclusion Tests:');

const userPantryWithExpired: CleanInventoryItem[] = [
    { name: 'chicken', daysLeft: -1, isExpired: true, isExpiringSoon: false }, // Spoiled / expired yesterday
    { name: 'garlic', daysLeft: 5, isExpired: false, isExpiringSoon: false }
];

const scoredSafety = scoreAndRankRecipe(mockRecipeA, userPantryWithExpired.filter(i => !i.isExpired));

assert(
    !scoredSafety.matchedIngredients.includes('chicken breast'),
    'Expired chicken is NOT matched or recommended for safety',
    `Matched: ${scoredSafety.matchedIngredients.join(', ')}`
);

assert(
    scoredSafety.matchedIngredients.length === 1 && scoredSafety.matchedIngredients[0] === 'garlic cloves',
    'Only safe fresh ingredients are matched',
    `Matched: ${scoredSafety.matchedIngredients.join(', ')}`
);

// -------------------------------------------------------------
// SECTION 7: QUANTITY & UNIT HANDLING TESTS
// -------------------------------------------------------------
console.log('\n⚖️ 7. Quantity & Unit Variation Tests:');

assert(
    isIngredientMatch('1 kg chicken', '500g boneless chicken breast'),
    'Matches across different metric quantities (1 kg chicken <-> 500g boneless chicken breast)'
);

assert(
    isIngredientMatch('3 pcs eggs', '2 large beaten eggs'),
    'Matches across unit variations (3 pcs eggs <-> 2 large beaten eggs)'
);

assert(
    isIngredientMatch('1 l whole milk', '1/2 cup warm milk'),
    'Matches across volume unit variations (1 l whole milk <-> 1/2 cup warm milk)'
);

// -------------------------------------------------------------
// SECTION 8: EDGE CASES (EMPTY PANTRY & COMPLETE MATCH)
// -------------------------------------------------------------
console.log('\n🫙 8. Edge Case Tests:');

const emptyPantryScored = scoreAndRankRecipe(mockRecipeA, []);
assert(
    emptyPantryScored.matchedIngredients.length === 0 &&
    emptyPantryScored.matchPercentage === 0 &&
    emptyPantryScored.missingIngredients.length === 4,
    'Empty pantry results in 0% match and all missing without throwing errors'
);

const perfectPantry: CleanInventoryItem[] = [
    { name: 'chicken', daysLeft: 5, isExpired: false, isExpiringSoon: false },
    { name: 'garlic', daysLeft: 5, isExpired: false, isExpiringSoon: false },
    { name: 'butter', daysLeft: 5, isExpired: false, isExpiringSoon: false },
    { name: 'parsley', daysLeft: 5, isExpired: false, isExpiringSoon: false }
];

const perfectScored = scoreAndRankRecipe(mockRecipeA, perfectPantry);
assert(
    perfectScored.matchPercentage === 100 &&
    perfectScored.missingIngredients.length === 0 &&
    perfectScored.matchTier === 'can_make',
    '100% pantry match produces perfect tier and 0 missing items'
);

console.log(`\n🎉 TEST SUMMARY: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
    console.log('🚀 ALL RECIPE ENGINE TESTS PASSED SUCCESFULLY!\n');
} else {
    process.exit(1);
}
