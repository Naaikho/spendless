import React, { useContext, useState } from 'react';
import AppContext from '../inc/AppContext';
import $ from 'jquery';
import { animateOn, makeId } from '../inc/Function.inc';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';

import angleLeft from "../assets/img/form-design-top-left.png";
import angleRight from "../assets/img/form-design-bottom-right.png";
import { Motion, spring } from 'react-motion';
import GhostExit from './Ghost';

import { Config } from '../cfg/Config';
import { NkSelect } from './Form';

const ipcRenderer = window.require('electron').ipcRenderer;
const path = window.require('path');

const EnvSoftware = (props) => {

    const app = useContext(AppContext);

    return(
        <div className={"nk-env-form " + ((props.show)? "show" : "")}>
            <div className="nk-env-content">
                <p className="nk-env-label mb noselect">
                    Select the folder of FL Studio
                </p>
                <button
                    className="nk-btn primary-gradient lg"
                    onClick={(e) => {
                        ipcRenderer.send('setFlStudio');
                        ipcRenderer.on("FlStudioDone", () => {
                            app.setEnvPage(2);
                        });
                    }}
                >
                    <FontAwesomeIcon icon={solid("folder")} /> &nbsp; FL Studio
                </button>
            </div>
        </div>
    );
};

const EnvUser = (props) => {

    const app = useContext(AppContext);
    const[artist, setArtist] = React.useState("");

    return(
        <div className={"nk-env-form " + ((props.show)? "show" : "")}>
            
            <div className="nk-form nk-form-layer">
                <p className="nk-env-label mb-s noselect">
                    Your artist name
                </p>
                <p className="nk-env-label mb small noselect">Can be empty</p>
                <div className="nk-input-box nk-col-12">
                    <input
                        type="text"
                        className="nk-input"
                        placeholder="Artist name"
                        onChange={(e) => {
                            setArtist(e.target.value);
                            ipcRenderer.on("dataStatus", (e, data) => {
                                animateOn("fadeOut",
                                    [
                                        $(".nk-setenv-popup")
                                    ],[
                                        0
                                    ],()=>{
                                        app.setHaveData(data);
                                    }
                                );
                            });
                        }}
                    />
                </div>
                <div className="nk-col-12 nk-row center mt">
                    <button
                        className="nk-btn primary"
                        onClick={(e) => {
                            ipcRenderer.send('setArtist', artist);
                            ipcRenderer.invoke('getUsers').then((data) => {
                                app.setUser({...data});
                            });
                        }}
                    >
                        Next
                    </button>
                </div>
            </div>

        </div>
    );
};

const InfosSlide = (props) => {

    const app = useContext(AppContext);

    return(
        <div className={"nk-env-form " + ((props.show)? "show" : "")}>
            
            <div className="nk-env-welcome-container">
                <h1 className="mb">Welcome to <span>SpendLess [Alpha]</span></h1>
                <p className="nk-welcome-text">
                    Spendless is a free software for managing musical projects that allows you to save time (actually in Alpha version).
                    It is constantly communicating with a distant server to submit your projects and receive the latest information about it.
                    This allows SpendLess to offer advanced features such as reading / modifying your project from a .flp, editing certain parameters directly related to the project, improving the external management of samples, etc.
                    I assure you that no trace of your project will be kept on the server and that no data concerning you is kept or used for any purpose.

                    <br /><br />

                    Thank you for using SpendLess, you can give me your feedback here <a className="nk-link" href="mailto:support@naikho.com">support@naikho.com</a>.
                    You can also help me finance this project on
                    <button
                        className="nk-link"
                        onClick={(e)=>{
                            e.preventDefault();
                            ipcRenderer.send('openLink', 'http://patreon.naikho.com');
                        }}
                    >
                        patreon
                    </button>
                </p>
                <button
                    className="nk-btn primary sm abs"
                    onClick={(e) => {
                        app.setEnvPage(1);
                    }}
                >
                    Next
                </button>
            </div>

        </div>
    );
};

const EnvPopup = () => {

    const app = useContext(AppContext);

    return (
        <Motion
            defaultStyle={{
                opacity: 0,
                scale: 0.8,
            }}
            style={{
                opacity: spring(1, {stiffness: 500, damping: 20}),
                scale: spring(1, {stiffness: 500, damping: 20})
            }}
        >
            {({opacity, scale}) => (
                <div
                    className="nk-setenv-popup"
                    style={{
                        opacity: opacity,
                        transform: `scale(${scale})`,
                    }}
                >

                    <div className="nk-setenv-filter"></div>

                    <div className="nk-setenv-box">
                        <div className="nk-angle-design">
                            <img src={angleLeft} alt="" className="angle l" />
                            <img src={angleRight} alt="" className="angle r" />
                        </div>
                        <InfosSlide show={app.envPage === 0} />
                        <EnvSoftware show={app.envPage === 1} />
                        <EnvUser show={app.envPage === 2} />
                        <div className="nk-setenv-switch-bar">
                            <div className="nk-setenv-switcher-box">
                                <button
                                    className={"nk-switch-btn primary noselect " + ((app.envPage === 0)? "selected" : "")}
                                ></button>
                                <button
                                    className={"nk-switch-btn primary noselect " + ((app.envPage === 1)? "selected" : "")}
                                ></button>
                                <button
                                    className={"nk-switch-btn primary noselect " + ((app.envPage === 2)? "selected" : "")}
                                ></button>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </Motion>
    );
};



const DeletePopup = (props) => {

    const app = useContext(AppContext);

    const [id, ] = useState(makeId());

    return (
        <Motion
            defaultStyle={{
                opacity: 0,
                scale: 0.8,
            }}
            style={{
                opacity: spring(1, {stiffness: 500, damping: 20}),
                scale: spring(1, {stiffness: 500, damping: 20}),
        }}
        >
            {({opacity, scale}) => (
                <>
                    <GhostExit
                        zIndex={9999}
                        onClick={(e) => {
                            if(props.close){
                                props.close();
                            }
                            animateOn("fadeOut",
                                [
                                    $(".nk-delete-popup"),
                                    $("#" + id),
                                ],
                                [
                                    0,
                                    0,
                                ],
                                ()=>{
                                    app.setConfPopup(null);
                                }
                            );
                        }}
                        bg={true}
                        style={{opacity: opacity}}
                        id={id}
                    />
                    <div className="nk-delete-popup bs " style={{
                            opacity: opacity,
                            transform: `translate(-50%, -50%) scale(${scale})`,
                        }}>

                        <div className="nk-del-pop-container">

                            <h1 className="noselect">Delete <span>{props.name}</span> ?</h1>
                            <p className="noselect">
                                <span>Are you sure you want to delete this {props.type} ?</span>
                                <br />
                                <span className="danger">This action is irreversible.</span>
                            </p>

                            <div className="nk-btn-container mt">
                                <button
                                    className="nk-btn danger less"
                                    onClick={(e) => {
                                        props.delete();
                                        animateOn("fadeOut",
                                            [
                                                $(".nk-delete-popup"),
                                                $("#" + id),
                                            ],
                                            [
                                                0,
                                                0,
                                            ],
                                            ()=>{
                                                app.setConfPopup(null);
                                            }
                                        );
                                    }}
                                >
                                    Delete
                                </button>
                                <button
                                    className="nk-btn primary"
                                    onClick={(e) => {
                                        if(props.close){
                                            props.close();
                                        }
                                        animateOn("fadeOut",
                                            [
                                                $(".nk-delete-popup"),
                                                $("#" + id),
                                            ],
                                            [
                                                0,
                                                0,
                                            ],
                                            ()=>{
                                                app.setConfPopup(null);
                                            }
                                        );
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>

                        </div>

                    </div>
                </>
            )}
        </Motion>
    );
};





























const ProjectPopup = (props) => {

    const app = useContext(AppContext);

    const [id, ] = useState(makeId());

    const icons = Config("icons");
    const colors = Config("colors");

    const [color, setColor] = useState(props.color);
    const [icon, setIcon] = useState(props.icon);

    let l = [];
    for(let i = 0; i < 49; i++) {
        l.push(<span key={i}><FontAwesomeIcon key={i} icon={icons[icon]} /></span>);
    }

    const [land, setLand] = useState(l);
    const [title, setTitle] = useState(props.title);
    const [tempo, setTempo] = useState(String(props.tempo));
    const [genre, setGenre] = useState(props.genre);
    const [artist, setArtist] = useState(props.artist);
    const [vst, ] = useState(props.vst);
    const [samples, ] = useState(props.samples);
    const [projectFolder, ] = useState(props.projectFolder);
    const [comment, setComment] = useState(props.comment);

    const [open, setOpen] = useState(null);
    const [saveBtn, setSaveBtn] = useState(props.btn);

    const [needUpload, setNeedUpload] = useState(false);

    function makeLand(ico){
        let l = [];
        for(let i = 0; i < 49; i++) {
            l.push(<span key={i}><FontAwesomeIcon key={i} icon={icons[ico]} /></span>);
        }
        setIcon(ico);
        setLand(l);
    }




    var details = ()=>{return null};
    if(props.details){
        details = () => {
            return(
                <>
                    <hr />
                    <div className="nk-flp-details nk-col-3">
                        <div className="nk-col-12 nopad">
                            <p className="nk-info-title noselect">
                                VST:
                            </p>
                        </div>
                        <div className="nk-col-12">
                            <div className="nk-info-text">
                                {vst.map((v, i) => {
                                    if(v.name){
                                        return(
                                            <div className='nk-info-vst' key={i}>
                                                {v.name}
                                                <span>
                                                    {v.by}
                                                </span>
                                            </div>
                                        );
                                    } else {
                                        return null;
                                    }
                                })}
                            </div>
                        </div>
                        <div className="nk-col-12 nopad">
                            <p className="nk-info-title noselect">
                                Samples:
                            </p>
                        </div>
                        <div className="nk-col-12">
                            <p className="nk-info-text noselect">
                                {samples.length}
                            </p>
                        </div>
                        <div className="nk-col-12 nopad">
                            <button
                                className="nk-btn grey less xsm fill"
                                onClick={(e) => {
                                    ipcRenderer.send("openPath", projectFolder);
                                }}
                            >
                                Open Folder
                            </button>
                        </div>
                    </div>
                </>
            );
        }
    }




    return(
        <Motion
            defaultStyle={{
                opacity: 0,
                scale: 0.8,
            }}
            style={{
                opacity: spring(1, {stiffness: 500, damping: 20}),
                scale: spring(1, {stiffness: 500, damping: 20}),
            }}
        >
            {({opacity, scale}) => (
                <>
                    <GhostExit
                        zIndex={9999}
                        onClick={(e) => {
                            if(props.close){
                                props.close();
                            }
                            animateOn("fadeOut",
                                [
                                    $(".nk-edit-popup"),
                                    $("#" + id),
                                ],
                                [
                                    0,
                                    0,
                                ],
                                ()=>{
                                    app.setProjectPopup(null);
                                }
                            );
                        }}
                        bg={true}
                        style={{opacity: opacity}}
                        id={id}
                    />

                    <div className="nk-edit-popup" style={{
                            opacity: opacity,
                            transform: `translate(-50%, -50%) scale(${scale})`,
                        }}>
                        <h2 className="mb">
                            {((props.details)? "Edit" : "Create")} <span>{title}</span>
                        </h2>
                        <div className="nk-edit-content">

                            <div className="nk-edit-infos mb">
                                <div className="nk-edit-pattern nk-col-4">
                                    <div className={"nk-icon-scene noselect " + colors[color]}>
                                        <p className="nk-land">
                                            {
                                                land
                                            }
                                        </p>
                                        <FontAwesomeIcon icon={icons[icon]} />
                                    </div>
                                    <div className="nk-icon-settings">
                                        <button
                                            className="nk-setting icon"
                                            onClick={(e) => {
                                                if(open === "icon"){
                                                    setOpen(null);
                                                }else{
                                                    setOpen("icon");
                                                }
                                            }}
                                        >
                                            <FontAwesomeIcon icon={icons[icon]} />
                                        </button>
                                        <button
                                            className={"nk-setting color " + colors[color]}
                                            onClick={(e) => {
                                                if(open === "color"){
                                                    setOpen(null);
                                                }else{
                                                    setOpen("color");
                                                }
                                            }}
                                        >
                                            <FontAwesomeIcon icon={solid("eye-dropper")} />
                                        </button>

                                        <div className={"nk-change-item " + ((open === "color")? "show" : "")}>
                                            {
                                                colors.map((c, i) => {
                                                    return(
                                                        <button
                                                            key={i}
                                                            className={"nk-color " + c + (c === colors[color] ? " active" : "")}
                                                            onClick={(e) => {
                                                                setColor(i);
                                                                setOpen(null);
                                                            }}
                                                        />
                                                    );
                                                })
                                            }
                                        </div>

                                        <div className={"nk-change-item " + ((open === "icon")? "show" : "")}>
                                            {
                                                icons.map((ico, i) => {
                                                    return(
                                                        <button
                                                            key={i}
                                                            className={"nk-icon " + (i === icon ? "active" : "")}
                                                            onClick={(e) => {
                                                                makeLand(i);
                                                                setOpen(null);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={ico} />
                                                        </button>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                </div>
                                <hr />
                                <div className={"nk-flp-info nk-form-layer nopad " + ((props.details)? "nk-col-5": "nk-col-8")}>
                                    <div className="nk-col-12">
                                        <input
                                            type="text"
                                            defaultValue={title}
                                            className="nk-input small"
                                            placeholder='Title'
                                            onChange={(e)=>{
                                                setTitle(e.target.value);
                                                setNeedUpload(true);
                                            }}
                                        />
                                    </div>
                                    <div className="nk-col-12">
                                        <input
                                            type="text"
                                            defaultValue={artist}
                                            className="nk-input small"
                                            placeholder='Artist(s)'
                                            onChange={(e)=>{
                                                setArtist(e.target.value);
                                                setNeedUpload(true);
                                            }}
                                        />
                                    </div>
                                    <div className="nk-col-12 nk-row nopad">
                                        <div className="nk-col-6">
                                            <input
                                                type="text"
                                                defaultValue={tempo}
                                                className="nk-input small"
                                                placeholder='Tempo'
                                                onChange={(e)=>{
                                                    setTempo(e.target.value);
                                                    setNeedUpload(true);
                                                }}
                                            />
                                        </div>
                                        <div className="nk-col-6">
                                            <input
                                                type="text"
                                                defaultValue={genre}
                                                className="nk-input small"
                                                placeholder='Genre'
                                                onChange={(e)=>{
                                                    setGenre(e.target.value);
                                                    setNeedUpload(true);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {
                                    details()
                                }
                            </div>
                            <div className="nk-col-12 nk-form-layer">
                                <textarea
                                    className='nk-area'
                                    placeholder='Comment . . .'
                                    defaultValue={comment}
                                    onChange={(e) => {
                                        setComment(e.target.value);
                                        setNeedUpload(true);
                                    }}
                                >
                                </textarea>
                            </div>
                            <div className="nk-save-box">
                                <button
                                    className="nk-btn primary"
                                    id="save-btn"
                                    onClick={(e)=>{
                                        setSaveBtn(
                                            <FontAwesomeIcon icon={solid("circle-notch")} spin />
                                        );
                                        ipcRenderer.invoke(props.to, {
                                            id: props.id,
                                            renamed: props.renamed,
                                            title: title,
                                            artist: artist,
                                            tempo: tempo,
                                            genre: genre,
                                            color: color,
                                            icon: icon,
                                            comment: comment,
                                            update: needUpload,
                                        }).then((res) => {
                                            if(res){
                                                if(props.close){
                                                    props.close();
                                                }
                                                setSaveBtn("Save");
                                                animateOn("fadeOut",
                                                    [
                                                        $(".nk-edit-popup"),
                                                        $("#" + id),
                                                    ],
                                                    [
                                                        0,
                                                        0,
                                                    ],
                                                    ()=>{
                                                        app.setProjectPopup(null);
                                                    }
                                                );
                                            } else {
                                                setSaveBtn(props.btn);
                                            }
                                        });
                                    }}
                                >
                                    {saveBtn}
                                </button>
                            </div>

                        </div>
                    </div>
                </>

            )}
        </Motion>
    );
};




































const ExportPopup = (props) => {

    const app = useContext(AppContext);

    const [id, ] = useState(makeId());

    let list = [
        {
            id: "spend",
            name: "SpendLess file"
        },
        {
            id: "zip",
            name: "FL Studio Project"
        },
        {
            id: "wav",
            name: "Wave Audio"
        },
        {
            id: "mp3",
            name: "MP3 Audio"
        },
        {
            id: "ogg",
            name: "Ogg Audio"
        },
        {
            id: "flac",
            name: "FLAC Audio"
        }
    ];

    const [artist, setArtist] = useState(props.artist);
    const [title, setTitle] = useState(props.title);
    const [genre, setGenre] = useState(props.genre);
    const [fileType, setFileType] = useState(0);
    const [savePath, setSavePath] = useState(path.join(props.dir, "export", path.basename(props.dir) + "." + list[fileType].id));

    const [btn, setBtn] = useState("Export");

    return(
        <Motion
            defaultStyle={{
                opacity: 0,
                scale: 0.8,
            }}
            style={{
                opacity: spring(1, {stiffness: 500, damping: 20}),
                scale: spring(1, {stiffness: 500, damping: 20}),
            }}
        >
            {({opacity, scale}) => (
                <>
                    <GhostExit
                        zIndex={9999}
                        onClick={(e) => {
                            if(props.close){
                                props.close();
                            }
                            animateOn("fadeOut",
                                [
                                    $(".nk-export-popup"),
                                    $("#" + id),
                                ],
                                [
                                    0,
                                    0,
                                ],
                                ()=>{
                                    app.setProjectPopup(null);
                                }
                            );
                        }}
                        bg={true}
                        style={{opacity: opacity}}
                        id={id}
                    />

                    <div
                        className="nk-export-popup"
                        style={{
                            opacity: opacity,
                            transform: `translate(-50%, -50%) scale(${scale})`,
                        }}
                    >
                        <h2 className='noselect mb'>
                            Export <span>{props.title}</span>
                        </h2>
                        <div className={"nk-col-12 nopad nk-row nk-form-layer mb-s " + ((fileType !== 0)? "hide" : "")}>
                            <div className="nk-col-4">
                                <input
                                    type="text"
                                    className="nk-input"
                                    placeholder={((props.title)? props.title : "Title")}
                                    onChange={(e)=>{
                                        e.preventDefault();
                                        setTitle(e.target.value);
                                    }}
                                />
                            </div>
                            <div className="nk-col-4">
                                <input
                                    type="text"
                                    className="nk-input"
                                    placeholder={((props.artist)? props.artist : "Artist")}
                                    onChange={(e)=>{
                                        e.preventDefault();
                                        setArtist(e.target.value);
                                    }}
                                />
                            </div>
                            <div className="nk-col-4">
                                <input
                                    type="text"
                                    className="nk-input"
                                    placeholder={((props.genre)? props.genre : "Genre")}
                                    onChange={(e)=>{
                                        e.preventDefault();
                                        setGenre(e.target.value);
                                    }}
                                />
                            </div>
                        </div>
                        <div className="nk-col-12 nk-form-layer mb-s">
                            <NkSelect
                                // .spend, .flp, .wav, .mp3, .ogg, .flac
                                list={list}
                                onChange={(data)=>{
                                    setFileType(data);
                                    setSavePath(savePath.split(".").slice(0, -1).join(".") + "." + list[data].id);
                                }}
                            />
                        </div>
                        {
                            ((fileType !== 0 && fileType !== 1)? <p className="nk-export-advert nk-col-12 mt-s mb noselect">Exporting to an audio format requires opening FL Studio. If FL Studio is already open and a project is running, please make sure to save your changes before starting the export to avoid overwriting your progress.</p> : "")
                        }
                        <div className="nk-col-12 nopad nk-row stretch nk-form-layer mb">
                            <div className="nk-col-10">
                                <input
                                    type="text"
                                    className="nk-input small disable"
                                    value={savePath}
                                    disabled
                                />
                            </div>
                            <div className="nk-col-2 nk-row center">
                                <button
                                    className="nk-btn primary nopad less full-fill"
                                    onClick={()=>{
                                        ipcRenderer.invoke(
                                            "saveDialog",
                                            [
                                                {
                                                    name: list[fileType].name,
                                                    extensions: [list[fileType].id]
                                                }
                                            ],
                                            path.join(props.dir, "export", path.basename(props.dir))
                                        ).then((data)=>{
                                            if(!data.canceled){
                                                setSavePath(data.filePath);
                                            }
                                        });
                                    }}
                                >
                                    <FontAwesomeIcon icon={solid("folder")} />
                                </button>
                            </div>
                        </div>
                        <div className="nk-col-12">
                            <button
                                className="nk-btn primary fill"
                                onClick={()=>{
                                    setBtn(<FontAwesomeIcon icon={solid("circle-notch")} spin />);
                                    ipcRenderer.invoke("exportProject", {
                                        id: props.id,
                                        artist: artist,
                                        title: title,
                                        genre: genre,
                                        fileType: list[fileType].id,
                                        savePath: savePath,
                                    }).then((data)=>{
                                        if(props.close){
                                            props.close();
                                        }
                                        if(data){
                                            animateOn("fadeOut",
                                                [
                                                    $(".nk-export-popup"),
                                                    $("#" + id),
                                                ],
                                                [
                                                    0,
                                                    0,
                                                ],
                                                ()=>{
                                                    app.setProjectPopup(null);
                                                }
                                            );
                                            setBtn("Export");
                                        } else {
                                            setBtn("Export");
                                        }
                                    });
                                }}
                            >
                                {btn}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </Motion>
    );
};



export {
    EnvPopup,
    DeletePopup,
    ProjectPopup,
    ExportPopup,
};