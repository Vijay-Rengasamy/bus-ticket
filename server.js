const express = require('express');
const users = require('./routes/users');

const app = express();

const PORT = 3000;

// Middleware for parsing JSON bodies
app.use(express.json());

app.use('/users', users);

app.listen(PORT, (error) => {
    if (!error) {
        console.log(`Server is running on port ${PORT}`);
    }
    else {
        console.log("Error occured", error);
    }
});