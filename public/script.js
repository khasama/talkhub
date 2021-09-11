const socket = io('/');
const myPeer = new Peer();

const myVideo = document.createElement('video');
myVideo.muted = true;

let localStream;
let currentId;
peers = {};
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
    socket.emit('join-room', ROOM_ID, id, localStream.id);
    addVideoStream(myVideo, localStream);
    currentId = id;
    console.log('khoi tao');
});

myPeer.on('call', call => {
    call.answer(localStream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        video.setAttribute('id', userVideoStream.id);
        addVideoStream(video, userVideoStream);
    });
});

socket.on('user-connected',  userId => {
    connectToNewUser(userId, localStream);
    console.log('co nguoi ket noi');
});

socket.on('update-list', userInRoom => {
    console.log('update');
    listUsers = JSON.parse(userInRoom).users;
});

socket.on('user-disconnected', (userInRoom, userId, mediaId) => {
    console.log('co nguoi huy ket noi');
    if(peers[userId]) peers[userId].close();
    listUsers = JSON.parse(userInRoom).users;
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
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        video.setAttribute('id', userVideoStream.id);
        addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
        video.remove();
    });
    peers[userId] = call;

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
