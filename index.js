const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://car-doctor-crud-38f97.web.app',
         'https://car-doctor-crud-38f97.firebaseapp.com'
        ],
    credentials:true
}));
app.use(express.json());
app.use(cookieParser())


app.get('/', (req, res) => {
    res.send('Assignment time running out')
})

app.listen(port, () => {
    console.log(`Assignment server running on ${port}`)
})