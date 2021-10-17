const express = require('express');
const { stringify } = require('querystring');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4, validate: uuidValidate } = require('uuid');

app.set('view engine', 'ejs');
app.use(express.static('public'));
const port = process.env.PORT || 3000;

let allUsers = [];
let rooms = [
    {
        roomId: 'aaaa',
        screen: false,
        users: []
    },
];

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

app.get('/home', (req, res) => {
    res.render('pages/index');
});

app.get('/:room', (req, res) => {
    if(uuidValidate(req.params.room)){
        res.render('room', { roomId: req.params.room });
    } else {
        res.redirect(`/home`);
    }
});

// Server chạy và lắng nghe kết nối
io.on('connection', socket => {

    // nếu có req gọi lên với key = 'join-room' 
    socket.on('join-room', (roomId, userId, mediaId) => {
        let screen;
        
        checkAndAdd(roomId, userId, mediaId); // kiểm tra có tồn tại và thêm mới
        const userInRoom = rooms.find((item, i) => { //lấy ra danh sách người đang trong phòng
            if(item.roomId == roomId){
                return item;
            }
        });

        rooms.find(item => {
            if(item.roomId == roomId){
                screen = item.screen;
            }
        });

        if(screen){
            socket.emit('user-shared', screen);
        }

        socket.join(roomId);
        // gửi lên userId của người vừa vào room cho tất cả người trong room với key = 'user-connected' 
        socket.to(roomId).emit('user-connected',  userId);

        //update danh sách và gửi về cho all người trong room
        io.sockets.to(roomId).emit('update-list', JSON.stringify(userInRoom));
        
        // lắng nghe sự kiện có người rời phòng
        socket.on('disconnect', () => {
            let index;
            rooms.find((item, i) => {
                if(item.roomId == roomId){
                    index = i;
                }
            });
            rooms[index].users.find((user, i) => { // kiểm tra người mới rời phòng có đang share screen ko
                if(user.isStream === true && user.userId == userId){
                    socket.to(roomId).emit('user-stop-share'); // nếu có thì gửi về là dừng share
                }
            });
            
            // xóa người mới rời phòng
            removeUser(roomId, userId);
            // gừi về danh sách mới và userId của người vừa rời phòng cho tất cả client trong room
            socket.to(roomId).emit('user-disconnected', JSON.stringify(userInRoom), userId, mediaId);
        });

        // lắng nghe có người nào đó share screen
        socket.on('user-share', (roomId, id, userId) => {
            let index;
            rooms.find((item, i) => {
                if(item.roomId == roomId){
                    index = i;
                }
            });
            rooms[index].screen = id;
            rooms[index].users.find((user, i) => { // tìm vị trí của người share screen
                if(user.userId == userId){
                    rooms[index].users[i].isStream = true; // ghi lại trạng thái là true
                }
            });
            console.log(rooms[index]);
            // gửi screenId về cho những người khác trừ người gửi
            socket.to(roomId).emit('user-share', id);
        });
        // lắng nghe có người vừa dừng share
        socket.on('user-stop-share', () => {
            let index;
            rooms.find((item, i) => {
                if(item.roomId == roomId){
                    index = i;
                }
            });
            rooms[index].screen = false;
            rooms[index].users.find((user, i) => { // tìm vị trí của người vừa dừng share screen
                if(user.userId == userId && user.isStream){
                    rooms[index].users[i].isStream = false; // ghi lại trạng thái là false
                }
            });
            
            console.log(rooms[index]);
            // gửi screenId về cho những người khác trừ người gửi
            socket.to(roomId).emit('user-stop-share');
        });
        
        
    });
});

function checkAndAdd(roomId, userId, mediaId){
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
            mediaId: `${mediaId}`,
            isStream: false
        });
    }else{
        rooms.push({
            roomId: `${roomId}`,
            screen: false,
            users: [{
                userId: `${userId}`,
                mediaId: `${mediaId}`,
                isStream: false
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

server.listen( port, () => {
    console.log("server is running in 3000");
});