"use strict"

console.log("create_room.js is loaded");
$(window).on("load", function() {
    console.log("window on load function");
    init();
})

function init(){
    let connection = new RTCPeerConnection();
    connection.createOffer().then(submitOffer)
}

function submitOffer(offer){
    console.log("submitOffer")
    console.log(offer.sdp);
    let uuid = Cookies.get('uuid'); 
    if(!uuid){
        uuid = UUID.generate();
        Cookies.set('uuid', uuid);
        alert("UUID is updated");
    }
    let data ={
        room_id: getRoomId(),
        participant_uuid: uuid,
        offer_sdp: offer.sdp,
    }
    console.log(data);
    console.log("POST");
    fetch(`../../../api/offers/`,{
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
            'X-CSRFToken': Cookies.get('csrftoken')
        },
        body: JSON.stringify(data)    
    }).then(function(){
        console.log("send offer");
    });
}

function getRoomId(){
    let splitted = decodeURI(location.href).split("/");
    console.log(splitted);
    let idx = splitted.findIndex(function(e){
        return e == "rooms";
    });
    return splitted[idx + 1];
}