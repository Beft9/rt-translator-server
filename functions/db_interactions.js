

export function AddUser(Pool, user, respond){
    console.log(user);
    // const now = new Date();
    // console.log(now);

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
                console.log("Succes");
                console.log(res)
                respond.send({"success": true});
            }
    })
}