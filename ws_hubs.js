import { TextToSpeech } from "./functions/speaker.js";
import { SimpleTranslater } from "./functions/translator.js";

export default function main(app){
    app.ws('/meeting_hub', function(ws, req) {
        ws.on('message', async function(msg) {
            try {
                var meetings = app.get('meetings');
                console.log(meetings);
                var req = JSON.parse(msg);
                console.log(req)
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