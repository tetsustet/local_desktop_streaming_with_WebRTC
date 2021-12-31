"use strict"

class WebRTCConnection{
    isOffer;
    connection;
    #checkInterval = 5000;
    targetUUID;
    timer;
    senders = {video:null, audio:null};
    
    constructor(targetUUID, type, icetype){
        this.targetUUID = targetUUID;
        this.isOffer = type == "Offer"? true : false;
        this.icetype = icetype;
        this.connection = new RTCPeerConnection();
        if (this.icetype == "vannilaICE"){
            this.connection.addEventListener('icecandidate', e => this.vanillaOnICEcandidate(this.connection, e))
        };
        
        if(this.isOffer){
            this.timer = setInterval(this.checkAnswer,this.#checkInterval, this);
        }
    }

    static acceptConnection(from_uuid, sdp_text, icetype){
        return new Promise(async function(resolve){
            let connection = new WebRTCConnection(from_uuid, "Answer", icetype);
            await connection.connection.setRemoteDescription(new RTCSessionDescription({type:'offer', sdp:sdp_text}));
            console.log(`SetRemoteDescription:${connection.connection}`);
            console.log(connection);
            resolve(connection);
        });
    }

    async checkAnswer(connection){
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
            console.assert(i == 0, "i is non zero");
            console.log(connection.connection);
            connection.connection.setRemoteDescription(new RTCSessionDescription({type:'answer', sdp:data[i].sdp_text}));
            //answer送ったらofferは消しておく
            await fetch(`../../../api/sdp/${data[i].id}/`,{
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
                    'X-CSRFToken': Cookies.get('csrftoken')
                },
            });
            clearInterval(connection.timer);
        }
    }
    
    connect(){
        if(this.icetype == "vannilaICE"){
            this.vanillaICEConnection();
        }
    }

    async onIceCandidate(connection, event) {
        await connection.addIceCandidate(event.candidate);
        console.log(`ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
    }
    
    setStreams(streams) {
        streams.getTracks().forEach(track => this.connection.addTrack(track, streams));
    }

    vanillaOnICEcandidate(connection, e){
        if(e.candidate){
            console.log(e.candidate);
            //connection.addIceCandidate(e.candidate);
        } else {
            console.log('empty ice event');
            console.log(this);
            if(this.isOffer){
                this.submitOffer(this.connection.localDescription);
            }else{
                this.submitAnswer(this.connection.localDescription);
            }
        }
    }

    async vanillaICEConnection(){
        if(this.connection.pendingRemoteDescription){
            console.log("remote sdp is exists. I create answer.");
            let answer = await this.connection.createAnswer();
            await this.connection.setLocalDescription(answer);
        }else{
            console.log("I create offer.");
            let offer = await this.connection.createOffer();
            await this.connection.setLocalDescription(offer);
        }
    }

    submitAnswer(sdp){
        let connection = this;
        return new Promise(function(resolve){
            let uuid = Cookies.get('uuid'); 
            if(!uuid){
                uuid = UUID.generate();
                Cookies.set('uuid', uuid);
                alert("UUID is updated");
            }
            let data ={
                room_id: getRoomId(),
                from_uuid: uuid,
                to_uuid: connection.targetUUID,
                sdp_text: sdp.sdp,
            }
            fetch(`../../../api/sdp/`,{
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
                resolve(sdp);
            });
        });

    }

    submitOffer(sdp){
        return new Promise(function(resolve){
            let uuid = Cookies.get('uuid'); 
            if(!uuid){
                uuid = UUID.generate();
                Cookies.set('uuid', uuid);
                alert("UUID is updated");
            }
            let data ={
                room_id: getRoomId(),
                from_uuid: uuid,
                to_uuid: room.organizer_uuid,
                sdp_text: sdp.sdp,
            }
            fetch(`../../../api/sdp/`,{
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
                resolve(sdp);
            });
        });
    }

    // ダミーのMediaStreamを生成する
// 参照: https://lealog.hateblo.jp/entry/2018/02/19/160808
    static getFakeStream(ctx) {
        const $canvas = document.createElement('canvas');
        $canvas.width = $canvas.height = 1;
        // NOTE: これがないとFirefoxが通らない
        $canvas.getContext('2d');
        const vStream = $canvas.captureStream();
        const aStream = ctx.createMediaStreamDestination().stream;
    
        const [vTrack] = vStream.getVideoTracks();
        const [aTrack] = aStream.getAudioTracks();
    
        return new MediaStream([vTrack, aTrack]);
    }
}

function getRoomId(){
    console.log("getRoomId()");
    let splitted = decodeURI(location.href).split("/");
    let idx = splitted.findIndex(function(e){
        return e == "rooms";
    });
    return splitted[idx + 1];
}

