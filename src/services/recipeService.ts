// TheMealDB API - Intelligent Recipe Engine & Caching Layer for SmartBite
// Provides pantry-aware matching, multi-factor zero-waste scoring, and food-safe recommendations.

import { normalizeIngredient, isIngredientMatch } from '../utils/ingredientNormalizer';
import type { InventoryItem } from '../types';

export interface Recipe {
    id: string;
    name: string;
    image: string;
    category: string;
    area: string;
    instructions: string;
    ingredients: string[];
    matchedIngredients: string[];
    matchScore: number;
    // Intelligent scoring & match metrics
    matchPercentage: number;
    missingIngredients: string[];
    expiringMatchCount: number;
    matchTier: 'can_make' | 'almost_can_make' | 'missing_items';
    scoreBreakdown?: {
        matchScore: number;
        utilizationScore: number;
        expiringBonus: number;
        missingPenalty: number;
        totalScore: number;
    };
    readyInMinutes?: number;
    servings?: number;
    sourceUrl?: string;
}

interface MealDBRecipe {
    idMeal: string;
    strMeal: string;
    strCategory: string;
    strArea: string;
    strInstructions: string;
    strMealThumb: string;
    strSource?: string;
    strYoutube?: string;
    [key: string]: string | undefined;
}

// In-Memory Caches for performance & rate-limit reduction
const mealDetailsCache = new Map<string, Recipe>();
const queryCache = new Map<string, { timestamp: number; recipes: Recipe[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

// Extract ingredients from MealDB recipe format
function extractIngredients(meal: MealDBRecipe): string[] {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        if (ingredient && ingredient.trim()) {
            ingredients.push(ingredient.trim());
        }
    }
    return ingredients;
}

// Convert MealDB raw object to canonical base Recipe
function convertToRecipe(meal: MealDBRecipe): Recipe {
    const rawIngredients = extractIngredients(meal);

    return {
        id: meal.idMeal,
        name: meal.strMeal || 'Untitled Recipe',
        image: meal.strMealThumb || '',
        category: meal.strCategory || 'Main Course',
        area: meal.strArea || 'International',
        instructions: meal.strInstructions || '',
        ingredients: rawIngredients,
        matchedIngredients: [],
        matchScore: 0,
        matchPercentage: 0,
        missingIngredients: [...rawIngredients],
        expiringMatchCount: 0,
        matchTier: 'missing_items',
        readyInMinutes: 30, // Fallback estimate
        servings: 4,
        sourceUrl: meal.strSource || (meal.idMeal ? `https://www.themealdb.com/meal/${meal.idMeal}` : undefined)
    };
}

// Fetch recipe details by ID with memoization
export async function getRecipeById(id: string): Promise<Recipe | null> {
    if (!id) return null;

    if (mealDetailsCache.has(id)) {
        return mealDetailsCache.get(id)!;
    }

    try {
        const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.meals || data.meals.length === 0) {
            return null;
        }

        const recipe = convertToRecipe(data.meals[0]);
        mealDetailsCache.set(id, recipe);
        return recipe;
    } catch (error) {
        console.error('Error fetching recipe details for ID:', id, error);
        return null;
    }
}

// Search recipes by meal title
export async function searchRecipesByName(searchTerm: string): Promise<Recipe[]> {
    if (!searchTerm || !searchTerm.trim()) return [];

    const cleanTerm = searchTerm.trim().toLowerCase();
    const cacheKey = `name:${cleanTerm}`;

    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.recipes;
    }

    try {
        const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(cleanTerm)}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.meals) {
            queryCache.set(cacheKey, { timestamp: Date.now(), recipes: [] });
            return [];
        }

        const recipes: Recipe[] = data.meals.slice(0, 10).map((meal: MealDBRecipe) => {
            const converted = convertToRecipe(meal);
            mealDetailsCache.set(converted.id, converted);
            return converted;
        });

        queryCache.set(cacheKey, { timestamp: Date.now(), recipes });
        return recipes;
    } catch (error) {
        console.error('Error searching recipes by name:', error);
        return [];
    }
}

// Search recipes by INGREDIENT with parallel lookup and caching
export async function getRecipesByIngredient(ingredient: string): Promise<Recipe[]> {
    if (!ingredient || !ingredient.trim()) return [];

    const cleanIng = normalizeIngredient(ingredient) || ingredient.trim().toLowerCase();
    const cacheKey = `ing:${cleanIng}`;

    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.recipes;
    }

    try {
        const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(cleanIng)}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.meals || data.meals.length === 0) {
            queryCache.set(cacheKey, { timestamp: Date.now(), recipes: [] });
            return [];
        }

        // Fetch up to 8 meals in parallel
        const candidateMeals = data.meals.slice(0, 8);
        const recipePromises = candidateMeals.map((meal: { idMeal: string }) => getRecipeById(meal.idMeal));
        const resolvedRecipes = await Promise.all(recipePromises);

        const recipes = resolvedRecipes.filter((r): r is Recipe => r !== null);
        queryCache.set(cacheKey, { timestamp: Date.now(), recipes });
        return recipes;
    } catch (error) {
        console.error('Error fetching recipes by ingredient:', error);
        return [];
    }
}

// Curated recipes for specialty items that lack comprehensive free API endpoints (e.g. chips/snacks)
const KNOWN_ITEM_RECIPES: Record<string, Recipe[]> = {
    'potato chips': [
        {
            id: 'custom-lays-1',
            name: 'Crispy Chips Bhel Puri',
            image: '/i1.jpeg',
            category: 'Snack',
            area: 'Indian',
            instructions: '1. Crush the potato chips into bite-sized pieces in a bowl.\n2. Add finely chopped onion, tomato, green chili, and coriander.\n3. Squeeze fresh lemon juice over the mixture.\n4. Add tamarind chutney and green chutney.\n5. Toss everything together and serve immediately while crispy.',
            ingredients: ['potato chips', 'onion', 'tomato', 'green chili', 'coriander', 'lemon juice', 'tamarind chutney', 'green chutney', 'sev'],
            matchedIngredients: [],
            matchScore: 0,
            matchPercentage: 0,
            missingIngredients: [],
            expiringMatchCount: 0,
            matchTier: 'can_make',
            readyInMinutes: 10,
            servings: 2,
            sourceUrl: 'https://www.youtube.com/watch?v=92gHUzeeOI8'
        },
        {
            id: 'custom-lays-2',
            name: 'Loaded Nachos with Cheese Sauce',
            image: '/i2.jpeg',
            category: 'Starter',
            area: 'Mexican',
            instructions: '1. Arrange potato chips on a baking tray in a single layer.\n2. Make cheese sauce: melt butter, add flour, stir in milk, then add grated cheese until smooth.\n3. Pour hot cheese sauce over the chips.\n4. Top with diced tomatoes, jalapeños, and corn.\n5. Bake at 180°C for 5 minutes until cheese is bubbly.\n6. Garnish with sour cream and coriander.',
            ingredients: ['potato chips', 'cheese', 'butter', 'flour', 'milk', 'tomato', 'jalapeno', 'corn', 'sour cream', 'coriander'],
            matchedIngredients: [],
            matchScore: 0,
            matchPercentage: 0,
            missingIngredients: [],
            expiringMatchCount: 0,
            matchTier: 'can_make',
            readyInMinutes: 15,
            servings: 4,
            sourceUrl: 'https://www.youtube.com/watch?v=X2effcTdCZY'
        },
        {
            id: 'custom-lays-3',
            name: 'Chips Crusted Aloo Tikki',
            image: '/i3.jpeg',
            category: 'Side',
            area: 'Indian',
            instructions: '1. Boil and mash potatoes. Mix with chopped onion, green chili, ginger, garam masala, and salt.\n2. Crush chips finely to make a crispy coating.\n3. Shape potato mixture into flat round patties.\n4. Coat each patty generously with crushed chips.\n5. Shallow fry on medium heat until golden and crispy on both sides.\n6. Serve hot with mint chutney and tamarind chutney.',
            ingredients: ['potato chips', 'potato', 'onion', 'green chili', 'ginger', 'garam masala', 'salt', 'oil', 'mint chutney'],
            matchedIngredients: [],
            matchScore: 0,
            matchPercentage: 0,
            missingIngredients: [],
            expiringMatchCount: 0,
            matchTier: 'can_make',
            readyInMinutes: 25,
            servings: 4,
            sourceUrl: 'https://www.youtube.com/watch?v=qkM7HwvclCU'
        }
    ]
};

function getKnownRecipes(itemName: string): Recipe[] | null {
    const normalized = normalizeIngredient(itemName).toLowerCase();
    for (const [key, recipes] of Object.entries(KNOWN_ITEM_RECIPES)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return recipes;
        }
    }
    return null;
}

// Normalized internal inventory representation
export interface CleanInventoryItem {
    name: string;
    daysLeft: number;
    isExpired: boolean;
    isExpiringSoon: boolean;
}

function parseInventoryItems(
    rawInventory: (string | InventoryItem | { name: string; expiryDate?: string; status?: string; daysLeft?: number })[]
): CleanInventoryItem[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rawInventory
        .map(item => {
            if (typeof item === 'string') {
                return {
                    name: item.trim(),
                    daysLeft: 99,
                    isExpired: false,
                    isExpiringSoon: false
                };
            }

            let daysLeft = 99;
            const itemAny = item as { daysLeft?: number; expiryDate?: string; status?: string };
            if (typeof itemAny.daysLeft === 'number') {
                daysLeft = itemAny.daysLeft;
            } else if (itemAny.expiryDate) {
                const expiry = new Date(itemAny.expiryDate);
                expiry.setHours(0, 0, 0, 0);
                daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            }

            const isExpired = item.status === 'Expired' || daysLeft < 0;
            const isExpiringSoon = !isExpired && daysLeft >= 0 && daysLeft <= 7;

            return {
                name: item.name.trim(),
                daysLeft,
                isExpired,
                isExpiringSoon
            };
        })
        .filter(item => item.name.length > 0 && !item.isExpired); // Filter out expired items for food safety
}

/**
 * Intelligent Multi-Factor Recipe Scorer:
 * 1. Ingredient Match % (40% weight)
 * 2. Inventory Utilization % (20% weight)
 * 3. Expiring-Soon Urgency Boost (up to +25 points)
 * 4. Missing Ingredients Penalty (-5 points per missing item, max -30)
 * 5. Can Make / Almost Can Make categorization
 */
export function scoreAndRankRecipe(recipe: Recipe, activeInventory: CleanInventoryItem[]): Recipe {
    const matchedIngredients: string[] = [];
    const missingIngredients: string[] = [];
    const matchedInventoryNames = new Set<string>();
    let expiringMatchCount = 0;

    const recipeIngredients = recipe.ingredients.length > 0 ? recipe.ingredients : ['Ingredient'];

    for (const recipeIng of recipeIngredients) {
        let isMatched = false;
        let matchedInvItem: CleanInventoryItem | null = null;

        for (const invItem of activeInventory) {
            if (isIngredientMatch(invItem.name, recipeIng)) {
                isMatched = true;
                matchedInvItem = invItem;
                break;
            }
        }

        if (isMatched && matchedInvItem) {
            matchedIngredients.push(recipeIng);
            matchedInventoryNames.add(matchedInvItem.name.toLowerCase());
            if (matchedInvItem.isExpiringSoon) {
                expiringMatchCount++;
            }
        } else {
            missingIngredients.push(recipeIng);
        }
    }

    const totalIngs = recipeIngredients.length;
    const matchPercentage = totalIngs > 0 ? Math.round((matchedIngredients.length / totalIngs) * 100) : 0;
    const inventoryUtilization = activeInventory.length > 0 ? Math.round((matchedInventoryNames.size / activeInventory.length) * 100) : 0;

    // Expiring Urgency Boost
    let expiringBonus = 0;
    if (expiringMatchCount === 1) expiringBonus = 15;
    else if (expiringMatchCount >= 2) expiringBonus = 25;

    // Missing Ingredient Penalty
    const missingPenalty = Math.min(30, missingIngredients.length * 5);

    // Multi-factor composite score
    const totalScore = Math.round(
        (matchPercentage * 0.40) +
        (inventoryUtilization * 0.20) +
        expiringBonus -
        missingPenalty
    );

    // Determine match tier
    let matchTier: 'can_make' | 'almost_can_make' | 'missing_items' = 'missing_items';
    if (matchPercentage >= 80 || missingIngredients.length <= 1) {
        matchTier = 'can_make';
    } else if (matchPercentage >= 50 || missingIngredients.length <= 3) {
        matchTier = 'almost_can_make';
    }

    return {
        ...recipe,
        matchedIngredients,
        missingIngredients,
        matchScore: matchedIngredients.length,
        matchPercentage,
        expiringMatchCount,
        matchTier,
        scoreBreakdown: {
            matchScore: matchPercentage,
            utilizationScore: inventoryUtilization,
            expiringBonus,
            missingPenalty,
            totalScore
        }
    };
}

/**
 * Common culinary dish terms to distinguish title searches from ingredient searches
 */
const COMMON_DISH_TERMS = new Set([
    'soup', 'salad', 'curry', 'pie', 'cake', 'pizza', 'burger', 'stew',
    'casserole', 'taco', 'pancake', 'cookie', 'bread', 'sandwich', 'pasta',
    'roast', 'tart', 'wrap', 'bowl', 'dip', 'omelette', 'omelet', 'lasagna'
]);

/**
 * Primary Engine Function: Finds the best recipes matching the user's inventory
 * Handles both string[] and rich InventoryItem[] inputs for backward compatibility.
 */
export async function findBestRecipes(
    targetQueryOrItem: string,
    rawInventory: (string | InventoryItem | { name: string; expiryDate?: string; status?: string; daysLeft?: number })[]
): Promise<Recipe[]> {
    const cleanTarget = (targetQueryOrItem || '').trim();
    const activeInventory = parseInventoryItems(rawInventory);

    // Check if target matches specialty known items (e.g. chips/lays)
    const known = getKnownRecipes(cleanTarget);
    if (known) {
        return known
            .map(r => scoreAndRankRecipe(r, activeInventory))
            .sort((a, b) => (b.scoreBreakdown?.totalScore || 0) - (a.scoreBreakdown?.totalScore || 0));
    }

    const isDishQuery = COMMON_DISH_TERMS.has(cleanTarget.toLowerCase());
    let rawCandidates: Recipe[] = [];

    try {
        if (isDishQuery) {
            // If user searched for a dish name, search titles first
            rawCandidates = await searchRecipesByName(cleanTarget);
            if (rawCandidates.length < 3) {
                const ingResults = await getRecipesByIngredient(cleanTarget);
                rawCandidates = [...rawCandidates, ...ingResults];
            }
        } else {
            // For food ingredients, prioritize ingredient-based retrieval
            rawCandidates = await getRecipesByIngredient(cleanTarget);

            // Supplement with name search if results are scarce
            if (rawCandidates.length < 4) {
                const nameResults = await searchRecipesByName(cleanTarget);
                rawCandidates = [...rawCandidates, ...nameResults];
            }
        }

        // Fallback: If still few or no candidates, try last word (e.g., "Whole Milk" -> "Milk")
        if (rawCandidates.length === 0 && cleanTarget.includes(' ')) {
            const lastWord = cleanTarget.split(' ').pop() || '';
            if (lastWord.length > 2) {
                rawCandidates = await getRecipesByIngredient(lastWord);
                if (rawCandidates.length === 0) {
                    rawCandidates = await searchRecipesByName(lastWord);
                }
            }
        }

        // If completely empty, fetch random recipes as graceful discovery
        if (rawCandidates.length === 0) {
            rawCandidates = await getRandomRecipes(4);
        }

        // Deduplicate recipes by ID
        const uniqueRecipes = new Map<string, Recipe>();
        for (const recipe of rawCandidates) {
            if (recipe && recipe.id && !uniqueRecipes.has(recipe.id)) {
                uniqueRecipes.set(recipe.id, recipe);
            }
        }

        // Score and rank each recipe with multi-factor engine
        const scored = Array.from(uniqueRecipes.values())
            .map(recipe => scoreAndRankRecipe(recipe, activeInventory))
            .sort((a, b) => {
                const scoreA = a.scoreBreakdown?.totalScore ?? 0;
                const scoreB = b.scoreBreakdown?.totalScore ?? 0;
                if (scoreB !== scoreA) return scoreB - scoreA;
                return b.matchPercentage - a.matchPercentage;
            });

        return scored.slice(0, 8);
    } catch (error) {
        console.error('Error finding best recipes:', error);
        return [];
    }
}

// Get random recipes (fallback when no specific matches)
export async function getRandomRecipes(count: number = 3): Promise<Recipe[]> {
    const recipes: Recipe[] = [];

    try {
        const promises = Array.from({ length: count }, () =>
            fetch('https://www.themealdb.com/api/json/v1/1/random.php')
                .then(res => res.ok ? res.json() : null)
                .catch(() => null)
        );

        const results = await Promise.all(promises);
        for (const data of results) {
            if (data?.meals?.[0]) {
                const recipe = convertToRecipe(data.meals[0]);
                mealDetailsCache.set(recipe.id, recipe);
                recipes.push(recipe);
            }
        }
    } catch (error) {
        console.error('Error fetching random recipes:', error);
    }

    return recipes;
}

// Get a single random recipe
export async function getRandomRecipe(): Promise<Recipe | null> {
    const list = await getRandomRecipes(1);
    return list[0] || null;
}
