const pool = require('../db');

// Helper untuk generate ID berurutan (contoh: TR-001, STP-001)
const generateCustomId = async (connectionOrPool, table, idColumn, prefix) => {
    const query = `SELECT ${idColumn} FROM ${table} WHERE ${idColumn} LIKE ? ORDER BY ${idColumn} DESC LIMIT 1`;
    const [rows] = await connectionOrPool.query(query, [`${prefix}%`]);
    
    if (rows.length === 0) {
        return `${prefix}001`;
    }
    
    const lastId = rows[0][idColumn].trim();
    const numStr = lastId.substring(prefix.length);
    const num = parseInt(numStr, 10);
    
    if (isNaN(num)) {
        return `${prefix}001`;
    }
    
    const paddedNum = (num + 1).toString().padStart(3, '0');
    return `${prefix}${paddedNum}`;
};

// Get Data Transport
const getAllTransports = async (req, res) => {
    try {
        const { type } = req.query;
        const summaryQuery = `SELECT type, COUNT(*) as total FROM trans GROUP BY type`;
        const [summaryData] = await pool.query(summaryQuery);

        let dataQuery = `SELECT * FROM trans ORDER BY name ASC`;
        let queryParams = [];

        if (type) {
            dataQuery = `SELECT * FROM trans WHERE type = ? ORDER BY name ASC`;
            queryParams.push(type);
        }

        const [transports] = await pool.query(dataQuery, queryParams);

        res.status(200).json({
            message: "Berhasil, mengambil data transportasi",
            summary: summaryData,
            data: transports
        });
    }
    catch (error) {
        console.error("Error Get Transport: ", error);
        res.status(500).json({ message: "Gagal mengambil data transportasi." });
    }
};


// Create Data Transport
const createTransport = async (req, res) => {
    try {
        const { name, type, is_low_entry, has_wheelchair_slot, has_priority_seat, has_women_area, is_active } = req.body;
        const trans_id = await generateCustomId(pool, 'trans', 'trans_id', 'TR-');
        
        const query = `
            INSERT INTO trans (trans_id, name, type, is_low_entry, has_wheelchair_slot, has_priority_seat, has_women_area, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        await pool.query(query, [
            trans_id, name, type,
            is_low_entry || 0, has_wheelchair_slot || 0,
            has_priority_seat || 0, has_women_area || 0,
            is_active !== undefined ? is_active : 1
        ]);

        res.status(201).json({ message: "Data transportasi berhasil ditambahkan!" })
    }
    catch (error) {
        console.error("Error Create Transport: ", error);
        res.status(500).json({ message: "Gagal menambahkan data transportasi." });
    }
};

// Update Data Transport
const updateTransport = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, is_low_entry, has_wheelchair_slot, has_priority_seat, has_women_area, is_active } = req.body;

        const query = `
            UPDATE trans 
            SET name = ?, type = ?, is_low_entry = ?, has_wheelchair_slot = ?, has_priority_seat = ?, has_women_area = ?, is_active = ?
            WHERE trans_id = ?`;

        const [result] = await pool.query(query, [
            name, type, is_low_entry, has_wheelchair_slot, has_priority_seat, has_women_area, is_active, id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Admin tidak ditemukan atau gagal diperbarui." });
        }

        res.status(200).json({ message: "Data transportasi berhasil diubah!" });
    }
    catch (error) {
        console.error("Error Update Transport: ", error);
        res.status(500).json({ message: "Gagal mengperbarui data transportasi." });
    }
};

// Get Data Rute
const getAllRoutes = async (req, res) => {
    console.log(`[DEBUG] getAllRoutes: Request received!`);
    try {
        const query =
            `SELECT 
                TRIM(r.route_id) AS route_id, 
                r.route_name, 
                r.is_active,
                TRIM(r.origin_stop_id) AS origin_stop_id, 
                o.name AS origin_stop_name,
                TRIM(r.destination_stop_id) AS destination_stop_id, 
                d.name AS destination_stop_name,
                TRIM(r.trans_id) AS trans_id, 
                t.name AS transport_name, 
                t.type AS transport_type
            FROM routes r
            LEFT JOIN stops o ON r.origin_stop_id = o.stop_id
            LEFT JOIN stops d ON r.destination_stop_id = d.stop_id
            LEFT JOIN trans t ON r.trans_id = t.trans_id
            ORDER BY r.route_name ASC`;

        const [routes] = await pool.query(query);

        const rsQuery = `
            SELECT route_stop_id, TRIM(route_id) AS route_id, TRIM(stop_id) AS stop_id, stop_order, est_time_minutes
            FROM route_stops
            ORDER BY stop_order ASC
        `;
        const [routeStops] = await pool.query(rsQuery);

        const routesWithStops = routes.map(route => ({
            ...route,
            route_stops: routeStops.filter(rs => rs.route_id === route.route_id)
        }));

        res.status(200).json({
            message: "Berhasil mengambil data rute",
            total_routes: routes.length,
            data: routesWithStops
        });
        console.log(`[DEBUG] getAllRoutes: Fetched ${routes.length} routes, sent JSON.`);
    }
    catch (error) {
        console.error("Error Get Routes: ", error);
        res.status(500).json({ message: "Gagal mengambil data rute." });
    }
};

// Create Data Rute
const createRoute = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const { route_name, origin_stop_id, destination_stop_id, trans_id, is_active, route_stops } = req.body;
        const route_id = await generateCustomId(connection, 'routes', 'route_id', 'RT-');

        if (!route_name || !origin_stop_id || !destination_stop_id || !trans_id) {
            return res.status(400).json({ message: "Nama Rute, Asal, Tujuan, dan Transportasi wajib diisi!" });
        }

        const query = `
            INSERT INTO routes (route_id, route_name, origin_stop_id, destination_stop_id, is_active, trans_id) 
            VALUES (?, ?, ?, ?, ?, ?)`;

        // Pad trans_id with spaces up to 36 chars to bypass the foreign key VARCHAR vs CHAR schema mismatch
        const paddedTransId = trans_id.padEnd(36, ' ');

        await connection.query(query, [
            route_id, route_name, origin_stop_id.trim(), destination_stop_id.trim(),
            is_active !== undefined ? is_active : 1,
            paddedTransId
        ]);

        if (route_stops && Array.isArray(route_stops) && route_stops.length > 0) {
            const rsQuery = `INSERT INTO route_stops (route_stop_id, route_id, stop_id, stop_order, est_time_minutes) VALUES ?`;
            const rsValues = route_stops.map((rs, index) => [
                null, 
                route_id, rs.stop_id.trim(), rs.stop_order || (index + 1), rs.est_time_minutes || null
            ]);
            await connection.query(rsQuery, [rsValues]);
        }

        await connection.commit();
        res.status(201).json({ message: "Data rute berhasil ditambahkan!", route_id });
    }
    catch (error) {
        if (connection) await connection.rollback();
        console.error("Error Create Route: ", error);
        res.status(500).json({ message: "Gagal menambahkan data rute." });
    } finally {
        if (connection) connection.release();
    }
};

// Update Data Rute
const updateRoute = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const { id } = req.params;
        const { route_name, origin_stop_id, destination_stop_id, trans_id, is_active, route_stops } = req.body;

        const query = `
            UPDATE routes 
            SET route_name = ?, origin_stop_id = ?, destination_stop_id = ?, trans_id = ?, is_active = ?
            WHERE route_id = ?`;

        const paddedTransId = trans_id.padEnd(36, ' ');

        const [result] = await connection.query(query, [
            route_name, origin_stop_id.trim(), destination_stop_id.trim(), paddedTransId, is_active, id
        ]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Data rute tidak ditemukan." });
        }

        await connection.query(`DELETE FROM route_stops WHERE route_id = ?`, [id]);

        if (route_stops && Array.isArray(route_stops) && route_stops.length > 0) {
            const rsQuery = `INSERT INTO route_stops (route_stop_id, route_id, stop_id, stop_order, est_time_minutes) VALUES ?`;
            const rsValues = route_stops.map((rs, index) => [
                null, 
                id, rs.stop_id.trim(), rs.stop_order || (index + 1), rs.est_time_minutes || null
            ]);
            await connection.query(rsQuery, [rsValues]);
        }

        await connection.commit();
        res.status(200).json({ message: "Data rute berhasil diupdate!" });
    }
    catch (error) {
        if (connection) await connection.rollback();
        console.error("Error Update Route: ", error);
        res.status(500).json({ message: "Gagal mengupdate data rute." });
    } finally {
        if (connection) connection.release();
    }
};

const deleteRoute = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const { id } = req.params;

        // Delete from route_stops first to prevent foreign key constraint error
        await connection.query(`DELETE FROM route_stops WHERE route_id = ?`, [id]);
        
        // Delete the route
        const [result] = await connection.query(`DELETE FROM routes WHERE route_id = ?`, [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Data rute tidak ditemukan." });
        }

        await connection.commit();
        res.status(200).json({ message: "Data rute berhasil dihapus!" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error Delete Route: ", error);
        res.status(500).json({ message: "Gagal menghapus data rute." });
    } finally {
        if (connection) connection.release();
    }
};

// Get Data Halte
const getAllStops = async (req, res) => {
    try {
        const { facility } = req.query;

        const summaryQuery = `
            SELECT 
                COUNT(*) AS total_stops,
                SUM(has_ramp = 1) AS total_with_ramp,
                SUM(has_elevator = 1) AS total_with_elevator
            FROM stops`;
        const [[summaryData]] = await pool.query(summaryQuery);

        let dataQuery = `SELECT * FROM stops ORDER BY name ASC`;
        let queryParams = [];

        if (facility === 'ramp') {
            dataQuery = `SELECT * FROM stops WHERE has_ramp = 1 ORDER BY name ASC`;
        } else if (facility === 'elevator') {
            dataQuery = `SELECT * FROM stops WHERE has_elevator = 1 ORDER BY name ASC`;
        }

        const [stops] = await pool.query(dataQuery, queryParams);

        res.status(200).json({
            message: "Berhasil mengambil data halte",
            summary: {
                total: parseInt(summaryData.total_stops || 0),
                with_ramp: parseInt(summaryData.total_with_ramp || 0),
                with_elevator: parseInt(summaryData.total_with_elevator || 0)
            },
            data: stops
        });
    }
    catch (error) {
        console.error("Error Get Stops: ", error);
        res.status(500).json({ message: "Gagal mengambil data halte." });
    }
};

// Create Data Halte
const createStop = async (req, res) => {
    try {
        const { name, address, latitude, longitude, has_ramp, has_elevator, is_active } = req.body;
        const stop_id = await generateCustomId(pool, 'stops', 'stop_id', 'STP-');

        const query = `
            INSERT INTO stops (stop_id, name, address, latitude, longitude, has_ramp, has_elevator, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        await pool.query(query, [
            stop_id, name, address || null, latitude || null, longitude || null,
            has_ramp || 0, has_elevator || 0,
            is_active !== undefined ? is_active : 1
        ]);

        res.status(201).json({ message: "Data halte berhasil ditambahkan!" });
    }
    catch (error) {
        console.error("Error Create Stop: ", error);
        res.status(500).json({ message: "Gagal menambahkan data halte." });
    }
};

// Update Data Halte
const updateStop = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, latitude, longitude, has_ramp, has_elevator, is_active } = req.body;

        const query = `
            UPDATE stops 
            SET name = ?, address = ?, latitude = ?, longitude = ?, has_ramp = ?, has_elevator = ?, is_active = ?
            WHERE stop_id = ?`;

        const [result] = await pool.query(query, [
            name, address || null, latitude || null, longitude || null,
            has_ramp, has_elevator, is_active,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data halte tidak ditemukan." });
        }

        res.status(200).json({ message: "Data halte berhasil diupdate!" });
    }
    catch (error) {
        console.error("Error Update Stop: ", error);
        res.status(500).json({ message: "Gagal mengupdate data halte." });
    }
};

const deleteTransport = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(`DELETE FROM trans WHERE trans_id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data transportasi tidak ditemukan." });
        }
        res.status(200).json({ message: "Data transportasi berhasil dihapus!" });
    } catch (error) {
        console.error("Error Delete Transport: ", error);
        res.status(500).json({ message: "Gagal menghapus data transportasi." });
    }
};

const deleteStop = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(`DELETE FROM stops WHERE stop_id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data halte tidak ditemukan." });
        }
        res.status(200).json({ message: "Data halte berhasil dihapus!" });
    } catch (error) {
        console.error("Error Delete Stop: ", error);
        res.status(500).json({ message: "Gagal menghapus data halte." });
    }
};

// Get Data Route Stop
const getAllRouteStops = async (req, res) => {
    try {
        const query = `
            SELECT 
                rs.route_stop_id, 
                TRIM(rs.route_id) AS route_id, 
                r.route_name,
                TRIM(r.trans_id) AS trans_id,
                TRIM(rs.stop_id) AS stop_id, 
                s.name AS stop_name,
                rs.stop_order, 
                rs.est_time_minutes
            FROM route_stops rs
            LEFT JOIN routes r ON rs.route_id = r.route_id
            LEFT JOIN stops s ON rs.stop_id = s.stop_id
            ORDER BY r.route_name ASC, rs.stop_order ASC`;

        const [routeStops] = await pool.query(query);

        res.status(200).json({
            message: "Berhasil mengambil data rute stop",
            total_route_stops: routeStops.length,
            data: routeStops
        });
    }
    catch (error) {
        console.error("Error Get Route Stops: ", error);
        res.status(500).json({ message: "Gagal mengambil data rute stop." });
    }
};

// Create Data Route Stop
const createRouteStop = async (req, res) => {
    try {
        const { route_id, stop_id, stop_order, est_time_minutes } = req.body;

        if (!route_id || !stop_id || stop_order === undefined) {
            return res.status(400).json({ message: "Route, Stop, dan Stop Order wajib diisi!" });
        }

        const query = `
            INSERT INTO route_stops (route_stop_id, route_id, stop_id, stop_order, est_time_minutes) 
            VALUES (NULL, ?, ?, ?, ?)`;

        await pool.query(query, [
            route_id, stop_id.trim(), stop_order, est_time_minutes || null
        ]);

        res.status(201).json({ message: "Data rute stop berhasil ditambahkan!" });
    }
    catch (error) {
        console.error("Error Create Route Stop: ", error);
        res.status(500).json({ message: "Gagal menambahkan data rute stop." });
    }
};

// Update Data Route Stop
const updateRouteStop = async (req, res) => {
    try {
        const { id } = req.params;
        const { route_id, stop_id, stop_order, est_time_minutes } = req.body;

        const query = `
            UPDATE route_stops 
            SET route_id = ?, stop_id = ?, stop_order = ?, est_time_minutes = ?
            WHERE route_stop_id = ?`;

        const [result] = await pool.query(query, [
            route_id, stop_id, stop_order, est_time_minutes || null, id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data rute stop tidak ditemukan." });
        }

        res.status(200).json({ message: "Data rute stop berhasil diupdate!" });
    }
    catch (error) {
        console.error("Error Update Route Stop: ", error);
        res.status(500).json({ message: "Gagal mengupdate data rute stop." });
    }
};

const deleteRouteStop = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(`DELETE FROM route_stops WHERE route_stop_id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data rute stop tidak ditemukan." });
        }
        res.status(200).json({ message: "Data rute stop berhasil dihapus!" });
    } catch (error) {
        console.error("Error Delete Route Stop: ", error);
        res.status(500).json({ message: "Gagal menghapus data rute stop." });
    }
};

module.exports = {
    getAllTransports,
    createTransport,
    updateTransport,
    deleteTransport,
    getAllRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    getAllStops,
    createStop,
    updateStop,
    deleteStop,
    getAllRouteStops,
    createRouteStop,
    updateRouteStop,
    deleteRouteStop
};