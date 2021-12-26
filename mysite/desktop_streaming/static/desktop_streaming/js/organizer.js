"use strict"

console.log("create_room.js is loaded");
$(window).on("load", function() {
    console.log("window on load function");
    init();
})

function init(){
    $("#share_desktop").on("click", getDesktopStream);
}

function submitOffer(sdp){

}

async function getDesktopStream(){
    console.log("getDesktopStream()");
    let video = $("#desktop").get(0);
    let stream = await navigator.mediaDevices.getDisplayMedia({video: true})
    // streamをvideoにつなげる
    video.srcObject = stream;
    return stream;
}