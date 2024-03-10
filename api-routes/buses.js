const express = require('express');
const db = require('../database');
const router = express.Router();

const app = express();

app.use(express.json());

router.get('/', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM buses`);
        res.status(200).send(result.rows);
    }
    catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/:bus_id', async (req, res) => {
    const { bus_id } = req.params;
    try {
        const result = await db.query(`SELECT * FROM buses WHERE bus_id = $1`, [bus_id]);

        res.status(200).send(result);
    }
    catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/', async (req, res) => {
    const { bus_name, total_seats } = req.body;

    try {
        const result = await db.query(`
        INSERT INTO buses (bus_name, total_seats)
        VALUES ($1, $2, $3)`, [bus_name, total_seats]);

        res.json(result.rows);
    }
    catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.put('/:bus_id', async (req, res) => {
    const { bus_id } = req.params;
    const { bus_name, total_seats } = req.body;

    try {
        const busCheck = await db.query('SELECT * FROM buses WHERE bus_id = $1', [bus_id]);
        if (busCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Bus not found.' });
        }

        const result = await db.query(`
            UPDATE buses
            SET bus_name = $1, total_seats = $2
            WHERE bus_id = $3
            RETURNING *
        `, [bus_name, total_seats, bus_id]);

        res.json(result.rows);
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.delete('/:bus_id', async (req, res) => {
    const { bus_id } = req.params;

    try {
        const busCheck = await db.query('SELECT * FROM buses WHERE bus_id = $1', [bus_id]);
        if (busCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Bus not found.' });
        }

        await db.deleteBusWithRoutesAndBookings(bus_id);

        res.status(204).send();
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;