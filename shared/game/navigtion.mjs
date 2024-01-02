export const NAVIGATIONS_OFFSETS = [
    {y: -1, x: 0,  direction: "N", penalty: false},
    {y: 0,  x: -1, direction: "W", penalty: false},
    {y: 0,  x: 1,  direction: "E", penalty: false},
    {y: 1,  x: 0,  direction: "S", penalty: false},
    {y: -1, x: -1, direction: "NW", penalty: true},
    {y: -1, x: 1,  direction: "NE", penalty: true},
    {y: 1,x: -1,   direction: "SW", penalty: true},
    {y: 1, x: 1,   direction: "SE", penalty: true}
];
