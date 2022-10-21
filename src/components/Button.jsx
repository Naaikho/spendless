import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { Link } from 'react-router-dom';

const NkLink = (props) => {
    return (
        <div className="nk-navlink-box">
            <Link
                className={"nk-navlink-btn " + ((props.select)? "selected" : "")}
                to={props.to}
                onClick={props.onClick}
            >
                <div className="nk-btn-dot"></div>
                <div className="nk-navlink-icon">
                    <FontAwesomeIcon icon={props.icon} className="nk-icon" />
                </div>
                <div className="nk-navlink-text">
                    {props.text}
                </div>
            </Link>
        </div>
    );
};

const NkCheckbox = (props) => {
    
    const [checked, setChecked] = React.useState(props.checked);

    return(
        <div
            className={"nk-checkbox " + props.className + " " + ((checked) ? "active" : "")}
            onClick={() => {
                props.onChange(!checked);
                setChecked(!checked);
            }}
        >
            <div className="nk-check noselect">
                <FontAwesomeIcon icon={solid("check")} className="nk-icon" />
            </div>
            <label className="nk-check-label noselect">
                {props.text}
            </label>
        </div>
    );
};

export {
    NkLink,
    NkCheckbox,
};