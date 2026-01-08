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

// Find best recipes that use expiring item + other inventory items
export async function findBestRecipes(
    expiringItemName: string,
    allInventoryItems: string[]
): Promise<Recipe[]> {
    console.log('🍳 Finding recipes for:', expiringItemName, 'with inventory:', allInventoryItems);

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


