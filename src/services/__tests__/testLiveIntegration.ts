// Live End-to-End Test for SmartBite Recipe Service & TheMealDB Integration
import { findBestRecipes } from '../recipeService';
import type { InventoryItem } from '../../types';

async function testLive() {
    console.log('🌐 Testing live TheMealDB integration with SmartBite intelligent engine...\n');

    const mockInventory: InventoryItem[] = [
        {
            id: '1',
            name: 'Chicken Breast',
            expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Expiring tomorrow!
            quantity: 500,
            unit: 'g',
            category: 'Meat',
            isOpened: false,
            status: 'Expiring Soon',
            reminderDays: 2
        },
        {
            id: '2',
            name: 'Garlic',
            expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            quantity: 3,
            unit: 'pcs',
            category: 'Vegetable',
            isOpened: false,
            status: 'Good',
            reminderDays: 2
        },
        {
            id: '3',
            name: 'Onion',
            expiryDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            quantity: 2,
            unit: 'pcs',
            category: 'Vegetable',
            isOpened: false,
            status: 'Good',
            reminderDays: 2
        },
        {
            id: '4',
            name: 'Tomatoes',
            expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Expiring in 2 days!
            quantity: 4,
            unit: 'pcs',
            category: 'Vegetable',
            isOpened: false,
            status: 'Expiring Soon',
            reminderDays: 2
        }
    ];

    console.log('📦 User Inventory:');
    mockInventory.forEach(i => console.log(` - ${i.name} (Status: ${i.status})`));

    console.log('\n🔍 Fetching recommended recipes for "Chicken"...');
    const start = Date.now();
    const recipes = await findBestRecipes('Chicken', mockInventory);
    const duration1 = Date.now() - start;

    console.log(`⏱️ Query 1 duration: ${duration1}ms`);
    console.log(`📋 Found ${recipes.length} recipes:\n`);

    recipes.forEach((r, idx) => {
        console.log(`[${idx + 1}] ${r.name}`);
        console.log(`    Match Tier: ${r.matchTier} | Match: ${r.matchPercentage}% | Score: ${r.scoreBreakdown?.totalScore}`);
        console.log(`    Matched (${r.matchedIngredients.length}): ${r.matchedIngredients.join(', ')}`);
        console.log(`    Missing (${r.missingIngredients.length}): ${r.missingIngredients.slice(0, 3).join(', ')}${r.missingIngredients.length > 3 ? '...' : ''}`);
        console.log(`    Expiring Used: ${r.expiringMatchCount}`);
    });

    console.log('\n⚡ Testing Cache Speed on Repeat Query:');
    const start2 = Date.now();
    const cachedRecipes = await findBestRecipes('Chicken', mockInventory);
    const duration2 = Date.now() - start2;
    console.log(`⏱️ Query 2 (cached) duration: ${duration2}ms (Speedup: ${(duration1 / Math.max(1, duration2)).toFixed(1)}x faster!)`);

    if (recipes.length > 0 && cachedRecipes.length === recipes.length) {
        console.log('\n✅ Live test passed with flying colors!');
    } else {
        console.error('\n❌ Unexpected result in live test');
        process.exit(1);
    }
}

testLive().catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
