export const TILE_SIZE=45;
export const UNIT_SIZE=43;
export const LEGEND_SIZE=20;
export const TOP_BAR_HEIGHT=50;

export function applyCssConstants(){
    document.documentElement.style.setProperty(`--tile-size`, TILE_SIZE+"px");
    document.documentElement.style.setProperty(`--legend-size`, LEGEND_SIZE+"px");
    document.documentElement.style.setProperty(`--top-bar-height`, TOP_BAR_HEIGHT+"px");
    document.documentElement.style.setProperty(`--unit-size`, UNIT_SIZE+"px");
}