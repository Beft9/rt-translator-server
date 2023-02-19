import { TextToSpeech } from "./functions/speaker.js";
import { SimpleTranslater } from "./functions/translator.js";

export default function MeetingHub(router, meeting_id, user_id){
    router.ws('/meeting_hub/'+meeting_id+'/'+user_id, function(ws, req) {
        ws.on('message', async function(msg) {
            try {
                console.log("Message!");
                var meetings = app.get('meetings');
                console.log(meetings);
                console.log(msg);
                console.log(req)
                var req = JSON.parse(msg);
                if(req.type == "start"){
                    console.log("StartTypeMessage");
                    
                    return;
                }
                for(let i=0; i<meetings[0].users.length; i++){
                    if(meetings[0].users[i].name != req.user){
                        console.log(meetings[0].users[i]);
                        var translation = await SimpleTranslater(req.text, req.lang, meetings[0].users[i].lang);
                        console.log(translation);
                        var speech = await TextToSpeech(translation, meetings[0].users[i].lang);
                        console.log(speech)
                        var u8 = new Uint8Array(speech[0].audioContent);
                        var b64 = Buffer.from(u8).toString('base64')
                        
                        speech[0].audioContent = b64;
                        ws.send(JSON.stringify({
                            user: meetings[0].users[i].name,
                            audioContent: speech[0].audioContent, 
                        }));
                    }
                }
                
            }
            catch(err){
                console.log(err)
            }
        });
        console.log('socket', req.testing);
    });
}

export function SendNewUser(io, meeting_id, user_id, participants){
    io.emit("newUserJoined", {
        participants: participants
    })
}

export async function CreateHub(io, meeting_id, user_id){
    console.log("Hub Creation");
    /*io.on("connection", (socket) => {
        console.log("Meeting socket created...");
        console.log("id:", socket.id)
      });*/
}

export function DeleteHub(ws_hubs, meeting_id, user_id){
    function findHub(hub){
        return (hub.meeting_id==meeting_id && hub.user_id==user_id)
    }
}


