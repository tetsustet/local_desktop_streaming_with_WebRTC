"use strict"

let connections = new Array();

console.log("create_room.js is loaded");
$(window).on("load", function() {
    console.log("window on load function");
    init();
})

async function init(){
    let connection = new RTCPeerConnection();
    let offer = await connection.createOffer();
    await submitOffer(offer);
    console.log(`My Offer\n${offer.sdp}`);
    console.log('setLocalDescription');
    await connection.setLocalDescription(offer);
    connections.push(connection);
    console.log(connections);
}

function submitOffer(offer){
    return new Promise(function(resolve){
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
            console.log("submitOffer");
            //offer返してるけど呼び出し元では使ってない
            resolve(offer);
        });
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