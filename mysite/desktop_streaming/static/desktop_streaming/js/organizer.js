"use strict"

let timer;
let connections = new Array();

console.log("create_room.js is loaded");
$(window).on("load", function() {
    console.log("window on load function");
    init();
})

function init(){
    $("#share_desktop").on("click", getDesktopStream);
    timer = setInterval(checkOffer,3000);
}

async function checkOffer(){
    let response = await fetch(`../../../api/offers/?${new URLSearchParams({room_id: getRoomId(), is_solved:"False"})}`,{
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
            'X-CSRFToken': Cookies.get('csrftoken')
        },
    });
    //ここを見ながら書いた https://github.com/webrtc/samples/blob/gh-pages/src/content/peerconnection/pc1/js/main.js
    let data = await response.json();
    console.log(data);
    for(let i = 0; i < data.length; i++){
        let connection = new RTCPeerConnection();
        console.log(data[i].offer_sdp);
        await connection.setRemoteDescription(new RTCSessionDescription({type:'offer', sdp:data[i].offer_sdp}));
        let answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        await submitAnswer(answer, data[i].participant_uuid);
        console.log(`Answer from pc2:\n${answer.sdp}`);
        connections.push(connection);

        //answer送ったらofferは消しておく
        await fetch(`../../../api/offers/${data[i].id}/`,{
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
                // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
                'X-CSRFToken': Cookies.get('csrftoken')
            },
        });
        
    }
}

function submitAnswer(answer, participant_uuid){
    return new Promise(function(resolve){
        let data ={
            room_id: getRoomId(),
            participant_uuid: participant_uuid,
            answer_sdp: answer.sdp,
        }
        fetch(`../../../api/answers/`,{
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
                'X-CSRFToken': Cookies.get('csrftoken')
            },
            body: JSON.stringify(data)    
        }).then(function(){
            console.log("submitAnswer");
            //offer返してるけど呼び出し元では使ってない
            resolve(answer);
        });
    });
}

async function getDesktopStream(){
    console.log("getDesktopStream()");
    let video = $("#desktop").get(0);
    let stream = await navigator.mediaDevices.getDisplayMedia({video: true})
    // streamをvideoにつなげる
    video.srcObject = stream;
    return stream;
}

function getRoomId(){
    let splitted = decodeURI(location.href).split("/");
    let idx = splitted.findIndex(function(e){
        return e == "rooms";
    });
    return splitted[idx + 1];
}