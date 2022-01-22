const express = require('express');
const { stringify } = require('querystring');
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const session = require('express-session');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4, validate: uuidValidate } = require('uuid');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    "key": "user",
    "secret": "khaprovcl",
    "resave": true,
    "saveUninitialized": true
}));
const port = process.env.PORT || 3000;

let allUsers = [];
let rooms = [
    {
        roomId: 'aaaa',
        screen: false,
        users: []
    },
];

const User = require('./models/User');
app.post('/signup', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if(username && password) {
        console.log(`${username} ${password}`);
        const user = await User.findOne({ username });
        if (!user) {
            bcrypt.hash(password, 10, async (err, hash) => {
                const userData = { username, password: hash };
                const newUser = new User(userData);
                await newUser.save();
                res.redirect('/');
            });
        } else {
            return res.render('pages/index', {errorSignUp: "Đã tồn tại Username trong hệ thống", errorSignIn: "", user: ""});
        }
    } else {
        res.redirect('/');
    }
    
});
app.post('/signin', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if(username && password) {
        //console.log(`${username} ${password}`);
        const user = await User.findOne({ username });
        if (user) {
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    req.session.user = user;
                    //console.log(JSON.stringify(req.session.user.username));
                    return res.redirect('/');
                } else {
                    return res.render('pages/index', {errorSignIn: "Sai pass", errorSignUp: "", user: ""});
                }
            });
        } else {
            return res.render('pages/index', {errorSignIn: "Không tìm thấy Username", errorSignUp: "", user: ""});
        }
    } else {
        return res.redirect('/');
    }
    
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.get('/', (req, res) => {
    if(req.session.user){
        res.render('pages/index', {errorSignUp: "", errorSignIn: "", user: req.session.user});
    } else {
        res.render('pages/index', {errorSignUp: "", errorSignIn: "", user: ""});
    }
    
});

app.get('/:room', (req, res) => {
    if (req.session.user) {
        if(uuidValidate(req.params.room)){
            res.render('pages/room', { roomId: req.params.room, user: req.session.user });
        } else {
            res.redirect(`/`);
        }
    } else {
        res.redirect(`/`);
    }
    
});

// Server chạy và lắng nghe kết nối
io.on('connection', socket => {

    // nếu có req gọi lên với key = 'join-room' 
    socket.on('join-room', (roomId, userId, mediaId, username) => {
        let screen;
        
        checkAndAdd(roomId, userId, mediaId, username); // kiểm tra có tồn tại và thêm mới
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
        socket.to(roomId).emit('user-connected',  userId, username);

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
            socket.to(roomId).emit('user-disconnected', JSON.stringify(userInRoom), userId, mediaId, username);
        });

        // lắng nghe có người nào đó share screen
        socket.on('user-share', (roomId, id, userId, username) => {
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
            socket.to(roomId).emit('user-share', id, username, JSON.stringify(userInRoom));
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

function checkAndAdd(roomId, userId, mediaId, username){
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
            name: `${username}`,
            isStream: false
        });
    }else{
        rooms.push({
            roomId: `${roomId}`,
            screen: false,
            users: [{
                userId: `${userId}`,
                mediaId: `${mediaId}`,
                name: `${username}`,
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
connectDB();
server.listen( port, () => {
    console.log("server is running in 3000");
});