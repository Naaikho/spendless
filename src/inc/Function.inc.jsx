import React from 'react';
import $ from 'jquery';
import { AlertLabel } from '../components/Alerts';

const animateOn = function(animeType="", animatedProps=[$], timeBetween=[0], after=function(){}){

    let tmp_time=0;
    timeBetween.forEach(function(time, i){
        timeBetween[i] += tmp_time;
        tmp_time = timeBetween[i];
    });

    if(timeBetween.length < animatedProps.length){
        throw new Error("timeBetween must be an array of length equal to animatedProps");
    }
    if(animeType === ""){
        throw new Error("animeType must be a string");
    }
    if(animatedProps.length <= 0 || timeBetween.length <= 0){
        throw new Error("animatedProps must be an array of length greater than 0");
    }

    let duration = 500;

    function eachAnimate(cssObj, animateObj, hided=false, delay=0){
        animatedProps.forEach(function(elem, index){
            let setF = index === animatedProps.length - 1 ? after : function(){};
            elem.removeAttr("style");
            elem.css(cssObj);
            if(!hided){
                elem.removeClass("hided")
            }
            setTimeout(function(){
                elem.animate(animateObj, ((delay)? delay : duration), function(){
                    if(hided){
                        elem.addClass("hided")
                    }
                    elem.removeAttr("style");
                    setF();
                });
            }, timeBetween[index]);
        });
    }

    switch(animeType){
        case "fadeIn":
            eachAnimate({
                "opacity": "0"
            },{
                "opacity": "1"
            }, false);
            break;
        case "fadeOut":
            eachAnimate({
                "opacity": "1"
            },{
                "opacity": "0"
            }, true);
            break;
        
        case "slideIn":
            eachAnimate({
                "position": "relative",
                "bottom": "-50px",
                "opacity": "0"
            },{
                "bottom": "0px",
                "opacity": "1"
            }, false);
            break;
        case "slideOut":
            eachAnimate({
                "position": "relative",
                "bottom": "0px",
                "opacity": "1",
                "pointer-events": "none",
            },{
                "bottom": "50px",
                "opacity": "0",
            }, true);
            break;

        case "slideInR":
            eachAnimate({
                "position": "relative",
                "right": "-50px",
                "opacity": "0",
            },{
                "right": "0px",
                "opacity": "1",
            }, false);
            break;
        case "slideInL":
            eachAnimate({
                "position": "relative",
                "left": "-50px",
                "opacity": "0",
            },{
                "left": "0px",
                "opacity": "1",
            }, false);
            break;

        case "slideOutR":
            eachAnimate({
                "position": "relative",
                "right": "0px",
                "opacity": "1",
                "pointer-events": "none",
            },{
                "right": "-50px",
                "opacity": "0",
                "position": "absolute",
            }, true);
            break;
        case "slideOutL":
            eachAnimate({
                "transition": "0",
                "position": "relative",
                "left": "0px",
                "opacity": "1",
                "pointer-events": "none",
            },{
                "left": "-50px",
                "opacity": "0",
                "position": "absolute",
            }, true);
            break;
        
        default:
            throw new Error("animeType not found");
    }
};

const createPopup = (app, popupStatus, popupMessage)=>{
    if(app.popup === undefined)
        throw new Error("'app' is invalid");
    let uniqId = Math.random().toString(36).substring(2, 9);
    app.setPopup(
        {
            id: uniqId,
            element: <AlertLabel 
                id={uniqId}
                status={popupStatus}
                message={popupMessage}
            />
        }
    );
}

const makeId = (length=16)=>{
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export {
    animateOn,
    createPopup,
    makeId
};