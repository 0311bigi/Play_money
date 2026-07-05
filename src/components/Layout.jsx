import React from 'react';
import { Icon } from './Icon';

export const NavBtn = ({icon, label, active, onClick}) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full gap-1 ${active?'text-rose-600 scale-105':'text-stone-400 hover:text-stone-600'}`}>
        {icon}<span className="text-xs font-bold">{label}</span>
    </button>
);

export const Header = ({ currentBook, setIsBookSelectOpen, user, handleGoogleLogin, title }) => (
    <header className="sticky top-0 z-20 bg-white border-b border-stone-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer p-2 hover:bg-stone-50 rounded-xl" onClick={() => !title && setIsBookSelectOpen(true)}>
            <div className="bg-rose-500 p-2.5 rounded-xl text-white shadow-md shadow-rose-200">
                <Icon name={title ? 'landmark' : (currentBook.id==='main'?'book':'plane')} size={24}/>
            </div>
            <div>
                <h1 className="font-bold text-lg text-stone-700 tracking-wide flex items-center gap-1.5">
                    {title || currentBook.name} {!title && <Icon name="chevron-down" size={18} className="text-stone-400"/>}
                </h1>
            </div>
        </div>
        {user?.isAnonymous ? (
            <button onClick={handleGoogleLogin} className="text-sm font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">登入</button>
        ) : (
            <div className="h-9 w-9 rounded-full overflow-hidden border border-stone-200">
                <img src={user?.photoURL||'https://via.placeholder.com/32'} alt="User"/>
            </div>
        )}
    </header>
);