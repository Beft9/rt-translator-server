import { Router } from "express";

import { v2 } from '@google-cloud/translate';
import { v1 } from '@google-cloud/text-to-speech'

import { WebSocket } from "ws";

// Instantiates clients
const Translate = v2.Translate
const Speech = v1.TextToSpeechClient;

const projectId = 'wired-compass-334608';

const translate = new Translate({ projectId });
const speech = new Speech({ projectId })

/* Database Initilize */
import pool from "./db_initialize.js"

const meetings = []

async function Translater(req, res) {

  // The text to translate
  const text = await req.query.text;
  console.log("text:", text);

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
  res.send({ translation, audio })
}

const router = Router();

//import Transcripta from "./"

router.post('/send_speech', GetSpeech);
router.post('/create_meeting', CreateMeeting);
router.post('/join_meeting', JoinMeeting);
router.post('/leave_meeting', LeaveMeeting);
router.post('/change_language', ChangeLanguage);
router.post('/sign_up', SignUp)
router.post('/login', Login)
router.post('/update_status', UpdateStatus);
//router.post('/transcript', Transcript);
router.get('/get_contacts', GetContacts);
router.get('/get_profile', GetProfile);
router.get('/translate', Translater);
router.get('/texttospeech', TextToSpeechHTTP);

//router.ws("/meeting_hub", MeetingWS);

// User Interactions !!!
import { AddUser, UserLogin } from "./functions/db_interactions.js";

export async function SignUp(req, res) {
  try {
    AddUser(pool, req.body.body, res);

  } catch (err) {
    console.log("Error", err);
  }
}

export async function Login(req, res) {
  try {
    UserLogin(pool, req.body.body, res);

  } catch (err) {
    console.log("Error", err);
  }
}


// Google Api Methods !!!




// Meeting Functions !!!
import { SendNewUser, CreateHub, SendSpeechToParticipants } from "./ws_hubs.js"
import { GetContactsSQL, GetProfileSQL, UpdateStatusSQL, GetParticipantsSQL, GetMyMeetingSQL, CreateMeetingSQL, AddUserToMeetingSQL, DeleteUserFromMeetingSQL } from "./functions/db_interactions.js"


async function CreateMeeting(req, res) {
  try {
    var response = await CreateMeetingSQL(pool, /* req.body.meeting_name */ "Meeting", req.body.owner_id);
    if (response?.success) {
      var meeting = await GetMyMeetingSQL(pool, req.body.owner_id)
      AddUserToMeetingSQL(pool, req.body.owner_id, meeting.meeting.id);
      CreateHub(req.app.get('io'), req.body.owner_id, meeting.meeting.id);
      res.send({ success: true, meeting: meeting.meeting });
    }
    res.send(response);
  } catch (err) {
    console.log("Error", err);
  }
}
async function JoinMeeting(req, res) {
  try {
    var response = await AddUserToMeetingSQL(pool, req.body.user.id, req.body.meeting_id);
    console.log(response)
    if (response?.success) {
      console.log("Succesfully joined!");
      var participants = await GetParticipantsSQL(pool, req.body.meeting_id);
      participants.forEach((user) => {
        console.log(user);
        SendNewUser(req.app.get('io'), req.body.meeting_id, user.id, participants);
      })
      res.send({ success: true, participants: participants });
    }
    else {
      res.send(response);
    }
  } catch (err) {
    console.log("Error", err);
  }
}
async function LeaveMeeting(req, res) {
  try {
    var response = await DeleteUserFromMeetingSQL(pool, req.body.user_id, req.body.meeting_id);
    if (response?.success) {
      console.log("Succesfully left!");
      var participants = await GetParticipantsSQL(pool, req.body.meeting_id);
      participants.forEach((user) => {
        console.log(user);
        SendNewUser(req.app.get('io'), req.body.meeting_id, user.id, participants);
      })
    }
    res.send(response)
  } catch (err) {
    console.log("Error", err);
  }
}

async function ChangeLanguage(req, res) {
  try {
    for (let i = 0; i < meetings[0].users.length; i++) {
      if (meetings[0].users[i].name == req.body.user) {
        meetings[0].users[i].lang = req.body.lang
      }
      console.log("User " + req.body.user + " changed his language to " + req.body.lang);
    }
    req.app.set('meetings', meetings);
    res.send("success");
  } catch (err) {
    console.log("Error", err);
  }
}

async function GetSpeech(req, res) {
  try {
    console.log(req.body)
    var participants = await GetParticipantsSQL(pool, req.body.meeting_id);
    participants.forEach((user) => {
      console.log(user);
      if (user.id != req.body.user_id) {
        SendSpeechToParticipants(req.app.get('io'), req.body.meeting_id, user.id, req.body.user.id, req.body.text, req.body.user.lang);
      }
    })
    res.send({ "result": "success" });
  } catch (err) {
    console.log("Error", err);
  }
}

async function GetContacts(req, res) {
  try {
    console.log("GetContacts...");
    var participants = await GetContactsSQL(pool, 1);
    res.send(participants);
  } catch (err) {
    console.log("Error", err);
  }
}

async function GetProfile(req, res) {
  try {
    console.log("Obtaining profile with id " + req.query.user_id + "...");
    var profile = await GetProfileSQL(pool, req.query.user_id);
    res.send(profile);
  } catch (err) {
    console.log("Error", err);
  }
}

async function UpdateStatus(req, res) {
  try {
    console.log("Obtaining profile with id " + req.body.user_id + "...");
    var result = await UpdateStatusSQL(pool, req.body.user_id, req.body.status);
    res.send(result);
  } catch (err) {
    console.log("Error", err);
  }
}

const request = {
  input: { text: "" },
  voice: { languageCode: 'tr-TR', ssmlGender: 'NEUTRAL' },
  audioConfig: { audioEncoding: 'MP3' }
}

async function TextToSpeechHTTP(req, res) {
  request.input.text = req.query.text;
  request.voice.languageCode = req.query.lang;
  try {
    const response = await speech.synthesizeSpeech(request);
    res.send(response);
  } catch (err) {
    console.log("Error", err);
  }
}

async function TextToSpeech(text, lang) {
  request.input.text = text;
  request.voice.languageCode = lang;
  try {
    const response = await speech.synthesizeSpeech(request);
    return response;
  } catch (err) {
    console.log("Error", err);
  }
}

function MeetingWS(ws, req) {
  ws.on('message', function (msg) {
    ws.send(msg);
  });
}


export default router;
