import { Router } from "express";

import { v2 } from '@google-cloud/translate';
import { v1 } from '@google-cloud/text-to-speech'


const Translate = v2.Translate
const Speech = v1.TextToSpeechClient;


const projectId = 'wired-compass-334608';

// Instantiates clients
const translate = new Translate({projectId});
const speech = new Speech({projectId})

async function Translater(req, res) {
  // The text to translate
  const text = await req.query.text;

  // source language
  const source = await req.query.sourcelang;
  console.log("source:", source)


  // The target language
  const target = req.query.targetlang;
  console.log("target:", target)

  const reqOptions = {
    from: source,
    to: target
  }



  // Translates some text into Russian
  const [translation] = await translate.translate(text, reqOptions);


  const audio = await TextToSpeech(translation, target);
  
  var u8 = new Uint8Array(audio[0].audioContent);
  var b64 = Buffer.from(u8).toString('base64')
  
  audio[0].audioContent = b64;
  res.send({translation, audio})
}

const router = Router();

//import Transcripta from "./"

//router.post('/transcript', Transcript);
router.get('/translate', Translater);



const request = {
  input: { text: ""},
  voice: {languageCode: 'tr-TR', ssmlGender: 'NEUTRAL'},
  audioConfig: { audioEncoding: 'MP3'}
}

async function TextToSpeechHTTP(req, res) {
  request.input.text = req.query.text;
  request.voice.languageCode = req.query.lang;
  try {
    const response = await speech.synthesizeSpeech(request);
    res.send(response);
  } catch(err) {
    console.log("Error",err);
  }
}

async function TextToSpeech(text, lang){
  request.input.text = text;
  request.voice.languageCode = lang;
  try {
    const response = await speech.synthesizeSpeech(request);
    return response;
  } catch(err) {
    console.log("Error",err);
  }
}

router.get('/texttospeech',TextToSpeechHTTP)


export default router;