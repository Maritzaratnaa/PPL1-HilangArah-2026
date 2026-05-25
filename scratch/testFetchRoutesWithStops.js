const pool = require('../backend/db');

async function testFetchRoutesWithStops() {
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
        console.log("ROUTES WITH STOPS COUNT:", routesWithStops.length);
        if (routesWithStops.length > 0) {
            console.log("FIRST ROUTE STOPS COUNT:", routesWithStops[0].route_stops.length);
        }
    } catch(e) {
        console.error("ERROR:", e);
    } finally {
        process.exit(0);
    }
}
testFetchRoutesWithStops();
