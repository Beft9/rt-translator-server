

export function AddUser(Pool, user, respond){
    console.log(user);

    Pool.query(`INSERT INTO public.users(
        name, password, email, language, gender)
        VALUES ('`+user.name+"','"+ user.password+"','"+ user.email+"','"+ user.language +"',"+ user.gender+")", 
        (err, res)=>{
            if(err){
                console.log("Error!");
                console.log(err)
                respond.send({"success": false, "error": err.detail})
            }
            else {
                respond.send({"success": true});
            }
    })
}

export function UserLogin(Pool, user, respond){
    console.log(user);

    Pool.query(`SELECT id, name, password, email, language, gender
	FROM public.users where email = '`+user.email+"';", 
        (err, res)=>{
            if(err){
                console.log("Error!");
                console.log(err)
                respond.send({"success": false, "error": err.detail})
            }
            else {
                if(res.rows.length < 1){
                    console.log("No such a user!");
                    respond.send({"success": false, "error": "No such a user!"});
                }
                else if(res.rows[0].password == user.password){
                    respond.send({"success": true, "user": res.rows[0]});
                }
                else {
                    respond.send({"success": false, "error": "Wrong password"});
                }
                
                
            }
    })
}


// Meeting Interactions !!!

export function GetParticipantsSQL(Pool, meeting_id){
    return new Promise((resolve) => { Pool.query(`SELECT name, id, language, gender FROM public."MeetingUsers" JOIN public.users ON user_id = id WHERE meeting_id = `+meeting_id+`;`,
        (err,res) => {
            if(err){
                console.log("Error cought when getting participant of meeting!")
                console.log(err);
                resolve({"success": false, "error": err.detail})
            }
            else {
                resolve(res.rows);
            }
        })
    })
}


export async function CreateMeetingSQL(Pool, name, user_id){
    return new Promise((resolve) => { Pool.query(`INSERT INTO public.meetings(name, owner_id) VALUES ( '`+name+"', "+user_id+`);`,
        (err,res) => {
            if(err){
                console.log("Error cought when creating meeting!")
                console.log(err);
                if(err.constraint == 'owner_id_unq'){
                    console.log("You have already an ongoing meeting!")
                    resolve({success: true});
                }
                resolve({success: false, error: err.detail})
            }
            else {
                console.log("Meeting Created on Table!");
                resolve({success: true});
            }
        })
    })
}


export async function GetMyMeetingSQL(Pool, user_id){
    return new Promise((resolve) => { Pool.query(`SELECT id FROM public.meetings WHERE owner_id = `+user_id+`;`,
        (err,res) => {
            if(err){
                console.log("Error cought when finding the meeting of the user!")
                console.log(err);
                resolve({success: false, "error": err.detail})
            }
            else {
                console.log(res);
                resolve({success: true, meeting: res.rows[0]});
            }
        })
    })
}


export async function AddUserToMeetingSQL(Pool, user_id, meeting_id){

    return new Promise((resolve) => { Pool.query(`INSERT INTO public."MeetingUsers"( user_id, meeting_id) VALUES (`+user_id+", "+meeting_id+`);`,
        (err,res) => {
            if(err){
                console.log("Error cought when joining the meeting!")
                if(err.constraint == "MeetingUsers_PK"){
                    console.log("User already in the meeting");
                    resolve({ success: true });
                }
                console.log(err);
                resolve({success: false, error: err.detail})
            }
            else {
                console.log(res);
                resolve({ success: true });
            }
        })
    })
}

export async function DeleteUserFromMeetingSQL(Pool, user_id, meeting_id){

    return new Promise((resolve) => { Pool.query(`DELETE FROM public."MeetingUsers" WHERE user_id = `+user_id+`  AND meeting_id = `+meeting_id+`;`,
        (err,res) => {
            if(err){
                console.log("Error cought when leaving the meeting!")
                console.log(err);
                resolve({success: false, error: err.detail})
            }
            else {
                resolve({ success: true });
            }
        })
    })
}