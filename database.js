const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'postBusTicket',
  host: 'localhost',
  port: 5432, // default Postgres port
  database: 'Bus Ticket'
});

async function deleteBusWithRoutesAndBookings(busId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const busRoutesResult = await client.query('SELECT bus_route_id FROM bus_routes WHERE bus_id = $1', [busId]);
    const busRoutes = busRoutesResult.rows.map(row => row.bus_route_id);

    if (busRoutes.length > 0) {
      await client.query('DELETE FROM bookings WHERE bus_route_id = ANY($1)', [busRoutes]);
    }

    await client.query('DELETE FROM bus_routes WHERE bus_id = $1', [busId]);

    await client.query('DELETE FROM buses WHERE bus_id = $1', [busId]);

    await client.query('COMMIT');
  } 
  catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } 
  finally {
    client.release();
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  deleteBusWithRoutesAndBookings
};