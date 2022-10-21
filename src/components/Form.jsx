import React from 'react';

const NkSelect = (props) => {

    const [select, setSelect] = React.useState(0);
    const [open, setOpen] = React.useState(false);

    return (
        <div
            className={"nk-select " + props.className + ((open)? " open" : "")}
            onClick={()=>{
                setOpen(!open);
            }}
        >
            <span className='noselect'>{props.list[select].name}</span>
            <div
                className="nk-select-list bs"
                onClick={()=>{
                    setOpen(!open);
                }}
            >
                {
                    props.list.map((item, ind)=>{
                        return (
                            <div
                                key={ind}
                                className={"nk-select-item " + ((ind === select)? "active" : "")}
                                onClick={()=>{
                                    setSelect(ind);
                                    if(props.onChange)
                                        props.onChange(ind);
                                }}
                            >
                                <span className='noselect'>{item.name}</span>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
};

export {
    NkSelect
};