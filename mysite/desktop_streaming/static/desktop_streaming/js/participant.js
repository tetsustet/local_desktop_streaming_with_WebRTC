"use strict"

let connections = new Array();
let room;
let timer;

console.log("create_room.js is loaded");
$(window).on("load", function() {
    console.log("window on load function");
    init();
})

async function init(){
    room = await getRoomDetail();
    console.log(room);
    let connection = new WebRTCConnection(room.organizer_uuid, "Offer", "vannilaICE");
    let localStream = WebRTCConnection.getFakeStream(new AudioContext());
    connection.setStreams(localStream);
    connection.connect();
    connection.connection.ontrack = function(event) {
        console.log("ontrack");
        document.getElementById("remote_desktop").srcObject = event.streams[0];
        //document.getElementById("hangup-button").disabled = false;
    };
    connections.push(connection);
    console.log(connections);
}

async function getRoomDetail() {
    let response = await fetch(`../../../api/rooms/${getRoomId()}`,{
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
            'X-CSRFToken': Cookies.get('csrftoken')
        },
    });
    let d = await response.json();
    return d;
}