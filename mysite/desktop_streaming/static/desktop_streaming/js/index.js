"use strict"

console.log("create_room.js is loaded");
$(window).on("load", function() {
    console.log("window on load function");
    init();
})

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
        fetch(`api/rooms/${roomId}`,{
            method: 'GET',
        }).then(function(response){
            //既存なら飛ぶ
            if(response.status == 200){
                console.log("room is exist");
                window.location.href = `rooms/${roomId}/participant/`
            }else if(response.status == 404){
                $("#room_id").next().text("その部屋は存在しません")
                                    .removeClass("is-hidden");
            }
        });
     });
}