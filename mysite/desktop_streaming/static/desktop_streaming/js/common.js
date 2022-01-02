"use strict"

// 参考になった資料
// ・ネゴシエーション
// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling#starting_negotiation
// ・DataChannelを用いたSDPの交換
// https://qiita.com/massie_g/items/1316eb8c6e0d171307f5

class WebRTCConnection{
    isOffer;
    connection;
    #checkInterval = 5000;
    targetUUID;
    timer;
    //senders = {video:null, audio:null};

    onready = null;

    messagingChannel;
    
    constructor(targetUUID, type, icetype){
        let thisObj = this;
        this.targetUUID = targetUUID;
        this.isOffer = type == "Offer"? true : false;
        this.icetype = icetype;
        this.connection = new RTCPeerConnection();
        this.messagingChannel = null;

        this.connection.ondatachannel = function(e){
            console.log("ondetachannel\n%o",e);
            thisObj.messagingChannel=e.channel;
            WebRTCConnection.setupDataChannel(thisObj, e.channel);
        }
        this.connection.onnegotiationneeded = function(e){
            console.log("onnegotiationneeded\n%o",e);
            if(!thisObj.messagingChannel  || thisObj.connection.connectionState != "connected"){
                console.log("no messagingChannel or state is not connected\n%o", thisObj);
                return;
            }
            thisObj.handleNegotiationNeededEvent(e);
        }
        this.connection.onconnectionstatechange = function(e) {
            console.log("connection state updated:%s", thisObj.connection.connectionState);
        }

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

    static setupDataChannel(connection, channel){
        console.log("setupDataChannel label:%s",channel.label);
        channel.onerror = function(error) {
            console.log('onerror:', error);
        };
        channel.onopen = function(evt) {
            console.log('onopen:', evt);
        };
        channel.onclose = function() {
            console.log('onclose.');
        };
        if(channel.label == "messagingDataChannel"){
            console.log()
            channel.onmessage = async function(evt) {
                console.log('onmessage:\n %o ', evt);
                console.log(channel);
                const msg = JSON.parse(evt.data);
                if(msg.type == "sdp"){
                    const sdp = msg.content;
                    console.log(msg.content);
                    await connection.connection.setRemoteDescription(msg.content);
                    if(msg.content.type =="offer"){
                        const sdp = await connection.connection.createAnswer();
                        await connection.connection.setLocalDescription(sdp);
                        connection.sendSdpViaMessagingChannel(sdp);
                    }
                }
            };
            channel.onopen = function(evt) {
                console.log('onopen:', evt);
                if(connection.onready){
                    console.log("onready");
                    connection.onready();
                }
            };
        }
        console.log("setupDataChannel()");
    }

    async handleNegotiationNeededEvent(e){
        console.log(this);
        let offer = await this.connection.createOffer();
        this.connection.setLocalDescription(offer);
        this.sendSdpViaMessagingChannel(offer);
    }

    sendSdpViaMessagingChannel(sdp){
        console.log("sendSdpViaMessagingChannel()\n%o",sdp);
        this.sendMessage("sdp", sdp);
    }

    sendMessage(type, obj){
        this.messagingChannel.send(JSON.stringify({type:type, content:obj}));
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
            console.log("connect()");
            this.vanillaICEConnection();
            console.log("connect()_end");
        }
    }

    async onIceCandidate(connection, event) {
        await connection.addIceCandidate(event.candidate);
        console.log(`ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
    }
    
    setStreams(streams) {
        console.log("setStreams()");
        this.connection.getSenders().forEach(sender => {
            console.log("removed\n%o",sender);
            this.connection.removeTrack(sender);
        });
        streams.getTracks().forEach(track => {
            console.log("added\n%o",track);
            this.connection.addTrack(track, streams);
        });
        this.connection.getSenders().forEach(sender => {
            console.log("new sender\n%o",sender);
        });
    }

    createMessagingChannel(){
        if(this.messagingChannel){
            console.error("messaging channel is already exist");
        }
        this.messagingChannel =  this.connection.createDataChannel("messagingDataChannel");
        console.log(this.messagingChannel);
        WebRTCConnection.setupDataChannel(this, this.messagingChannel);
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

