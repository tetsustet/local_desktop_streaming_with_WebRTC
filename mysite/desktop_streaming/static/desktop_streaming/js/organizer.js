"use strict"

let timer;
let canvasTimer;
let connections = new Array();
let currentStream;
let defaultStream;
let desktopStream;
let defaultImg;
let canvas;
let ctx;
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
    defaultStream = canvas.captureStream(30);
    currentStream = defaultStream;   
    $("#main_view").get(0).srcObject = currentStream;
    //$(canvas).appendTo("body");
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("配信は一時停止中です", canvas.width / 2, canvas.height / 2);
    
    sharingState = "non-sharing";
    setTimeout(function(){
        console.log("setStream");
        //CanvasのStreamは先に開いてから描画しないとだめっぽい．
        //表示したいcanvasを予め作っておいて，送信用のcanvasにコピーするのが良いか
        //defaultStream = canvas.captureStream(30);
        currentStream = defaultStream;    
        $("#main_view").get(0).srcObject = currentStream;
        setTimeout(function(){
            canvasDraw();
        },1000);
    },1000);
    timer = setInterval(checkOffer,3000);
    canvasTimer = setInterval(canvasDraw, 100);
}

function canvasDraw(){
    //
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("配信は一時停止中です", canvas.width / 2, canvas.height / 2);
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
                ctx.drawImage(loadImg, 0, 0);
            }
            loadImg.src = e.target.result;
        }
        reader.readAsDataURL($(dialog).get(0).files[0]); 
    })    
    dialog.trigger("click");
    
}