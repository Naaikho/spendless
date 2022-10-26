import React, { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import AppContext from '../../inc/AppContext';
import GhostExit from '../../components/Ghost';
import { DeletePopup, ExportPopup, ProjectPopup } from '../../components/Popup';
import { createPopup } from '../../inc/Function.inc';

const ipcRenderer = window.require('electron').ipcRenderer;

const Project = (props) => {

    const app = useContext(AppContext);

    const [openMenu, setOpenMenu] = React.useState(false);
    const [prevAudio, setPrevAudio] = React.useState(null);
    const [playBtn, setPlayBtn] = React.useState(solid("play"));

    const mouseCoor = {
        x: 0,
        y: 0
    };

    let color = app.colors[props.color];
    let icon = app.icons[props.icon];

    let s_ver = props.version.split(".");
    // get anly the first 3 numbers
    s_ver = s_ver[0] + "." + s_ver[1];

    let land = [];
    for(let i = 0; i < 150; i++) {
        land.push(<span key={i}><FontAwesomeIcon key={i} icon={icon} /></span>);
    }

    return (
        <>
            {
                (openMenu)? <GhostExit zIndex={20} onClick={(e)=>{
                    e.stopPropagation();
                    setOpenMenu(false);
                }} /> : null
            }
            <div
                className={"nk-project-file " + ((app.currentProject.includes(props.id))? "open " : "") + ((app.currentProcessed === props.id)? "disable" : "")}
                onClick={(e) => {
                    ipcRenderer.send('openProject', props.id);
                }}
            >

                <button
                    className={"nk-btn dark less abs play xsm " + ((props.preview === "")? "hide" : "")}
                    onClick={(e) => {
                        e.stopPropagation();

                        if(prevAudio){
                            let lvl = prevAudio.volume;
                            let interval = setInterval(() => {
                                lvl -= 0.01;
                                try{
                                    prevAudio.volume = lvl;
                                } catch(e){
                                    clearInterval(interval);
                                    prevAudio.pause();
                                    prevAudio.currentTime = 0;
                                    setPrevAudio(null);
                                    setPlayBtn(solid("play"));
                                }
                            }, 1);
                        } else {
                            // play props.preview audio
                            let audio = new Audio(props.preview);
                            setPrevAudio(audio);
                            // set audio lvl to 0
                            audio.volume = 0;
                            audio.play();
                            // augment audio lvl to 1 with ease
                            let lvl = 0;
                            let interval = setInterval(() => {
                                lvl += 0.01;
                                if(lvl >= 0.5){
                                    clearInterval(interval);
                                }
                                try{
                                    audio.volume = lvl;
                                } catch(e){
                                    clearInterval(interval);
                                }
                            }, 10);
                            setPlayBtn(solid("pause"));
                            // when audio end, set audio lvl to 0 with ease
                            audio.addEventListener('ended', () => {
                                setPlayBtn(solid("play"));
                            });
                        }
                    }}
                >
                    <FontAwesomeIcon icon={playBtn} />
                </button>

                <div
                    className="nk-project-box"
                    // onMouseMove={(e) => {
                    //     mouseCoor.x = e.clientX;
                    //     mouseCoor.y = e.clientY;
                    //     console.log(e.clientX, e.clientY);
                    // }}
                    // onRightClick 
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setOpenMenu(true);
                    }}
                >
                    <div className="nk-wait-overlay">
                        <FontAwesomeIcon icon={solid("circle-notch")} spin />
                    </div>

                    <div className="nk-complet-version noselect">
                        {props.version}
                    </div>
                    <div className={"nk-schema-box noselect " + color}>
                        <div className="nk-bg-land">
                            {land}
                        </div>
                        <div className="nk-edit-layer">
                            <FontAwesomeIcon icon={solid('pen')} />
                        </div>
                        <span className="nk-icon-proj">
                            <FontAwesomeIcon icon={icon} />
                        </span>
                    </div>

                    <div className="nk-project-informations noselect">
                        <h6 className="nk-artist noselect">
                            {props.artist}
                        </h6>
                        <div className="proj-title-box noselect">
                            <h5 className="proj-title">
                                {props.name}
                            </h5>
                            <small className="proj-version noselect">
                                {s_ver}
                            </small>
                        </div>
                        <div className="nk-col-12 nk-row between nopad noselect">
                            <p className="proj-bpm">
                                Bpm: <span>{props.tempo}</span>
                            </p>
                            <p className="proj-genre">
                                {props.genre || "Unknown"}
                            </p>
                        </div>
                        <div className="proj-desc-box">
                            <p className="proj-description noselect">
                                {props.description}
                            </p>
                        </div>
                        <small className="proj-worktime noselect">
                            Work time: {props.workTime}
                        </small>
                        <small className="proj-date noselect">
                            Start: {props.date}
                        </small>
                    </div>
                </div>

                <div
                    className={"proj-options-box " + ((openMenu)? "open" : "")}
                >
                    <button
                        className="proj-btn option"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(true);
                        }}
                    >
                        <FontAwesomeIcon icon={solid('ellipsis-vertical')} />
                    </button>
                    <div className="nk-proj-tab">

                        <button
                            className={"nk-pt-btn " + ((app.menuStats.send && !app.currentProject.includes(props.id))? "" : "disable")}
                            onClick={(e)=>{
                                e.stopPropagation();
                                setOpenMenu(false);
                                app.setProjectPopup(
                                    <ProjectPopup
                                        id={props.id}
                                        color={props.color}
                                        icon={props.icon}
                                        title={props.name}
                                        tempo={props.tempo}
                                        genre={props.genre}
                                        artist={props.artist}
                                        vst={props.vst}
                                        samples={props.samples}
                                        projectFolder={props.dirpath}
                                        comment={props.description}
                                        btn="Save"
                                        to="editProject"
                                        details={true}
                                        rename={null}
                                    />
                                );
                            }}
                        >
                            Edit
                        </button>
                        <button
                            className={"nk-pt-btn " + ((!app.currentProject.includes(props.id))? "" : "disable")}
                            onClick={(e)=>{
                                e.stopPropagation();
                                setOpenMenu(false);
                                app.setProjectPopup(
                                    <ExportPopup
                                        id={props.id}
                                        title={props.name}
                                        genre={props.genre}
                                        artist={props.artist}
                                        dir={props.dirpath}
                                    />
                                );
                            }}
                        >
                            Export
                        </button>
                        <button
                            className={"nk-pt-btn " + ((!app.currentProject.includes(props.id))? "" : "disable")}
                            onClick={(e)=>{
                                e.stopPropagation();
                                setOpenMenu(false);

                                if(!app.menuStats.send){
                                    createPopup(app, "ok", props.name + " added to the queue ! ⏳");
                                }

                                ipcRenderer.send("upProject", props.id);
                            }}
                        >
                            Update
                        </button>
                        <button
                            className={"nk-pt-btn danger " + ((!app.currentProject.includes(props.id))? "" : "disable")}
                            onClick={(e)=>{
                                e.stopPropagation();
                                setOpenMenu(false);

                                app.setConfPopup(
                                    <DeletePopup
                                        name={props.name}
                                        type="project"
                                        delete={()=>{
                                            ipcRenderer.send("deleteProject", props.id);
                                        }} />
                                );
                            }}
                        >
                            Delete
                        </button>

                    </div>
                </div>
                
            </div>
        </>
    );
};

export default Project;