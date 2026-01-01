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

// Search recipes by main ingredient
export async function getRecipesByIngredient(ingredient: string): Promise<Recipe[]> {
    try {
        console.log('🔍 Searching TheMealDB for:', ingredient);

        const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.meals) {
            console.log('No meals found for:', ingredient);
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
        // Search by main ingredient
        const recipes = await getRecipesByIngredient(expiringItemName);

        if (recipes.length === 0) {
            // Try searching by first word (e.g., "Whole Milk" -> "Milk")
            const firstWord = expiringItemName.split(' ').pop() || expiringItemName;
            console.log('Trying search with:', firstWord);
            const altRecipes = await getRecipesByIngredient(firstWord);

            if (altRecipes.length === 0) {
                // Try getting a random recipe as fallback
                console.log('No specific recipes found, getting suggestions...');
                return await getRandomRecipes(3);
            }

            return processRecipes(altRecipes, expiringNormalized, inventoryNormalized);
        }

        return processRecipes(recipes, expiringNormalized, inventoryNormalized);
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

// Search recipes by name
export async function searchRecipesByName(query: string): Promise<Recipe[]> {
    try {
        const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.meals) {
            return [];
        }

        return data.meals.slice(0, 5).map((meal: MealDBRecipe) => convertToRecipe(meal));
    } catch (error) {
        console.error('Error searching recipes:', error);
        return [];
    }
}
