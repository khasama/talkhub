const socket = io('/');
const myPeer = new Peer();

const myVideo = document.createElement('video');
myVideo.muted = true;

let localStream;
let currentId;
peers = {};
let listUsers = [];
let listToConn = [];
let con;



// Bật client cái này sẽ chạy
navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
}).then(stream => {
    localStream = stream;
}).catch((err) => { console.log(err) });

// Bắt đầu tạo userId và gửi userId và roomId lên cho server với key là 'join-room'
myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id, localStream.id);
    addVideoStream(myVideo, localStream); // Thêm màn hình của chính mình lên
    currentId = id;
    console.log('khoi tao');
    
});

// Lắng nghe có người gọi tới
myPeer.on('call', call => {
    call.answer(localStream); // trả lời bằng stream của mình
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        video.setAttribute('id', userVideoStream.id);
        addVideoStream(video, userVideoStream); //Nếu có người gọi tới thì thêm stream của họ vào
    });
});

// lắng nghe có người kết nối tới
myPeer.on('connection', (conn) => {
    conn.on('data', (data) => {
        // nếu có người nhắn thì thêm tin nhắn lên box
        $(".chat-box").append(`<p>${conn.peer}: ${data}</p>`);
    });
});

// Nhận về userId của người vừa vào phòng và gọi cho họ
socket.on('user-connected',  userId => {
    $(".chat-box").append(`${userId} vừa tham gia !!!`);
    connectToNewUser(userId, localStream);
    console.log('co nguoi ket noi');
});

// nếu có người mới vào phòng server sẽ update danh sách và trả về cho all người trong phòng
socket.on('update-list', userInRoom => {
    console.log('update');
    listUsers = JSON.parse(userInRoom).users; //cập nhật lại
    updateUsers(listUsers);
    // update lại cái list để gửi tin nhắn
    let newListToConn = [];
    listUsers.forEach(ele => {
        const conn = myPeer.connect(ele.userId);
        newListToConn.push(conn);
    });
    listToConn = newListToConn;
    
});

// nếu có người hủy kết nối thì hủy màn hình của họ và đóng kết nối
socket.on('user-disconnected', (userInRoom, userId, mediaId) => {
    console.log('co nguoi huy ket noi');
    if(peers[userId]) peers[userId].close(); 
    listUsers = JSON.parse(userInRoom).users;

    // Update lại cái danh sách người dùng trong phòng
    updateUsers(listUsers);
    
    // hiện người vừa rời lên box
    $(".chat-box").append(`<p>${userId} vừa rời phòng !!!</p>`);
    $(`#${mediaId}`).remove();
});

function addVideoStream(video, stream){
    video.autoplay = true;
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    $("#video-grid").append(video);
}

function connectToNewUser(userId, stream){
    //gọi cho họ với userId và gửi kèm với cái stream của mình
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        // nếu họ trả lời thì thêm màn hình của họ lên
        video.setAttribute('id', userVideoStream.id);
        addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
        video.remove();
    });
    peers[userId] = call;

}


function updateUsers(listUsers){
    let list = '';
    listUsers.find((obj, i) => {
        list += `<li>${obj.userId}</li>`
    });
    $('.list-users').html(list);
}

$("#btnOff").click(() => {
    myVideo.pause();
    myVideo.src = "";
    localStream.getVideoTracks()[0].stop();
    $("#btnOff").hide();
    $("#btnOn").show();
});

$("#btnOn").click(() => {
    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            width: { min: 1024, ideal: 1280, max: 1920 },
            height: { min: 576, ideal: 720, max: 1080 }
        }
    }).then(stream => {
        localStream = stream;
        myVideo.autoplay = true;
        myVideo.srcObject = localStream;
        myVideo.play();
    });
    $("#btnOn").hide();
    $("#btnOff").show();
});

$("#chat-input").keyup((event) => {
    if (event.keyCode === 13) {
        let msg = $("#chat-input").val();
        sendMess(msg);
    }
});
$("#submit-chat").click(() => {
    let msg = $("#chat-input").val();
    sendMess(msg);
});

function sendMess(mess){
    $("#chat-input").val('');
    if(mess){
        $(".chat-box").append(`<p>You: ${mess}</p>`);
        listToConn.forEach((ele) => {
            ele.send(mess);
        });
    }
}
