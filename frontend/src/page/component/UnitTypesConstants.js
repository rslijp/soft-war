import {faTents, faWater} from "@fortawesome/free-solid-svg-icons";

export const TYPE_MAP = {
    'C' : 'city',
    'I' : 'infantry',
    'T' : 'tank',
    'M' : 'truck',
    'F' : 'fighter',
    'B' : 'bomber',
    'H' : 'helicopter',
    'D' : 'destroyer',
    'c' : 'cruiser',
    'A' : 'aircraftcarrier',
    'S' : 'submarine',
    'm' : 'missile',
    't' : 'transport',
    'b' : 'battleship',
};

export const SPECIAL_MAP = {
    'fortify': faTents,
    'activate': faTents,
    'surface': faWater,
    'dive': faWater
};