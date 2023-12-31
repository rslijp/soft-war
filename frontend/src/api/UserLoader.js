import {apiFetch} from "./Api";

export function loadUser() {
    return apiFetch("GET", `/api/app-state/user`);
}

export function logoutUser() {
    return apiFetch("PUT", `/auth/logout`);
}