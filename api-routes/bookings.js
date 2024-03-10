const express = require('express');
const db = require('../database');
const router = express.Router();

const app = express();

app.use(express.json());

router.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const result = await db.query(`SELECT * FROM bookings WHERE booking_status != 'Cancelled'`);
        const user_bookings = result.rows.find((obj) => obj.user_id == user_id);

        res.status(200).send(user_bookings);
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

        const bus_id = busRouteCheck.rows[0].bus_id;

        const busDetails = await db.query('SELECT total_seats, booked_seats FROM buses WHERE bus_id = $1', [bus_id]);
        if (busDetails.rows.length === 0) {
            return res.status(404).json({ error: 'Bus not found.' });
        }

        const { total_seats, booked_seats: current_booked_seats } = busDetails.rows[0];
        const availableSeats = total_seats - current_booked_seats;
        if (availableSeats < booked_seats) {
            return res.status(400).json({ error: 'Not enough available seats on the bus route.' });
        }

        await db.query('UPDATE buses SET booked_seats = $1 WHERE bus_id = $2', [current_booked_seats + booked_seats, bus_id]);

        await db.query(`CREATE TABLE IF NOT EXISTS bookings (
            booking_id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(user_id),
            bus_route_id INT REFERENCES bus_routes(bus_route_id),
            booked_seats INT,
            booking_status VARCHAR(50)
        )`);

        const bookingResult = await db.query('INSERT INTO bookings (user_id, bus_route_id, booked_seats, booking_status) VALUES ($1, $2, $3, $4) RETURNING booking_id', [user_id, bus_route_id, booked_seats, booking_status]);

        const booked_id = bookingResult.rows[0].booking_id;
        const booked_status = bookingResult.rows[0].booking_status;

        res.status(201).json({ booked_id, booked_status, message: 'Booking successful' });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/:booking_id', async (req, res) => {
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