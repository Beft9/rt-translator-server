import express from "express";
import router from "./routes.js";
import expressWs from "express-ws";


const PORT = 5000
const app = express();

app.set('meetings', []);
expressWs(app);

console.log("Server started...")

app.use(express.urlencoded({extended: true}))

app.use(express.json())

app.use(router)

app.listen(PORT);