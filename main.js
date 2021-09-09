const socket = io('http://localhost:3000');
const peer = new Peer();

function openStream(){
    const config = {
        audio: false,
        video: true
    };
    return navigator.mediaDevices.getUserMedia(config);
}

function playStream(idVideo, stream){
    const video = document.getElementById(idVideo);
    video.srcObject = stream;
    video.play();
}

//openStream().then(stream => playStream('localStream', stream));

peer.on('open', id => $("#localID").append(id));

//goi
$("#btnCall").click(() => {
    const id = $("#remoteID").val();
    openStream().then(stream => {
        playStream('localStream', stream);
        const call = peer.call(id, stream);
        call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
    });
});

//nghe
peer.on('call', call => {
    openStream().then(stream => {
        call.answer(stream);
        playStream('localStream', stream);
        call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
    });
});