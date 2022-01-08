"use strict"

console.log("create_room.js is loaded");
$(window).on("load", function() {
    console.log("window on load function");
    init();
});

function init() {
    $("#join_button").on("click", function(e){
        if($("#room_id").val()==""){
            console.log("show danger message");
            $("#room_id").next().text("部屋IDは必須です")
                                .removeClass("is-hidden");
            return
        }else{
            console.log("hide danger message");
            $("#room_id").next().addClass("is-hidden");
        }
        let roomId = $("#room_id").val();
        //問い合わせて
        fetch(`../api/rooms/${roomId}`,{
            method: 'GET',
        }).then(function(response){
            //既存ならエラー
            if(response.status == 200){
                $("#room_id").next().text("その部屋IDは使われています")
                                    .removeClass("is-hidden");
            }else if(response.status == 404){
                //なければ作成して配信ページへ移動
                let uuid = Cookies.get('uuid'); 
                
                if(!uuid){
                    uuid = UUID.generate();
                    Cookies.set('uuid', uuid, {sameSite:"Strict"});
                    alert("UUID is updated");
                }
                let data ={
                    room_id: roomId,
                    organizer_uuid: uuid
                }
                console.log("POST");
                fetch(`../api/rooms/`,{
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
                        'X-CSRFToken': Cookies.get('csrftoken')
                    },
                    body: JSON.stringify(data)    
                }).then(function(){
                    console.log("create streaming page");
                    window.location.href = `../rooms/${roomId}/organizer/`
                });
            }
        });

        //何故か動かない
        $("#room_id").keydown(function(e){
            console.log("keydown()");
            if (e.keyCode == 13) {
                e.preventDefault();
                $("#join_button").trigger("click");
            }
        });
     });

     $("#room_id").on("change", function(){
        console.log("roomId on change function");
        if($(this).val()==""){
            console.log("show danger message");
            $(this).next().text("部屋IDは必須です")
                          .removeClass("is-hidden");

        }else{
            console.log("hide danger message");
            $(this).next().addClass("is-hidden");
        }
     })
}