// TheMealDB API - Free Recipe Database (No API key required!)
// https://www.themealdb.com/api.php

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
    // Ingredients and measures come as strIngredient1-20 and strMeasure1-20
    [key: string]: string | undefined;
}

// Extract ingredients from MealDB recipe format
function extractIngredients(meal: MealDBRecipe): string[] {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        if (ingredient && ingredient.trim()) {
            ingredients.push(ingredient.trim().toLowerCase());
        }
    }
    return ingredients;
}

// Convert MealDB recipe to our Recipe format
function convertToRecipe(meal: MealDBRecipe, matchedIngredients: string[] = []): Recipe {
    const ingredients = extractIngredients(meal);

    return {
        id: meal.idMeal,
        name: meal.strMeal,
        image: meal.strMealThumb,
        category: meal.strCategory || 'Main Course',
        area: meal.strArea || 'International',
        instructions: meal.strInstructions || '',
        ingredients: ingredients,
        matchedIngredients: matchedIngredients.length > 0 ? matchedIngredients : ingredients.slice(0, 3),
        matchScore: matchedIngredients.length,
        readyInMinutes: 30, // MealDB doesn't provide this, estimate
        servings: 4, // MealDB doesn't provide this, estimate
        sourceUrl: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`
    };
}

// Search recipes by meal NAME (what the MealDB website search uses)
export async function searchRecipesByName(searchTerm: string): Promise<Recipe[]> {
    try {
        console.log('🔍 Searching TheMealDB by NAME for:', searchTerm);

        const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchTerm)}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.meals) {
            console.log('No meals found by name for:', searchTerm);
            return [];
        }

        // Convert meals to our Recipe format (already has full details from search.php)
        const recipes = data.meals.slice(0, 5).map((meal: MealDBRecipe) => convertToRecipe(meal));
        console.log(`✅ Found ${recipes.length} recipes by name search`);
        return recipes;
    } catch (error) {
        console.error('Error searching recipes by name:', error);
        return [];
    }
}

// Search recipes by INGREDIENT (filter endpoint)
export async function getRecipesByIngredient(ingredient: string): Promise<Recipe[]> {
    try {
        console.log('🔍 Searching TheMealDB by INGREDIENT for:', ingredient);

        const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.meals) {
            console.log('No meals found by ingredient for:', ingredient);
            return [];
        }

        // Get basic recipe info, then fetch full details for top 5
        const meals = data.meals.slice(0, 5);
        const recipes: Recipe[] = [];

        for (const meal of meals) {
            const fullRecipe = await getRecipeById(meal.idMeal);
            if (fullRecipe) {
                recipes.push(fullRecipe);
            }
        }

        console.log(`✅ Found ${recipes.length} recipes by ingredient`);
        return recipes;
    } catch (error) {
        console.error('Error fetching recipes from TheMealDB:', error);
        return [];
    }
}

// Get full recipe details by ID
export async function getRecipeById(id: string): Promise<Recipe | null> {
    try {
        const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.meals || data.meals.length === 0) {
            return null;
        }

        return convertToRecipe(data.meals[0]);
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        return null;
    }
}

// Hardcoded recipes for specific items that don't get good API results
const KNOWN_ITEM_RECIPES: Record<string, Recipe[]> = {
    'lays': [
        {
            id: 'custom-lays-1',
            name: 'Crispy Chips Bhel Puri',
            image: '/i1.jpeg',
            category: 'Snack',
            area: 'Indian',
            instructions: '1. Crush the Lays chips into bite-sized pieces in a bowl.\n2. Add finely chopped onion, tomato, green chili, and coriander.\n3. Squeeze fresh lemon juice over the mixture.\n4. Add tamarind chutney and green chutney.\n5. Toss everything together and serve immediately while crispy.',
            ingredients: ['lays chips', 'onion', 'tomato', 'green chili', 'coriander', 'lemon juice', 'tamarind chutney', 'green chutney', 'sev'],
            matchedIngredients: ['lays chips', 'onion', 'tomato'],
            matchScore: 3,
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
            instructions: '1. Arrange Lays chips on a baking tray in a single layer.\n2. Make cheese sauce: melt butter, add flour, stir in milk, then add grated cheese until smooth.\n3. Pour hot cheese sauce over the chips.\n4. Top with diced tomatoes, jalapeños, and corn kernels.\n5. Bake at 180°C for 5 minutes until cheese is bubbly.\n6. Garnish with sour cream and coriander.',
            ingredients: ['lays chips', 'cheese', 'butter', 'flour', 'milk', 'tomato', 'jalapeño', 'corn', 'sour cream', 'coriander'],
            matchedIngredients: ['lays chips', 'cheese', 'tomato'],
            matchScore: 3,
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
            instructions: '1. Boil and mash potatoes. Mix with chopped onion, green chili, ginger, garam masala, and salt.\n2. Crush Lays chips finely to make a crispy coating.\n3. Shape potato mixture into flat round patties.\n4. Coat each patty generously with crushed chips.\n5. Shallow fry on medium heat until golden and crispy on both sides.\n6. Serve hot with mint chutney and tamarind chutney.',
            ingredients: ['lays chips', 'potato', 'onion', 'green chili', 'ginger', 'garam masala', 'salt', 'oil', 'mint chutney'],
            matchedIngredients: ['lays chips', 'potato', 'onion'],
            matchScore: 3,
            readyInMinutes: 25,
            servings: 4,
            sourceUrl: 'https://www.youtube.com/watch?v=qkM7HwvclCU'
        }
    ]
};

// Check if an item name matches any known recipe key
function getKnownRecipes(itemName: string): Recipe[] | null {
    const normalized = itemName.toLowerCase();
    for (const [key, recipes] of Object.entries(KNOWN_ITEM_RECIPES)) {
        if (normalized.includes(key)) {
            return recipes;
        }
    }
    return null;
}

// Find best recipes that use expiring item + other inventory items
export async function findBestRecipes(
    expiringItemName: string,
    allInventoryItems: string[]
): Promise<Recipe[]> {
    console.log('🍳 Finding recipes for:', expiringItemName, 'with inventory:', allInventoryItems);

    // Check hardcoded recipes first (for items like Lays that don't have good API results)
    const knownRecipes = getKnownRecipes(expiringItemName);
    if (knownRecipes) {
        console.log('✅ Found hardcoded recipes for:', expiringItemName);
        // Update matched ingredients with actual inventory items
        const inventoryNormalized = allInventoryItems.map(s => s.toLowerCase().trim());
        return knownRecipes.map(recipe => {
            const matched = recipe.ingredients.filter(ing =>
                inventoryNormalized.some(inv => ing.includes(inv) || inv.includes(ing))
            );
            if (!matched.some(m => m.includes(expiringItemName.toLowerCase()))) {
                matched.unshift(expiringItemName.toLowerCase());
            }
            return { ...recipe, matchedIngredients: matched, matchScore: matched.length };
        });
    }

    // Normalize ingredient names
    const normalize = (s: string) => s.toLowerCase().trim();
    const expiringNormalized = normalize(expiringItemName);
    const inventoryNormalized = allInventoryItems.map(normalize);

    try {
        // FIRST: Try searching by NAME (like MealDB website search bar)
        // This finds recipes WITH that name (e.g., "cookies" -> "Peanut Butter Cookies")
        console.log('📛 Step 1: Searching by NAME for:', expiringItemName);
        let recipes = await searchRecipesByName(expiringItemName);

        if (recipes.length > 0) {
            console.log(`✅ Found ${recipes.length} recipes by name!`);
            return processRecipes(recipes, expiringNormalized, inventoryNormalized);
        }

        // SECOND: Try searching by INGREDIENT (finds meals that USE this ingredient)
        console.log('🥘 Step 2: Searching by INGREDIENT for:', expiringItemName);
        recipes = await getRecipesByIngredient(expiringItemName);

        if (recipes.length > 0) {
            console.log(`✅ Found ${recipes.length} recipes by ingredient!`);
            return processRecipes(recipes, expiringNormalized, inventoryNormalized);
        }

        // THIRD: Try with last word (e.g., "Whole Milk" -> "Milk")
        const lastWord = expiringItemName.split(' ').pop() || expiringItemName;
        if (lastWord !== expiringItemName) {
            console.log('🔄 Step 3: Trying with last word:', lastWord);

            // Try name search first
            recipes = await searchRecipesByName(lastWord);
            if (recipes.length > 0) {
                return processRecipes(recipes, expiringNormalized, inventoryNormalized);
            }

            // Then ingredient search
            recipes = await getRecipesByIngredient(lastWord);
            if (recipes.length > 0) {
                return processRecipes(recipes, expiringNormalized, inventoryNormalized);
            }
        }

        // FALLBACK: Get random recipes
        console.log('🎲 No specific recipes found, getting random suggestions...');
        return await getRandomRecipes(3);

    } catch (error) {
        console.error('Error finding best recipes:', error);
        return [];
    }
}

// Process recipes to calculate match scores
function processRecipes(
    recipes: Recipe[],
    expiringItem: string,
    inventory: string[]
): Recipe[] {
    return recipes.map(recipe => {
        // Find which inventory items match this recipe's ingredients
        const matchedIngredients = recipe.ingredients.filter(ing =>
            inventory.some(inv =>
                ing.includes(inv) || inv.includes(ing)
            )
        );

        // Make sure the main ingredient is included
        if (!matchedIngredients.some(m => m.includes(expiringItem) || expiringItem.includes(m))) {
            matchedIngredients.unshift(expiringItem);
        }

        return {
            ...recipe,
            matchedIngredients: matchedIngredients.slice(0, 5),
            matchScore: matchedIngredients.length
        };
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
}

// Get random recipes (fallback when no specific matches)
export async function getRandomRecipes(count: number = 3): Promise<Recipe[]> {
    const recipes: Recipe[] = [];

    try {
        for (let i = 0; i < count; i++) {
            const response = await fetch(
                'https://www.themealdb.com/api/json/v1/1/random.php'
            );

            if (response.ok) {
                const data = await response.json();
                if (data.meals && data.meals[0]) {
                    recipes.push(convertToRecipe(data.meals[0]));
                }
            }
        }
    } catch (error) {
        console.error('Error fetching random recipes:', error);
    }

    return recipes;
}

// Get a single random recipe
export async function getRandomRecipe(): Promise<Recipe | null> {
    try {
        const response = await fetch(
            'https://www.themealdb.com/api/json/v1/1/random.php'
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.meals || data.meals.length === 0) {
            return null;
        }

        return convertToRecipe(data.meals[0]);
    } catch (error) {
        console.error('Error fetching random recipe:', error);
        return null;
    }
}


