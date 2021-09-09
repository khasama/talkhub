const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
    cors: {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log(socket.id);
});

httpServer.listen(3000);