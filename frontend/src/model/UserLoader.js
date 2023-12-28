import {csrfToken} from "../utils/Cookies";

export function loadUser() {
    // return fetch(`/api/app-state/AMAZING`, {
    //     method: "GET",
    //     headers: {
    //         "Content-Type": "application/json",
    //         "X-XSRF-TOKEN": csrfToken(),
    //         'Accept': 'application/json, text/javascript'
    //     },
    //     redirect: "follow",
    //     referrerPolicy: "no-referrer"
    // }).then(r => r.json());
    return fetch(`/api/app-state/user`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": csrfToken(),
            'Accept': 'application/json, text/javascript'
        },
        redirect: "follow",
        referrerPolicy: "no-referrer"
    }).then(r => r.json());
}