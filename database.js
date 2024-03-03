const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'postBusTicket',
  host: 'localhost',
  port: 5432, // default Postgres port
  database: 'Bus Ticket'
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};