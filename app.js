import express from "express";
import router from "./routes.js";

const PORT = 5000
const app = express();

app.use(express.urlencoded({extended: true}))

app.use(express.json())

app.use(router)

app.listen(PORT);