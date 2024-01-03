import {LEGEND_SIZE, TILE_SIZE} from "../Constants";
import React, {useState} from "react";
import {func, number, shape} from "prop-types";

function HorizontalScrollBar({range, onUpdate}) {
    const [state, setState] = useState({track: false, touch: null});
    function normalizedRange(range){
        const r = {...range, startX: range.startX, startY:  range.startY};
        if(r.startX<0){
            r.startX+=r.deltaX;
            // console.log("adjusted",r.startX);
        }
        return r;
    }

    function moveScrollBarOnMouse(e){
        if(!state.track) return;
        var target = e.target;
        while(target.className!=="scroll-horizontal"){
            target=target.parentElement;
        }
        const pos = target.getBoundingClientRect();
        const perc = (e.pageX-pos.x)/pos.width;
        onUpdate({...range, startX: Math.max(0,perc*range.width)});
    }

    function moveScrollBarOnTouch(e){
        var target = e.target;
        while(target.className!=="scroll-horizontal"){
            target=target.parentElement;
        }
        const pos = target.getBoundingClientRect();
        const perc = (e.touches[0].pageX-pos.x-LEGEND_SIZE)/pos.width;
        onUpdate({...range, startX: Math.max(0,perc*range.width)});
    }

    function viewport(range) {
        if(range.deltaX>=range.width) {
            return <div className={"scroll-horizontal"}><div style={{"width": "100%"}}/></div>;
        }
        let wagonLeft = range.startX/range.width;
        let wagonWidth = range.deltaX/range.width;
        let wagonLeftOverrun = wagonLeft+wagonWidth>1 ?
            wagonLeft+wagonWidth-1
            : 0;
        wagonWidth=wagonWidth-wagonLeftOverrun;
        wagonLeft=wagonLeft-wagonLeftOverrun;

        wagonLeft = Math.floor(wagonLeft*range.deltaX*TILE_SIZE);
        wagonWidth = Math.floor(wagonWidth*range.deltaX*TILE_SIZE);
        wagonLeftOverrun = Math.floor(wagonLeftOverrun*range.deltaX*TILE_SIZE);

        return <div className={"scroll-horizontal"}
            onMouseDown={()=>setState({...state, track: true})}
            onMouseUp={()=>setState({...state, track: false})}
            onMouseMove={moveScrollBarOnMouse}
            onTouchStart={moveScrollBarOnTouch}
            onTouchMove={moveScrollBarOnTouch}>
            {wagonLeftOverrun!==0?<div className={"scroll-horizontal-wagon scroll-horizontal-wagon-overun"} style={{"width": `${wagonLeftOverrun}px`}}><div className={"scroll-right"}/></div>:null}
            <div style={{"width": `${wagonLeft}px`}}/>
            <div className={"scroll-horizontal-wagon"} style={{"left": `${wagonLeft}px`,"width": `${wagonWidth}px`}}>
                <div className={"scroll-left"}/>
                {wagonLeftOverrun!==0?null:<div className={"scroll-right"}/>}
            </div>
        </div>;
    }



    return viewport(normalizedRange(range));
}

HorizontalScrollBar.propTypes = {
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
export default HorizontalScrollBar;