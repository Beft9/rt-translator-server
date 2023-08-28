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
    const token = jwt.sign(userData, 'secretKeyForApp123', { expiresIn: '24h' });
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
        Pool.query(`SELECT users.name, users.id, users.language, users.gender 
        FROM public."meeting_users" 
        JOIN public.users ON meeting_users.user_id = users.id 
        WHERE meeting_id = ` + meeting_id + `;
        `,
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

// export function GetMeetingsByUserSQL(Pool, user_id) {
//     return new Promise((resolve) => {
//         Pool.query(
//             `SELECT meeting_id FROM public."meeting_users" WHERE user_id = ${user_id};`,
//             async (err, res) => {
//                 if (err) {
//                     console.log("Error caught when getting participant of meeting!");
//                     console.log(err);
//                     resolve({ success: false, error: err.detail });
//                 } else {
//                     // const meetingIds = res.rows.map((row) => row.meeting_id);
//                     const meetingIdsSet = new Set();
//                     res.rows.forEach((row) => {
//                         meetingIdsSet.add(row.meeting_id);
//                     });

//                     const meetingIds = Array.from(meetingIdsSet);
//                     // Fetching the meetings details based on the meetingIds
//                     const pastMeetings = [];
//                     const activeMeetings = [];
//                     const futureMeetings = [];

//                     for (const meetingId of meetingIds) {
//                         const meetingData = await getMeetingDetails(Pool, meetingId);
//                         if (meetingData) {
//                             const currentDateTime = new Date();
//                             const currentDate = new Date(currentDateTime.getTime() - (currentDateTime.getTimezoneOffset() * 60000));
//                             const meetingdate = new Date(meetingData.meetingdate);
//                             const endDate = meetingData.enddate ? new Date(meetingData.enddate) : null;

//                             if (meetingdate < currentDate && endDate && endDate < currentDate) {
//                                 pastMeetings.push(meetingData);
//                             } else if (currentDate > meetingdate && !endDate) {
//                                 activeMeetings.push(meetingData);
//                             } else if (currentDate < meetingdate) {
//                                 futureMeetings.push(meetingData);
//                             }
//                         }
//                     }

//                     resolve({
//                         success: true,
//                         pastMeetings,
//                         activeMeetings,
//                         futureMeetings,
//                     });
//                 }
//             }
//         );
//     });
// }

// function getMeetingDetails(Pool, meeting_id) {
//     return new Promise(async (resolve) => {
//         try {
//             const meetingDetails = await new Promise((resolve) => {
//                 Pool.query(
//                     `SELECT * FROM public."meetings" WHERE id = ${meeting_id};`,
//                     (err, res) => {
//                         if (err) {
//                             console.log("Error caught when fetching meeting details!");
//                             console.log(err);
//                             resolve(null);
//                         } else {
//                             resolve(res.rows[0]);
//                         }
//                     }
//                 );
//             });

//             if (!meetingDetails) {
//                 resolve(null);
//                 return;
//             }

//             Pool.query(
//                 `SELECT user_id FROM public."meeting_users" WHERE meeting_id = ${meeting_id};`,
//                 (err, res) => {
//                     if (err) {
//                         console.log("Error caught when fetching meeting participants!");
//                         console.log(err);
//                         resolve(null);
//                     } else {
//                         const participants = res.rows.map((row) => row.user_id);
//                         meetingDetails.participants = participants;
//                         resolve(meetingDetails);
//                     }
//                 }
//             );
//         } catch (error) {
//             console.error("Error caught when fetching meeting details with participants!");
//             console.error(error);
//             resolve(null);
//         }
//     });
// }


export async function GetMeetingsByUserSQL(Pool, user_id) {
    try {
        const participantQueryResult = await Pool.query(
            `SELECT DISTINCT meeting_id FROM public."meeting_users" WHERE user_id = $1;`,
            [user_id]
        );

        const meetingIds = participantQueryResult.rows.map((row) => row.meeting_id);
        const meetingDetailsPromises = meetingIds.map((meetingId) =>
            getMeetingDetails(Pool, meetingId)
        );

        const meetingDetailsList = await Promise.all(meetingDetailsPromises);

        const currentDateTime = new Date();
        const currentDate = new Date(
            currentDateTime.getTime() - currentDateTime.getTimezoneOffset() * 60000
        );

        const pastMeetings = [];
        const activeMeetings = [];
        const futureMeetings = [];

        for (const meetingData of meetingDetailsList) {
            if (!meetingData) {
                continue;
            }

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

        pastMeetings.sort(compareByMeetingDate);
        activeMeetings.sort(compareByMeetingDate);
        futureMeetings.sort(compareByMeetingDate);

        return {
            success: true,
            pastMeetings,
            activeMeetings,
            futureMeetings,
        };
    } catch (error) {
        console.log("Error caught when getting participant meetings!");
        console.log(error);
        return { success: false, error: error.detail };
    }
}

const compareByMeetingDate = (meetingA, meetingB) => {
    const dateA = new Date(meetingA.meetingdate);
    const dateB = new Date(meetingB.meetingdate);
    return dateA - dateB;
};

async function getMeetingDetails(Pool, meeting_id) {
    try {
        const meetingDetailsQueryResult = await Pool.query(
            `SELECT * FROM public."meetings" WHERE id = $1;`,
            [meeting_id]
        );

        if (meetingDetailsQueryResult.rowCount === 0) {
            return null;
        }

        const meetingDetails = meetingDetailsQueryResult.rows[0];

        const participantsQueryResult = await Pool.query(
            `SELECT user_id FROM public."meeting_users" WHERE meeting_id = $1;`,
            [meeting_id]
        );

        const participants = participantsQueryResult.rows.map((row) => row.user_id);
        meetingDetails.participants = participants;

        return meetingDetails;
    } catch (error) {
        console.error("Error caught when fetching meeting details with participants!");
        console.error(error);
        return null;
    }
}


export async function CreateMeetingSQL(Pool, name, createdate, userid, topic) {
    const currentDateTime = new Date();
    const localDateTime = new Date(currentDateTime.getTime() - (currentDateTime.getTimezoneOffset() * 60000));
    const randomId = Math.floor(10000000 + Math.random() * 90000000); // 8 basamaklı rastgele ID
    return new Promise((resolve) => {
        Pool.query(
            `INSERT INTO public.meetings(meeting_id, name, createdate, meetingdate, topic, ownerid) VALUES ('${randomId}' ,'${name}', '${localDateTime.toISOString()}', '${createdate}', '${topic}', ${userid} ) RETURNING id;`,
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

export async function StartMeetingSQL(Pool, userid) {
    const currentDateTime = new Date();
    const localDateTime = new Date(currentDateTime.getTime() - (currentDateTime.getTimezoneOffset() * 60000));
    const randomId = Math.floor(10000000 + Math.random() * 90000000); // 8 basamaklı rastgele ID
    const name = `Meeting-${randomId}`;
    const topic = `Topic-${randomId}`;
    return new Promise((resolve) => {
        Pool.query(
            `INSERT INTO public.meetings(meeting_id, name, createdate, meetingdate, topic, ownerid) VALUES ( '${randomId}', '${name}', '${localDateTime.toISOString()}', '${localDateTime.toISOString()}', '${topic}', ${userid} ) RETURNING id;`,
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
        Pool.query(`SELECT * FROM public.meetings WHERE id = ` + id + `;`,
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

// export async function AddUserToMeetingSQL(Pool, user_id, meeting_id) {
//     return new Promise((resolve) => {
//         Pool.query(
//             `INSERT INTO public.meeting_users(user_id, meeting_id) VALUES (${user_id}, ${meeting_id});`,
//             (err, res) => {
//                 if (err) {
//                     console.log("user_id: ", user_id, meeting_id)
//                     console.log("Error caught when joining the meeting!");
//                     if (err.constraint == "meeting_users_PK") {
//                         console.log("User already in the meeting");
//                         resolve({ success: true });
//                     } else {
//                         console.log(err);
//                         resolve({ success: false, error: err.detail });
//                     }
//                 } else {
//                     console.log(res);
//                     resolve({ success: true });
//                 }
//             }
//         );
//     });
// }

export async function AddUserToMeetingSQL(Pool, user_id, meeting_id) {
    return new Promise((resolve) => {
        // Kontrol etmek için veritabanında kullanıcıyı sorgula
        Pool.query(
            `SELECT * FROM public.meeting_users WHERE user_id = ${user_id} AND meeting_id = ${meeting_id};`,
            (err, res) => {
                if (err) {
                    console.log("Error checking user existence:", err);
                    resolve({ success: false, error: err.detail });
                } else {
                    // Kullanıcı zaten bulunuyorsa hata döndür
                    if (res.rows.length > 0) {
                        console.log("User already in the meeting");
                        resolve({ success: true });
                    } else {
                        // Kullanıcı yoksa ekle
                        Pool.query(
                            `INSERT INTO public.meeting_users(user_id, meeting_id) VALUES (${user_id}, ${meeting_id});`,
                            (err, res) => {
                                if (err) {
                                    console.log("Error caught when joining the meeting:", err);
                                    resolve({ success: false, error: err.detail });
                                } else {
                                    console.log("User added to the meeting");
                                    resolve({ success: true });
                                }
                            }
                        );
                    }
                }
            }
        );
    });
}

export async function AddUsersToMeetingSQL(Pool, user_ids, meeting_id) {
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return { success: false, error: "Invalid user_ids array." };
    }

    const queryValues = user_ids.map((user_id) => `(${user_id}, ${meeting_id})`).join(", ");

    return new Promise((resolve) => {
        Pool.query(
            `INSERT INTO public.meeting_users(user_id, meeting_id) VALUES ${queryValues}`,
            (err, res) => {
                if (err) {
                    console.log("user_ids: ", user_ids, "meeting_id: ", meeting_id);
                    console.log("Error caught when joining the meeting!");
                    if (err.constraint == "meeting_users_PK") {
                        console.log("User(s) already in the meeting.");
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

export async function GetMeetingByMeetingIdSQL(Pool, meeting_id) {
    return new Promise((resolve) => {
        Pool.query(
            `SELECT * FROM public.meetings WHERE meeting_id = ${meeting_id};`,
            (err, res) => {
                if (err) {
                    console.log(err)
                    resolve({ success: false, error: err.detail });
                } else {
                    if (res.rows.length > 0) {
                        const meeting = res.rows[0]; // İlk sıradaki kaydı al
                        resolve({ success: true, meeting });
                    } else {
                        resolve({ success: false, error: "Meeting not found" });
                    }
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

export async function FinishMeetingForAllUser(Pool, meeting_id) {
    const currentDateTime = new Date();
    const localDateTime = new Date(currentDateTime.getTime() - (currentDateTime.getTimezoneOffset() * 60000));
   
    return new Promise((resolve) => {
        Pool.query(
            `UPDATE public."meetings"
             SET enddate = $1
             WHERE meeting_id = $2;`,
            [localDateTime, meeting_id],
            (err, res) => {
                if (err) {
                    console.log("Error caught when leaving the meeting!");
                    console.log(err);
                    resolve({ success: false, error: err.detail });
                } else {
                    resolve({ success: true });
                }
            }
        );
    });
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

export async function dbGetUsers(Pool, user_id, respond) {
    Pool.query(`SELECT * FROM public."users"`,
        (err, res) => {
            if (err) {
                console.log("Error!  " + err);
                respond.send({ "success": false, "error": err.detail })
                return;
            }
            respond.send({ "success": true, "users": res.rows });
        })
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