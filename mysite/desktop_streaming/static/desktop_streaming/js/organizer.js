"use strict"

let timer;
let connections = new Array();
let currentStream;
let defaultStream;
let desktopStream;
let sharingState; //"sharing", "not-sharing"

console.log("create_room.js is loaded");
$(window).on("load", function() {
    console.log("window on load function");
    init();
})

function init(){
    $("#share_desktop").on("click", shareDesktopButton);
    sharingState = "non-sharing";
    defaultStream = WebRTCConnection.getFakeStream(new AudioContext());
    currentStream = defaultStream;
    timer = setInterval(checkOffer,3000);
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
        console.log(`connect()`);
        connection.connect();
        connection.onready = function(){
            connection.setStreams(currentStream);
        }
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

async function shareDesktopButton(){
    console.log("shareDesktopButton()");
    if(sharingState == "non-sharing"){
        let video = $("#main_view").get(0);
        try{
            let stream = await navigator.mediaDevices.getDisplayMedia({video: true});
            // streamをvideoにつなげる
            stream.addEventListener("onremovetrack", removeDesktop, stream);
            video.srcObject = stream;
            desktopStream = stream;
            currentStream = stream;
            $("#share_desktop").removeClass("is-link")
                            .addClass("is-danger")
                            .text("共有を停止");
            sharingState = "sharing"
            connections.forEach(connection => {
                connection.setStreams(desktopStream);
            });
            return stream;
        }catch(e){
            
        }
    }else{    
        currentStream = defaultStream;
        connections.forEach(connection => {
            connection.setStreams(defaultStream);
        });
        $("#share_desktop").removeClass("is-danger")
                           .addClass("is-link")
                           .text("画面を共有");
        sharingState = "non-sharing"
    }
}

function removeDesktop(stream){
    $("#share_desktop").removeClass("is-danger")
    .addClass("is-link")
    .text("画面を共有");
    sharingState = "non-sharing"
}
