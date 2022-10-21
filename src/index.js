import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/scss/fonts.scss';
import './assets/scss/reset.scss';
import './assets/scss/style.scss';
import App from './App';
import AppContext from './inc/AppContext';
import reportWebVitals from './reportWebVitals';
import { Config } from './cfg/Config';
import { createPopup } from './inc/Function.inc';

const ipcRenderer = window.require('electron').ipcRenderer;

const AppContextEmbed = () => {

    const [cfg, setCfg] = React.useState({});
    const [preferences, setPreferences] = React.useState({});
    const [user, setUser] = React.useState({});
    const [icons, setIcons] = React.useState(Config("icons"));
    const [colors, setColors] = React.useState(Config("colors"));
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [menuSelected, setMenuSelected] = React.useState(0);
    const [projects, setProjects] = React.useState([]);
    const [haveData, setHaveData] = React.useState(true);
    const [popup, setPopup] = React.useState(null);
    const [envPage, setEnvPage] = React.useState(0);
    const [bar, setBar] = React.useState(0);
    const [confPopup, setConfPopup] = React.useState(null);
    const [projectPopup, setProjectPopup] = React.useState(null);
    const [currentProject, setCurrentProject] = React.useState([]);
    const [currentUpload, setCurrentUpload] = React.useState("");

    const [menuStats, setMenuStats] = React.useState({
        send: false
    });
    const [currentProcessed, setCurrentProcessed] = React.useState("");

    const app = {cfg,setCfg,preferences,setPreferences,user,setUser,icons,setIcons,colors,setColors,menuOpen,setMenuOpen,menuSelected,setMenuSelected,projects,setProjects,haveData,setHaveData,popup,setPopup,envPage,setEnvPage,bar,setBar,confPopup,setConfPopup,projectPopup,setProjectPopup,currentProject,setCurrentProject,currentUpload,setCurrentUpload,menuStats,setMenuStats,currentProcessed,setCurrentProcessed};

    React.useEffect(() => {

        for(let i = 0; i < 10; i++) {
            console.log('STOP !');
            console.log('DO NOT PASTE ANYTHING HERE');
        }


        ipcRenderer.invoke('getCfg').then((data) => {
            setCfg({...data});
        });

        ipcRenderer.invoke('getPreferences').then((data) => {
            setPreferences({...data});
        });

        ipcRenderer.invoke('getUsers').then((data) => {
            setUser({...data});
        });

        ipcRenderer.on("alert", (e, data) => {
            createPopup(app, data.status, data.message);
        });

        ipcRenderer.invoke("haveData").then((data) => {
            setHaveData(data);
        });

        ipcRenderer.invoke("sendStatus").then((data) => {
            setMenuStats({...menuStats, send: data});
        });

        ipcRenderer.invoke("getProjects").then((data) => {
            setProjects(data);
            createPopup(app, "ok", "Projects loaded ! 🗿");
        });

        ipcRenderer.on("reloadProjects", () => {
            ipcRenderer.invoke("getProjects").then((data) => {
                setProjects([
                    ...data
                ]);
            });
        });

        ipcRenderer.on("setSend", (e, data) => {
            setMenuStats({...menuStats, send: data.status});
            setCurrentProcessed(data.id);
        });

        ipcRenderer.on("setCurrent", (e, data) => {
            setCurrentProject([
                ...data
            ]);
        });

        ipcRenderer.on("currentUpload", (e, data) => {
            setCurrentUpload(data);
        });

    }, []);

    React.useEffect(() => {
        ipcRenderer.send("setPreferences", preferences);
    }, [preferences]);

    return(
        <React.StrictMode>
            <AppContext.Provider value={app}>
                <App />
            </AppContext.Provider>
        </React.StrictMode>
    )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <AppContextEmbed />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
