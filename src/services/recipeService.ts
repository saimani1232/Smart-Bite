// Spoonacular API - Premium Recipe Database
// https://spoonacular.com/food-api

const SPOONACULAR_API_KEY = '1d69c0ef9f3b465fb2f3beee47ab7de2';
const BASE_URL = 'https://api.spoonacular.com';

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

interface SpoonacularRecipe {
    id: number;
    title: string;
    image: string;
    imageType: string;
    usedIngredientCount: number;
    missedIngredientCount: number;
    usedIngredients: Array<{ name: string }>;
    missedIngredients: Array<{ name: string }>;
}

interface SpoonacularRecipeDetails {
    id: number;
    title: string;
    image: string;
    readyInMinutes: number;
    servings: number;
    sourceUrl: string;
    instructions: string;
    cuisines: string[];
    dishTypes: string[];
    extendedIngredients: Array<{ name: string }>;
}

// Get recipes that use specific ingredients
export async function getRecipesByIngredient(ingredient: string): Promise<Recipe[]> {
    try {
        const response = await fetch(
            `${BASE_URL}/recipes/findByIngredients?apiKey=${SPOONACULAR_API_KEY}&ingredients=${encodeURIComponent(ingredient)}&number=10&ranking=1&ignorePantry=true`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data: SpoonacularRecipe[] = await response.json();

        return data.map((recipe) => ({
            id: recipe.id.toString(),
            name: recipe.title,
            image: recipe.image,
            category: '',
            area: '',
            instructions: '',
            ingredients: [],
            matchedIngredients: recipe.usedIngredients.map(i => i.name),
            matchScore: recipe.usedIngredientCount
        }));
    } catch (error) {
        console.error('Error fetching recipes from Spoonacular:', error);
        return [];
    }
}

// Get full recipe details
export async function getRecipeDetails(recipeId: string): Promise<Recipe | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const recipe: SpoonacularRecipeDetails = await response.json();

        return {
            id: recipe.id.toString(),
            name: recipe.title,
            image: recipe.image,
            category: recipe.dishTypes?.[0] || 'Main Course',
            area: recipe.cuisines?.[0] || 'International',
            instructions: recipe.instructions || '',
            ingredients: recipe.extendedIngredients.map(i => i.name.toLowerCase()),
            matchedIngredients: [],
            matchScore: 0,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            sourceUrl: recipe.sourceUrl
        };
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
    console.log('Finding recipes for:', expiringItemName, 'with inventory:', allInventoryItems);

    // Normalize ingredient names
    const normalize = (s: string) => s.toLowerCase().trim();
    const inventoryNormalized = allInventoryItems.map(normalize);

    // Combine expiring item with other inventory items for better results
    const searchIngredients = [expiringItemName, ...allInventoryItems.slice(0, 4)].join(',');

    try {
        const response = await fetch(
            `${BASE_URL}/recipes/findByIngredients?apiKey=${SPOONACULAR_API_KEY}&ingredients=${encodeURIComponent(searchIngredients)}&number=10&ranking=2&ignorePantry=true`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const recipes: SpoonacularRecipe[] = await response.json();

        if (recipes.length === 0) {
            console.log('No recipes found for:', expiringItemName);
            return [];
        }

        // Get details for top recipes
        const detailedRecipes: Recipe[] = [];
        const recipesToCheck = recipes.slice(0, 5);

        for (const recipe of recipesToCheck) {
            const details = await getRecipeDetails(recipe.id.toString());
            if (details) {
                // Calculate how many inventory items this recipe uses
                const matchedIngredients = details.ingredients.filter(ing =>
                    inventoryNormalized.some(inv =>
                        ing.includes(inv) || inv.includes(ing)
                    )
                );

                // Include the main ingredient
                const expiringNormalized = normalize(expiringItemName);
                if (!matchedIngredients.includes(expiringNormalized)) {
                    matchedIngredients.push(expiringNormalized);
                }

                details.matchedIngredients = matchedIngredients;
                details.matchScore = recipe.usedIngredientCount;
                detailedRecipes.push(details);
            }
        }

        // Sort by match score
        detailedRecipes.sort((a, b) => b.matchScore - a.matchScore);

        console.log('Found recipes:', detailedRecipes.map(r => ({
            name: r.name,
            matched: r.matchedIngredients,
            score: r.matchScore,
            readyIn: r.readyInMinutes
        })));

        return detailedRecipes.slice(0, 3);
    } catch (error) {
        console.error('Error finding best recipes:', error);
        return [];
    }
}

// Get a random recipe for testing/display
export async function getRandomRecipe(): Promise<Recipe | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/recipes/random?apiKey=${SPOONACULAR_API_KEY}&number=1`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const recipe = data.recipes?.[0];

        if (!recipe) return null;

        return {
            id: recipe.id.toString(),
            name: recipe.title,
            image: recipe.image,
            category: recipe.dishTypes?.[0] || 'Main Course',
            area: recipe.cuisines?.[0] || 'International',
            instructions: recipe.instructions || '',
            ingredients: recipe.extendedIngredients?.map((i: { name: string }) => i.name.toLowerCase()) || [],
            matchedIngredients: [],
            matchScore: 0,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            sourceUrl: recipe.sourceUrl
        };
    } catch (error) {
        console.error('Error fetching random recipe:', error);
        return null;
    }
}
