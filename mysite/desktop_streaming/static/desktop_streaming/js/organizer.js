"use strict"

let timer;
let connections = new Array();
let currentStream;
let sharingState; //"sharing", "not-sharing"

console.log("create_room.js is loaded");
$(window).on("load", function() {
    console.log("window on load function");
    init();
})

function init(){
    $("#share_desktop").on("click", getDesktopStream);
    currentStream = WebRTCConnection.getFakeStream(new AudioContext());
}

//あとでoffer listnerとして commonに出す
async function checkOffer(){
    // console.log("waitOffer()");
    let response = await fetch(`../../../api/sdp/?${new URLSearchParams({to_uuid: Cookies.get('uuid'), is_solved:"False"})}`,{
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
            'X-CSRFToken': Cookies.get('csrftoken')
        },
    });

    //ここを見ながら書いた https://github.com/webrtc/samples/blob/gh-pages/src/content/peerconnection/pc1/js/main.js
    let data = await response.json();
    if(data.length != 0)console.log(data);
    for(let i = 0; i < data.length; i++){
        let connection = await WebRTCConnection.acceptConnection(data[i].from_uuid, data[i].sdp_text, "vannilaICE");
        let localStream = WebRTCConnection.getFakeStream(new AudioContext());
        connection.setStreams(currentStream);
        console.log(`connect()`);
        connection.connect();
        connections.push(connection);
    
        //answer送ったらofferは消しておく
        await fetch(`../../../api/sdp/${data[i].id}/`,{
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
                // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
                'X-CSRFToken': Cookies.get('csrftoken')
            },
        });
    }
}

async function getDesktopStream(){
    console.log("getDesktopStream()");
    let video = $("#desktop").get(0);
    let stream = await navigator.mediaDevices.getDisplayMedia({video: true})
    // streamをvideoにつなげる
    video.srcObject = stream;
    timer = setInterval(checkOffer,3000);
    currentStream = stream;
    return stream;
}
