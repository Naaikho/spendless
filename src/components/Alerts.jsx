import React, { useContext, useEffect } from 'react';
import AppContext from '../inc/AppContext';

const AlertLabel = (props) => {

    const app = useContext(AppContext);

    useEffect(() => {
        setTimeout(() => {
            if(props.id === app.popup.id){
                app.setPopup(null);
            }
        }, 10000);
    }, []);

    return(
        <div
            className={"nk-alert-box " + ((props.status === "error")? "danger" : "")}
            id={props.id}
            onClick={() => {
                if(props.id === app.popup.id){
                    app.setPopup(null);
                }
            }}
        >
            <p
                className='noselect'
            >{props.message}</p>
        </div>
    );
};

const AlertPopup = () => {

    const app = useContext(AppContext);

    return (
        <div className="nk-alert-popup-container">
            {(app.popup) ? app.popup.element : null}
        </div>
    );
};

export {
    AlertPopup,
    AlertLabel,
}