/**
 * Name: SpendLess
 * Author: @Naikho
 * Date: 21-10-2022
 * Description: SpendLess is an advanced project manager for music production
 * License: MIT
 */

const {app, BrowserWindow, ipcMain, shell, globalShortcut} = require('electron');
const io = require('socket.io-client');
const path = require('path');
const fs = require('fs');
const {dialog} = require('electron');
const find = require('find-process')
const JSZip = require('jszip');
const spawn = require("child_process").spawn;

const env = JSON.parse(fs.readFileSync(path.join(__dirname, 'env.json'), 'utf8'));
env["storage"] = app.getPath('userData');
env["flData"] = path.join(app.getPath('documents'), "Image-Line", "FL Studio");
env["base_flp"] = path.join(__dirname, "flp", "base.flp");

const bufferSize = 1024 * 20;

const sock = io.connect(env.protocol + "://" + env.host + ":" + env.port, {
    timeout: 120000,
    reconnectionDelayMax: 10000,
});

const bdec = (str)=>{
    return Buffer.from(str, 'base64').toString('utf-8');
}
const benc = (str)=>{
    return Buffer.from(str, 'utf-8').toString('base64');
}

const bdec_bin = (str)=>{
    return Buffer.from(str, 'base64').toString('binary');
}
const benc_bin = (str)=>{
    return Buffer.from(str, 'binary').toString('base64');
}




// if the data folder not exists, create it
if (!fs.existsSync(path.join(env["storage"], 'data'))) {
    fs.mkdirSync(path.join(env["storage"], 'data'));
}

if (!fs.existsSync(path.join(env["storage"], 'projects'))) {
    fs.mkdirSync(path.join(env["storage"], 'projects'));
}

if (!fs.existsSync(path.join(env["storage"], 'tmp'))) {
    fs.mkdirSync(path.join(env["storage"], 'tmp'));
}

if (!fs.existsSync(path.join(env["storage"], 'data', "preferences.json"))) {
    fs.writeFileSync(path.join(env["storage"], 'data', "preferences.json"), "{}");
}
var preferences = JSON.parse(fs.readFileSync(path.join(env["storage"], 'data', "preferences.json"), 'utf8'));

function savePreferences(){
    fs.writeFileSync(path.join(env["storage"], 'data', "preferences.json"), JSON.stringify(preferences));
}

if(!Object.entries(preferences).length){
    preferences = {
        noname_menu: true,
        projects_menu: true,
        default_tempo: 130,
        template: path.join(__dirname, "src", "assets", "flp", "base.flp"),
        update: true,
    };
}

if(!fs.existsSync(preferences.template)){
    preferences.template = env["base_flp"];
    savePreferences();
}

if (!fs.existsSync(path.join(env["storage"], 'data', "user.json"))) {
    fs.writeFileSync(path.join(env["storage"], 'data', "user.json"), "{}");
}
const user = JSON.parse(fs.readFileSync(path.join(env["storage"], 'data', "user.json"), 'utf8'));

function saveUser(){
    fs.writeFileSync(path.join(env["storage"], 'data', "user.json"), JSON.stringify(user));
}

ipcMain.handle("haveData", ()=>{
    return Object.entries(user).length !== 0;
});

savePreferences();





require("@electron/remote/main").initialize();

function createWindow () {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1200,
        // width: 1400,
        height: 700,
        minHeight: 600,
        minWidth: 900,
        frame: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false
        },
        icon: path.join(__dirname, 'spendless-icon.ico')
    });

    const startUrl = process.env.ELECTRON_START_URL || "file://" + path.join(__dirname, '/index.html');

    mainWindow.loadURL(startUrl);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    var main = createWindow();

    function ipcSend(channel, data="") {
        try{
            main.webContents.send(channel, data);
        }catch(e){
            console.log(e);
        }
    }

    function isValidFlStudio(path="", scaled=false) {
        let listFiles = fs.readdirSync(path);
        if(path !== ""){
            let files = [
                "FL64.exe",
                "FL64 (scaled).exe",
                "FL.exe",
                "FL (scaled).exe",
                "FL_3GB.exe"
            ];
            let version = "";
            files.forEach((file)=>{
                if(version !== "") return;
                listFiles.forEach((lf)=>{
                    if(version !== "") return;
                    if(lf.includes(file)){
                        if(scaled && lf.includes("scaled")){
                            version = lf;
                        }
                        if(!scaled){
                            version = lf;
                        }
                    }
                });
            });
            return version;
        }
        return false;
    }

    function getLastModified(file) {
        // to second
        return Math.floor(fs.statSync(file).mtimeMs);
    }

    // custom reload
    globalShortcut.register('CommandOrControl+R', () => {});
    if(!process.env.ELECTRON_START_URL){
        // custom hard reload
        globalShortcut.register('CommandOrControl+Shift+R', () => {});
        // custom dev tools
        globalShortcut.register('CommandOrControl+Shift+I', () => {});
    }

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    var processProject = {};
    // var fileBuffer = [];
    const cfgElements = {
        icons: 156,
        colors: 8,
    };
    var makeUpdate = [];
    var onUpdate = {};
    var currents_proj = [];
    var userProjects = {};
    var endFile = {};
    var fileBuffer = {};

    // var progressing = 0;
    // var progress_value = 0;
    var currUpdate = [];
    var isEdit= {};
    var isCreating = {};
    var useTmp = {};
    var basedSamples = {};

    var onOpen = false;

    // ipcMain.handle("sendStatus", ()=>{
    //     return !inProcessing
    // });

    // get projects
    ipcMain.handle('getProjects', () => {

        let projects = [];
        let listFolders = fs.readdirSync(path.join(env["storage"], 'projects'));

        listFolders.forEach((fold)=>{
            let p = path.join(env["storage"], 'projects', fold)

            if(fs.lstatSync(p).isDirectory() && fs.existsSync(path.join(p, fold+".json"))){
                let proj = JSON.parse(fs.readFileSync(path.join(p, fold+".json"), 'utf8'));

                proj.preview = "";
                if(fs.existsSync(path.join(p, fold + ".mp3"))){
                    proj.preview = path.join(p, fold + ".mp3");
                }

                if(proj["last_edited"] !== getLastModified(proj.filepath)){
                    makeUpdate.push(proj.id);
                }

                projects.push(proj);
            }
        });

        projects.forEach((proj)=>{
            userProjects[proj.id] = proj;
        });

        let pr_tmp = [...projects];
        for(let i=0; i<pr_tmp.length; i++){
            let l = 0;
            while(l < pr_tmp.length) {
                if(pr_tmp[l].last_edited < pr_tmp[l+1]?.last_edited){
                    let tmp = pr_tmp[l];
                    pr_tmp[l] = pr_tmp[l+1];
                    pr_tmp[l+1] = tmp;
                }
                l++;
            }
        }

        projects = [...pr_tmp];

        return projects;

    });

    // create project
    ipcMain.on('openProject', (e, id) => {

        if(currents_proj.includes(id)){
            return;
        }

        onOpen = true;

        console.log("open project", id);

        try{
            shell.openPath(userProjects[id].filepath);
            onOpen = false;
        } catch(e){
            console.log(e);
            ipcSend("alert", {
                status: "error",
                message: "Error opening project " + e
            });
            onOpen = false;
        }
    });

    ipcMain.on('openPath', (e, path) => {
        shell.openPath(path);
    });

    ipcMain.on('createProject', (e, arg) => {});

    // update project
    ipcMain.on('upProject', (e, id) => {
        makeUpdate.push(id);
    });



    ipcMain.handle("setProject", (e, data)=>{
        try{
            let icon = data.icon;
            let color = data.color;
            let title = String(data.title).trim();
            let artist = String(data.artist).trim();
            let genre = String(data.genre).trim();
            if(data.tempo.includes(",")){
                data.tempo = data.tempo.replace(",", ".");
            }
            let tempo = parseFloat(data.tempo);

            if(tempo < 10 || tempo > 522){
                ipcSend("alert", {
                    status: "error",
                    message: "Tempo must be between 10 and 522"
                });
                return 0;
            }
            if(!tempo){
                ipcSend("alert", {
                    status: "error",
                    message: "Tempo must be a number"
                });
                return 0;
            }

            let comment = String(data.comment).trim();

            let project = {
                id: data.id,
                icon: icon,
                color: color,
                title: title,
                artist: artist,
                genre: genre,
                tempo: tempo,
                comment: comment,
                renamed: data.renamed,
            };


            try{
                let folderName = project.title.replace(/\.[^/.]+$/, "");
                folderName = folderName.replace(/[^a-zA-Z0-9 ]/g, "");
                folderName = folderName.replace(/ /g, "_");

                if(fs.existsSync(path.join(env["storage"], 'projects', folderName))){
                    for(let i = 1; true; i++){
                        let fn = folderName + "_" + String(i);
                        if(!fs.existsSync(path.join(env["storage"], 'projects', fn))){
                            folderName = fn;
                            project.title = fn.split("_").join(" ");
                            break;
                        }
                    }
                }
                

                ipcSend("currentUpload", project.title);

                let proj_file = {
                    id: project.id,
                    artist: project.artist,
                    filename: folderName,
                    dir: path.join(env["storage"], 'projects', folderName),
                    foldername: folderName,
                    stream: benc_bin(fs.readFileSync(preferences.template, "binary")),
                    edit_title: project.title,
                    edit_artist: project.artist,
                    edit_tempo: project.tempo,
                    edit_genre: project.genre,
                    edit_comment: project.comment
                };

                proj_file = benc(JSON.stringify(proj_file));

                fileBuffer[project.id] = [];

                let l = 0;
                for(let i=0; i<proj_file.length; i+=bufferSize) {
                    fileBuffer[project.id].push(JSON.stringify({
                        id: project.id,
                        part: l,
                        stream: proj_file.slice(i, i+bufferSize),
                    }));
                    l++;
                }

                if(!fs.existsSync(preferences.template)){
                    preferences.template = env["base_flp"];
                    savePreferences();
                }

                processProject[project.id] = {
                    id: project.id,
                    filepath: preferences.template,
                    filename: path.basename(preferences.template),
                    jsonname: folderName+".json",
                    color: project.color,
                    icon: project.icon,
                    data:{},
                    renamed: project.renamed,
                };
                console.log("send datas");

                let progressing = fileBuffer[project.id].length;
                isCreating[project.id] = true;
                sock.emit("getFileInfo", fileBuffer[project.id][0]);
                sock.off("continue_" + project.id);
                sock.on("continue_" + project.id, (data)=>{
                    try{
                        while(true){
                            if(fileBuffer[project.id].length > 1) {
                                fileBuffer[project.id].shift();
                                sock.emit("getFileInfo", fileBuffer[project.id][0]);
                            } else {
                                fileBuffer[project.id] = [];
                                console.log("upload complete");
                                sock.emit("getFileInfo", JSON.stringify({
                                    id: project.id,
                                    stream: "end"
                                }));
                                progressing = 0;
                                ipcSend("loading", {
                                    id: project.id,
                                    value: 1
                                });
                                break;
                            }
                            ipcSend("loading", {
                                value: ((progressing - fileBuffer[project.id].length)/progressing) * 100,
                                id: project.id
                            });
                        }
                    } catch(e){
                        onUpdate[project.id] = false;
                        currUpdate = currUpdate.filter((e)=>e !== project.id);
                        console.log(e);
                        isEdit[project.id] = false;
                        ipcSend("alert", {
                            status: "error",
                            message: "Error while updating project. 🐞\n"+e,
                        });
                        ipcSend("loading", {
                            id: project.id,
                            value: 0
                        });
                        ipcSend("setSend", {
                            action: "remove",
                            id: project.id
                        });
                    }
                });
            }catch(e){
                console.log(e);
                ipcSend("loading", {
                    id: project.id,
                    value: 0
                });
                ipcSend("alert", {
                    status: "error",
                    message: "Error while creating project. 🐞\n" + e + "\n" + preferences.template + " " + env["base_flp"]
                });
                isCreating[project.id] = false;
                ipcSend("setSend", {
                    action: "remove",
                    id: project.id
                });
            }
            return 1;
        } catch(e){
            ipcSend("alert", {
                status: "error",
                message: "Error creating project: " + e
            });
            isEdit[data.id] = false;
        }
        return 0;
    });

    ipcMain.handle('editProject', (e, data) => {
        if(currents_proj.includes(data.id)){
            ipcSend("alert", {
                status: "error",
                message: "You can't edit a project that is open ⛔"
            });
            return;
        }
        try{
            isEdit[data.id] = true;
            if(userProjects[data.id]){

                let icon = data.icon;
                let color = data.color;
                let title = String(data.title).trim();
                let artist = String(data.artist).trim();
                let genre = String(data.genre).trim();
                if(data.tempo.includes(",")){
                    data.tempo = data.tempo.replace(",", ".");
                }
                let tempo = parseFloat(data.tempo);

                if(tempo < 10 || tempo > 522){
                    ipcSend("alert", {
                        status: "error",
                        message: "Tempo must be between 10 and 522"
                    });
                    return 0;
                }
                if(!tempo){
                    ipcSend("alert", {
                        status: "error",
                        message: "Tempo must be a number"
                    });
                    return 0;
                }

                let comment = String(data.comment).trim();

                userProjects[data.id].color = color;
                userProjects[data.id].icon = icon;

                if(data.update){
                    // title
                    userProjects[data.id].data.title = title;
                    // artist
                    userProjects[data.id].data.artist = artist;
                    // tempo
                    userProjects[data.id].data.tempo = tempo;
                    // genre
                    userProjects[data.id].data.genre = genre;
                    // comment
                    userProjects[data.id].data.comment = comment;
                }

                userProjects[data.id].renamed = true;

                fs.writeFileSync(path.join(userProjects[data.id].data.dir, userProjects[data.id].jsonname), JSON.stringify(userProjects[data.id]));

                if(data.update){
                    console.log("update");
                    makeUpdate.push(data.id);
                } else {
                    ipcSend("reloadProjects");
                }
                return 1;
            } else {
                ipcSend("alert", {
                    status: "error",
                    message: "Error: project not found"
                });
                isEdit[data.id] = false;
            }
        } catch(e){
            ipcSend("alert", {
                status: "error",
                message: "Error editing project: " + e
            });
            isEdit[data.id] = false;
        }
        return 0;
    });

    // delete project
    ipcMain.on('deleteProject', (e, id) => {

        if(currents_proj.includes(id)){
            ipcSend("alert", {
                status: "error",
                message: "You can't delete a project that is open ⛔"
            });
            return;
        }

        if(currUpdate.includes(id)){
            ipcSend("alert", {
                status: "error",
                message: "You can't delete a project that is updating ⛔"
            });
            return;
        }

        let p = userProjects[id].data.dir
        let n = userProjects[id].data.title;
        // delete the dir of project at p
        fs.rmSync(p, { recursive: true });
        ipcSend("alert", {
            status: "ok",
            message: n + " deleted ! 🗑"
        });
        ipcSend("reloadProjects");
    });



    ipcMain.on("importProject", (e, data)=>{

        // if(inProcessing){
        //     ipcSend("alert", {
        //         status: "error",
        //         message: "You can't import multiple projects at the same time. ⛔"
        //     });
        //     return;
        // }

        // ask file to user
        dialog.showOpenDialog({
            // later, allow multiple selections
            properties: ['openFile'],
            filters: [
                {
                    name: 'Projects', extensions: ['flp', 'spend', 'zip'],
                }
            ]
        }).then(res => {

            if(!res.canceled && res.filePaths.length > 0){

                let isZip = res.filePaths[0].split(".")[res.filePaths[0].split(".").length-1]=== "zip";

                if(res.filePaths[0].split(".")[res.filePaths[0].split(".").length-1]=== "spend" || isZip){

                    // make uniq id
                    let projectId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); 

                    basedSamples[projectId] = true;

                    let zip = new JSZip();
                    let spend = null;

                    if(isZip){
                        spend = fs.readFileSync(res.filePaths[0]);
                        let folderName = path.basename(res.filePaths[0]).replace(/\.[^/.]+$/, "");
                        folderName = folderName.replace(/[^a-zA-Z0-9]/g, "");
                        folderName = folderName.replace(/ /g, "_");
                        spend = {
                            id: projectId,
                            filename: "",
                            dirname: folderName,
                            color: Math.floor(Math.random() * cfgElements.colors),
                            icon: Math.floor(Math.random() * cfgElements.icons),
                            version: app.getVersion(),
                            file: benc_bin(spend),
                        }
                    } else {
                        spend = JSON.parse(fs.readFileSync(res.filePaths[0]));
                    }

                    let savePath = path.join(env["storage"], "tmp", spend.id);
                    
                    if(spend.version !== app.getVersion()){
                        ipcSend("alert", {
                            status: "error",
                            message: "This project was created with a different version of SpendLess. ⛔"
                        });
                        basedSamples[projectId] = false;
                        return;
                    }

                    function importContinue(flpName=""){
                        // read binary file with sync
                        ipcSend("setSend", {
                            action: "import",
                            id: projectId,
                        });

                        if(isZip){
                            if(flpName === ""){
                                ipcSend("alert", {
                                    status: "error",
                                    message: "This zip file doesn't contain a .flp file. ⛔"
                                });
                                ipcSend("loading", {
                                    id: projectId,
                                    value: 0
                                });
                                useTmp[projectId] = false;
                                ipcSend("setSend", {
                                    action: "unimport",
                                    id: projectId,
                                });
                                basedSamples[projectId] = false;
                                return;
                            }
                            spend.filename = flpName;
                        }

                        // mkdir in env["storage"]/projects a folder with file name without extension and special char and replace space by _
                        try{
                            let projectId = spend.id;
                            let folderName = spend.dirname;

                            if(fs.existsSync(path.join(env["storage"], 'projects', folderName))){
                                for(let i = 1; true; i++){
                                    let fn = folderName + "_" + String(i);
                                    if(!fs.existsSync(path.join(env["storage"], 'projects', fn))){
                                        folderName = fn;
                                        break;
                                    }
                                }
                            }

                            ipcSend("currentUpload", path.basename(savePath));

                            let proj_file = {
                                id: projectId,
                                artist: user.artist || "Unknown",
                                filename: spend.filename,
                                dir: path.join(env["storage"], 'projects', folderName),
                                foldername: folderName,
                                stream: benc_bin(fs.readFileSync(path.join(savePath, spend.filename), "binary")),
                            };

                            proj_file = benc(JSON.stringify(proj_file));

                            fileBuffer[projectId] = [];

                            let l = 0;
                            for(let i=0; i<proj_file.length; i+=bufferSize) {
                                fileBuffer[projectId].push(JSON.stringify({
                                    id: projectId,
                                    part: l,
                                    stream: proj_file.slice(i, i+bufferSize),
                                }));
                                l++;
                            }
                            processProject[projectId] = {
                                id: projectId,
                                filepath: path.join(savePath, spend.filename),
                                filename: spend.filename,
                                color: spend.color,
                                icon: spend.icon,
                                data:{},
                                renamed: true,
                            };
                            console.log("send datas");

                            let progressing = fileBuffer[projectId].length;
                            sock.emit("getFileInfo", fileBuffer[projectId][0]);
                            sock.off("continue_" + projectId);
                            sock.on("continue_" + projectId, (data)=>{
                                try{
                                    while(true){
                                        if(fileBuffer[projectId].length > 1) {
                                            fileBuffer[projectId].shift();
                                            sock.emit("getFileInfo", fileBuffer[projectId][0]);
                                        } else {
                                            fileBuffer[projectId] = [];
                                            console.log("upload complete");
                                            sock.emit("getFileInfo", JSON.stringify({
                                                id: projectId,
                                                stream: "end"
                                            }));
                                            progressing = 0;
                                            ipcSend("loading", {
                                                id: projectId,
                                                value: 1
                                            });
                                            break;
                                        }
                                        ipcSend("loading", {
                                            value: ((progressing - fileBuffer[projectId].length)/progressing) * 100,
                                            id: projectId
                                        });
                                    }
                                } catch(e){
                                    onUpdate[projectId] = false;
                                    currUpdate = currUpdate.filter((e)=>e !== projectId);
                                    console.log(e);
                                    isEdit[projectId] = false;
                                    ipcSend("alert", {
                                        status: "error",
                                        message: "Error while updating project. 🐞\n"+e,
                                    });
                                    ipcSend("loading", {
                                        id: projectId,
                                        value: 0
                                    });
                                    ipcSend("setSend", {
                                        action: "remove",
                                        id: projectId
                                    });
                                }
                            });
                        }catch(e){
                            console.log(e);
                            ipcSend("loading", {
                                id: projectId,
                                value: 0
                            });
                            ipcSend("alert", {
                                status: "error",
                                message: "Error while importing project. 🐞"
                            });
                            basedSamples[projectId] = false;
                            useTmp[projectId] = false;
                            ipcSend("setSend", {
                                action: "unimport",
                                id: projectId,
                            });
                        }
                    }

                    zip.loadAsync(bdec_bin(spend.file)).then(function (zip) {

                        try{
                            fs.mkdirSync(savePath, { recursive: true });
                            useTmp[projectId] = true;

                            let i = 0;
                            let flpName = "";
                            Object.values(zip.files).forEach(function(data) {
                                if(data.dir){
                                    i++;
                                    return;
                                }

                                if(data.name.includes(".flp")){
                                    flpName = data.name;
                                }

                                zip.file(data.name).async("nodebuffer").then(function(content) {
                                    fs.writeFileSync(path.join(savePath, path.basename(data.name)), content, "binary");
                                    i++;
                                    if(i === Object.values(zip.files).length){
                                        importContinue(flpName);
                                    }
                                });
                            });
                        }catch(e){
                            console.log(e);
                            ipcSend("loading", {
                                id: projectId,
                                value: 0
                            });
                            ipcSend("alert", {
                                status: "error",
                                message: "Error while importing project. 🐞"
                            });
                            // progressing = 0;
                            useTmp[projectId] = false;
                            basedSamples[projectId] = false;
                            ipcSend("setSend", {
                                action: "unimport",
                                id: projectId,
                            });
                        }
                    });
                }



                if(res.filePaths[0].split(".")[res.filePaths[0].split(".").length-1]=== "flp"){

                    // make uniq id
                    let projectId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); 

                    basedSamples[projectId] = false;

                    ipcSend("loading", {
                        id: projectId,
                        value: 1
                    });
                    // read binary file with sync
                    ipcSend("setSend", {
                        action: "import",
                        id: projectId,
                    });
                    // mkdir in env["storage"]/projects a folder with file name without extension and special char and replace space by _
                    try{
                        let folderName = path.basename(res.filePaths[0]).replace(/\.[^/.]+$/, "");
                        folderName = folderName.replace(/[^a-zA-Z0-9]/g, "");
                        folderName = folderName.replace(/ /g, "_");

                        if(fs.existsSync(path.join(env["storage"], 'projects', folderName))){
                            for(let i = 1; true; i++){
                                let fn = folderName + "_" + String(i);
                                if(!fs.existsSync(path.join(env["storage"], 'projects', fn))){
                                    folderName = fn;
                                    break;
                                }
                            }
                        }

                        ipcSend("currentUpload", path.basename(res.filePaths[0]));

                        let proj_file = {
                            id: projectId,
                            artist: user.artist || "Unknown",
                            filename: folderName + ".flp",
                            dir: path.join(env["storage"], 'projects', folderName),
                            foldername: folderName,
                            stream: benc_bin(fs.readFileSync(res.filePaths[0], "binary")),
                        };

                        proj_file = benc(JSON.stringify(proj_file));

                        fileBuffer[projectId] = [];

                        let l = 0;
                        for(let i=0; i<proj_file.length; i+=bufferSize) {
                            fileBuffer[projectId].push(JSON.stringify({
                                id: projectId,
                                part: l,
                                stream: proj_file.slice(i, i+bufferSize),
                            }));
                            l++;
                        }
                        processProject[projectId] = {
                            id: projectId,
                            filepath: res.filePaths[0],
                            filename: path.basename(res.filePaths[0]),
                            color: Math.floor(Math.random() * cfgElements.colors),
                            icon: Math.floor(Math.random() * cfgElements.icons),
                            data:{},
                            renamed: true,
                        };
                        console.log("send datas");

                        let progressing = fileBuffer[projectId].length;
                        sock.emit("getFileInfo", fileBuffer[projectId][0]);
                        sock.off("continue_" + projectId);
                        sock.on("continue_" + projectId, (data)=>{
                            try{
                                while(true){
                                    if(fileBuffer[projectId].length > 1) {
                                        fileBuffer[projectId].shift();
                                        sock.emit("getFileInfo", fileBuffer[projectId][0]);
                                    } else {
                                        fileBuffer[projectId] = [];
                                        console.log("upload complete");
                                        sock.emit("getFileInfo", JSON.stringify({
                                            id: projectId,
                                            stream: "end"
                                        }));
                                        progressing = 0;
                                        ipcSend("loading", {
                                            id: projectId,
                                            value: 1
                                        });
                                        break;
                                    }
                                    ipcSend("loading", {
                                        value: ((progressing - fileBuffer[projectId].length)/progressing) * 100,
                                        id: projectId
                                    });
                                }
                            } catch(e){
                                onUpdate[projectId] = false;
                                currUpdate = currUpdate.filter((e)=>e !== projectId);
                                console.log(e);
                                isEdit[projectId] = false;
                                ipcSend("alert", {
                                    status: "error",
                                    message: "Error while updating project. 🐞\n"+e,
                                });
                                ipcSend("loading", {
                                    id: projectId,
                                    value: 0
                                });
                                ipcSend("setSend", {
                                    action: "remove",
                                    id: projectId
                                });
                            }
                        });
                    }catch(e){
                        console.log(e);
                        ipcSend("loading", {
                            id: projectId,
                            value: 0
                        });
                        ipcSend("alert", {
                            status: "error",
                            message: "Error while importing project. 🐞"
                        });
                        ipcSend("setSend", {
                            action: "unimport",
                            id: projectId,
                        });
                    }
                }
            }
        }).catch(err => {
            console.log(err);
        });
    });

    ipcMain.handle("exportProject", (e, data)=>{

        if(data.fileType === "spend"){
            let zip = new JSZip();
            try {

                zip.file(userProjects[data.id].filename, fs.readFileSync(userProjects[data.id].filepath, "binary"), {binary:true});

                let samp = zip.folder("samples");

                let listSamples = fs.readdirSync(path.join(userProjects[data.id].data.dir, "samples"));

                for(let i = 0; i < listSamples.length; i++){
                    samp.file(listSamples[i], fs.readFileSync(path.join(userProjects[data.id].data.dir, "samples", listSamples[i]), "binary"), {binary:true});
                }
                
                zip.generateAsync({type: 'nodebuffer'})
                    .then(function (content) {
                        let spendFile = {
                            id: userProjects[data.id].id,
                            filename: userProjects[data.id].filename,
                            dirname: path.basename(userProjects[data.id].data.dir),
                            color: userProjects[data.id].color,
                            icon: userProjects[data.id].icon,
                            version: app.getVersion(),
                            file: benc_bin(content),
                        }
                        fs.writeFileSync(data.savePath, JSON.stringify(spendFile));
                        ipcSend("alert", {
                            status: "ok",
                            message: "Project exported ! 📦",
                        });
                    })
                    .catch(e => {
                        console.log(e);
                        ipcSend("alert", {
                            status: "error",
                            message: "Error while encoding the project. 🐞\n" + e,
                        });
                    });
                
                return 1;
            } catch (err) {
                ipcSend("alert", {
                    status: "error",
                    message: "Error while exporting project. 🐞\n"+err
                });
                return 0;
            }
        }

        if(data.fileType === "zip"){
            let zip = new JSZip();
            try{
                zip.file(userProjects[data.id].filename, fs.readFileSync(userProjects[data.id].filepath, "binary"), {binary:true});

                let listSamples = fs.readdirSync(path.join(userProjects[data.id].data.dir, "samples"));

                for(let i = 0; i < listSamples.length; i++){
                    zip.file(listSamples[i], fs.readFileSync(path.join(userProjects[data.id].data.dir, "samples", listSamples[i]), "binary"), {binary:true});
                }
                
                zip.generateAsync({type: 'nodebuffer'})
                    .then(function (content) {
                        fs.writeFileSync(data.savePath, content);
                        ipcSend("alert", {
                            status: "ok",
                            message: "Project exported ! 📦",
                        });
                    })
                    .catch(e => {
                        console.log(e);
                        ipcSend("alert", {
                            status: "error",
                            message: "Error while encoding the project. 🐞\n" + e,
                        });
                    });
            }catch(e){
                console.log(e);
                ipcSend("alert", {
                    status: "error",
                    message: "Error while exporting project. 🐞"
                });
            }
        }

        if(["mp3", "wav", "ogg", "flac"].includes(data.fileType)){
            let fileType = (data.fileType === "mp3") ? "mp3" : "mp3,"+data.fileType;
            // exec shell command
            spawn(`${path.basename(user.flstudio)} /R /E${fileType} /F"${path.dirname(userProjects[data.id].filepath)}"`, {cwd: path.dirname(user.flstudio), shell: true, stdio: [ 'ignore', null, null ], detached: true }).on("close", (code)=>{
                let exportedPath = path.dirname(userProjects[data.id].filepath);
                fs.copyFileSync(path.join(exportedPath, path.basename(userProjects[data.id].filepath).replace(/\.[^/.]+$/, "." + data.fileType)), data.savePath);
                if(fileType !== "mp3"){
                    fs.unlinkSync(path.join(exportedPath, path.basename(userProjects[data.id].filepath).replace(/\.[^/.]+$/, "." + data.fileType)));
                }
                ipcSend("alert", {
                    status: "ok",
                    message: "Project exported ! 📦",
                });
                ipcSend("reloadProjects");
            }).unref();
        }

        return 1;
    });






    ipcMain.on("updateProjects", (projectId)=>{
        console.log("updateProjects");

        // if(inProcessing){
        //     return;
        // }

        ipcSend("loading", {
            id: projectId,
            value: 1
        });
        onUpdate[projectId] = true;
        try{
            let p = makeUpdate[0];
            makeUpdate.shift();
            p = userProjects[p];
            ipcSend("currentUpload", p.data.title);
            if(currents_proj.includes(p.id)){
                onUpdate[projectId] = false;
                isEdit[p.id] = false;
                ipcSend("loading", {
                    id: projectId,
                    value: 0
                });
                ipcSend("setSend", {
                    action: "remove",
                    id: p.id
                });
                return;
            }
            currUpdate.push(p.id);
            ipcSend("setSend", {
                action: "add",
                id: p.id
            });
            let toSend = {
                id: p.id,
                artist: p.artist,
                filename: p.filename,
                dir: p.data.dir,
                foldername: path.basename(p.data.dir),
                stream: benc_bin(fs.readFileSync(p.filepath, "binary")),
            };
            if(isEdit){
                toSend.edit_title = p.data.title
                toSend.edit_artist = p.data.artist
                toSend.edit_tempo = p.data.tempo
                toSend.edit_genre = p.data.genre
                toSend.edit_comment = p.data.comment
            }
            toSend = benc(JSON.stringify(toSend));
            fileBuffer[p.id] = [];
            let l = 0;
            for(let i=0; i<toSend.length; i+=bufferSize) {
                fileBuffer[p.id].push(JSON.stringify({
                    id: p.id,
                    part: l,
                    stream: toSend.slice(i, i+bufferSize),
                }));
                l++;
            }
            let progressing = fileBuffer[p.id].length;
            sock.emit("getFileInfo", fileBuffer[p.id][0]);
            sock.off("continue_" + p.id);
            sock.on("continue_" + p.id, (data)=>{
                try{
                    while(true){
                        if(fileBuffer[p.id].length > 1) {
                            fileBuffer[p.id].shift();
                            sock.emit("getFileInfo", fileBuffer[p.id][0]);
                        } else {
                            fileBuffer[p.id] = [];
                            console.log("upload complete");
                            sock.emit("getFileInfo", JSON.stringify({
                                id: p.id,
                                stream: "end"
                            }));
                            progressing = 0;
                            ipcSend("loading", {
                                id: p.id,
                                value: 1
                            });
                            break;
                        }
                        ipcSend("loading", {
                            value: ((progressing - fileBuffer[p.id].length)/progressing) * 100,
                            id: p.id
                        });
                    }
                } catch(e){
                    onUpdate[p.id] = false;
                    currUpdate = currUpdate.filter((e)=>e !== p.id);
                    console.log(e);
                    isEdit[p.id] = false;
                    ipcSend("alert", {
                        status: "error",
                        message: "Error while updating project. 🐞\n"+e,
                    });
                    ipcSend("loading", {
                        id: p.id,
                        value: 0
                    });
                    ipcSend("setSend", {
                        action: "remove",
                        id: p.id
                    });
                }
            });
        }catch(e){
            onUpdate[projectId] = false;
            currUpdate = currUpdate.filter((e)=>e !== projectId);
            console.log(e);
            isEdit[projectId] = false;
            ipcSend("alert", {
                status: "error",
                message: "Error while updating project. 🐞\n"+e,
            });
            ipcSend("loading", {
                id: projectId,
                value: 0
            });
            ipcSend("setSend", {
                action: "remove",
                id: projectId
            });
        }
    });

    // sock.on('upload', ()=>{
    //     try{
    //         console.log("AHHHHHHH");
    //         while(true){
    //             if(fileBuffer[eid].length > 1) {
    //                 fileBuffer[eid].shift();
    //                 sock.emit("getFileInfo", fileBuffer[eid][0]);
    //             } else {
    //                 fileBuffer[eid] = [];
    //                 console.log("upload complete");
    //                 sock.emit("getFileInfo", JSON.stringify({
    //                     id:,
    //                     stream: "end"
    //                 }));
    //                 progressing = 0;
    //                 progress_value = 0;
    //                 break;
    //             }
    //             ipcSend("loading", ((progressing - fileBuffer[eid].length)/progressing) * 100, project.id);
    //         }
    //         return;
    //     }catch(e){
    //         ipcSend("alert", {
    //             status: "error",
    //             message: "Error while uploading project. 🐞\n"+e,
    //         });
    //         isEdit[ide] = false;
    //         onUpdate[projectId] = false;
    //         currUpdate = currUpdate.filter((e)=>e !== err.id);
    //         isCreating[eid] = false;
    //         ipcSend("setSend", {
    //             status: true,
    //             id: ""
    //         });
    //     }
    // });

    sock.on("setStatus", (data)=>{
        if(data){
            data = JSON.parse(data);
            ipcSend("setStatus", data);
        }
    });

    sock.on("endProcess", (data)=>{
        data = JSON.parse(data);

        if(!endFile[data.id]){
            endFile[data.id] = [];
        }

        if(data.stream === "end"){

            ipcSend("loading", {
                id: data.id,
                value: 0
            });

            try{
                let tmp = [];

                endFile[data.id].forEach(elm => {
                    for(let i=0; i<endFile[data.id].length; i++) {
                        if(elm.part === i) {
                            tmp.push(elm.stream);
                            break;
                        }
                    }
                });
                endFile[data.id] = tmp.join("");

                endFile[data.id] = JSON.parse(bdec(endFile[data.id]));
                endFile[data.id].flp = bdec_bin(endFile[data.id].flp);
            } catch(e){
                console.log(e);
                ipcSend("alert", {
                    status: "error",
                    message: "Error while processing project. 🐞\n"+e,
                });
                isEdit[data.id] = false;
                onUpdate[data.id] = false;
                currUpdate = currUpdate.filter((e)=>e !== data.id);
                isCreating[data.id] = false;
                basedSamples[data.id] = false;
                endFile[data.id] = [];
                ipcSend("setSend", {
                    action: "remove",
                    id: data.id
                });
                return;
            }

            if(onUpdate[data.id]){
                
                try{
                    console.log("start final update");
                    let id = endFile[data.id].id;
                    let flp = endFile[data.id].flp;
                    let folderName = path.basename(endFile[data.id].dir).toLowerCase();
                    delete endFile[data.id].id;
                    delete endFile[data.id].flp;
                    userProjects[id].data = endFile[data.id];
                    endFile[data.id] = [];

                    let sampleDir = path.join(env["storage"], 'projects', folderName, "samples");
                    if(!fs.existsSync(sampleDir)){
                        fs.mkdirSync(sampleDir);
                    }

                    for(let i=0; i<userProjects[id].data.samples.length; i++){
                        let s_path = userProjects[id].data.samples[i];
                        s_path = s_path.replace("%FLStudioUserData%", env["flData"]);
                        let s_name = path.basename(userProjects[id].data.samples[i]);

                        try{
                            fs.copyFileSync(s_path, path.join(sampleDir, s_name));
                            userProjects[id].data.samples[i] = path.join(sampleDir, s_name);
                        } catch(e){
                            try{
                                s_path = path.join(path.dirname(userProjects[id].filepath), s_name)
                                fs.copyFileSync(s_path, path.join(sampleDir, s_name));
                                userProjects[id].data.samples[i] = path.join(sampleDir, s_name);
                            } catch(e){
                                userProjects[id].data.samples.splice(i, 1);
                            }
                        }
                    }

                    let listFolders = fs.readdirSync(sampleDir);
                    let sampleList = [];
                    userProjects[id].data.samples.forEach((s)=>{
                        sampleList.push(path.basename(s));
                    });

                    listFolders.forEach((f)=>{
                        f = path.basename(f);
                        if(!sampleList.includes(f)){
                            fs.unlinkSync(path.join(sampleDir, f));
                        }
                    });

                    fs.writeFileSync(userProjects[id].filepath, flp, "binary");

                    userProjects[id].last_edited = getLastModified(userProjects[id].filepath);


                    fs.writeFileSync(path.join(userProjects[id].data.dir, userProjects[id].jsonname), JSON.stringify(userProjects[id]));


                    ipcSend("setStatus", {
                        id: id,
                        status: "",
                        step: [0,0]
                    });
                    onUpdate[id] = false;
                    currUpdate = currUpdate.filter((e)=>e !== id);
                    isEdit[id] = false;
                    ipcSend("setSend", {
                        action: "remove",
                        id: id
                    });
                    ipcSend("reloadProjects");
                    ipcSend("alert", {
                        status: "ok",
                        message: userProjects[id].data.title + " updated ! 🎉",
                    });
                    return;
                }catch(e){
                    ipcSend("alert", {
                        status: "error",
                        message: "Error while updating project: " + e + " 🐞",
                    });
                    ipcSend("setStatus", {
                        id: data.id,
                        status: "",
                        step: [0,0]
                    });
                    onUpdate[data.id] = false;
                    currUpdate = currUpdate.filter((e)=>e !== data.id);
                    isEdit[data.id] = false;
                    endFile[data.id] = [];
                    ipcSend("setSend", {
                        action: "remove",
                        id: data.id
                    });
                }

            } else {
                try{
                    console.log("start final process");
                    let id = endFile[data.id].id;
                    let flp = endFile[id].flp;
                    let folderName = path.basename(endFile[id].dir).toLowerCase();
                    delete endFile[id].id;
                    delete endFile[id].flp;
                    processProject[id].data = endFile[id];
                    processProject[id].jsonname = folderName + ".json";
                    
                    endFile[id] = [];

                    processProject[id].filename = folderName + ".flp";

                    if (!fs.existsSync(path.join(env["storage"], 'projects', folderName))) {
                        fs.mkdirSync(path.join(env["storage"], 'projects', folderName));
                    }
                    fs.mkdirSync(path.join(env["storage"], 'projects', folderName, "export"));

                    // copy file to env["storage"]/projects/folderName
                    fs.writeFileSync(path.join(env["storage"], 'projects', folderName, processProject[id].filename), flp, "binary");

                    let sampleDir = path.join(env["storage"], 'projects', folderName, "samples");
                    fs.mkdirSync(sampleDir);

                    if(basedSamples[id]){
                        for(let i=0; i<processProject[id].data.samples.length; i++){
                            let s_name = path.basename(processProject[id].data.samples[i]);
                            let s_path = path.join(path.dirname(processProject[id].filepath), s_name);
    
                            try{
                                fs.copyFileSync(s_path, path.join(sampleDir, s_name));
                                processProject[id].data.samples[i] = path.join(sampleDir, s_name);
                            } catch(e){
                                console.log("sample "+ s_path + " not found")
                                processProject[id].data.samples.splice(i, 1);
                            }
                        }
                    } else {
                        for(let i=0; i<processProject[id].data.samples.length; i++){
                            let s_path = processProject[id].data.samples[i];
                            s_path = s_path.replace("%FLStudioUserData%", env["flData"]);
                            let s_name = path.basename(processProject[id].data.samples[i]);

                            try{
                                fs.copyFileSync(s_path, path.join(sampleDir, s_name));
                                processProject[id].data.samples[i] = path.join(sampleDir, s_name);
                            } catch(e){
                                // processProject[id].filepath
                                try{
                                    s_path = path.join(path.dirname(processProject[id].filepath), s_name)
                                    fs.copyFileSync(s_path, path.join(sampleDir, s_name));
                                    processProject[id].data.samples[i] = path.join(sampleDir, s_name);
                                } catch(e){
                                    console.log("sample "+ s_path + " not found")
                                    processProject[id].data.samples.splice(i, 1);
                                }
                            }
                        }
                    }

                    processProject[id].filepath = path.join(env["storage"], 'projects', folderName, processProject[id].filename);

                    processProject[id].last_edited = getLastModified(processProject[id].filepath);

                    // save data to env["storage"]/projects/folderName/foldername.json
                    fs.writeFileSync(path.join(env["storage"], 'projects', folderName, processProject[id].jsonname), JSON.stringify(processProject[id]));

                    userProjects[id] = {...processProject[id]};

                    console.log("end process");

                    if(isCreating[id]){
                        // open project
                        ipcMain.emit("openProject", null, id);
                    }

                    if(useTmp[id]){
                        fs.rmSync(path.join(env["storage"], "tmp", id), {force: true, recursive: true, maxRetries: 3, retryDelay: 100});
                    }

                    delete processProject[id];
                    ipcSend("setStatus", {
                        id: id,
                        status: "",
                        step: [0,0]
                    });
                    ipcSend("alert", {
                        status: "ok",
                        message: "Project loaded ! 🎉",
                    });
                    ipcSend("reloadProjects");
                    currUpdate = currUpdate.filter((e)=>e !== id);
                    isCreating[id] = false;
                    useTmp[id] = false;
                    basedSamples[id] = false;
                    endFile[id] = [];
                    ipcSend("setSend", {
                        action: "remove",
                        id: id
                    });
                    if(!isCreating[id]){
                        ipcSend("setSend", {
                            action: "unimport",
                            id: id,
                        });
                    }
                } catch(e){
                    ipcSend("alert", {
                        status: "error",
                        message: "Error while importing project: " + e + " 🐞",
                    });
                    ipcSend("setStatus", {
                        id: data.id,
                        status: "",
                        step: [0,0]
                    });
                    if(!isCreating[data.id]){
                        ipcSend("setSend", {
                            action: "unimport",
                            id: data.id,
                        });
                    }
                    currUpdate = currUpdate.filter((e)=>e !== data.id);
                    isCreating[data.id] = false;
                    useTmp[data.id] = false;
                    basedSamples[data.id] = false;
                    endFile[data.id] = [];
                    ipcSend("setSend", {
                        action: "remove",
                        id: data.id
                    });
                }
            }
        } else {
            endFile[data.id].push(data);
            ipcSend("loading", ({
                value: ((data.part+1) / data.size) * 100,
                id: data.id
            }));
        }
    });



    ipcMain.on("setFlStudio", ()=>{
        dialog.showOpenDialog({
            // allow select folder
            properties: ['openDirectory'],
            filters: [
                {
                    name: 'All Files', extensions: ['*'],
                }
            ]
        }).then(res => {
            if(!res.canceled && res.filePaths.length > 0){
                let flPath = res.filePaths[0];
                let fname = isValidFlStudio(flPath, false);
                if(!fname){
                    ipcSend("alert", {
                        status: "error",
                        message: "Invalid FL Studio path ! ❌",
                    });
                    return;
                }
                user.flstudio = path.join(flPath, fname);
                user.flstudio_path = flPath;
                saveUser();
                ipcSend("alert", {
                    status: "ok",
                    message: "FL Studio path updated ! 🎉",
                });
                ipcSend("FlStudioDone");
            }
        }).catch(err => {
            console.log(err);
            ipcSend("alert", {
                stauts: "error",
                message: "Error while selecting folder ! 🐞",
            });
        });
    });

    ipcMain.on("setArtist", (e, data)=>{
        try{
            user.artist = data;
            saveUser();
            ipcSend("alert", {
                status: "ok",
                message: "Artist name set to " + data + " ! 🎉",
            });
            ipcSend("dataStatus", true);
        } catch(e){
            ipcSend("alert", {
                status: "error",
                message: "Error while setting artist name ! 🐞\n" + e,
            });
        }
    });

    ipcMain.on("setUpdateSongs", (e, data)=>{
        try{
            console.log(data);
            preferences.update = data;
            savePreferences();
        } catch(e){
            ipcSend("alert", {
                status: "error",
                message: "Error while setting songs update ! 🐞\n" + e,
            });
        }
    });

    ipcMain.on("setTempo", (e, data)=>{
        try{
            let temp = parseFloat(data);
            if(!isNaN(temp)){
                preferences.default_tempo = temp;
                savePreferences();
                ipcSend("alert", {
                    status: "ok",
                    message: "Default tempo set to " + temp + " ! 🎉",
                });
                return;
            }
            ipcSend("alert", {
                status: "error",
                message: "Invalid tempo ! ❌",
            });
        } catch(e){
            ipcSend("alert", {
                status: "error",
                message: "Error while setting default tempo ! 🐞\n" + e,
            });
        }
    });

    ipcMain.on("setTemplate", (e, data)=>{
        dialog.showOpenDialog({
            // allow select folder
            properties: ['openFile'],
            filters: [
                {
                    name: 'Template', extensions: ['flp'],
                }
            ]
        }).then(res => {
            if(!res.canceled && res.filePaths.length > 0){
                try{
                    fs.copyFileSync(res.filePaths[0], path.join(env["storage"], "data", path.basename(res.filePaths[0])));
                    preferences.template = path.join(env["storage"], "data", path.basename(res.filePaths[0]));
                    savePreferences();
                    ipcSend("setPrefTemp", path.basename(res.filePaths[0]));
                    ipcSend("alert", {
                        status: "ok",
                        message: "Template updated ! 🎉",
                    });
                } catch(e){
                    ipcSend("alert", {
                        status: "error",
                        message: "Error while set template ! 🐞\n" + e,
                    });
                }
            }
        }).catch(err => {
            ipcSend("alert", {
                stauts: "error",
                message: "Error while set template ! 🐞\n" + err,
            });
        });
    });



    sock.on('connect', ()=>{
        console.log("connected");
    });

    sock.on('disconnect', ()=>{
        console.log("disconnected");
        currUpdate = [];
        // let projsLen = Object.keys(userProjects).length;
        Object.entries(userProjects).forEach(([key, value])=>{
            console.log("remove", value.id);
            ipcSend("setSend", {
                action: "remove",
                id: value.id
            });
            isEdit[value.id] = false;
            onUpdate[value.id] = false;
            currUpdate = currUpdate.filter((e)=>e !== value.id);
            isCreating[value.id] = false;
            ipcSend("loading", {
                id: value.id,
                value: 0
            });
            ipcSend("setSend", {
                action: "remove",
                id: value.id
            });
        });
        setTimeout(()=>{
            sock.connect();
        }, 1000);
    });

    sock.on('error', (err)=>{
        err = JSON.parse(err);
        ipcSend("alert", {
            status: "error",
            message: "Error from server: " + err.message + " 🐞",
        });
        isEdit[err.id] = false;
        onUpdate[err.id] = false;
        currUpdate = currUpdate.filter((e)=>e !== err.id);
        isCreating[err.id] = false;
        ipcSend("loading", {
            id: err.id,
            value: 0
        });
        ipcSend("setSend", {
            action: "remove",
            id: err.id
        });
    });





    ipcMain.handle("saveDialog", (e, filters, basename)=>{
        console.log(filters);
        return dialog.showSaveDialog({
            // allow select folder
            properties: ['openDirectory'],
            filters: filters,
            defaultPath: basename
        });
    });

    ipcMain.on('exit', () => {
        try{
            savePreferences();
            saveUser();
        } catch(e){
            console.log(e);
        }
        app.quit();
    });

    ipcMain.on('minimize', () => {
        BrowserWindow.getFocusedWindow().minimize();
    });

    ipcMain.on('maximize', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    });

    ipcMain.on('openLink', (e, arg) => {
        shell.openExternal(arg);
    });

    // catch get version invoke
    ipcMain.handle('getCfg', () => {
        return {
            version: app.getVersion(),
            path: app.getAppPath(),
            isDev: (process.env.ELECTRON_DEV)?true:false,
            dirname: __dirname,
        };
    });

    ipcMain.handle("getPreferences", ()=>{
        return preferences;
    });

    ipcMain.on("setPreferences", (e, data)=>{
        preferences = data;
        savePreferences();
    });

    ipcMain.handle("getUsers", ()=>{
        return user;
    });






    setInterval(()=>{

        /**
         * @object userProjects: contains all projects
         * @array openProjects: contains all opened projects
         * @array makeUpdate: contains all projects that need to be updated
         */



        if(makeUpdate.length > 0 && preferences.update){
            for(let i = 0; i < makeUpdate.length; i++){
                console.log("update " + makeUpdate[i]);
                ipcMain.emit("updateProjects", makeUpdate[i]);
            }
        }



        if(user.flstudio && !onOpen){
            find('name', path.basename(user.flstudio)).then(function (list) {

                if(list.length === 0 && currents_proj.length > 0){
                    currents_proj.forEach((value, index)=>{
                        if(getLastModified(userProjects[value].filepath) > userProjects[value].last_edited){
                            makeUpdate.push(value);
                        }
                    });
                    currents_proj = [];
                    ipcSend("setCurrent", currents_proj);
                }
                
                let openeds = [];
                list.forEach((item)=>{
                    item.cmd = item.cmd.replace(/"/g, "").replace(/\\/g, "/").split("/");
                    openeds.push(item.cmd[item.cmd.length-1]);
                })

                Object.entries(userProjects).forEach(([key, value]) => {
                    if(!currents_proj.includes(key) && !makeUpdate.includes(key) && openeds.includes(value.filename)){
                        currents_proj.push(key);
                        ipcSend("setCurrent", currents_proj);
                    } else if(currents_proj.includes(key) && !openeds.includes(value.filename) && getLastModified(value.filepath) > value.last_edited && !makeUpdate.includes(key)){
                        makeUpdate.push(key);
                        // delete id from currents_proj
                        currents_proj.splice(currents_proj.indexOf(key), 1);
                        ipcSend("setCurrent", currents_proj);
                    }
                });
            });
        }

    }, 2000);
});






// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});