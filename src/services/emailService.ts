// EmailJS - Free Email Service (200 emails/month free)
// User needs to set up at https://www.emailjs.com/

import type { InventoryItem } from '../types';
import type { Recipe } from './recipeService';

// EmailJS Configuration - Read from environment variables
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Check if EmailJS is configured
export function isEmailConfigured(): boolean {
    return Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
}

// Format recipes into a readable text format for email
function formatRecipesForEmail(recipes: Recipe[], itemName: string): string {
    if (recipes.length === 0) {
        return `We couldn't find specific recipes, but you can search for "${itemName} recipes" online for ideas!`;
    }

    let recipeText = '';
    recipes.forEach((recipe, index) => {
        recipeText += `
${index + 1}. ${recipe.name}
   ⏱️ Ready in: ${recipe.readyInMinutes || 30} minutes
   🍽️ Servings: ${recipe.servings || 4}
   ✅ Uses your ingredients: ${recipe.matchedIngredients.join(', ') || itemName}
   🔗 View Recipe: ${recipe.sourceUrl || `https://spoonacular.com/recipes/${recipe.id}`}
`;
    });
    return recipeText;
}

// Send expiry reminder email with recipe suggestions
export async function sendExpiryReminder(
    item: InventoryItem,
    recipes: Recipe[]
): Promise<boolean> {
    if (!isEmailConfigured()) {
        console.warn('EmailJS not configured. Update the credentials in .env file');
        console.log('Would send email to:', item.reminderEmail);
        console.log('Item:', item.name, 'expires:', item.expiryDate);
        console.log('Recipes:', recipes.map(r => r.name));
        return false;
    }

    if (!item.reminderEmail) {
        console.warn('No email address for item:', item.name);
        return false;
    }

    const today = new Date();
    const expiry = new Date(item.expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Format the expiry date nicely
    const expiryFormatted = expiry.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Build the full email message with recipes
    const recipeSection = formatRecipesForEmail(recipes, item.name);

    const fullMessage = `
🚨 EXPIRY ALERT: ${item.name}

Your item "${item.name}" is expiring on ${expiryFormatted} (in ${daysLeft} day${daysLeft !== 1 ? 's' : ''})!

Don't let it go to waste! Here are some delicious recipes you can make:

🍳 RECIPE SUGGESTIONS:
${recipeSection}

────────────────────────────────
📱 Open Smart Bite to see more details
🌿 Smart Bite - Your Food Inventory Manager
────────────────────────────────
    `.trim();

    const params = {
        to_email: item.reminderEmail,
        to_name: 'Smart Bite User',
        from_name: 'Smart Bite',
        subject: `🚨 Expiry Alert: ${item.name} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}!`,
        message: fullMessage,
        // Also include individual fields for templates that use them
        item_name: item.name,
        expiry_date: item.expiryDate,
        days_left: daysLeft,
        recipe_1_name: recipes[0]?.name || '',
        recipe_1_image: recipes[0]?.image || '',
        recipe_1_url: recipes[0]?.sourceUrl || '',
        recipe_2_name: recipes[1]?.name || '',
        recipe_2_image: recipes[1]?.image || '',
        recipe_2_url: recipes[1]?.sourceUrl || '',
        recipe_3_name: recipes[2]?.name || '',
        recipe_3_image: recipes[2]?.image || '',
        recipe_3_url: recipes[2]?.sourceUrl || ''
    };

    console.log('📧 Email params:', params);

    try {
        // Dynamic import to avoid issues if emailjs isn't installed
        const emailjs = await import('@emailjs/browser');

        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            params as unknown as Record<string, unknown>,
            EMAILJS_PUBLIC_KEY
        );

        console.log('✅ Email sent successfully to:', item.reminderEmail);
        return true;
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        return false;
    }
}

// Send a test email with sample recipe suggestions
export async function sendTestEmail(testEmail: string): Promise<{ success: boolean; message: string }> {
    if (!isEmailConfigured()) {
        return {
            success: false,
            message: 'EmailJS is not configured. Please set VITE_EMAILJS_* in your .env file'
        };
    }

    if (!testEmail || !testEmail.includes('@')) {
        return {
            success: false,
            message: 'Please enter a valid email address'
        };
    }

    try {
        // Import recipe service dynamically
        const { findBestRecipes } = await import('./recipeService');

        // Fetch real recipes using "Chicken" as sample ingredient
        const recipes = await findBestRecipes('Chicken', ['rice', 'garlic', 'onion', 'tomato']);

        const expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const expiryFormatted = expiryDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Build comprehensive message content
        const recipeSection = formatRecipesForEmail(recipes, 'Chicken');

        // Create full email message that works with simple templates
        const fullMessage = `
🚨 EXPIRY ALERT: Chicken

Your item "Chicken" is expiring on ${expiryFormatted} (in 3 days)!

Don't let it go to waste! Here are some delicious recipes you can make:

🍳 RECIPE SUGGESTIONS:
${recipeSection}

────────────────────────────────
📱 This is a TEST email from Smart Bite
🌿 Smart Bite - Your Food Inventory Manager
────────────────────────────────
        `.trim();

        const params = {
            to_email: testEmail,
            to_name: 'Smart Bite User',
            from_name: 'Smart Bite',
            subject: '🍗 TEST: Expiry Alert - Chicken expires in 3 days!',
            message: fullMessage,
            // Also include individual fields for templates that use them
            item_name: 'Chicken',
            expiry_date: expiryDate.toISOString().split('T')[0],
            days_left: 3,
            recipe_1_name: recipes[0]?.name || '',
            recipe_1_image: recipes[0]?.image || '',
            recipe_1_url: recipes[0]?.sourceUrl || '',
            recipe_2_name: recipes[1]?.name || '',
            recipe_2_image: recipes[1]?.image || '',
            recipe_2_url: recipes[1]?.sourceUrl || '',
            recipe_3_name: recipes[2]?.name || '',
            recipe_3_image: recipes[2]?.image || '',
            recipe_3_url: recipes[2]?.sourceUrl || ''
        };

        console.log('📧 Test email params:', params);

        const emailjs = await import('@emailjs/browser');
        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            params as unknown as Record<string, unknown>,
            EMAILJS_PUBLIC_KEY
        );

        return {
            success: true,
            message: `Test email sent successfully to ${testEmail}! Check your inbox.`
        };
    } catch (error) {
        console.error('Failed to send test email:', error);
        return {
            success: false,
            message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
