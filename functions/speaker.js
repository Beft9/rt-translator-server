import { v1 } from '@google-cloud/text-to-speech'

const Speech = v1.TextToSpeechClient;

const projectId = 'wired-compass-334608';

const speech = new Speech({projectId})

const request = {
    input: { text: ""},
    voice: {languageCode: 'tr-TR', ssmlGender: 'NEUTRAL'},
    audioConfig: { audioEncoding: 'MP3'}
  }
  

export async function TextToSpeech(text, lang){
    request.input.text = text;
    request.voice.languageCode = lang;
    try {
      const response = await speech.synthesizeSpeech(request);
      return response;
    } catch(err) {
      console.log("Error",err);
    }
  }