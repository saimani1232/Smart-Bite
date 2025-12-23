// EmailJS - Free Email Service (200 emails/month free)
// User needs to set up at https://www.emailjs.com/

import type { InventoryItem } from '../types';
import type { Recipe } from './recipeService';

// EmailJS Configuration - User should update these
const EMAILJS_SERVICE_ID = 'service_2dzjphm';  // Get from EmailJS dashboard
const EMAILJS_TEMPLATE_ID = 'template_vokttut'; // Create email template
const EMAILJS_PUBLIC_KEY = 'VhEb3ulPQVN0NBDz-';   // Get from EmailJS dashboard

interface EmailParams {
    to_email: string;
    item_name: string;
    expiry_date: string;
    days_left: number;
    recipe_1_name?: string;
    recipe_1_image?: string;
    recipe_1_ingredients?: string;
    recipe_2_name?: string;
    recipe_2_image?: string;
    recipe_2_ingredients?: string;
    recipe_3_name?: string;
    recipe_3_image?: string;
    recipe_3_ingredients?: string;
}

// Check if EmailJS is configured
export function isEmailConfigured(): boolean {
    return (EMAILJS_SERVICE_ID as string) !== 'YOUR_SERVICE_ID' &&
        (EMAILJS_TEMPLATE_ID as string) !== 'YOUR_TEMPLATE_ID' &&
        (EMAILJS_PUBLIC_KEY as string) !== 'YOUR_PUBLIC_KEY';
}

// Send expiry reminder email with recipe suggestions
export async function sendExpiryReminder(
    item: InventoryItem,
    recipes: Recipe[]
): Promise<boolean> {
    if (!isEmailConfigured()) {
        console.warn('EmailJS not configured. Update the credentials in emailService.ts');
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

    const params: EmailParams = {
        to_email: item.reminderEmail,
        item_name: item.name,
        expiry_date: item.expiryDate,
        days_left: daysLeft
    };

    // Add recipe info
    if (recipes[0]) {
        params.recipe_1_name = recipes[0].name;
        params.recipe_1_image = recipes[0].image;
        params.recipe_1_ingredients = recipes[0].matchedIngredients.join(', ');
    }
    if (recipes[1]) {
        params.recipe_2_name = recipes[1].name;
        params.recipe_2_image = recipes[1].image;
        params.recipe_2_ingredients = recipes[1].matchedIngredients.join(', ');
    }
    if (recipes[2]) {
        params.recipe_3_name = recipes[2].name;
        params.recipe_3_image = recipes[2].image;
        params.recipe_3_ingredients = recipes[2].matchedIngredients.join(', ');
    }

    try {
        // Dynamic import to avoid issues if emailjs isn't installed
        const emailjs = await import('@emailjs/browser');

        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            params as unknown as Record<string, unknown>,
            EMAILJS_PUBLIC_KEY
        );

        console.log('Email sent successfully to:', item.reminderEmail);
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

// Send a test email with sample recipe suggestions
export async function sendTestEmail(testEmail: string): Promise<{ success: boolean; message: string }> {
    if (!isEmailConfigured()) {
        return {
            success: false,
            message: 'EmailJS is not configured. Please update credentials in emailService.ts'
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

        const expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Build comprehensive message content
        let recipeSection = '';
        if (recipes.length > 0) {
            recipeSection = `
🍳 RECIPE SUGGESTIONS TO USE YOUR CHICKEN:

`;
            recipes.forEach((recipe, index) => {
                recipeSection += `${index + 1}. ${recipe.name}
   📸 Image: ${recipe.image}
   🏷️ Category: ${recipe.category || 'Main Dish'}
   🌍 Cuisine: ${recipe.area || 'International'}
   ⏱️ Ready in: ${recipe.readyInMinutes || 30} minutes
   🍽️ Servings: ${recipe.servings || 4}
   ✅ Uses your ingredients: ${recipe.matchedIngredients.join(', ')}

`;
            });
        } else {
            recipeSection = `
🍳 We couldn't find recipes at this time. Try searching for chicken recipes online!
`;
        }

        // Create full email message that works with simple templates
        const fullMessage = `
🍗 EXPIRY ALERT: Chicken

Your item "Chicken" is expiring on ${expiryDate} (in 3 days)!

Don't let it go to waste! Here are some delicious recipes you can make:
${recipeSection}
────────────────────────────────
This is a test email from Smart Bite 🌿
Your Food Inventory Manager
────────────────────────────────
        `.trim();

        const params = {
            to_email: testEmail,
            to_name: 'Smart Bite User',
            from_name: 'Smart Bite',
            subject: '🍗 Expiry Alert: Chicken expires in 3 days!',
            message: fullMessage,
            // Also include individual fields for templates that use them
            item_name: 'Chicken',
            expiry_date: expiryDate,
            days_left: 3,
            recipe_1_name: recipes[0]?.name || '',
            recipe_1_image: recipes[0]?.image || '',
            recipe_2_name: recipes[1]?.name || '',
            recipe_2_image: recipes[1]?.image || '',
            recipe_3_name: recipes[2]?.name || '',
            recipe_3_image: recipes[2]?.image || ''
        };

        const emailjs = await import('@emailjs/browser');
        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            params as unknown as Record<string, unknown>,
            EMAILJS_PUBLIC_KEY
        );

        return {
            success: true,
            message: `Test email sent successfully to ${testEmail}!`
        };
    } catch (error) {
        console.error('Failed to send test email:', error);
        return {
            success: false,
            message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
