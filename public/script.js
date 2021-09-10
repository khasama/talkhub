const socket = io('/');
const myPeer = new Peer();

const myVideo = document.createElement('video');
myVideo.muted = true;

let localStream;

peers = {}

// Bật client cái này sẽ chạy
navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
        width: { min: 1024, ideal: 1280, max: 1920 },
        height: { min: 576, ideal: 720, max: 1080 }
    }
}).then(stream => {
    // Thêm màn hình của chính mình lên
    //addVideoStream(myVideo, stream);

    localStream = stream;

    myPeer.on('call', call => {
        //call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            console.log(userVideoStream);
            addVideoStream(video, userVideoStream);
        });
    });

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream);
    });

});

// Bắt đầu tạo userId và gửi userId và roomId lên cho server với key là 'join-room'
myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
});

socket.on('user-connected', userId => {
    console.log(userId);
});

socket.on('user-disconnected', userId => {
    if(peers[userId]) peers[userId].close();
    $(`#${userId}`).remove();
});

function addVideoStream(video, stream){
    video.autoplay = true;
    video.srcObject = stream;
    video.play();
    $("#video-grid").append(video);
}

function connectToNewUser(userId, stream){
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    video.setAttribute('id', userId);
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
        video.remove();
    });

    peers[userId] = call;
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
