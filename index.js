const express = require('express');
const { stringify } = require('querystring');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');

let allUsers = [];
let rooms = [
    {
        roomId: 'aaaa',
        users: []
    },
];


app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
});

// Server chạy và lắng nghe kết nối
io.on('connection', socket => {

    // nếu có req gọi lên với key = 'join-room' 
    socket.on('join-room', (roomId, userId, mediaId) => {
        checkAndAdd(roomId, userId, mediaId);
        const userInRoom = rooms.find((item, i) => {
            if(item.roomId == roomId){
                return item;
            }
        });
        console.log(userInRoom);

        //console.log(rooms[0]);
        socket.join(roomId);
        // gửi lên userId của người vừa vào room cho tất cả người trong room với key = 'user-connected' 
        socket.to(roomId).emit('user-connected',  userId);
        //socket.emit('user-connected', userId);
        io.sockets.to(roomId).emit('update-list', JSON.stringify(userInRoom));
        //socket.broadcasts.to(roomId).emit('user-connected', userId);


        // lắng nghe sự kiện có người rời phòng
        socket.on('disconnect', () => {
            removeUser(roomId, userId);
            // gừi về userId của người vừa rời phòng cho tất cả client trong room
            socket.to(roomId).emit('user-disconnected', JSON.stringify(userInRoom), userId, mediaId);
        });
        
        
    });
});

function checkAndAdd(roomId, userId, mediaId){
    //console.log(mediaId);
    let index = -1;
    const val = `${roomId}`
    rooms.find((item, i) => {
        if(item.roomId == val){
            index = i;
        }
    });
    if(index > -1){
        rooms[index].users.push({
            userId: `${userId}`,
            mediaId: `${mediaId}`
        });
    }else{
        rooms.push({
            roomId: `${roomId}`,
            users: [{
                userId: `${userId}`,
                mediaId: `${mediaId}`
            }]
        });
    }
}

function removeUser(roomId, userId){
    let index = -1;
    let d = -1;
    const val = `${roomId}`
    rooms.find((item, i) => {
        if(item.roomId == val){
            index = i;
        }
    });
    rooms[index].users.find((obj, n) => {
        // vì if(obj.userId == userId) nó đéo chịu nên làm thế này
        b = obj.userId == userId;
        c = b;
        if(c){
            d = n;
        }
        
    });
    rooms[index].users.splice(d, 1);
}

server.listen( process.env.PORT || 3000, () => {
    console.log("server is running in 3000");
});