import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
import { Clock, CheckCircle2, X } from 'https://esm.sh/lucide-react@0.263.1';

// --- Componente Confetti ---
export const Confetti = () => {
    const [particles, setParticles] = useState([]);
    useEffect(() => {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffae00'];
        setParticles(Array.from({ length: 100 }).map((_, i) => ({ id: i, left: Math.random() * 100 + 'vw', bg: colors[Math.floor(Math.random() * colors.length)], delay: Math.random() * 1 + 's', duration: Math.random() * 3 + 2 + 's', size: Math.random() * 8 + 8 + 'px' })));
    }, []);
    return React.createElement(React.Fragment, null, particles.map(p => React.createElement("div", { key: p.id, className: "confetti", style: { left: p.left, backgroundColor: p.bg, width: p.size, height: p.size, animation: `fall ${p.duration} linear ${p.delay} infinite` } })));
};

// --- Componente Tablero de Jugador ---
export const PlayerBoard = ({ playerNum, state, keysHint, isRotated, time, showTime, onAnswer, labelPlayer }) => {
    const displayText = state.problem?.display || '';
    const fontSizeClass = displayText.length > 10 ? 'text-3xl' : 'text-5xl';

    return React.createElement("div", {
        className: `flex-1 flex flex-col p-4 transition-all duration-200 relative
            ${isRotated ? 'rotate-180 border-b-4 border-gray-200' : ''}
            ${playerNum === 2 && !isRotated ? 'border-l-4 border-gray-200' : ''} 
            ${state.lastResult === 'correct' ? 'bg-green-50' : ''} 
            ${state.lastResult === 'wrong' ? 'bg-red-50 shake' : ''}
            ${isRotated ? 'shadow-inner' : ''}` 
    },
        React.createElement("div", { className: "flex justify-between items-start mb-2 bg-white p-2 rounded-xl shadow-sm" },
            React.createElement("div", { className: "flex flex-col" },
                React.createElement("span", { className: "text-xs font-bold text-gray-400 uppercase" }, `${labelPlayer} ${playerNum}`),
                React.createElement("span", { className: "text-3xl font-black text-indigo-600" }, state.score)
            ),
            showTime && React.createElement("div", { className: `flex flex-col items-end ${time <= 10 ? 'text-red-500 animate-pulse' : 'text-gray-500'}` },
                    React.createElement(Clock, { className: "w-4 h-4 mb-1" }),
                    React.createElement("span", { className: "font-mono font-bold text-xl" }, time)
            )
        ),
        React.createElement("div", { className: "flex-grow flex flex-col justify-center items-center mb-2" },
            React.createElement("h2", { className: `${fontSizeClass} font-black text-gray-800 tracking-tight text-center mb-2 transition-all` }, displayText),
            state.lastResult && React.createElement("div", { className: "mt-1" },
                state.lastResult === 'correct' ? React.createElement(CheckCircle2, { className: "text-green-500 w-8 h-8 animate-bounce" }) : React.createElement(X, { className: "text-red-500 w-8 h-8 animate-bounce" })
            )
        ),
        React.createElement("div", { className: "grid grid-cols-2 gap-3 h-1/2" }, 
            state.options.map((opt, idx) => 
                React.createElement("button", {
                    key: idx,
                    onClick: (e) => { e.preventDefault(); onAnswer(playerNum, opt); },
                    className: "relative bg-white hover:bg-indigo-50 active:bg-indigo-200 text-gray-800 font-bold text-2xl rounded-xl shadow-md border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all touch-manipulation"
                },
                    opt,
                    !isRotated && React.createElement("div", { className: "key-hint" }, keysHint[idx])
                )
            )
        )
    );
};