import axios from 'axios';

/**
 * Fetches and aggregates bike availability data from Shopify and Izyrent APIs
 * This runs entirely in the browser - no backend needed!
 */

const SHOPIFY_PRODUCTS_URL = 'https://xpertmoto.com.au/products.json?limit=250';
const IZYRENT_API_URL = 'https://izyrent.speaz.com/front/get_bookings';
const SHOP_DOMAIN = '7f13fc-4d.myshopify.com';

/**
 * Fetches product images from Shopify
 */
export async function fetchProductImages() {
    try {
        const response = await axios.get(SHOPIFY_PRODUCTS_URL);
        const imageMap = {};

        response.data.products.forEach(p => {
            if (p.images && p.images.length > 0) {
                imageMap[p.handle] = p.images[0].src;
            }
        });

        return imageMap;
    } catch (error) {
        console.error('[Fetch] Failed to fetch product images:', error.message);
        return {};
    }
}

/**
 * Fetches booking data from Izyrent for a specific bike variant
 */
async function fetchBookings(product) {
    try {
        const payload = {
            shop: SHOP_DOMAIN,
            idProduct: parseInt(product.productId),
            countLastRangeDay: false,
            interval: {
                stock: product.metafields.stock || "product",
                variantStock: {
                    product: product.metafields.variantStock.product,
                    [product.variantId]: product.metafields.variantStock[product.variantId]
                }
            },
            timeRange: false,
            expiration: 15
        };

        const response = await axios.post(IZYRENT_API_URL, payload, {
            timeout: 10000,
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8'
            }
        });

        return response.data;
    } catch (error) {
        console.error(`[Fetch] Failed to fetch bookings for ${product.name}:`, error.message);
        return {};
    }
}

/**
 * Extracts bike metadata synchronously from example.json
 * Returns immediately with bike info (names, images, pricing) but no bookings
 * @param {Object} exampleData - The parsed example.json data
 * @param {Object} imageMap - Pre-fetched product images from Shopify
 * @returns {Object} Initial bike data with global settings
 */
export function extractBikeMetadata(exampleData, imageMap) {
    console.log('[Fetch] Extracting bike metadata...');

    const bikes = [];
    const seenVariantIds = new Set();

    Object.entries(exampleData.data).forEach(([key, product]) => {
        if (!product) return;

        try {
            const metafields = JSON.parse(product.newMetafields.value);
            const variants = metafields.variantStock;

            Object.entries(variants).forEach(([variantId, variantData]) => {
                if (variantId === 'product') return;

                // Skip if we've already seen this variantId
                if (seenVariantIds.has(variantId)) {
                    console.log(`[Fetch] Skipping duplicate variant: ${variantId}`);
                    return;
                }
                seenVariantIds.add(variantId);

                const variantPrices = variantData.prices || [];

                bikes.push({
                    handle: product.handle,
                    productId: product.id.split('/').pop(),
                    variantId: variantId,
                    name: product.handle.replace(/-/g, ' ').replace(' rental', '').toUpperCase(),
                    stock: parseInt(variantData.stock || 1),
                    imageUrl: imageMap[product.handle] || null,
                    pricing: variantPrices,
                    metafields: metafields,
                    bookings: undefined, // Will be populated progressively
                    isLoading: true
                });
            });
        } catch (e) {
            console.error(`[Fetch] Error parsing metafields for ${key}:`, e.message);
        }
    });

    const globalSettings = extractGlobalSettings(exampleData);

    console.log(`[Fetch] Extracted ${bikes.length} bike variants`);

    return {
        bikes,
        globalSettings,
        lastUpdated: new Date().toISOString()
    };
}

/**
 * Fetches bookings progressively with callbacks for each completed bike
 * @param {Array} bikes - Bike metadata array
 * @param {Object} callbacks - { onBikeUpdate, onProgress, onComplete }
 */
export async function fetchBookingsProgressively(bikes, { onBikeUpdate, onProgress, onComplete }) {
    console.log('[Fetch] Starting progressive booking fetch...');

    const total = bikes.length;

    for (let i = 0; i < bikes.length; i++) {
        const bike = bikes[i];
        console.log(`[Fetch] Fetching bookings for ${bike.name}... (${i + 1}/${total})`);

        // Report progress
        if (onProgress) {
            onProgress({ current: i + 1, total, name: bike.name });
        }

        const bookings = await fetchBookings(bike);

        // Call update callback with completed bike data
        if (onBikeUpdate) {
            onBikeUpdate(bike.variantId, {
                bookings,
                isLoading: false
            });
        }
    }

    console.log('[Fetch] All bookings fetched!');

    if (onComplete) {
        onComplete();
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use extractBikeMetadata + fetchBookingsProgressively instead
 */
export async function fetchAvailabilityData(exampleData, onProgress = null) {
    console.log('[Fetch] Starting data aggregation...');

    // Fetch product images
    console.log('[Fetch] Fetching product images from Shopify...');
    const imageMap = await fetchProductImages();

    // Extract metadata
    const { bikes, globalSettings } = extractBikeMetadata(exampleData, imageMap);

    // Fetch bookings synchronously
    const availability = [];
    const total = bikes.length;

    for (let i = 0; i < bikes.length; i++) {
        const bike = bikes[i];
        console.log(`[Fetch] Fetching bookings for ${bike.name}... (${i + 1}/${total})`);

        if (onProgress) {
            onProgress({ current: i + 1, total, name: bike.name });
        }

        const bookings = await fetchBookings(bike);

        availability.push({
            ...bike,
            bookings: bookings,
            isLoading: false
        });
    }

    console.log('[Fetch] Data aggregation complete!');

    return {
        lastUpdated: new Date().toISOString(),
        globalSettings,
        availability
    };
}

/**
 * Extracts global closure settings from example.json
 */
function extractGlobalSettings(exampleData) {
    try {
        const firstProduct = Object.values(exampleData.data).find(p => p && p.newMetafields);
        if (!firstProduct) return { closures: [0], disabledDatesGlobal: {} };

        const metafields = JSON.parse(firstProduct.newMetafields.value);
        return {
            closures: metafields.closures || [0], // Default: Sundays closed
            disabledDatesGlobal: metafields.disabledDatesGlobal || {}
        };
    } catch (e) {
        console.error('[Fetch] Error extracting global settings:', e.message);
        return { closures: [0], disabledDatesGlobal: {} };
    }
}
