const express = require('express');
const users = require('./api-routes/users');
const routes = require('./api-routes/routes');
const buses = require('./api-routes/buses');
const bookings = require('./api-routes/bookings');

const app = express();

const PORT = 3000;

// Middleware for parsing JSON bodies
app.use(express.json());

app.use('/users', users);
app.use('/routes', routes);
app.use('/buses', buses);
app.use('/bookings', bookings);

app.listen(PORT, (error) => {
    if (!error) {
        console.log(`Server is running on port ${PORT}`);
    }
    else {
        console.log("Error occured", error);
    }
});