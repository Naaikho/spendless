import React, { useContext, useEffect } from 'react';
import AppContext from '../inc/AppContext';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { NkLink } from './Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createPopup, makeId } from '../inc/Function.inc';
import { ProjectPopup } from './Popup';

const ipcRenderer = window.require('electron').ipcRenderer;

const Menu = () => {

    const app = useContext(AppContext);

    const [onReload, setOnReload] = React.useState(false);

    useEffect(() => {
        ipcRenderer.on("loading", (e, data) => {
            app.setBar(parseInt(data));
        });
    }, []);

    return (
        <>
            <div className='nk-menu-bar'>
                <div
                    className="nk-burger-box"
                    onClick={() => app.setMenuOpen(!app.menuOpen)}
                >
                    <div
                        className={"nk-burger-btn " + ((app.menuOpen)? "open" : "")}
                    >
                        <div className="nk-line" id="1"></div>
                        <div className="nk-line" id="2"></div>
                        <div className="nk-line" id="3"></div>
                    </div>
                </div>

                <div className={"nk-loading-container " + ((app.bar > 0)? "show" : "")}>
                    <div className="nk-load-circle noselect">
                        <FontAwesomeIcon icon={solid("circle-notch")} spin />
                    </div>
                    <div className="nk-loading-bar noselect">
                        <div
                            className="nk-loading-fill"
                            style={{width: app.bar + "%"}}
                        ></div>
                    </div>
                    <div className="nk-load-hover noselect">
                        {app.currentUpload}
                    </div>
                </div>

                <div className="nk-center-side"></div>
                <div className="nk-side-tools">

                        <button
                            className={"nk-tool-btn fast-add " + ((app.menuStats.send)? "" : "disable")}
                            onClick={() => {
                                ipcRenderer.invoke("setProject", {
                                    id: makeId(),
                                    renamed: false,
                                    title: "New project",
                                    artist: app.user.artist,
                                    tempo: String(app.preferences.default_tempo),
                                    genre: "Unknown",
                                    color: Math.floor(Math.random() * app.colors.length),
                                    icon: Math.floor(Math.random() * app.icons.length),
                                    comment: ""
                                })
                            }}
                        >
                            <FontAwesomeIcon icon={solid('backward')} />
                            <small className="nk-tool-popup noselect">
                                Fast create project
                            </small>
                        </button>
                        <button
                            className={"nk-tool-btn " + ((app.menuStats.send)? "" : "disable")}
                            onClick={() => {
                                let id = makeId();
                                app.setProjectPopup(
                                    <ProjectPopup
                                        id={id}
                                        color={Math.floor(Math.random() * app.colors.length)}
                                        icon={Math.floor(Math.random() * app.icons.length)}
                                        title="New project"
                                        tempo={app.preferences.default_tempo}
                                        genre=""
                                        artist={app.user.artist}
                                        comment=""
                                        btn="Create"
                                        to="setProject"
                                        details={false}
                                        renamed={true}
                                    />
                                );
                            }}
                        >
                            <FontAwesomeIcon icon={solid('plus')} />
                            <small className="nk-tool-popup noselect">
                                Create project
                            </small>
                        </button>
                        <button
                            className={"nk-tool-btn " + ((app.menuStats.send)? "" : "disable")}
                            onClick={(e) => {
                                ipcRenderer.send('importProject');
                            }}
                        >
                            <FontAwesomeIcon icon={solid('file-arrow-down')} />
                            <small className="nk-tool-popup noselect">
                                Import project
                            </small>
                        </button>
                        <button
                            className={"nk-tool-btn reload " + ((onReload)? "active" : "")}
                            onClick={(e) => {
                                if(!onReload) {
                                    ipcRenderer.invoke("getProjects").then((data) => {
                                        createPopup(app, "ok", "Projects reloaded ! 🍻");
                                        app.setProjects(data);
                                    });
                                    setOnReload(true);
                                    setTimeout(() => {
                                        setOnReload(false);
                                    }, 1000);
                                }
                            }}
                        >
                            <span><FontAwesomeIcon icon={solid('rotate')} /></span>
                            <small className="nk-tool-popup noselect">
                                Refresh
                            </small>
                        </button>

                    </div>
            </div>
            <div className={"nk-swip-menu " + ((app.menuOpen)? "open" : "") }>

                <NkLink
                    to="*"
                    icon={solid('diagram-project')}
                    text="Projects"
                    select={app.menuSelected === 0}
                    onClick={()=>{
                        app.setMenuSelected(0)
                    }}
                />
                <NkLink
                    to="/settings"
                    icon={solid('cog')}
                    text="Settings"
                    select={app.menuSelected === 1}
                    onClick={()=>{
                        app.setMenuSelected(1)
                    }}
                />

                <div className="nk-swip-footer">
                    <span
                        className="nk-swip-footer-text"
                        onClick={() => {
                            ipcRenderer.send('openLink', "https://naikho.com");
                        }}
                    >
                        By Naikho
                    </span>
                </div>
            </div>
        </>
    );
};

export default Menu;