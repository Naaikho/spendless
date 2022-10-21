import React from 'react';

const GhostExit = (props) => {

    let style = props.style || {};
    style.zIndex = props.zIndex || 10;

    return (
        <div
            className={"nk-ghost-hide " + ((props.bg)? "bg" : "")}
            id={props.id}
            style={style}
            onClick={props.onClick}
        ></div>
    );
};

export default GhostExit;