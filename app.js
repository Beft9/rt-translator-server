import express from "express";
import router from "./routes.js";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 5001
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { path: "/meeting_hub" });
// const ipAddress = '192.168.1.185';
const ipAddress = '192.168.1.39'

app.set("io", io);

console.log("Server started...")

app.use(express.urlencoded({ extended: true }))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb' }));

app.use(router)

// httpServer.listen(PORT);

app.listen(PORT, ipAddress, () => {
  console.log(`Server is running on http://${ipAddress}:${PORT}`);
});

io.on("connection", (socket) => {
  console.log("Meeting socket created...");
  console.log("id:", socket.id)
});