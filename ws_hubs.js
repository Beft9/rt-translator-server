
export function SendNewUser(io, meeting_id, user_id, participants){
    io.emit("newUserJoined", {
        participants: participants
    })
}

export function SendSpeechToParticipants(io, meeting_id, target_user_id, user_id, text, sourceLang){
    console.log("sourceLang:", sourceLang);
    io.emit("speechTo" + target_user_id, {
        user_id: user_id,
        text: text,
        sourceLang: sourceLang
    })
}

export async function CreateHub(io, meeting_id, user_id){   // Not available yet!
    console.log("Hub Creation");
    /*io.on("connection", (socket) => {
        console.log("Meeting socket created...");
        console.log("id:", socket.id)
      });*/
}

export function DeleteHub(ws_hubs, meeting_id, user_id){    // Not available yet!
    function findHub(hub){
        return (hub.meeting_id==meeting_id && hub.user_id==user_id)
    }
}

export function SendSpeechToParticipants(io, meeting_id, user_id, body_user_id, text, lang) {
    console.log('SendSpeechToParticipants working')
}


