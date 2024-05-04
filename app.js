import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import nodemailer from 'nodemailer';
import cors from 'cors';
import bodyParser from "body-parser";
import mongoose from "mongoose";

const app = express();
const server = createServer(app)
app.use(bodyParser.json());
const userId = [];


const corsOpts = {
    origin: '*',

    methods: [
        'GET',
        'POST',
    ],

    allowedHeaders: [
        'Content-Type',
    ],
}
app.use(cors(corsOpts));

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
})

mongoose.connect('mongodb+srv://jayeshp:ErhdDsaGokp0mg48@cluster0.kvtsndl.mongodb.net/Cluster0?retryWrites=true&w=majority')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const loginSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String
}, { collection: 'login' });

const LoginData = mongoose.model('LoginData', loginSchema);




app.get('/', async (req, res) => {
    let isUser = await LoginData.find({});
    res.status(200).send({ code: 0, data: isUser })
})


app.post('/register', async (req, res) => {
    let body = req.body;
    console.log("body", body);
    let isUser = await LoginData.find({ username: body.username });
    console.log("body", isUser);
    let error = false;
    let data = {};
    if (!isUser) {
        if (!body.username) {
            data.username = "Please Enter Username";
            error = true;
        }
        if (!body.password) {
            data.password = "Please Enter Password";
            error = true;
        }
        if (!body.email) {
            data.password = "Please Enter Email";
            error = true;
        }
        if (!error) {
            const newUser = new LoginData(body);
            const savedUser = await newUser.save();
            res.status(200).send({ code: 0, returnMessage: 'Register Successfully', data: savedUser })
        }
        else {
            res.status(400).send({ code: 1, error: data })
        }
    }
    else {
        res.send({ code: 1, returnMessage: "User Already Exist" })
    }
})

app.post('/login', async (req, res) => {
    let body = req.body;
    console.log("body", body);
    let isUser = await LoginData.findOne({ username: body.username });
    console.log("body", isUser);
    let data = {};
    let error = false;
    if (isUser) {
        if (!body.username) {
            data.username = "Please Enter Username";
            error = true;
        }
        if (!body.password) {
            data.password = "Please Enter Password";
            error = true;
        }
        if (!body.email) {
            data.password = "Please Enter Email";
            error = true;
        }
        // if (body.email != isUser.email) {
        //     data.password = "Email Doesn't Match";
        //     error = true;
        // }
        // if (body.password != isUser.password) {
        //     data.password = "Password Doesn't Match";
        //     error = true;
        // }
        if (!error) {

            io.on("connection", (socket) => {
                console.log("User Connected");
                console.log("Id", socket.id);
                socket.emit("welcome", "Hello Jayesh");
                userId.push({ userid: isUser._id, socketId: socket.id })
                socket.on("message", (msg) => {
                    console.log(msg);
                    socketId = userId.find(x => x._id == msg.id);
                    socket.to(socketId.socket).emit('receive-message', msg)
                })
            })
            res.status(200).send({ code: 0, returnMessage: 'Login Successfully' })
        }
        if (error) {
            res.status(400).send({ code: 1, error: data })
        }
    }
    else {
        res.send({ code: 1, returnMessage: "User Doesn't Exist" })
    }
})


app.post('/sendOtp', async (req, res) => {
    console.log(req.body);
    let body = req.body;
    let isUser = await LoginData.findOne({ username: body.username });
    if (isUser.username == body.username) {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'darshannakarani0@gmail.com', // your Gmail email address
                pass: 'plje uarc agkx tsrz' // your Gmail password or app-specific password
            }
        });

        let mailOptions = {
            from: 'darshannakarani0@gmail.com', // sender address
            to: body.email, // list of receivers
            subject: 'Otp', // Subject line
            text: String(body.code), // plain text body
            html: `<p>Here is the data you requested:</p><p>Data: <strong>${String(body.code)}</strong></p>` // html body with data
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                res.send('Error');
            } else {
                console.log('Email sent: ' + info.response);
                res.send('Email sent: ' + info.response);
            }
        });
    }
    else {
        res.status(400).send({ code: 1, returnMessage: "User Doesn't Exist." })
    }
})


io.on("connection", (socket) => {
    console.log("User Connected");
    console.log("Id", socket.id);

    socket.on("message", (data) => {
        console.log(data);
        socket.broadcast.emit('receive-message', data)
    })
})

server.listen(3000, () => {
    console.log('Server Is Running on Port 3000')
})