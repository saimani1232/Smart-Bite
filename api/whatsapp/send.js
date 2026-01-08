// WhatsApp Message API - Send reminder via Twilio
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

    // Log incoming request
    console.log('📱 WhatsApp API called');
    console.log('📦 Body:', JSON.stringify(req.body));

    try {
        const { to, itemName, expiryDate, daysLeft, recipes } = req.body || {};

        // Validation
        if (!to || !itemName || !expiryDate) {
            console.log('❌ Missing fields:', { to: !!to, itemName: !!itemName, expiryDate: !!expiryDate });
            return res.status(400).json({ error: 'Missing required fields: to, itemName, expiryDate' });
        }

        // Check Twilio config
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

        console.log('🔑 Twilio config check:');
        console.log('  - ACCOUNT_SID set:', !!accountSid, accountSid ? `(starts with ${accountSid.substring(0, 5)}...)` : '');
        console.log('  - AUTH_TOKEN set:', !!authToken);
        console.log('  - WHATSAPP_NUMBER set:', !!twilioWhatsAppNumber, twilioWhatsAppNumber || '');

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
            // Assume India if no country code
            phoneNumber = '+91' + phoneNumber;
        }
        console.log('📞 Formatted phone:', phoneNumber);

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

        console.log('📝 Message built, length:', message.length);

        // Send via Twilio
        console.log('📤 Initializing Twilio client...');
        const client = twilio(accountSid, authToken);
        
        console.log('📤 Sending message...');
        console.log('  - From: whatsapp:' + twilioWhatsAppNumber);
        console.log('  - To: whatsapp:' + phoneNumber);

        const result = await client.messages.create({
            body: message,
            from: `whatsapp:${twilioWhatsAppNumber}`,
            to: `whatsapp:${phoneNumber}`
        });

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
        console.error('❌ Full error:', error);
        
        // Check for specific Twilio errors
        if (error.code) {
            console.error('❌ Twilio error code:', error.code);
        }
        
        return res.status(500).json({ 
            error: 'Failed to send WhatsApp message',
            details: error.message,
            code: error.code || 'UNKNOWN'
        });
    }
}
