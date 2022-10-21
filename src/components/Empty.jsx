import React from 'react';
import logo from '../assets/img/spendless-logo-light.png';

const EmptyFill = () => {

    return (
        <div className="nk-empty-fill">
            <img src={logo} alt="" />
        </div>
    );
};

export {
    EmptyFill,
};