import {csrfToken} from "./utils/Cookies";

export function loadGameState() {
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
    return fetch(`/api/map-generator/REGULAR/128x128`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": csrfToken(),
            'Accept': 'application/json, text/javascript'
        },
        redirect: "follow",
        referrerPolicy: "no-referrer"
    }).then(r => r.json()).then(r => {
        return {
            map: r
        };
    });
}