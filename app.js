import express from "express";
import router from "./routes.js";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 5000
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { path: "/meeting_hub"});

app.set("io", io);

console.log("Server started...")

app.use(express.urlencoded({extended: true}))

app.use(express.json())

app.use(router)

httpServer.listen(PORT);

io.on("connection", (socket) => {
    console.log("Meeting socket created...");
    console.log("id:", socket.id)
  });