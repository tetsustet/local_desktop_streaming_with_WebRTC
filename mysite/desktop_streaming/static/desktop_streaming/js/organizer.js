"use strict"

let timer;
let canvasTimer;
let connections = new Array();
let currentStream;
let defaultStream;
let desktopStream;
let defaultImg;
let canvas;
let canvasCtx;
let streamingCanvas;
let streamingCanvasCtx;

let sharingState; //"sharing", "not-sharing";

console.log("create_room.js is loaded");
$(window).on("load", function() {
    console.log("window on load function");
    init();
})

function init(){
    console.log("init()");
    $("#share_desktop").on("click", shareDesktopButton);
    $("#set_default_img").on("click", setDafaultImgButton);
    
    canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    canvasCtx = canvas.getContext("2d");
    streamingCanvas = document.createElement("canvas");
    streamingCanvasCtx = streamingCanvas.getContext("2d");
    
    //$(streamingCanvas).appendTo("body");
    
    canvasCtx.fillStyle = "#fff";
    canvasCtx.fillRect(0,0,canvas.width, canvas.height);
    canvasCtx.fillStyle = "#000";
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "middle";
    canvasCtx.fillText("配信は一時停止中です", canvas.width / 2, canvas.height / 2);
    canvasDraw();

    defaultStream = streamingCanvas.captureStream(1);
    currentStream = defaultStream;
    $("#main_view").get(0).srcObject = currentStream;
    sharingState = "non-sharing";

    timer = setInterval(checkOffer,3000);
    canvasTimer = setInterval(canvasDraw, 200);
}

function canvasDraw(){
    console.log("canvasDraw()");
    if(streamingCanvas.width != canvas.width || streamingCanvas.height != canvas.height ){
        streamingCanvas.width = canvas.width;
        streamingCanvas.height = canvas.height;
    }
    
    streamingCanvasCtx.drawImage(canvas,0,0);
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

function shareDesktopButton(){
    console.log("shareDesktopButton()");
    if(sharingState == "non-sharing"){
        startDesktopSharing();
    }else{    
        stopDesktopSharing();
    }
}

async function startDesktopSharing(){
        let stream = await navigator.mediaDevices.getDisplayMedia({video: true});
        // streamをvideoにつなげる
        stream.addEventListener("onremovetrack", removeDesktop, stream);
        desktopStream = stream;
        currentStream = stream;
        stream.getTracks()[0].onended = stopDesktopSharing;
        //video.srcObject = currentStream;
        $("#share_desktop").removeClass("is-link")
                        .addClass("is-danger")
                        .text("共有を停止");
        sharingState = "sharing"
        connections.forEach(connection => {
            connection.setStreams(currentStream);
        });
        $("#main_view").get(0).srcObject = currentStream;
        return stream;
}

function stopDesktopSharing(){
    currentStream = defaultStream;
    connections.forEach(connection => {
        connection.setStreams(currentStream);
    });
    $("#main_view").get(0).srcObject = currentStream;
    $("#share_desktop").removeClass("is-danger")
                       .addClass("is-link")
                       .text("画面を共有");
    desktopStream.getTracks().forEach(function(track) {
        track.stop();
    });                   
    sharingState = "non-sharing"
}

function removeDesktop(stream){
    $("#share_desktop").removeClass("is-danger")
    .addClass("is-link")
    .text("画面を共有");
    sharingState = "non-sharing"
}

function setDafaultImgButton(){
    let dialog = $("<input>", {type: "file"});
    dialog.on("change",function(){
        console.log("Image file open");
        let reader = new FileReader(); 
        reader.onload = function(e) {
            const loadImg = new Image();
            loadImg.onload = function() {
                canvas.width  = loadImg.naturalWidth;
                canvas.height = loadImg.naturalHeight;
                canvasCtx.drawImage(loadImg, 0, 0);
            }
            loadImg.src = e.target.result;
        }
        reader.readAsDataURL($(dialog).get(0).files[0]); 
    })    
    dialog.trigger("click");
    
}