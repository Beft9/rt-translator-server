/*  User Interactions   */

// import { MeetingStatuses } from "../routes";

import jwt from "jsonwebtoken"

export const MeetingStatuses = {
    PAST: 1,
    ACTIVE: 2,
    FUTURE: 3
}

export function AddUser(Pool, user, respond) {
    console.log(user);

    Pool.query(`INSERT INTO public.users(
        name, password, email, language, gender)
        VALUES ('`+ user.name + "','" + user.password + "','" + user.email + "','" + user.language + "'," + user.gender + ")",
        (err, res) => {
            if (err) {
                console.log("Error!");
                console.log(err)
                respond.send({ "success": false, "error": err.detail })
            }
            else {
                respond.send({ "success": true });
            }
        })
}

export function UserLogin(Pool, user, respond) {
    console.log(user);

    Pool.query(`SELECT id, name, password, email, language, gender
	FROM public.users where email = '`+ user.email + "';",
        (err, res) => {
            if (err) {
                console.log("Error!");
                console.log(err)
                respond.send({ "success": false, "error": err.detail })
            }
            else {
                if (res.rows.length < 1) {
                    console.log("No such a user!");
                    respond.send({ "success": false, "error": "No such a user!" });
                }
                else if (res.rows[0].password == user.password) {
                    const userData = {
                        id: res.rows[0].id,
                        name: res.rows[0].name,
                        email: res.rows[0].email,
                        // ... diğer kullanıcı bilgileri
                    };
                    const token = GenerateToken(userData)
                    console.log("token", token)
                    respond.send({ "success": true, "user": res.rows[0], "token": token }); // JWT kullanıcıya döndürülüyor
                
                    // respond.send({ "success": true, "user": res.rows[0] });
                }
                else {
                    respond.send({ "success": false, "error": "Wrong password" });
                }


            }
        })
}


export const verifyToken = (req, res, next) => {
    const token =
      req.body.token || req.query.token || req.headers["x-access-token"];
  
    if (!token) {
      return res.status(403).send("A token is required for authentication");
    }
    try {
      const decoded = jwt.verify(token, "secretKeyForApp123");
      req.user = decoded;
    } catch (err) {
      return res.status(401).send("Invalid Token");
    }
    return next();
  };

export function GenerateToken(userData) {
    const token = jwt.sign(userData, 'secretKeyForApp123', { expiresIn: '1h' }); 
    return token;
}
export function GetContactsSQL(Pool, user_id) {
    return new Promise((resolve) => {
        Pool.query(`SELECT id, name, language, status FROM public."users";`,
            (err, res) => {
                if (err) {
                    console.log("Error cought when getting participant of meeting!")
                    console.log(err);
                    resolve({ "success": false, "error": err.detail })
                }
                else {
                    resolve(res.rows);
                }
            })
    })
}

export function GetProfileSQL(Pool, user_id) {
    return new Promise((resolve) => {
        Pool.query(`SELECT id, name, email, gender, language, status FROM public."users" WHERE id=` + user_id,
            (err, res) => {
                if (err) {
                    console.log("Error cought when getting participant of meeting!")
                    console.log(err);
                    resolve({ "success": false, "error": err.detail })
                }
                else {
                    resolve(res.rows);
                }
            })
    })
}

export function UpdateStatusSQL(Pool, user_id, status) {
    return new Promise((resolve) => {
        Pool.query(`UPDATE public.users SET status=${status} WHERE id=` + user_id,
            (err, res) => {
                if (err) {
                    console.log("Error cought when getting participant of meeting!")
                    console.log(err);
                    resolve({ "success": false, "error": err.detail })
                }
                else {
                    resolve({ "success": true });
                }
            })
    })
}

// Meeting Interactions !!!

export function GetParticipantsSQL(Pool, meeting_id) {
    return new Promise((resolve) => {
        Pool.query(`SELECT name, id, language, gender FROM public."meeting_users" JOIN public.users ON user_id = id WHERE meeting_id = ` + meeting_id + `;`,
            (err, res) => {
                if (err) {
                    console.log("Error cought when getting participant of meeting!")
                    console.log(err);
                    resolve({ "success": false, "error": err.detail })
                }
                else {
                    resolve(res.rows);
                }
            })
    })
}


// export function GetMeetingsByUserSQL(Pool, user_id) {
//     return new Promise((resolve) => {
//         Pool.query(`SELECT id, name, startdate, enddate, meeting_status FROM public."meetings" WHERE id = ` + id + `;`,
//             (err, res) => {
//                 if (err) {
//                     console.log("Error cought when getting participant of meeting!")
//                     console.log(err);
//                     resolve({ "success": false, "error": err.detail })
//                 }
//                 else {
//                     resolve(res.rows);
//                 }
//             })
//     })
// }

export function GetMeetingsByUserSQL(Pool, user_id) {
    return new Promise((resolve) => {
        Pool.query(
            `SELECT meeting_id FROM public."meeting_users" WHERE user_id = ${user_id};`,
            async (err, res) => {
                if (err) {
                    console.log("Error caught when getting participant of meeting!");
                    console.log(err);
                    resolve({ success: false, error: err.detail });
                } else {
                    const meetingIds = res.rows.map((row) => row.meeting_id);

                    // Fetching the meetings details based on the meetingIds
                    const pastMeetings = [];
                    const activeMeetings = [];
                    const futureMeetings = [];

                    for (const meetingId of meetingIds) {
                        const meetingData = await getMeetingDetails(Pool, meetingId);
                        if (meetingData) {
                            const currentDateTime = new Date();
                            const currentDate = new Date(currentDateTime.getTime() - (currentDateTime.getTimezoneOffset() * 60000));
                            const meetingdate = new Date(meetingData.meetingdate);
                            const endDate = meetingData.enddate ? new Date(meetingData.enddate) : null;

                            if (meetingdate < currentDate && endDate && endDate < currentDate) {
                                pastMeetings.push(meetingData);
                            } else if (currentDate > meetingdate && !endDate) {
                                activeMeetings.push(meetingData);
                            } else if (currentDate < meetingdate) {
                                futureMeetings.push(meetingData);
                            }
                        }
                    }

                    resolve({
                        success: true,
                        pastMeetings,
                        activeMeetings,
                        futureMeetings,
                    });
                }
            }
        );
    });
}

// Helper function to get meeting details from the 'meetings' table
function getMeetingDetails(Pool, meeting_id) {
    return new Promise((resolve) => {
        Pool.query(
            `SELECT id, name, createdate, enddate, meetingdate, ownerid, topic FROM public."meetings" WHERE id = ${meeting_id};`,
            (err, res) => {
                if (err) {
                    console.log("Error caught when fetching meeting details!");
                    console.log(err);
                    resolve(null);
                } else {
                    resolve(res.rows[0]);
                }
            }
        );
    });
}



export async function CreateMeetingSQL(Pool, name, createdate, userid, topic) {
    const currentDateTime = new Date();
    const localDateTime = new Date(currentDateTime.getTime() - (currentDateTime.getTimezoneOffset() * 60000));

    return new Promise((resolve) => {
        Pool.query(
            `INSERT INTO public.meetings(name, createdate, meetingdate, topic, ownerid) VALUES ( '${name}', '${localDateTime.toISOString()}', '${createdate}', '${topic}', ${userid} ) RETURNING id;`,
            (err, res) => {
                if (err) {
                    console.log("Error caught when creating meeting!");
                    if (err.constraint == "owner_id_unq") {
                        console.log("You have already an ongoing meeting!");
                        resolve({ success: true });
                    } else {
                        console.log(err);
                        resolve({ success: false, error: err.detail });
                    }
                } else {
                    console.log("Meeting Created on Table!");
                    const insertedId = res.rows[0].id;
                    resolve({ success: true, id: insertedId });
                }
            }
        );
    });
}



export async function GetMyMeetingSQL(Pool, id) {
    return new Promise((resolve) => {
        Pool.query(`SELECT id FROM public.meetings WHERE id = ` + id + `;`,
            (err, res) => {
                if (err) {
                    console.log("Error cought when finding the meeting of the user!")
                    console.log(err);
                    resolve({ success: false, "error": err.detail })
                }
                else {
                    // console.log(res);
                    resolve({ success: true, meeting: res.rows[0] });
                }
            })
    })
}

export async function AddUserToMeetingSQL(Pool, user_id, meeting_id) {
    return new Promise((resolve) => {
        Pool.query(
            `INSERT INTO public.meeting_users(user_id, meeting_id) VALUES (${user_id}, ${meeting_id});`,
            (err, res) => {
                if (err) {
                    console.log("user_id: ", user_id, meeting_id)
                    console.log("Error caught when joining the meeting!");
                    if (err.constraint == "meeting_users_PK") {
                        console.log("User already in the meeting");
                        resolve({ success: true });
                    } else {
                        console.log(err);
                        resolve({ success: false, error: err.detail });
                    }
                } else {
                    console.log(res);
                    resolve({ success: true });
                }
            }
        );
    });
}

export async function DeleteUserFromMeetingSQL(Pool, user_id, meeting_id) {

    return new Promise((resolve) => {
        Pool.query(`DELETE FROM public."meeting_users" WHERE user_id = ` + user_id + `  AND meeting_id = ` + meeting_id + `;`,
            (err, res) => {
                if (err) {
                    console.log("Error cought when leaving the meeting!")
                    console.log(err);
                    resolve({ success: false, error: err.detail })
                }
                else {
                    resolve({ success: true });
                }
            })
    })
}


//#region dbSendMessage
export async function dbSendMessage(Pool, body, respond) {
    var time = new Date(Date.now() + (1000 * 60 * (-(new Date()).getTimezoneOffset()))).toISOString().replace('T', ' ').replace('Z', '');
    var now = new Date().toISOString().split('T')[0];
    Pool.query(`INSERT INTO public."Messages"(
        sender_id, reciever_id, message, send_date)
        VALUES ('`+ body.sender_id + "','" + body.reciever_id + "','" + body.message + "','" + time + "')",
        (err, res) => {
            if (err) {
                console.log("Error!");
                console.log(err)
                respond.send({ "success": false, "error": err.detail })
                return;
            }

            respond.send({ "success": true });
        })
}

export async function dbSendedMessagesListByUserId(Pool, sender_id, respond) {

    Pool.query(`SELECT *
	FROM public."Messages" where sender_id = '`+ sender_id + "';",
        (err, res) => {
            if (err) {
                console.log("Error! >>> " + err);
                respond.send({ "success": false, "error": err.detail })
                return;
            }

            if (res.rows.length < 1) {
                console.log("No records found!");
                respond.send({ "success": false, "error": "No records found!" });
                return;
            }

            respond.send({ "success": true, "datas": res.rows });
        })
}

export async function dbIncomingMessagesListByUserId(Pool, reciever_id, respond) {

    Pool.query(`SELECT *
	FROM public."Messages" where reciever_id = '`+ reciever_id + "';",
        (err, res) => {
            if (err) {
                console.log("Error! >>> " + err);
                respond.send({ "success": false, "error": err.detail })
                return;
            }

            if (res.rows.length < 1) {
                console.log("No records found!");
                respond.send({ "success": false, "error": "No records found!" });
                return;
            }

            respond.send({ "success": true, "datas": res.rows });
        })
}
//#endregion

//#region dbProfilePhoto
export async function dbAddProfilePhoto(Pool, body, respond) {

    Pool.query(`INSERT INTO public."profilePhoto"(
        user_id, image)
        VALUES ('`+ body.user_id + "','" + body.image + "')",
        (err, res) => {
            if (err) {
                console.log(body.user_id)
                console.log(err);
                if (err.code == "23505") {
                    console.log("Renewing profile photo...")
                    dbUpdateProfilePhoto(Pool, body, respond)
                }
                else {
                    respond.send({ "success": false, "error": err.detail })
                }
                return;
            }
            console.log("successfully added");
            respond.send({ "success": true });
        })
}

export async function dbUpdateProfilePhoto(Pool, body, respond) {

    Pool.query(`UPDATE public."profilePhoto" SET image='${body.image}' WHERE user_id=${body.user_id}`,
        (err, res) => {
            if (err) {
                console.log("Error!  " + err);
                respond.send({ "success": false, "error": err.detail })
                return;
            }

            respond.send({ "success": true });
        })
}

export async function dbGetProfilePhotoByUserId(Pool, user_id, respond) {
    dbBaseGetByIdMethod(Pool, user_id, 'profilePhoto', 'user_id', respond)
}

//#endregion

function dbBaseGetByIdMethod(Pool, id, tableName, idName, respond) {
    Pool.query(`SELECT image FROM public."${tableName}" WHERE ${idName}=` + id,
        (err, res) => {
            if (err) {
                console.log("Error!  " + err);
                respond.send({ "success": false, "error": err.detail })
                return;
            }
            console.log("Profile photo successfully obtained")
            respond.send({ "success": true, "image": res.rows[0]?.image });
        })
}