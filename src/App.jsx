import './App.css';
import { HashRouter as Router, Routes, Route  } from 'react-router-dom';
import Home from './page/Home';
import Settings from './page/Settings';
import Bar from './components/Bar';
import Menu from './components/Menu';
import { useContext } from 'react';
import AppContext from './inc/AppContext';
import { EnvPopup } from './components/Popup';
import { AlertPopup } from './components/Alerts';

function App() {

    const app = useContext(AppContext);

    return (
        <Router>
            <Bar />
            <div className="nk-container">
                <AlertPopup />
                {app.confPopup}
                {app.projectPopup}
                {(!app.haveData)? <EnvPopup /> : null}
                <Menu />
                <div className={"nk-window-container " + ((app.menuOpen)? "open" : "")}>
                    <Routes>
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Home />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
