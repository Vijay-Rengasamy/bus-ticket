const express = require('express');
const db = require('../database');
const router = express.Router();

const app = express();

app.use(express.json());

// list of routes
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM routes`);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// add routes
router.post('/', async (req, res) => {
    const { source, destination } = req.body;
    try {
        await db.query(`
        CREATE TABLE IF NOT EXISTS routes (
            route_id SERIAL PRIMARY KEY,
            source VARCHAR(50) NOT NULL,
            destination VARCHAR(50) NOT NULL
          );
        `);

        const result = await db.query(`
        INSERT INTO routes (source, destination)
        VALUES ($1, $2)
        RETURNING route_id, source, destination`, [source, destination]);

        res.json(result.rows);
    }
    catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server");
    }
});

//add bus to routes
router.post('/:route_id/buses', async (req, res) => {
    const { route_id } = req.params;
    const { bus_id, journey_start_time, journey_end_time } = req.body;
    try {
        const routeCheck = await db.query('SELECT * FROM routes WHERE route_id = $1', [route_id]);
        if (routeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Route not found.' });
        }

        await db.query(`
            CREATE TABLE IF NOT EXISTS bus_routes (
                bus_route_id SERIAL PRIMARY KEY,
                route_id INT REFERENCES routes(route_id),
                bus_id INT REFERENCES buses(bus_id),
                journey_start_time TIMESTAMP,
                journey_end_time TIMESTAMP
            )
        `);

        const result = await db.query(`
            INSERT INTO bus_routes (route_id, bus_id, journey_start_time, journey_end_time)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [route_id, bus_id, journey_start_time, journey_end_time]);

        res.status(201).json(result.rows);
    }
    catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// delete bus from route
router.delete('/:route_id/buses/:bus_id', async (req, res) => {
    const { route_id, bus_id } = req.params;

    try {
        const routeCheck = await db.query('SELECT * FROM routes WHERE route_id = $1', [route_id]);
        if (routeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Route not found.' });
        }

        const busCheck = await db.query('SELECT * FROM bus_routes WHERE bus_id = $1 AND route_id = $2', [bus_id, route_id]);
        if (busCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Bus not present in route.' });
        }

        await db.query(`DELETE FROM bus_routes WHERE route_id = $1 AND bus_id = $2`, [route_id, bus_id]);

        res.status(204).send();
    }
    catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// list bus routes
router.get('/:route_id/buses', async (req, res) => {
    const { route_id } = req.params;

    try {
        const result = await db.query(`SELECT 
        b.bus_name, b.bus_id, b.total_seats, b.booked_seats,
        r.route_id, r.source, r.destination,
        br.journey_start_time, br.journey_end_time 
        FROM buses b JOIN bus_routes br ON b.bus_id = br.bus_id
        JOIN routes r ON br.route_id = r.route_id
        WHERE r.route_id = $1`, [route_id]);

        res.status(200).json(result.rows);
    }
    catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;