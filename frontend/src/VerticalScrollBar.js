import {LEGEND_SIZE, TILE_SIZE} from "./Constants";
import React, {useState} from "react";
import {func, number, shape} from "prop-types";

function VerticalScrollBar({range, onUpdate}) {
    const [state, setState] = useState({track: false, touch: null});
    function normalizedRange(range){
        const r = {...range, startX: range.startX, startY:  range.startY};
        if(r.startY<0){
            r.startY+=r.deltaY;
        }
        return r;
    }

    function moveScrollBarOnMouse(e){
        if(!state.track) return;
        var target = e.target;
        while(target.className!=="scroll-vertical"){
            target=target.parentElement;
        }
        const pos = target.getBoundingClientRect();
        const perc = (e.pageY-pos.y)/pos.height;
        onUpdate({...range, startY: perc*range.height});
    }

    function moveScrollBarOnTouch(e){
        var target = e.target;
        while(target.className!=="scroll-vertical"){
            target=target.parentElement;
        }
        const pos = target.getBoundingClientRect();
        const perc = (e.touches[0].pageY-pos.y-LEGEND_SIZE)/pos.height;
        onUpdate({...range, startY: Math.max(0,perc*range.height)});
    }

    function viewport(range) {
        if(range.deltaY>=range.height) {
            return <div className={"scroll-vertical"}></div>;
        }
        let wagonTop = range.startY/range.height;
        let wagonHeight = range.deltaY/range.height;
        let wagonTopOverrun = wagonTop+wagonHeight>1 ?
            wagonTop+wagonHeight-1
            : 0;
        wagonHeight=wagonHeight-wagonTopOverrun;
        wagonTop=wagonTop-wagonTopOverrun;

        wagonTop = Math.floor(wagonTop*range.deltaY*TILE_SIZE);
        wagonHeight = Math.floor(wagonHeight*range.deltaY*TILE_SIZE);
        wagonTopOverrun = Math.floor(wagonTopOverrun*range.deltaY*TILE_SIZE);

        return <div className={"scroll-vertical"}
            onMouseDown={()=>setState({...state, track: true})}
            onMouseUp={()=>setState({...state, track: false})}
            onMouseMove={moveScrollBarOnMouse}
            onTouchStart={moveScrollBarOnTouch}
            onTouchMove={moveScrollBarOnTouch}>
            {wagonTopOverrun!==0?<div className={"scroll-vertical-wagon scroll-vertical-wagon-overun"} style={{"height": `${wagonTopOverrun}px`}}><div className={"scroll-down"}/></div>:null}
            <div style={{"height": `${wagonTop}px`}}/>
            <div className={"scroll-vertical-wagon"} style={{"top": `${wagonTop}px`,"height": `${wagonHeight}px`}}>
                <div className={"scroll-up"}/>
                {wagonTopOverrun!==0?null:<div className={"scroll-down"}/>}
            </div>
        </div>;
    }



    return viewport(normalizedRange(range));
}

VerticalScrollBar.propTypes = {
    range: shape({
        startX: number,
        startY: number,
        deltaX: number,
        deltaY: number,
        width: number,
        height: number
    }),
    onUpdate: func
};
export default VerticalScrollBar;