import express from "express";
import router from "./routes.js";
import expressWs from "express-ws";
import main from "./ws_hubs.js";


const PORT = 5000
const app = express();

app.set('meetings', []);
expressWs(app);

app.use(express.urlencoded({extended: true}))

app.use(express.json())

app.use(router)

main(app);

app.listen(PORT);