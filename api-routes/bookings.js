const express = require('express');
const db = require('../database');
const router = express.Router();

const app = express();

app.use(express.json());

router.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const result = await db.query(`SELECT * FROM bookings WHERE user_id = $1`, [user_id]);

        res.status(200).send(result.rows);
    }
    catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/', async (req, res) => {
    const { bus_route_id, user_id, booked_seats } = req.body;
    const booking_status = 'Booked';

    try {
        const busRouteCheck = await db.query('SELECT * FROM bus_routes WHERE bus_route_id = $1', [bus_route_id]);
        if (busRouteCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Bus route not found.' });
        }

        const { available_seats } = busRouteCheck.rows[0];

        if (booked_seats > available_seats) {
            return res.status(400).json({ error: 'Not enough available seats on the bus.' });
        }

        const bookingResult = await db.query('INSERT INTO bookings (user_id, bus_route_id, booked_seats, booking_status) VALUES ($1, $2, $3, $4) RETURNING booking_id', [user_id, bus_route_id, booked_seats, booking_status]);

        const booked_id = bookingResult.rows[0].booking_id;
        const booked_status = bookingResult.rows[0].booking_status;

        await db.query('UPDATE bus_routes SET available_seats = available_seats - $1 WHERE bus_route_id = $2', [booked_seats, bus_route_id]);

        res.status(201).json({ booked_id, booked_status, message: 'Booking successful' });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.put('/:booking_id', async (req, res) => {
    const { booking_id } = req.params;

    try {
        const bookingCheck = await db.query(`SELECT * FROM bookings WHERE booking_id = $1`, [booking_id]);
        if (bookingCheck.rows.length === 0) {
            return res.status(404).json({ error: "Booking not found." });
        }

        await db.query('UPDATE bookings SET booking_status = $1 WHERE booking_id = $2', ['Cancelled', booking_id]);

        res.status(200).json({ message: 'Booking cancelled successfully' });
    }
    catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;