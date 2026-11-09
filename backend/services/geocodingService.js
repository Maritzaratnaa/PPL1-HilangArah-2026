const FALLBACK_ADDRESS = "Alamat tidak terdeteksi";
const REQUEST_TIMEOUT_MS = 5000;

const getAddressFromCoordinates = async (latitude, longitude) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("Google Geocoding API key is not configured.");
        return FALLBACK_ADDRESS;
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.search = new URLSearchParams({
        latlng: `${latitude},${longitude}`,
        key: apiKey
    }).toString();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            console.error(`Google Geocoding API returned HTTP ${response.status}.`);
            return FALLBACK_ADDRESS;
        }

        const result = await response.json();
        const address = result.results?.[0]?.formatted_address;
        if (result.status !== "OK" || !address) {
            console.error(`Google Geocoding API returned status ${result.status || "UNKNOWN"}.`);
            return FALLBACK_ADDRESS;
        }

        return address;
    } catch (error) {
        console.error(`Google reverse geocoding failed: ${error.name || "request error"}.`);
        return FALLBACK_ADDRESS;
    } finally {
        clearTimeout(timeout);
    }
};

module.exports = { getAddressFromCoordinates, FALLBACK_ADDRESS };
