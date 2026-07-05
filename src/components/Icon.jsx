import React, { useEffect, useRef } from 'react';

export const Icon = ({ name, size = 24, className = "" }) => {
    const ref = useRef(null);
    useEffect(() => { 
        if (window.lucide && ref.current) { 
            const i = document.createElement('i'); 
            i.setAttribute('data-lucide', name); 
            ref.current.innerHTML = ''; 
            ref.current.appendChild(i); 
            window.lucide.createIcons({ root: ref.current, attrs: { width: String(size), height: String(size), class: className } }); 
        } 
    }, [name, size, className]);
    return <span ref={ref} style={{ display: 'inline-flex', verticalAlign: 'middle' }}></span>;
};