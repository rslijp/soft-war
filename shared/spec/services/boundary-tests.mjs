import {COMMANDS, SCREEN_TOPICS, unitRef} from "../../services/commands.mjs";
import {fileURLToPath} from "url";
import fs from "fs";
import path from "path";

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../frontend/src");

function sources(dir) {
    return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) return sources(file);
        return entry.name.endsWith(".js") ? [{file, text: fs.readFileSync(file, "utf8")}] : [];
    });
}

describe("the boundary between the screen and the game engine", function() {
    const files = fs.existsSync(FRONTEND) ? sources(FRONTEND) : [];

    it("should only send commands or screen topics from the frontend", function() {
        const known = new Set([...Object.keys(COMMANDS), ...SCREEN_TOPICS]);
        const unknown = [];
        files.forEach(({file, text}) => {
            for (const match of text.matchAll(/MessageBus\.(?:send|sendLockable)\(\s*"([a-z-]+)"/g)) {
                if (!known.has(match[1])) unknown.push(path.basename(file) + ": " + match[1]);
            }
        });
        expect(unknown).toEqual([]);
    });

    it("should not change the game directly from the frontend", function() {
        const direct = [];
        files.forEach(({file, text}) => {
            for (const match of text.matchAll(/\.(produce|toggleAutoNext|selectUnit|specialAction\(\)\.method\]|giveOrder|cursorUpdate)\(|\[action\.method\]\(/g)) {
                direct.push(path.basename(file) + ": " + match[0]);
            }
        });
        expect(direct).toEqual([]);
    });

    it("should describe a unit by data only", function() {
        //Given
        const unit = {clazz: "unit", player: 1, id: 3, derivedPosition: () => ({x: 4, y: 5, extra: true})};

        //When
        const ref = unitRef(unit);

        //Then
        expect(ref).toEqual({clazz: "unit", player: 1, id: 3, at: {x: 4, y: 5}});
        expect(JSON.parse(JSON.stringify(ref))).toEqual(ref);
        expect(unitRef(null)).toBeNull();
    });
});
