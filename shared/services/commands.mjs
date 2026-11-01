// The boundary between a player's screen and the game engine.
//
// COMMANDS are the only bus topics a screen may send to the engine. Their arguments are plain,
// serializable data (positions, directions, unit references), so they can later travel over a
// network to a game that runs on the server. Everything else the engine sends back are events.

export const COMMANDS = {
    "new-turn": "start the current player's turn on screen (messages)",
    "next-turn": "end the turn: hand over to the next player",
    "end-turn": "ask to end the turn (checks for units with orders first)",
    "next-unit": "select the next unit that can move (clickBased)",
    "auto-next": "switch automatically jumping to the next unit on or off",
    "select-unit": "select a unit or city (unitRef)",
    "cursor-select": "select whatever is at a position (position)",
    "cursor-direction": "move the selected unit or the cursor one step (direction)",
    "cursor-go-to": "move the cursor (position)",
    "special-action": "fortify, sentry, ... the selected unit (unitRef, action)",
    "give-order": "give the selected unit a move or patrol order (action, path, direction, confirmed)",
    "clear-order": "clear the order of the selected unit",
    "change-production": "change what a city produces (unitRef, unitType)"
};

// Topics a screen sends only to itself (dialogs, focus, redraws); the engine doesn't listen to them.
export const SCREEN_TOPICS = [
    "confirm-order", "escape-pressed", "game-view-focus", "infobar-update", "keyboard-key-pressed", "move-to-mode",
    "patrol-to-mode", "propose-end-turn", "refresh-badge", "screen-update", "update-game-state"
];

// A reference to a unit or city that can cross the boundary instead of the object itself.
export function unitRef(unit) {
    if (!unit) return null;
    const at = unit.derivedPosition();
    return {clazz: unit.clazz, player: unit.player, id: unit.id, at: {x: at.x, y: at.y}};
}
