const { findNearestStop } = require('../repositories/locationRepository');
const { getAddressFromCoordinates } = require('../services/geocodingService');

const getNearestStop = async (req, res) => {
    const { lat, lng } = req.body || {};
    if (
        typeof lat !== 'number' ||
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90 ||
        typeof lng !== 'number' ||
        !Number.isFinite(lng) ||
        lng < -180 ||
        lng > 180
    ) {
        return res.status(400).json({
            success: false,
            message: "Parameter lat dan lng wajib berupa angka koordinat yang valid."
        });
    }

    try {
        const address = await getAddressFromCoordinates(lat, lng);
        const nearestStop = await findNearestStop(lat, lng);

        if (!nearestStop) {
            return res.status(404).json({
                success: false,
                message: "Tidak ada halte aktif dengan koordinat yang tersedia."
            });
        }

        return res.status(200).json({
            success: true,
            address,
            nearest_stop: {
                stop_id: nearestStop.stop_id,
                name: nearestStop.name,
                address: nearestStop.address,
                distance_meters: nearestStop.distance_meters
            }
        });
    } catch (error) {
        console.error("Error Get Nearest Stop:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mendeteksi lokasi dan halte terdekat."
        });
    }
};

module.exports = { getNearestStop };
