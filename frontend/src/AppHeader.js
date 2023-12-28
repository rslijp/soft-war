import React, {useEffect, useState} from "react";
import {loadUser} from "./model/UserLoader";

function AppHeader() {
    const [state, setState] = useState('');
    const [user, setUser] = useState(null);
    useEffect(() => {
        setState('loading');
        loadUser().then(user=>{
            if(!user) {
                document.location.redirect("/public/auth/");
                return;
            }
            setUser(user);
            setState('ready');
        }).catch(error=>{
            console.error(error);
            setState("error");
        });
    }, []);

    console.log(user);

    function userName(user){
        return <>{user.picture?<img src={user.picture} className={"profile-picture"}/>:null}Welcome {user.name}</>;
    }

    return <div className={"top-bar"}>
        <div className={"name"}>{state!=="ready"?state:userName(user)}</div>

    </div>;
}

export default AppHeader;