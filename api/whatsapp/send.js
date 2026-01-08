// WhatsApp Message API - Send reminder via Twilio (with image support)
import twilio from 'twilio';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('📱 WhatsApp API called');

    try {
        const { to, itemName, expiryDate, daysLeft, recipes } = req.body || {};

        // Validation
        if (!to || !itemName || !expiryDate) {
            return res.status(400).json({ error: 'Missing required fields: to, itemName, expiryDate' });
        }

        // Check Twilio config
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

        if (!accountSid || !authToken || !twilioWhatsAppNumber) {
            console.error('❌ Twilio environment variables not configured!');
            return res.status(500).json({ 
                error: 'WhatsApp service not configured',
                details: 'Missing Twilio environment variables'
            });
        }

        // Format phone number for WhatsApp
        let phoneNumber = to.replace(/\s+/g, '').replace(/-/g, '');
        if (!phoneNumber.startsWith('+')) {
            phoneNumber = '+91' + phoneNumber;
        }

        // Build message with recipe links
        let message = `🍎 *SmartBite Reminder*\n\n`;
        message += `Your *${itemName}* expires on *${expiryDate}*`;
        
        if (daysLeft !== undefined) {
            if (daysLeft <= 0) {
                message += ` ⚠️ *(Expired!)*`;
            } else if (daysLeft === 1) {
                message += ` ⏰ *(Tomorrow!)*`;
            } else {
                message += ` 📅 *(${daysLeft} days left)*`;
            }
        }
        message += `\n`;

        // Add recipes with links
        if (recipes && recipes.length > 0) {
            message += `\n🍳 *Recipe Ideas to use it up:*\n\n`;
            recipes.slice(0, 3).forEach((recipe, i) => {
                message += `*${i + 1}. ${recipe.name}*\n`;
                if (recipe.link) {
                    message += `   📖 ${recipe.link}\n`;
                }
                message += `\n`;
            });
        }

        message += `━━━━━━━━━━━━━━━━━━\n`;
        message += `Don't let good food go to waste! 🌿\n`;
        message += `_Sent by SmartBite_`;

        // Initialize Twilio client
        const client = twilio(accountSid, authToken);
        
        // Get the first recipe image (if available) to send as media
        const firstRecipeWithImage = recipes?.find(r => r.image);
        
        console.log('📤 Sending WhatsApp message...');
        console.log('  - To:', phoneNumber);
        console.log('  - Has image:', !!firstRecipeWithImage);

        // Build message options
        const messageOptions = {
            body: message,
            from: `whatsapp:${twilioWhatsAppNumber}`,
            to: `whatsapp:${phoneNumber}`
        };

        // Add media URL if available (recipe image)
        if (firstRecipeWithImage && firstRecipeWithImage.image) {
            messageOptions.mediaUrl = [firstRecipeWithImage.image];
            console.log('  - Media URL:', firstRecipeWithImage.image);
        }

        const result = await client.messages.create(messageOptions);

        console.log('✅ WhatsApp message sent!');
        console.log('  - SID:', result.sid);
        console.log('  - Status:', result.status);

        return res.status(200).json({
            success: true,
            messageId: result.sid,
            status: result.status
        });

    } catch (error) {
        console.error('❌ WhatsApp error:', error.message);
        console.error('❌ Error code:', error.code);
        
        return res.status(500).json({ 
            error: 'Failed to send WhatsApp message',
            details: error.message,
            code: error.code || 'UNKNOWN'
        });
    }
}
