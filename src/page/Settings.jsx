import React, { useContext, useEffect } from 'react';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AppContext from '../inc/AppContext';
import { NkCheckbox } from '../components/Button';

const ipcRenderer = window.require('electron').ipcRenderer;
const path = window.require('path');

const Settings = () => {

    const app = useContext(AppContext);

    const [artist, setArtist] = React.useState(app.user.artist);
    const [tempo, setTempo] = React.useState(app.preferences.default_tempo);

    useEffect(() => {
        ipcRenderer.invoke('getPreferences').then((data) => {
            app.setPreferences({...data});
        });
        ipcRenderer.invoke('getUsers').then((data) => {
            app.setUser({...data});
        });
    }, []);

    return (
        <>

        <div className="nk-settings-container mb">
            <div className="nk-settings-title-box mb noselect">
                <h2>
                    Preferences
                </h2>
                <hr />
            </div>
            <div className="nk-settings-box">

                <div className="nk-col-12 nk-row between stretch mb">
                    <p className="nk-setting-label nk-col-3 noselect">
                        DAW path
                    </p>
                    <div className="nk-setting-value nk-col-6 noselect">
                        <p>
                            {app.user.flstudio}
                        </p>
                    </div>
                    <div className="nk-setting-daw-box nk-col-3">
                        <button
                            className="nk-btn primary-gradient"
                            onClick={(e) => {
                                ipcRenderer.send('setFlStudio');
                                ipcRenderer.invoke('getUsers').then((data) => {
                                    app.setUser({...data});
                                });
                            }}
                        >
                            <FontAwesomeIcon icon={solid("folder")} />
                        </button>
                    </div>
                </div>
                <div className="nk-col-12 nk-row between stretch mb">
                    <p className="nk-setting-label nk-col-3 noselect">
                        Artist name
                    </p>
                    <div className="nk-col-3 nk-form-layer">
                        <input
                            type="text"
                            className="nk-input layer small"
                            placeholder='Artist name'
                            defaultValue={artist}
                            onChange={(e) => {
                                setArtist(e.target.value);
                            }}
                            onBlur={(e) => {
                                ipcRenderer.send('setArtist', artist);
                                ipcRenderer.invoke('getUsers').then((data) => {
                                    app.setUser({...data});
                                });
                            }}
                            onKeyUp={(e) => {
                                if (e.key === "Enter") {
                                    // blur the input
                                    e.target.blur();
                                }
                            }}
                        />
                    </div>
                </div>
                <div className="nk-col-12 nk-row between stretch mb">
                    <p className="nk-setting-label nk-col-3 noselect">
                        Default tempo
                    </p>
                    <div className="nk-col-3 nk-form-layer">
                        <input
                            type="text"
                            className="nk-input layer small"
                            placeholder='Tempo'
                            defaultValue={tempo}
                            onChange={(e) => {
                                setTempo(e.target.value);
                            }}
                            onBlur={(e) => {
                                ipcRenderer.send('setTempo', tempo);
                                ipcRenderer.invoke('getPreferences').then((data) => {
                                    app.setPreferences({...data});
                                });
                            }}
                            onKeyUp={(e) => {
                                if (e.key === "Enter") {
                                    // blur the input
                                    e.target.blur();
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="nk-col-12 nk-row between stretch mb">
                    <p className="nk-setting-label nk-col-3 noselect">
                        Base template
                    </p>
                    <div className="nk-setting-value nk-col-6 noselect">
                        <p>
                            {
                                path.basename(app.preferences.template)
                            }
                        </p>
                    </div>
                    <div className="nk-setting-daw-box nk-col-3">
                        <button
                            className="nk-btn primary"
                            onClick={(e) => {
                                ipcRenderer.send('setTemplate');
                                ipcRenderer.on('setPrefTemp', (e, data)=>{
                                    app.preferences.template = data;
                                });
                            }}
                        >
                            <FontAwesomeIcon icon={solid("folder")} />
                        </button>
                    </div>
                </div>

                <div className="nk-col-12 nk-row between stretch">
                    <div className="nk-col-3 nk-form-layer">
                        <NkCheckbox
                            text="Update songs"
                            checked={app.preferences.update}
                            onChange={(status) => {
                                ipcRenderer.send('setUpdateSongs', status);
                                ipcRenderer.invoke('getPreferences').then((data) => {
                                    app.setPreferences({...data});
                                });
                            }}
                        />
                    </div>
                </div>

            </div>
        </div>

        </>
    );
};

export default Settings;