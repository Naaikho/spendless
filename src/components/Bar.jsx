import React, { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import AppContext from '../inc/AppContext';
import logo from "../assets/img/spendless-icon.ico";

const ipcRenderer = window.require('electron').ipcRenderer;

const Bar = () => {

    const app = useContext(AppContext);

    return (
        <div className={"nk-app-bar drag " + ((app.menuOpen)? "bright" : "")}>
            <div className="nk-name-bar noselect drag">
                <img src={logo} alt="" />
            </div>
            <div className="nk-tools-box no-drag">
                <button 
                    className="nk-tool-btn no-drag"
                    onClick={(e)=>{
                        ipcRenderer.send('minimize');
                    }}
                >
                    <FontAwesomeIcon icon={solid('minus')} />
                </button>
                <button 
                    className="nk-tool-btn no-drag"
                    onClick={(e)=>{
                        ipcRenderer.send('maximize');
                    }}
                >
                    <FontAwesomeIcon icon={solid('square')} />
                </button>
                <button 
                    className="nk-tool-btn no-drag"
                    onClick={(e)=>{
                        ipcRenderer.send('exit');
                    }}
                >
                    <FontAwesomeIcon icon={solid('times')} />
                </button>
            </div>
        </div>
    );
};

export default Bar;