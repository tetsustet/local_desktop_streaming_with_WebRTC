"use strict"

console.log("create_room.js is loaded");
$(window).on("load", function() {
    console.log("window on load function");
    init();
})

function init() {
    $("#join_button").on("click", function(e){
        let roomId = $("#room_id").val();
        console.log(`../api/rooms/${roomId}`);
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
                let uuid = UUID.generate();
                Cookies.set('uuid', uuid);
                let data ={
                    room_id: roomId,
                    organizer_uuid: uuid
                }
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
                });

            }
        });
     });

     $("#room_id").on("change", function(){
        console.log("roomId on change function");
        if($(this).val()==""){
            console.log("show danger message");
            $(this).next().removeClass("is-hidden");

        }else{
            console.log("hide danger message");
            $(this).next().text("部屋IDは必須です")
                .addClass("is-hidden");
        }
     })
}