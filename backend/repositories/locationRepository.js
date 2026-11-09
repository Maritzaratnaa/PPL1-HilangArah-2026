const pool = require('../db');

const findNearestStop = async (latitude, longitude) => {
    const query = `
        SELECT
            stop_id,
            name,
            address,
            latitude,
            longitude,
            (
                6371000 * 2 * ASIN(LEAST(1, SQRT(
                    POWER(SIN(RADIANS(latitude - ?) / 2), 2) +
                    COS(RADIANS(?)) * COS(RADIANS(latitude)) *
                    POWER(SIN(RADIANS(longitude - ?) / 2), 2)
                )))
            ) AS distance_meters
        FROM stops
        WHERE is_active = 1
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
        ORDER BY distance_meters ASC
        LIMIT 1
    `;

    const [rows] = await pool.query(query, [latitude, latitude, longitude]);
    if (rows.length === 0) return null;

    return {
        ...rows[0],
        distance_meters: Number(rows[0].distance_meters)
    };
};

module.exports = { findNearestStop };
