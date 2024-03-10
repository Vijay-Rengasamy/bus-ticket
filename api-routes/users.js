const express = require('express');
const db = require('../database');
const router = express.Router();

const app = express();

// Middleware for parsing JSON bodies
app.use(express.json());

router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM users');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/', async (req, res) => {
    const { first_name, last_name, gender, mobile_number, age } = req.body;

    if (!first_name || !last_name || !gender || !mobile_number || !age) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const mobileCheck = await db.query(
            'SELECT * FROM users WHERE mobile_number = $1',
            [mobile_number]
        );
        if (mobileCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Mobile number already exists.' });
        }

        await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            first_name VARCHAR(50),
            last_name VARCHAR(50),
            gender CHAR(1),
            mobile_number VARCHAR(15) UNIQUE,
            age INT
          )`);

        const result = await db.query(`
          INSERT INTO users (first_name, last_name, gender, mobile_number, age)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING user_id`, [first_name, last_name, gender, mobile_number, age]);

        const { user_id } = result.rows[0];
        res.json({ user_id });
    }
    catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;