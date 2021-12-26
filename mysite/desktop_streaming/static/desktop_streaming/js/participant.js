"use strict"

let connections = new Array();
let timer;

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
    timer = setInterval(checkAnswer,2000);
}

async function checkAnswer(){
    let response = await fetch(`../../../api/answers/?${new URLSearchParams({participant_uuid:Cookies.get('uuid'), is_solved:"False"})}`,{
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
            'X-CSRFToken': Cookies.get('csrftoken')//←いらないのか？
        },
    });
    //ここを見ながら書いた https://github.com/webrtc/samples/blob/gh-pages/src/content/peerconnection/pc1/js/main.js
    let data = await response.json();
    console.log(data);
    for(let i = 0; i < data.length; i++){// answerが複数来ることはないはずなので，常に1回．
        console.assert(i == 0);
        let connection = connections[0];
        console.log(`Answer \n${data[i].answer_sdp}`);
        await connection.setRemoteDescription(new RTCSessionDescription({type:'answer', sdp:data[i].answer_sdp}));
        let d = {
            room_id: data[i].room_id_id,//←謎の_id_id 時間があればなおす．
            participant_uuid: data[i].participant_uuid,
            answer_sdp: data[i].answer_sdp,
            is_solved: "True"
        }
        await fetch(`../../../api/answers/${data[i].id}/`,{
            method: 'PUT',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
                'X-CSRFToken': Cookies.get('csrftoken')
            },
            body: JSON.stringify(d)
        });
        //↓ダミーのデータが1つないと正しく削除されていない感．謎．時間があれば直す．
        await fetch(`../../../api/answers/${data[i].id}/`,{
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
                // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
                'X-CSRFToken': Cookies.get('csrftoken')
            },
        });
        clearInterval(timer);
    }
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