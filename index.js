const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const cors = require('cors');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);
const request = require('request');
const path = require('path');
require('dotenv').config();

app.use(bodyParser.json())
app.use(cors())

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(res => console.log('database connected'))
.catch(err => console.log(err))

const createUserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }
})

const createUser = mongoose.model('createUser', createUserSchema);

app.post('/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    const existUser = await createUser.findOne({ email })

    if (existUser) {
        return res.json({ status: 'user exist' })
    }

    const encryptedPassword = await bcrypt.hash(password, salt);
    
    await createUser.create({
        firstName,
        lastName,
        email,
        password: encryptedPassword
    }).then(response => res.json({ status: 'created' })).catch(err => res.json({ status: 'failed' }))
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await createUser.findOne({ email })

    if (!user) return res.json({ status: 'user not found' })

    const comparePassword = await bcrypt.compare(password, user.password);

    if (comparePassword) return res.json({ status: 'success', user })
    
    else {
        res.json({ status: "password doesn't match" })
    }
})



app.get('/currencyData', async (req, res) => {
    request('https://freecurrencyapi.net/api/v2/latest?apikey=cfaac5f0-8125-11ec-ad91-b75c453dc9f3', { json: true }, (err, response, body) => {
        if (err) { return console.log(err); }
        res.send(body.data);
        });
})

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'))

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
    })
}

const port = process.env.PORT

app.listen(port || '8000', (err) => {
    if (!err)
        console.log('server listening on port 8000');
    else console.log(err);
})