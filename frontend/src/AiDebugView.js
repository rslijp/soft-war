import {MessageBus} from "softwar-shared";

// Normally an AI turn is shown through the eyes of the human player: only the moves within sight,
// and moves out of sight are not slowed down. The debug view shows the AI's own view instead
// (its fog of war, intelligence and every move). Remembered per browser.
const STORAGE_KEY = "softwar-ai-debug-view";

export function isAiDebugView() {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
        return false;
    }
}

export function switchAiDebugView(gameState) {
    const next = !isAiDebugView();
    try {
        window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
        // storage blocked: the switch only lasts for this page
    }
    if (gameState) gameState.debugView = next;
    MessageBus.send("screen-update");
    return next;
}
