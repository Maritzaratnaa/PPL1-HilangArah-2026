const pool = require('../db');

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateLegFare(transType, farePerKm, boardingFee, baseFare, fareType, originLat, originLng, destLat, destLng) {
  if (fareType === 'flat') return baseFare || 0;

  const distanceKm = haversineDistance(
    parseFloat(originLat), parseFloat(originLng),
    parseFloat(destLat), parseFloat(destLng)
  );

  if (transType === 'MRT') {
    return Math.round((boardingFee || 1500) + ((farePerKm || 850) * distanceKm));
  }
  if (transType === 'LRT') {
    if (distanceKm <= 1) return boardingFee || 5000;
    return Math.round((boardingFee || 5000) + ((farePerKm || 700) * (distanceKm - 1)));
  }
  return 0;
}

const checkRecommendation = (userCategory, transports) => {
  if (transports.length === 0) return false;
  const safeCat = (userCategory || '').trim().toLowerCase();
  if (['disability', 'disabilitas', 'tunanetra', 'tuli', 'pengguna kursi roda'].includes(safeCat)) {
    return transports.every(t => t.facilities.low_entry || t.facilities.wheelchair_slot);
  } else if (['elderly', 'pregnant', 'vulnerable', 'children', 'lansia', 'ibu hamil', 'penyakit rentan', 'anak-anak'].includes(safeCat)) {
    return transports.every(t => t.facilities.priority_seat);
  } else if (['women', 'wanita', 'perempuan'].includes(safeCat)) {
    return transports.every(t => t.facilities.women_area);
  }
  return true;
};

const formatTransport = (prefix, row) => [{
  name: row[`${prefix}_name`], type: row[`${prefix}_type`],
  fare_type: row[`${prefix}_fare_type`],
  base_fare: row[`${prefix}_base_fare`],
  fare_per_km: row[`${prefix}_fare_per_km`],
  boarding_fee: row[`${prefix}_boarding_fee`],
  facilities: {
    low_entry: row[`${prefix}_low`] === 1,
    wheelchair_slot: row[`${prefix}_wheel`] === 1,
    priority_seat: row[`${prefix}_prio`] === 1,
    women_area: row[`${prefix}_women`] === 1
  }
}];

const fetchRoutePath = async (routeId, order1, order2) => {
  const minOrder = Math.min(order1, order2);
  const maxOrder = Math.max(order1, order2);
  const [rows] = await pool.query(`
    SELECT s.name AS stop_name, s.latitude, s.longitude,
      IF(s.has_ramp=1, true, false) AS has_ramp,
      IF(s.has_elevator=1, true, false) AS has_elevator
    FROM route_stops rs 
    JOIN stops s ON rs.stop_id = s.stop_id 
    WHERE rs.route_id = ? AND rs.stop_order BETWEEN ? AND ?
    ORDER BY rs.stop_order ASC
  `, [routeId, minOrder, maxOrder]);
  return rows;
};

function markAndSortRoutes(results) {
  if (results.length === 0) return results;
  
  results.sort((a, b) => {
    if (a.is_recommended && !b.is_recommended) return -1;
    if (!a.is_recommended && b.is_recommended) return 1;
    if (a.total_estimated_time !== b.total_estimated_time) {
      return a.total_estimated_time - b.total_estimated_time;
    }
    return (a.total_cost || 0) - (b.total_cost || 0);
  });

  return results.map((r, idx) => ({
    ...r,
    is_best: idx === 0
  }));
}

const searchRoutes = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ message: "Asal dan tujuan wajib diisi!" });
    }

    const [profiles] = await pool.query('SELECT category_status FROM profiles WHERE user_id = ?', [userId]);
    const userCategory = profiles.length > 0 ? profiles[0].category_status : 'Umum';

    const searchOrigin = `%${origin}%`;
    const searchDest = `%${destination}%`;

    const [originCheck] = await pool.query('SELECT stop_id FROM stops WHERE name LIKE ? LIMIT 1', [searchOrigin]);
    const [destCheck] = await pool.query('SELECT stop_id FROM stops WHERE name LIKE ? LIMIT 1', [searchDest]);

    if (originCheck.length === 0 || destCheck.length === 0) {
      return res.status(404).json({ message: "Rute tidak ditemukan. Pastikan nama halte benar." });
    }

    console.log(`[DEBUG] MENCARI RUTE: "${origin}" ➔ "${destination}"`);

    console.time("[WAKTU] Eksekusi Query Direct");
    const directQuery = `
      SELECT 
        r.route_id AS r_id, r.route_name,
        os.name AS origin_stop_name, os.latitude AS o_lat, os.longitude AS o_lng,
        os.has_ramp AS origin_ramp, os.has_elevator AS origin_elevator,
        ds.name AS destination_stop_name, ds.latitude AS d_lat, ds.longitude AS d_lng,
        ds.has_ramp AS dest_ramp, ds.has_elevator AS dest_elevator,
        ABS(d_rs.stop_order - o_rs.stop_order) AS total_stops,
        ABS(d_rs.est_time_minutes - o_rs.est_time_minutes) AS total_time,
        t.name AS trans_name, t.type AS trans_type,
        t.is_low_entry AS trans_low, t.has_wheelchair_slot AS trans_wheel,
        t.has_priority_seat AS trans_prio, t.has_women_area AS trans_women,
        t.fare_type AS trans_fare_type, t.base_fare AS trans_base_fare,
        t.fare_per_km AS trans_fare_per_km, t.boarding_fee AS trans_boarding_fee,
        o_rs.stop_order AS r_start, d_rs.stop_order AS r_end
      FROM routes r
      JOIN trans t ON TRIM(r.trans_id) = TRIM(t.trans_id)
      JOIN route_stops o_rs ON r.route_id = o_rs.route_id
      JOIN stops os ON o_rs.stop_id = os.stop_id
      JOIN route_stops d_rs ON r.route_id = d_rs.route_id
      JOIN stops ds ON d_rs.stop_id = ds.stop_id
      WHERE os.name LIKE ? AND ds.name LIKE ? AND o_rs.stop_order != d_rs.stop_order
    `;
    const [directRoutes] = await pool.query(directQuery, [searchOrigin, searchDest]);
    console.timeEnd("[WAKTU] Eksekusi Query Direct");

    if (directRoutes.length > 0) {
      console.log(`Ditemukan ${directRoutes.length} rute langsung!`);
      const results = [];
      for (const row of directRoutes) {
        const transports = formatTransport('trans', row);
        const path = await fetchRoutePath(row.r_id, row.r_start, row.r_end);
        const legFare = calculateLegFare(
          row.trans_type, row.trans_fare_per_km, row.trans_boarding_fee,
          row.trans_base_fare, row.trans_fare_type,
          row.o_lat, row.o_lng, row.d_lat, row.d_lng
        );
        results.push({
          route_type: "direct",
          total_estimated_time: row.total_time,
          total_cost: legFare,
          is_recommended: checkRecommendation(userCategory, transports),
          legs: [{
            step: 1, route_name: row.route_name,
            origin_stop: row.origin_stop_name, destination_stop: row.destination_stop_name,
            transports, stops_passed: row.total_stops,
            estimated_time_minutes: row.total_time,
            fare: legFare,
            route_path: path
          }]
        });
      }
      return res.status(200).json({ filter_applied: userCategory, data: markAndSortRoutes(results) });
    }

    console.log(`Rute Langsung tidak ditemukan. Melanjutkan ke pencarian Transit 1x...`);

    console.time("[WAKTU] Eksekusi Query Transit 1x");
    const transitQuery = `
      SELECT 
        r1.route_id AS r1_id, r1.route_name AS r1_name,
        t1.name AS t1_name, t1.type AS t1_type,
        t1.is_low_entry AS t1_low, t1.has_wheelchair_slot AS t1_wheel,
        t1.has_priority_seat AS t1_prio, t1.has_women_area AS t1_women,
        t1.fare_type AS t1_fare_type, t1.base_fare AS t1_base_fare,
        t1.fare_per_km AS t1_fare_per_km, t1.boarding_fee AS t1_boarding_fee,
        os.name AS origin_name, os.latitude AS o_lat, os.longitude AS o_lng,
        ts1.name AS transit_name, ts1.latitude AS t1_lat, ts1.longitude AS t1_lng,
        o_rs.stop_order AS r1_start, t_rs1.stop_order AS r1_end,

        r2.route_id AS r2_id, r2.route_name AS r2_name,
        t2.name AS t2_name, t2.type AS t2_type,
        t2.is_low_entry AS t2_low, t2.has_wheelchair_slot AS t2_wheel,
        t2.has_priority_seat AS t2_prio, t2.has_women_area AS t2_women,
        t2.fare_type AS t2_fare_type, t2.base_fare AS t2_base_fare,
        t2.fare_per_km AS t2_fare_per_km, t2.boarding_fee AS t2_boarding_fee,
        ds.name AS dest_name, ds.latitude AS d_lat, ds.longitude AS d_lng,
        t_rs2.stop_order AS r2_start, d_rs.stop_order AS r2_end,

        ABS(t_rs1.est_time_minutes - o_rs.est_time_minutes) AS leg1_time,
        ABS(d_rs.est_time_minutes - t_rs2.est_time_minutes) AS leg2_time,
        ABS(t_rs1.stop_order - o_rs.stop_order) AS leg1_stops,
        ABS(d_rs.stop_order - t_rs2.stop_order) AS leg2_stops

      FROM route_stops o_rs
      JOIN stops os ON o_rs.stop_id = os.stop_id
      JOIN routes r1 ON o_rs.route_id = r1.route_id
      JOIN trans t1 ON TRIM(r1.trans_id) = TRIM(t1.trans_id)
      JOIN route_stops t_rs1 ON r1.route_id = t_rs1.route_id
      JOIN stops ts1 ON t_rs1.stop_id = ts1.stop_id
      JOIN stops ts2 ON ts1.hub_id = ts2.hub_id AND ts1.hub_id IS NOT NULL
      JOIN route_stops t_rs2 ON ts2.stop_id = t_rs2.stop_id AND t_rs2.route_id != r1.route_id
      JOIN routes r2 ON t_rs2.route_id = r2.route_id
      JOIN trans t2 ON TRIM(r2.trans_id) = TRIM(t2.trans_id)
      JOIN route_stops d_rs ON r2.route_id = d_rs.route_id
      JOIN stops ds ON d_rs.stop_id = ds.stop_id
      WHERE os.name LIKE ? AND ds.name LIKE ?
      ORDER BY (leg1_time + leg2_time) ASC
      LIMIT 3
    `;
    const [transitRoutes] = await pool.query(transitQuery, [searchOrigin, searchDest]);
    console.timeEnd("[WAKTU] Eksekusi Query Transit 1x");

    if (transitRoutes.length > 0) {
      console.log(`Ditemukan ${transitRoutes.length} rute dengan Transit 1x!`);
      const results = [];
      for (const row of transitRoutes) {
        const t1 = formatTransport('t1', row);
        const t2 = formatTransport('t2', row);
        const path1 = await fetchRoutePath(row.r1_id, row.r1_start, row.r1_end);
        const path2 = await fetchRoutePath(row.r2_id, row.r2_start, row.r2_end);
        const fare1 = calculateLegFare(
          row.t1_type, row.t1_fare_per_km, row.t1_boarding_fee,
          row.t1_base_fare, row.t1_fare_type,
          row.o_lat, row.o_lng, row.t1_lat, row.t1_lng
        );
        const fare2 = calculateLegFare(
          row.t2_type, row.t2_fare_per_km, row.t2_boarding_fee,
          row.t2_base_fare, row.t2_fare_type,
          row.t1_lat, row.t1_lng, row.d_lat, row.d_lng
        );
        results.push({
          route_type: "transit",
          total_estimated_time: row.leg1_time + row.leg2_time,
          total_cost: fare1 + fare2,
          is_recommended: checkRecommendation(userCategory, t1) && checkRecommendation(userCategory, t2),
          legs: [
            { step: 1, route_name: row.r1_name, origin_stop: row.origin_name, destination_stop: row.transit_name, estimated_time_minutes: row.leg1_time, stops_passed: row.leg1_stops, fare: fare1, route_path: path1, transports: t1 },
            { step: 2, route_name: row.r2_name, origin_stop: row.transit_name, destination_stop: row.dest_name, estimated_time_minutes: row.leg2_time, stops_passed: row.leg2_stops, fare: fare2, route_path: path2, transports: t2 }
          ]
        });
      }
      return res.status(200).json({ filter_applied: userCategory, data: markAndSortRoutes(results) });
    }

    console.log(`Rute Transit 1x tidak ditemukan. Mencoba rute Transit 2x...`);

    console.time("[WAKTU] Eksekusi Query Transit 2x");
    const transit2xQuery = `
      SELECT 
        r1.route_id AS r1_id, r1.route_name AS r1_name,
        t1.name AS t1_name, t1.type AS t1_type,
        t1.is_low_entry AS t1_low, t1.has_wheelchair_slot AS t1_wheel,
        t1.has_priority_seat AS t1_prio, t1.has_women_area AS t1_women,
        t1.fare_type AS t1_fare_type, t1.base_fare AS t1_base_fare,
        t1.fare_per_km AS t1_fare_per_km, t1.boarding_fee AS t1_boarding_fee,
        os.name AS origin_name, os.latitude AS o_lat, os.longitude AS o_lng,
        ts1_out.name AS transit1_name, ts1_out.latitude AS t1_lat, ts1_out.longitude AS t1_lng,
        o_rs.stop_order AS r1_start, t1_rs_out.stop_order AS r1_end,

        r2.route_id AS r2_id, r2.route_name AS r2_name,
        t2.name AS t2_name, t2.type AS t2_type,
        t2.is_low_entry AS t2_low, t2.has_wheelchair_slot AS t2_wheel,
        t2.has_priority_seat AS t2_prio, t2.has_women_area AS t2_women,
        t2.fare_type AS t2_fare_type, t2.base_fare AS t2_base_fare,
        t2.fare_per_km AS t2_fare_per_km, t2.boarding_fee AS t2_boarding_fee,
        ts2_out.name AS transit2_name, ts2_out.latitude AS t2_lat, ts2_out.longitude AS t2_lng,
        t2_rs_in.stop_order AS r2_start, t2_rs_out.stop_order AS r2_end,

        r3.route_id AS r3_id, r3.route_name AS r3_name,
        t3.name AS t3_name, t3.type AS t3_type,
        t3.is_low_entry AS t3_low, t3.has_wheelchair_slot AS t3_wheel,
        t3.has_priority_seat AS t3_prio, t3.has_women_area AS t3_women,
        t3.fare_type AS t3_fare_type, t3.base_fare AS t3_base_fare,
        t3.fare_per_km AS t3_fare_per_km, t3.boarding_fee AS t3_boarding_fee,
        ds.name AS dest_name, ds.latitude AS d_lat, ds.longitude AS d_lng,
        t3_rs_in.stop_order AS r3_start, d_rs.stop_order AS r3_end,

        ABS(t1_rs_out.est_time_minutes - o_rs.est_time_minutes) AS leg1_time,
        ABS(t2_rs_out.est_time_minutes - t2_rs_in.est_time_minutes) AS leg2_time,
        ABS(d_rs.est_time_minutes - t3_rs_in.est_time_minutes) AS leg3_time,
        ABS(t1_rs_out.stop_order - o_rs.stop_order) AS leg1_stops,
        ABS(t2_rs_out.stop_order - t2_rs_in.stop_order) AS leg2_stops,
        ABS(d_rs.stop_order - t3_rs_in.stop_order) AS leg3_stops

      FROM route_stops o_rs
      JOIN stops os ON o_rs.stop_id = os.stop_id
      JOIN routes r1 ON o_rs.route_id = r1.route_id
      JOIN trans t1 ON TRIM(r1.trans_id) = TRIM(t1.trans_id)
      JOIN route_stops t1_rs_out ON r1.route_id = t1_rs_out.route_id
      JOIN stops ts1_out ON t1_rs_out.stop_id = ts1_out.stop_id
      JOIN stops ts1_in ON ts1_out.hub_id = ts1_in.hub_id AND ts1_out.hub_id IS NOT NULL
      JOIN route_stops t2_rs_in ON ts1_in.stop_id = t2_rs_in.stop_id AND t2_rs_in.route_id != r1.route_id
      JOIN routes r2 ON t2_rs_in.route_id = r2.route_id
      JOIN trans t2 ON TRIM(r2.trans_id) = TRIM(t2.trans_id)
      JOIN route_stops t2_rs_out ON r2.route_id = t2_rs_out.route_id AND t2_rs_out.stop_order != t2_rs_in.stop_order
      JOIN stops ts2_out ON t2_rs_out.stop_id = ts2_out.stop_id
      JOIN stops ts2_in ON ts2_out.hub_id = ts2_in.hub_id AND ts2_out.hub_id IS NOT NULL
      JOIN route_stops t3_rs_in ON ts2_in.stop_id = t3_rs_in.stop_id AND t3_rs_in.route_id != r2.route_id AND t3_rs_in.route_id != r1.route_id
      JOIN routes r3 ON t3_rs_in.route_id = r3.route_id
      JOIN trans t3 ON TRIM(r3.trans_id) = TRIM(t3.trans_id)
      JOIN route_stops d_rs ON r3.route_id = d_rs.route_id
      JOIN stops ds ON d_rs.stop_id = ds.stop_id
      WHERE os.name LIKE ? AND ds.name LIKE ?
      ORDER BY (leg1_time + leg2_time + leg3_time) ASC
      LIMIT 2
    `;
    const [transit2xRoutes] = await pool.query(transit2xQuery, [searchOrigin, searchDest]);
    console.timeEnd("[WAKTU] Eksekusi Query Transit 2x");

    if (transit2xRoutes.length > 0) {
      console.log(`Ditemukan ${transit2xRoutes.length} rute dengan Transit 2x!`);
      const results = [];
      for (const row of transit2xRoutes) {
        const t1 = formatTransport('t1', row);
        const t2 = formatTransport('t2', row);
        const t3 = formatTransport('t3', row);
        const path1 = await fetchRoutePath(row.r1_id, row.r1_start, row.r1_end);
        const path2 = await fetchRoutePath(row.r2_id, row.r2_start, row.r2_end);
        const path3 = await fetchRoutePath(row.r3_id, row.r3_start, row.r3_end);
        const fare1 = calculateLegFare(
          row.t1_type, row.t1_fare_per_km, row.t1_boarding_fee,
          row.t1_base_fare, row.t1_fare_type,
          row.o_lat, row.o_lng, row.t1_lat, row.t1_lng
        );
        const fare2 = calculateLegFare(
          row.t2_type, row.t2_fare_per_km, row.t2_boarding_fee,
          row.t2_base_fare, row.t2_fare_type,
          row.t1_lat, row.t1_lng, row.t2_lat, row.t2_lng
        );
        const fare3 = calculateLegFare(
          row.t3_type, row.t3_fare_per_km, row.t3_boarding_fee,
          row.t3_base_fare, row.t3_fare_type,
          row.t2_lat, row.t2_lng, row.d_lat, row.d_lng
        );
        results.push({
          route_type: "transit",
          total_estimated_time: row.leg1_time + row.leg2_time + row.leg3_time,
          total_cost: fare1 + fare2 + fare3,
          is_recommended: checkRecommendation(userCategory, t1) && checkRecommendation(userCategory, t2) && checkRecommendation(userCategory, t3),
          legs: [
            { step: 1, route_name: row.r1_name, origin_stop: row.origin_name, destination_stop: row.transit1_name, estimated_time_minutes: row.leg1_time, stops_passed: row.leg1_stops, fare: fare1, route_path: path1, transports: t1 },
            { step: 2, route_name: row.r2_name, origin_stop: row.transit1_name, destination_stop: row.transit2_name, estimated_time_minutes: row.leg2_time, stops_passed: row.leg2_stops, fare: fare2, route_path: path2, transports: t2 },
            { step: 3, route_name: row.r3_name, origin_stop: row.transit2_name, destination_stop: row.dest_name, estimated_time_minutes: row.leg3_time, stops_passed: row.leg3_stops, fare: fare3, route_path: path3, transports: t3 }
          ]
        });
      }
      return res.status(200).json({ filter_applied: userCategory, data: markAndSortRoutes(results) });
    }

    return res.status(404).json({ message: "Rute tidak ditemukan. Pastikan nama halte benar." });

  } catch (error) {
    console.error("ERROR SAAT PENCARIAN:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mencari rute." });
  }
};

const getStopSuggestions = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim().length < 2) {
      return res.status(200).json([]);
    }

    const searchKeyword = `%${keyword}%`;
    const query = `
      SELECT stop_id, name 
      FROM stops 
      WHERE name LIKE ? 
      LIMIT 5
    `;
    
    const [rows] = await pool.query(query, [searchKeyword]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error Get Stop Suggestions:", error);
    return res.status(500).json({ message: "Gagal mengambil saran halte." });
  }
};

module.exports = {
  searchRoutes,
  getStopSuggestions
};