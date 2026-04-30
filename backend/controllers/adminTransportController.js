const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

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
        const trans_id = uuidv4();
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
    try {
        const query =
            `SELECT 
                r.route_id, 
                r.route_name, 
                r.is_active,
                r.origin_stop_id, 
                o.name AS origin_stop_name,
                r.destination_stop_id, 
                d.name AS destination_stop_name,
                r.trans_id, 
                t.name AS transport_name, 
                t.type AS transport_type
            FROM routes r
            LEFT JOIN stops o ON r.origin_stop_id = o.stop_id
            LEFT JOIN stops d ON r.destination_stop_id = d.stop_id
            LEFT JOIN trans t ON r.trans_id = t.trans_id
            ORDER BY r.route_name ASC`;

        const [routes] = await pool.query(query);

        res.status(200).json({
            message: "Berhasil mengambil data rute",
            total_routes: routes.length,
            data: routes
        });
    }
    catch (error) {
        console.error("Error Get Routes: ", error);
        res.status(500).json({ message: "Gagal mengambil data rute." });
    }
};

// Create Data Rute
const createRoute = async (req, res) => {
    try {
        const { route_name, origin_stop_id, destination_stop_id, trans_id, is_active } = req.body;
        const route_id = uuidv4();

        if (!route_name || !origin_stop_id || !destination_stop_id || !trans_id) {
            return res.status(400).json({ message: "Nama Rute, Asal, Tujuan, dan Transportasi wajib diisi!" });
        }

        const query = `
            INSERT INTO routes (route_id, route_name, origin_stop_id, destination_stop_id, is_active, trans_id) 
            VALUES (?, ?, ?, ?, ?, ?)`;

        await pool.query(query, [
            route_id, route_name, origin_stop_id, destination_stop_id,
            is_active !== undefined ? is_active : 1,
            trans_id
        ]);

        res.status(201).json({ message: "Data rute berhasil ditambahkan!" });
    }
    catch (error) {
        console.error("Error Create Route: ", error);
        res.status(500).json({ message: "Gagal menambahkan data rute." });
    }
};

// Update Data Rute
const updateRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const { route_name, origin_stop_id, destination_stop_id, trans_id, is_active } = req.body;

        const query = `
            UPDATE routes 
            SET route_name = ?, origin_stop_id = ?, destination_stop_id = ?, trans_id = ?, is_active = ?
            WHERE route_id = ?`;

        const [result] = await pool.query(query, [
            route_name, origin_stop_id, destination_stop_id, trans_id, is_active, id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data rute tidak ditemukan." });
        }

        res.status(200).json({ message: "Data rute berhasil diupdate!" });
    }
    catch (error) {
        console.error("Error Update Route: ", error);
        res.status(500).json({ message: "Gagal mengupdate data rute." });
    }
};

const deleteRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(`DELETE FROM routes WHERE route_id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data rute tidak ditemukan." });
        }
        res.status(200).json({ message: "Data rute berhasil dihapus!" });
    } catch (error) {
        console.error("Error Delete Route: ", error);
        res.status(500).json({ message: "Gagal menghapus data rute." });
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
        const { name, address, latitude, longitude, has_ramp, has_elevator, is_active, hub_id } = req.body;
        const stop_id = uuidv4();

        const query = `
            INSERT INTO stops (stop_id, name, address, latitude, longitude, has_ramp, has_elevator, is_active, hub_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await pool.query(query, [
            stop_id, name, address || null, latitude || null, longitude || null,
            has_ramp || 0, has_elevator || 0,
            is_active !== undefined ? is_active : 1,
            hub_id || null
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
        const { name, address, latitude, longitude, has_ramp, has_elevator, is_active, hub_id } = req.body;

        const query = `
            UPDATE stops 
            SET name = ?, address = ?, latitude = ?, longitude = ?, has_ramp = ?, has_elevator = ?, is_active = ?, hub_id = ?
            WHERE stop_id = ?`;

        const [result] = await pool.query(query, [
            name, address || null, latitude || null, longitude || null,
            has_ramp, has_elevator, is_active, hub_id || null,
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
    deleteStop
};