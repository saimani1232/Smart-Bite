// WhatsApp Message API - Send reminder via Twilio
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

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

    try {
        const { to, itemName, expiryDate, daysLeft, recipes } = req.body || {};

        // Validation
        if (!to || !itemName || !expiryDate) {
            return res.status(400).json({ error: 'Missing required fields: to, itemName, expiryDate' });
        }

        // Check Twilio config
        if (!accountSid || !authToken || !twilioWhatsAppNumber) {
            console.error('Twilio not configured');
            return res.status(500).json({ error: 'WhatsApp service not configured' });
        }

        // Format phone number for WhatsApp
        let phoneNumber = to.replace(/\s+/g, '').replace(/-/g, '');
        if (!phoneNumber.startsWith('+')) {
            // Assume India if no country code
            phoneNumber = '+91' + phoneNumber;
        }

        // Build message
        let message = `🍎 *SmartBite Reminder*\n\n`;
        message += `Your *${itemName}* expires on *${expiryDate}*`;
        
        if (daysLeft !== undefined) {
            if (daysLeft <= 0) {
                message += ` (Expired!)`;
            } else if (daysLeft === 1) {
                message += ` (Tomorrow!)`;
            } else {
                message += ` (${daysLeft} days left)`;
            }
        }
        message += `\n\n`;

        // Add recipes if provided
        if (recipes && recipes.length > 0) {
            message += `🍳 *Recipe Ideas:*\n`;
            recipes.slice(0, 3).forEach((recipe, i) => {
                message += `${i + 1}. ${recipe.name}\n`;
            });
            message += `\n`;
        }

        message += `Don't let it go to waste! 🌿`;

        // Send via Twilio
        const client = twilio(accountSid, authToken);
        
        const result = await client.messages.create({
            body: message,
            from: `whatsapp:${twilioWhatsAppNumber}`,
            to: `whatsapp:${phoneNumber}`
        });

        console.log('WhatsApp message sent:', result.sid);

        return res.status(200).json({
            success: true,
            messageId: result.sid,
            status: result.status
        });

    } catch (error) {
        console.error('WhatsApp error:', error);
        return res.status(500).json({ 
            error: 'Failed to send WhatsApp message',
            details: error.message 
        });
    }
}
