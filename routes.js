import { Router } from "express";

import { v2 } from '@google-cloud/translate';
import { v1 } from '@google-cloud/text-to-speech'

// Instantiates clients

export const MeetingStatuses = {
  PAST: 1,
  ACTIVE: 2,
  FUTURE: 3
}

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

const auth = verifyToken;

const router = Router();

//import Transcripta from "./"

router.post('/send_speech', auth, GetSpeech);
router.post('/create_meeting', auth, CreateMeeting);
router.post('/start_meeting', auth, StartMeeting);
router.post('/join_meeting', auth, JoinMeeting);
router.post('/leave_meeting', auth, LeaveMeeting);
router.post('/finish_meeting', auth, FinishMeeting);
router.post('/change_language', auth, ChangeLanguage);
router.post('/sign_up', SignUp)
router.post('/login', Login)
router.post('/update_status', auth, UpdateStatus);
router.get('/get_meetings_by_user', auth, GetMeetingsByUser);
router.post('/add_user_to_meeting', auth, AddUserToMeeting);
router.post('/add_users_to_meeting', auth, AddUsersToMeeting);
router.post('/message/send', auth, SendMessage);
router.post('/profile_photo/add', auth, ProfilePhotoAdd);
router.post('/profile_photo/update', auth, ProfilePhotoUpdate);
//router.post('/transcript', Transcript);
router.get('/message/sended_messages_list_by_user_id', auth, SendedMessagesListByUserId);
router.get('/message/sended_incoming_messages_list_by_user_id', auth, IncomingMessagesListByUserId);
router.get('/profile_photo/get_by_user_id', auth, GetProfilePhotoByUserId);
router.get('/get_contacts', auth, GetContacts);
router.get('/get_profile', auth, GetProfile);
router.get('/translate', auth, Translater);
router.get('/texttospeech', auth, TextToSpeechHTTP);
router.get('/get_users', auth, GetUsers)



//router.ws("/meeting_hub", MeetingWS);

// User Interactions !!!
import { AddUser, UserLogin, verifyToken, dbSendMessage, dbSendedMessagesListByUserId, dbIncomingMessagesListByUserId, dbAddProfilePhoto, dbGetProfilePhotoByUserId, dbUpdateProfilePhoto, StartMeetingSQL, dbGetUsers, AddUsersToMeetingSQL, GetMeetingByMeetingIdSQL, FinishMeetingForAllUser } from "./functions/db_interactions.js";

export async function SignUp(req, res) {
  try {
    AddUser(pool, req.body, res);

  } catch (err) {
    console.log("Error", err);
  }
}

export async function Login(req, res) {
  try {
    UserLogin(pool, req.body, res);

  } catch (err) {
    console.log("Error", err);
  }
}

//#region Messages
export async function SendMessage(req, res) {
  try {
    dbSendMessage(pool, req.body, res);

  } catch (err) {
    console.log("Error ", err);
  }
}

export async function SendedMessagesListByUserId(req, res) {
  try {
    console.log("sender_user_id " + req.query.sender_user_id + "...");

    dbSendedMessagesListByUserId(pool, req.query.sender_user_id, res);

  } catch (err) {
    console.log("Error ", err);
  }
}

export async function IncomingMessagesListByUserId(req, res) {
  try {
    console.log("incoming_user_id " + req.query.incoming_user_id + "...");

    dbIncomingMessagesListByUserId(pool, req.query.incoming_user_id, res);

  } catch (err) {
    console.log("Error ", err);
  }
}
//#endregion

//#region profilePhoto

export async function ProfilePhotoAdd(req, res) {
  try {
    dbAddProfilePhoto(pool, req.body, res);

  } catch (err) {
    console.log("Error ", err);
  }
}

export async function ProfilePhotoUpdate(req, res) {
  try {
    dbUpdateProfilePhoto(pool, req.body, res);

  } catch (err) {
    console.log("Error ", err);
  }
}

export async function GetProfilePhotoByUserId(req, res) {
  try {
    console.log("user_id " + req.query.user_id + "...");

    dbGetProfilePhotoByUserId(pool, req.query.user_id, res);

  } catch (err) {
    console.log("Error ", err);
  }
}

export async function GetUsers(req, res) {
  console.log("**********", res.query)

  try {
    dbGetUsers(pool, req.query.user_id, res);
  } catch (err) {
    console.log("Error ", err);
  }
}
//#endregion

// Google Api Methods !!!




// Meeting Functions !!!
import { SendNewUser, CreateHub, SendSpeechToParticipants } from "./ws_hubs.js"
import { GetContactsSQL, GetProfileSQL, UpdateStatusSQL, GetParticipantsSQL, GetMyMeetingSQL, CreateMeetingSQL, AddUserToMeetingSQL, DeleteUserFromMeetingSQL, GetMeetingsByUserSQL } from "./functions/db_interactions.js"


async function CreateMeeting(req, res) {
  console.log("req: ", req)

  try {
    var response = await CreateMeetingSQL(pool, req.body.name, req.body.createdate, req.body.userid, req.body.topic);
    if (response?.success) {
      var meeting = await GetMyMeetingSQL(pool, response.id)
      // if (req.body.meeting_status === MeetingStatuses.ACTIVE) {
      AddUserToMeetingSQL(pool, req.body.userid, meeting.meeting.id);
      // }
      CreateHub(req.app.get('io'), req.body.userid, meeting.meeting.id);
      res.send({ success: true, meeting: meeting.meeting });
    } else {
      res.send(response);
    }
  } catch (err) {
    console.log("Error", err);
  }
}


async function StartMeeting(req, res) {
  try {
    var response = await StartMeetingSQL(pool, req.body.userid);
    if (response?.success) {
      var meeting = await GetMyMeetingSQL(pool, response.id)
      // if (req.body.meeting_status === MeetingStatuses.ACTIVE) {
      AddUserToMeetingSQL(pool, req.body.userid, meeting.meeting.id);
      // }
      CreateHub(req.app.get('io'), req.body.userid, meeting.meeting.id);
      res.send({ success: true, meeting: meeting.meeting });
    } else {
      res.send(response);
    }
  } catch (err) {
    console.log("Error", err);
  }
}


async function GetMeetingsByUser(req, res) {
  try {
    console.log("GetMeetingsByUser " + req.query.user_id + "...");
    var meetings = await GetMeetingsByUserSQL(pool, req.query.user_id);
    res.send(meetings);
  } catch (err) {
    console.log("Error", err);
  }
}

async function AddUserToMeeting(req, res) {
  console.log("req: ", req.body)
  try {
    var response = await AddUserToMeetingSQL(pool, req.body.user_id, req.body.meeting_id);
    console.log(response)
    if (response?.success) {
      console.log("Succesfully joined!");
      res.send({ success: true });
    }
    else {
      res.send(response);
    }
  } catch (err) {
    console.log("Error", err);
  }
}

async function AddUsersToMeeting(req, res) {
  try {
    var response = await AddUsersToMeetingSQL(pool, req.body.user_ids, req.body.meeting_id);
    console.log(response)
    // if (response?.success) {
    //   console.log("Succesfully joined!");
    //   res.send({ success: true });
    // }
    // else {
    //   res.send(response);
    // }
    if (response?.success) {
      var meeting = await GetMyMeetingSQL(pool, req.body.meeting_id)
      res.send({ success: true, meeting: meeting.meeting });
    } else {
      res.send(response);
    }
  } catch (err) {
    console.log("Error", err);
  }
}

async function JoinMeeting(req, res) {
  try {
    var meeting_by_meeting_id = await GetMeetingByMeetingIdSQL(pool, req.body.meeting_id)
    console.log(meeting_by_meeting_id)
    const meeting_id = meeting_by_meeting_id?.meeting.id
    var response = await AddUserToMeetingSQL(pool, req.body.user_id, meeting_id);
    console.log(response)
    if (response?.success) {
      console.log("Succesfully joined!");
      var participants = await GetParticipantsSQL(pool, meeting_id);
      console.log(participants)
      var meeting = await GetMyMeetingSQL(pool, meeting_id)
      participants.forEach((user) => {
        console.log(user);
        SendNewUser(req.app.get('io'), meeting_id, user.id, participants);
      })
      res.send({ success: true, participants: participants, meeting: meeting.meeting });
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

async function FinishMeeting(req, res) {
  try {
    var response = await FinishMeetingForAllUser(pool, req.body.meeting_id);
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
