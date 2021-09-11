const socket = io('/');
const myPeer = new Peer();

const myVideo = document.createElement('video');
myVideo.muted = true;

let localStream;
let currentId;
peers = {}
let userIn = [];
let listUsers = [];



// Bật client cái này sẽ chạy
navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
}).then(stream => {
    // Thêm màn hình của chính mình lên
    

    localStream = stream;
}).catch((err) => { console.log(err) });

// Bắt đầu tạo userId và gửi userId và roomId lên cho server với key là 'join-room'
myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
    addVideoStream(myVideo, localStream);
    currentId = id;
    userIn.push(id);
    console.log('khoi tao');
});

myPeer.on('call', call => {
    call.answer(localStream);
});

socket.on('user-connected', (userInRoom, userId) => {
    listUsers = JSON.parse(userInRoom).users;
    connectToNewUser(userId, localStream);
    // socket.emit('update-list', userId);
    console.log('co nguoi ket noi');
});

// socket.on('user-connected', userId => {
//     console.log(userId);
// });

socket.on('user-disconnected', (userInRoom, userId) => {
    console.log('co nguoi huy ket noi');
    if(peers[userId]) peers[userId].close();
    listUsers = JSON.parse(userInRoom).users;
    console.log(listUsers);
});

function addVideoStream(video, stream){
    video.autoplay = true;
    video.srcObject = stream;
    video.play();
    $("#video-grid").append(video);
}

function connectToNewUser(userId, stream){
    // listUsers.forEach((user) => {
    //     console.log(user.userId != currentId);
    //     if(user.userId != currentId){
    //         $(`#${user.userId}`).remove();
    //         const call =  myPeer.call(user.userId, stream);
    //         const video = document.createElement('video');
    //         video.setAttribute('id', user.userId);
    //         call.on('stream', userVideoStream => {
    //             console.log(userVideoStream);
    //             addVideoStream(video, userVideoStream);
    //         });
    //         call.on('close', () => {
    //             video.remove();
    //         });
    //         peers[user.userId] = call;
    //     }
    // });
    listUsers.find((obj, i) => {
        if(obj != currentId){
            const call = myPeer.call(obj, stream);
            $(`#${obj}`).remove();
            const video = document.createElement('video');
            video.setAttribute('id', obj);
            call.on('stream', userVideoStream => {
                console.log(i);
                addVideoStream(video, userVideoStream);
            });
            call.on('close', () => {
                video.remove();
            });
            peers[obj] = call;
        }
        
    });
    
}

$("#btnOff").click(() => {
    //console.log(localStream);
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
        //console.log(localStream);
    });
    $("#btnOn").hide();
    $("#btnOff").show();
});
