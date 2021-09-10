const express = require('express');
const { stringify } = require('querystring');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');

let allUsers = [];
let rooms = [
    {
        roomId: 'adasdasdasdasd',
        users: [
            {
                userId: 'adasdasdasdsad',
                abc: 'adasdasfasfd',
            },
            {
                userId: '1',
                abc: 'a',
            }
        ]
    },
    {
        roomId: 'khapro',
        users: [
            {
                userId: '1'
            },
            {
                userId: '2'
            }
        ]
    },
    {
        roomId: 'khavip',
        users: [
            {
                userId: '3'
            },
            {
                userId: '4'
            }
        ]
    }
];

let l = rooms.length;
let roomid = 'aaaa';
let c = 0;
while (c < l){
    if(rooms[c].roomId == roomid){
        rooms[c].users.push({
            userId: '1'
        });
        
        break;
    } else {
        console.log('chwua cos');
        break;
    }
    c++;
}




app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
});

// Server chạy và lắng nghe kết nối
// io.on('connection', socket => {

//     // nếu có req gọi lên với key = 'join-room' 
//     socket.on('join-room', (roomId, userId) => {
//         const l = rooms.length;
//         for(let i = 0; i < l; i++){
//             if(rooms[i].roomId == `${roomId}`){ // nếu đã tồn tại rồi thì chỉ thêm người dùng vào thôi
//                 rooms[i].users.push({
//                     userId: `${userId}`
//                 });
//                 console.log('đã có');
//                 break;
//             }
//             rooms.push({ // chưa thì thêm room vào 1 cái mảng json để dễ quản lý
//                 roomId: `${roomId}`,
//                 users: [{
//                     userId: `${userId}`
//                 }]
//             });
//             console.log('chưa có');
//             break;
//         }

//         console.log(rooms);

//         //console.log(rooms[0]);
//         socket.join(roomId);
//         // gửi lên userId của người vừa vào room cho tất cả người trong room với key = 'user-connected' 
//         // socket.to(roomId).emit('user-connected', userId);
//         // socket.emit('user-connected', userId);   
//         io.sockets.to(roomId).emit('user-connected', userId);
//         //socket.broadcasts.to(roomId).emit('user-connected', userId);


//         // lắng nghe sự kiện có người rời phòng
//         socket.on('disconnect', () => {

//             // gừi về userId của người vừa rời phòng cho tất cả client trong room
//             socket.to(roomId).emit('user-disconnected', userId);
//         });
        
        
//     });
// });

server.listen(3000, () => {
    console.log("server is running in 3000");
});