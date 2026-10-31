import {useEffect, useRef} from "react";

// Moves keyboard focus to the element holding the returned ref once the dialog has opened.
export function useDialogFocus() {
    const dialogView = useRef();

    const focusView = () => {
        if(dialogView.current) dialogView.current.blur();
        setTimeout(()=>dialogView.current.focus(),0);
    };

    useEffect(() => {
        setTimeout(()=>focusView(), 0);
    }, []);

    return dialogView;
}
