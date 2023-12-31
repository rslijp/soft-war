/* eslint-disable indent */
import {csrfToken} from "../utils/Cookies";

export function apiFetch(method, url) {
    return fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": csrfToken(),
            'Accept': 'application/json, text/javascript'
        },
        redirect: "follow",
        referrerPolicy: "no-referrer"
    }).
    then(r => r.json()).
    then(r => {
        if (r.redirect) window.location.href = r.redirect;
        return r;
    });

}