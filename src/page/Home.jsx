import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext } from 'react';
import { EmptyFill } from '../components/Empty';
import AppContext from '../inc/AppContext';
import Project from './home/Project';

const Home = () => {

    const app = useContext(AppContext);

    if(app.projects.length <= 0){
        return(
            <EmptyFill />
        );
    } else {
        return (
            <>
                <div
                    className="nk-section-title-box"
                    onClick={() => {
                        app.setPreferences({
                            ...app.preferences,
                            noname_menu: !app.preferences.noname_menu
                        });
                    }}
                >
                    <button className={"nk-section-toogle noselect mr-s " + ((app.preferences.noname_menu)? "open" : "")}>
                        <FontAwesomeIcon icon={solid('chevron-down')} />
                    </button>
                    <h3 className="nk-section-project noselect mr">
                        Not named
                    </h3>
                    <hr className="noselect" />
                </div>
                <div className={"nk-overview-box " + ((!app.preferences.noname_menu)? "hide" : "")}>
                    {
                        app.projects.map((project, index) => {
                            if(!project.renamed){
                                return (
                                    <Project
                                        key={index}
                                        id={project.id}
                                        name={project.data.title}
                                        description={project.data.description}
                                        // second to time
                                        date={new Date(project.data.createdAt * 1000).toLocaleDateString()}
                                        version={project.data.version}
                                        icon={project.icon}
                                        color={project.color}
                                        workTime={
                                            String(Math.round(project.data.workTime / 60 / 60)) + "h"
                                        }
                                        tempo={project.data.tempo}
                                        artist={project.data.artist}
                                        genre={project.data.genre}
                                        vst={project.data.plugins}
                                        samples={project.data.samples}
                                        dirpath={project.data.dir}
                                        filepath={project.filepath}
                                        preview={project.preview}
                                    />
                                );
                            } else {
                                return null;
                            }
                        })
                    }
                </div>
                <div
                    className="nk-section-title-box mt"
                    onClick={() => {
                        app.setPreferences({
                            ...app.preferences,
                            projects_menu: !app.preferences.projects_menu
                        });
                    }}
                >
                    <button className={"nk-section-toogle noselect mr-s " + ((app.preferences.projects_menu)? "open" : "")}>
                        <FontAwesomeIcon icon={solid('chevron-down')} />
                    </button>
                    <h3 className="nk-section-project noselect mr">
                        Projects
                    </h3>
                    <hr className="noselect" />
                </div>
                <div className={"nk-overview-box " + ((!app.preferences.projects_menu)? "hide" : "")}>
                    {
                        app.projects.map((project, index) => {
                            if(project.renamed){
                                return (
                                    <Project
                                        key={index}
                                        id={project.id}
                                        name={project.data.title}
                                        description={project.data.description}
                                        // second to time
                                        date={new Date(project.data.createdAt * 1000).toLocaleDateString()}
                                        version={project.data.version}
                                        icon={project.icon}
                                        color={project.color}
                                        workTime={
                                            String(Math.round(project.data.workTime / 60 / 60)) + "h"
                                        }
                                        tempo={project.data.tempo}
                                        artist={project.data.artist}
                                        genre={project.data.genre}
                                        vst={project.data.plugins}
                                        samples={project.data.samples}
                                        dirpath={project.data.dir}
                                        filepath={project.filepath}
                                        preview={project.preview}
                                    />
                                );
                            } else {
                                return null;
                            }
                        })
                    }
                </div>
            </>
        );
    }
};

export default Home;