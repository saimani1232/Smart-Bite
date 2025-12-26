import * as jose from 'jose';

// Service Account Credentials
const SERVICE_ACCOUNT = {
    client_email: "cloud-236@gen-lang-client-0283998814.iam.gserviceaccount.com",
    private_key: `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDmTYRh+1mVvMjW
BHpiEGSvp/oLumly/lGg2H7SJ6b+3bNVutPoVcqBLUpN6vllgMS8x7omW3lkFSg5
c+GdkXCaSqW+BOhZYnofY/T8xtijaYBRVxqKI36hVyaMVGXud/aaB+QFcr+iIBDM
1YONfMinJgarqbp0gPCP4DuNPkgMiJqO4Jy6ZiL+J9QpwgMWo30Sa89sBzeXtrQg
reOJ6gpKbMifLPgTT83HsbVbDSysn9uLJqYP63j8CaJFdviONhn9dAa/Il2kVlRk
Ss/lGZVQMCgOxwaBIU+1hxhimSIS72ijp7mS1BorwJjgSgVAy8Ft9OGQkR6aHw+9
r/2IyyR3AgMBAAECggEAIQXAyOCRbg2Vn052vUShff3Fi6n36ykOoP7PYdNADZp8
16WZiLPIfNuheb5gHWRTPB3IEi5FSosCwLOI3cmYI5+MLXd8WNjB2b9rm6qS2gz2
J8j9bAz+is7kHvS5GvJboKbR/3qpLMDmonWueSVei3fB4W/NuwfZYUqjRLOcrCMi
og+x9BPbS/tYT7H5uiClLmg4zL1dbTjzNjYiETurMCGd5AoPkRkwKfdPwxsxEucT
FTkQqIeYHp0FEhxZ58JpSUXWxC7fWoPOsJh3jTmjLaZXMhE8cK9GH4YYU93v3XHk
lIvskXJaJtW+K5spMm3jS5UcrT4h8wpqaYVBW80KGQKBgQD1KxAwD1Zed76BXCv7
L3bku9p2q0a1tD0ZWYuE3bZL3SL2bup137WFhN6aSSF+EEtNvPZDDRB/W7/rBzJC
/31u7D167S0xshh0k62NTDE/mxHhDlI3cKmSN6IlfKC1rzNEQraLlo6a4FDikFYt
cJOrDPjBFWsLc2y/R73lRphFvwKBgQDwelIpKLVCOtCZlPbcbRZEI9c9ebRI4bwg
n62WmsrdAwRhQ9754/+WzQCnMoNAyRXUO2980zz09kiNkEY1BDaO2AKP9drLrgN9
EaROrbTXKfgHZe5WGg9s/xWz8B65ZvFHBf07MBV4lDLidTz2STDHxtP5TAnXkVAS
KNBSe5r/SQKBgQDOGhOTs3ESHWwjZ475rN8wTtPK6xWYbxrmEqb9XT2A7TgVHw0v
Zo883YQdA9mKFryXb4E+wN7bkg/2zqfsNsgF1cehbX2Ox39TkUpW/HRyWjRflCB9
xtJmvyoqhWi9E7nvan33PuxHOsgEjv5DWN5q7463EwBYMgJ7kx4KfpxIFQKBgQDF
DgcbcR8u2VEsONQdBkrzpUbwOjWQb2GgfhhZzBgmCR3isiIaNUmwgeZiG9NQGDcK
BXYzHEncFaCYWDwfn4cxgDKBUx5qPvre1sEEM/V3Rw3WyiEGby5qy5A2NbKHjKJz
56V9hcZiW1ZjGVzOGGWfnv7+Tt/VxF6PsuAaZu04+QKBgQDTBFRcd++6lhBOM64L
bcjGmPIT1R/GV/kt4j6e2RBfxlBjC8bV61ZqTedbQkbykcQvz4oT0MLfygAmZ20/
x6ssSRebPB77MnwLvqzpySdoe9alljjdufxH6dBJCHLtU7opDVCEGTZyQur4hnfj
fAGT0Lh7JFfj73pHxcimORj5Qg==
-----END PRIVATE KEY-----`,
    token_uri: "https://oauth2.googleapis.com/token"
};

let cachedToken: { token: string; expiry: number } | null = null;

// Get access token using service account JWT
async function getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (cachedToken && Date.now() < cachedToken.expiry - 60000) {
        return cachedToken.token;
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: SERVICE_ACCOUNT.client_email,
        sub: SERVICE_ACCOUNT.client_email,
        aud: SERVICE_ACCOUNT.token_uri,
        iat: now,
        exp: now + 3600,
        scope: "https://www.googleapis.com/auth/cloud-vision"
    };

    // Import the private key
    const privateKey = await jose.importPKCS8(SERVICE_ACCOUNT.private_key, 'RS256');

    // Create signed JWT
    const jwt = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .sign(privateKey);

    // Exchange JWT for access token
    const tokenResponse = await fetch(SERVICE_ACCOUNT.token_uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
        throw new Error(`Token error: ${tokenData.error_description || tokenData.error}`);
    }

    cachedToken = {
        token: tokenData.access_token,
        expiry: Date.now() + (tokenData.expires_in * 1000)
    };

    return cachedToken.token;
}

// Call Cloud Vision API for text detection
export async function extractTextFromImage(base64Image: string): Promise<string> {
    const accessToken = await getAccessToken();

    const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            requests: [{
                image: { content: base64Image },
                features: [{ type: 'TEXT_DETECTION' }]
            }]
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(`Vision API error: ${data.error.message}`);
    }

    // Get full text from response
    const fullText = data.responses?.[0]?.fullTextAnnotation?.text ||
        data.responses?.[0]?.textAnnotations?.[0]?.description || '';

    return fullText;
}

// Smart date extraction from OCR text
export function extractExpiryDate(ocrText: string): string | null {
    console.log('OCR Text:', ocrText);

    const lines = ocrText.split('\n');

    // Look for lines containing expiry keywords
    const expiryKeywords = ['use by', 'best before', 'expiry', 'exp', 'bb', 'best by', 'exp date'];
    const ignoreKeywords = ['pkd', 'mfg', 'mfd', 'packed', 'manufacturing', 'mrp'];

    // Date pattern: DD/MM/YY or DD/MM/YYYY or DD-MM-YY etc.
    // eslint-disable-next-line no-useless-escape
    const datePattern = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g;

    // First, try to find date on lines with expiry keywords
    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        // Skip lines with ignore keywords
        if (ignoreKeywords.some(kw => lowerLine.includes(kw))) {
            continue;
        }

        // Check if line has expiry keyword
        if (expiryKeywords.some(kw => lowerLine.includes(kw))) {
            const matches = line.match(datePattern);
            if (matches && matches.length > 0) {
                const parsed = parseDate(matches[0]);
                if (parsed) {
                    console.log('Found expiry date on line:', line, '→', parsed);
                    return parsed;
                }
            }
        }
    }

    // If no keyword match, look for dates not on ignore lines
    const allDates: { date: string; parsed: string }[] = [];

    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        // Skip lines with ignore keywords
        if (ignoreKeywords.some(kw => lowerLine.includes(kw))) {
            continue;
        }

        const matches = line.match(datePattern);
        if (matches) {
            for (const match of matches) {
                const parsed = parseDate(match);
                if (parsed) {
                    allDates.push({ date: match, parsed });
                }
            }
        }
    }

    // Return the latest future date (most likely expiry)
    if (allDates.length > 0) {
        const today = new Date();
        const futureDates = allDates.filter(d => new Date(d.parsed) > today);

        if (futureDates.length > 0) {
            // Sort by date descending and return the latest
            futureDates.sort((a, b) => new Date(b.parsed).getTime() - new Date(a.parsed).getTime());
            console.log('Using latest future date:', futureDates[0]);
            return futureDates[0].parsed;
        }

        // If no future dates, return the first one found
        console.log('No future dates, using first found:', allDates[0]);
        return allDates[0].parsed;
    }

    return null;
}

// Parse date string to YYYY-MM-DD format
function parseDate(dateStr: string): string | null {
    // eslint-disable-next-line no-useless-escape
    const match = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (!match) return null;

    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    let year = parseInt(match[3]);

    // Fix 2-digit year
    if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
    }

    // Validate
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ============ BARCODE DETECTION ============

export interface ProductInfo {
    name: string;
    category: 'Dairy' | 'Grain' | 'Vegetable' | 'Meat' | 'Other';
    estimatedExpiryDays: number;
    barcode: string;
}

// Detect barcode from image using Cloud Vision
export async function detectBarcode(base64Image: string): Promise<string | null> {
    const accessToken = await getAccessToken();

    const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            requests: [{
                image: { content: base64Image },
                features: [
                    { type: 'TEXT_DETECTION' }
                ]
            }]
        })
    });

    const data = await response.json();
    console.log('Barcode Detection Response:', data);

    // Get all text from the image
    const text = data.responses?.[0]?.fullTextAnnotation?.text ||
        data.responses?.[0]?.textAnnotations?.[0]?.description || '';

    console.log('Extracted text from barcode image:', text);

    // Remove all whitespace and newlines, then look for barcode patterns
    const cleanText = text.replace(/\s+/g, '');
    console.log('Cleaned text:', cleanText);

    // Look for barcode patterns (8-14 digit numbers)
    // EAN-13: 13 digits, EAN-8: 8 digits, UPC-A: 12 digits
    const barcodePattern = /(\d{8,14})/g;
    const matches = cleanText.match(barcodePattern);

    console.log('Barcode pattern matches:', matches);

    if (matches && matches.length > 0) {
        // Filter to valid barcode lengths (8, 12, 13, 14)
        const validBarcodes = matches.filter((m: string) =>
            m.length === 8 || m.length === 12 || m.length === 13 || m.length === 14
        );

        if (validBarcodes.length > 0) {
            // Return the longest valid barcode
            const barcode = validBarcodes.sort((a: string, b: string) => b.length - a.length)[0];
            console.log('Detected barcode:', barcode);
            return barcode;
        }

        // If no valid length, return the longest match anyway
        const barcode = matches.sort((a: string, b: string) => b.length - a.length)[0];
        console.log('Using longest match as barcode:', barcode);
        return barcode;
    }

    // Try to find numbers with spaces (like "8 901725 015275")
    const spacedPattern = /(\d[\d\s]{10,})/g;
    const spacedMatches = text.match(spacedPattern);

    if (spacedMatches && spacedMatches.length > 0) {
        const barcode = spacedMatches[0].replace(/\s/g, '');
        console.log('Found spaced barcode:', barcode);
        return barcode;
    }

    console.log('No barcode found in image');
    return null;
}

// Waterfall barcode lookup: Open Food Facts → UPCitemdb → Unknown (manual entry)
export async function lookupProduct(barcode: string): Promise<ProductInfo | null> {
    // Clean barcode (remove spaces)
    const cleanBarcode = barcode.replace(/\s/g, '');
    console.log('🔍 Looking up barcode:', cleanBarcode);

    // Create a timeout promise
    const timeout = (ms: number) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
    );

    // Step 1: Try Open Food Facts first (better for food products)
    console.log('Step 1: Checking Open Food Facts...');
    try {
        const response = await Promise.race([
            fetch(`/api/openfoodfacts/product/${cleanBarcode}.json`),
            timeout(5000)
        ]) as Response;

        if (response.ok) {
            const data = await response.json();
            console.log('Open Food Facts Response:', data);

            if (data.status === 1 && data.product) {
                const product = data.product;
                const productName = product.product_name || product.generic_name;

                if (productName) {
                    const categories = (product.categories_tags || []).join(' ').toLowerCase();
                    const category = mapToCategory(categories, productName);
                    const expiryDays = getEstimatedExpiryDays(category, categories);

                    console.log('✅ Found in Open Food Facts:', productName);
                    return {
                        name: productName,
                        category: category,
                        estimatedExpiryDays: expiryDays,
                        barcode: cleanBarcode
                    };
                }
            }
        }
        console.log('❌ Not found in Open Food Facts');
    } catch (error) {
        console.log('⏱️ Open Food Facts timeout/error:', error);
    }

    // Step 2: Try UPCitemdb as fallback
    console.log('Step 2: Checking UPCitemdb...');
    try {
        const response = await Promise.race([
            fetch(`/api/upcitemdb/prod/trial/lookup?upc=${cleanBarcode}`),
            timeout(5000)
        ]) as Response;

        if (response.ok) {
            const data = await response.json();
            console.log('UPCitemdb Response:', data);

            if (data.items && data.items.length > 0) {
                const item = data.items[0];
                const productName = item.title || item.brand;

                if (productName) {
                    const categoryStr = (item.category || '').toLowerCase();
                    const category = mapToCategory(categoryStr, productName);
                    const expiryDays = getEstimatedExpiryDays(category, categoryStr);

                    console.log('✅ Found in UPCitemdb:', productName);
                    return {
                        name: productName,
                        category: category,
                        estimatedExpiryDays: expiryDays,
                        barcode: cleanBarcode
                    };
                }
            }
        }
        console.log('❌ Not found in UPCitemdb');
    } catch (error) {
        console.log('⏱️ UPCitemdb timeout/error:', error);
    }

    // Step 3: Return null to signal "Unknown Item" - user types name manually
    console.log('📝 Product not found - user will enter name manually');
    return {
        name: '', // Empty name signals manual entry needed
        category: 'Other',
        estimatedExpiryDays: 30,
        barcode: cleanBarcode
    };
}

// Map Open Food Facts categories to our categories
function mapToCategory(categories: string, productName: string): ProductInfo['category'] {
    const lowerName = productName.toLowerCase();
    const lowerCats = categories.toLowerCase();

    // Dairy
    if (lowerCats.includes('dairy') || lowerCats.includes('milk') || lowerCats.includes('cheese') ||
        lowerCats.includes('yogurt') || lowerCats.includes('butter') || lowerCats.includes('cream') ||
        lowerCats.includes('lassi') || lowerCats.includes('paneer') ||
        lowerName.includes('milk') || lowerName.includes('cheese') || lowerName.includes('yogurt') ||
        lowerName.includes('butter') || lowerName.includes('paneer') || lowerName.includes('curd') ||
        lowerName.includes('dahi') || lowerName.includes('ghee') || lowerName.includes('lassi')) {
        return 'Dairy';
    }

    // Meat
    if (lowerCats.includes('meat') || lowerCats.includes('poultry') || lowerCats.includes('fish') ||
        lowerCats.includes('seafood') || lowerCats.includes('chicken') || lowerCats.includes('beef') ||
        lowerName.includes('chicken') || lowerName.includes('mutton') || lowerName.includes('fish') ||
        lowerName.includes('egg') || lowerName.includes('meat') || lowerName.includes('prawn') ||
        lowerName.includes('kebab') || lowerName.includes('sausage')) {
        return 'Meat';
    }

    // Vegetable/Fruits
    if (lowerCats.includes('vegetable') || lowerCats.includes('fruit') || lowerCats.includes('produce') ||
        lowerCats.includes('fresh') || lowerCats.includes('salad') ||
        lowerName.includes('vegetable') || lowerName.includes('fruit') || lowerName.includes('sabzi')) {
        return 'Vegetable';
    }

    // Grain/Snacks/Biscuits - EXPANDED
    if (lowerCats.includes('grain') || lowerCats.includes('bread') || lowerCats.includes('cereal') ||
        lowerCats.includes('flour') || lowerCats.includes('rice') || lowerCats.includes('pasta') ||
        lowerCats.includes('biscuit') || lowerCats.includes('cookie') || lowerCats.includes('snack') ||
        lowerCats.includes('cracker') || lowerCats.includes('wafer') || lowerCats.includes('rusk') ||
        lowerCats.includes('namkeen') || lowerCats.includes('chips') || lowerCats.includes('noodle') ||
        lowerName.includes('bread') || lowerName.includes('rice') || lowerName.includes('flour') ||
        lowerName.includes('biscuit') || lowerName.includes('cookie') || lowerName.includes('chips') ||
        lowerName.includes('namkeen') || lowerName.includes('bhujia') || lowerName.includes('mixture') ||
        lowerName.includes('rusk') || lowerName.includes('toast') || lowerName.includes('cracker') ||
        lowerName.includes('wafer') || lowerName.includes('noodle') || lowerName.includes('maggi') ||
        lowerName.includes('parle') || lowerName.includes('britannia') || lowerName.includes('oreo') ||
        lowerName.includes('kurkure') || lowerName.includes('lays') || lowerName.includes('haldiram')) {
        return 'Grain';
    }

    return 'Other';
}

// Estimate shelf life based on category
function getEstimatedExpiryDays(category: ProductInfo['category'], categories: string): number {
    // Check for specific subcategories
    if (categories.includes('fresh') || categories.includes('refrigerated')) {
        return 7; // Fresh items: ~1 week
    }

    if (categories.includes('frozen')) {
        return 90; // Frozen items: ~3 months
    }

    switch (category) {
        case 'Dairy':
            return 14; // Dairy: ~2 weeks
        case 'Meat':
            return 5; // Fresh meat: ~5 days
        case 'Vegetable':
            return 7; // Fresh produce: ~1 week  
        case 'Grain':
            return 180; // Dry goods: ~6 months
        default:
            return 30; // Default: ~1 month
    }
}

// Estimate product info from barcode country prefix if no database match

export function estimateFromBarcode(barcode: string): ProductInfo {
    // Common prefixes:
    // 890 = India
    // 400-440 = Germany
    // 00-13 = USA/Canada

    // For Indian products (890), could add specific logic
    // For now, return generic info
    return {
        name: 'Unknown Product',
        category: 'Other',
        estimatedExpiryDays: 30,
        barcode: barcode
    };
}
