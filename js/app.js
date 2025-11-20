import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import { Clock, Trophy, Play, RotateCcw, Calculator, Brain, X, Award, Volume2, VolumeX, PartyPopper, Users, Zap, Infinity, Download, Globe } from 'https://esm.sh/lucide-react@0.263.1';

// Importaciones Modulares
import { translations } from './translations.js';
import { generateMathProblem, generateMathOptions } from './math.js';
import { soundSystem } from './sound.js';
import { Confetti, PlayerBoard } from './components.js';

const MathTriviaGame = () => {
    const [gameState, setGameState] = useState('menu');
    const [gameMode, setGameMode] = useState('classic');
    const [difficulty, setDifficulty] = useState('easy');
    const [timeLeft, setTimeLeft] = useState(60);
    const [highScores, setHighScores] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [lang, setLang] = useState('es');
    
    const [p1State, setP1State] = useState({ score: 0, problem: null, options: [], lastResult: null });
    const [p2State, setP2State] = useState({ score: 0, problem: null, options: [], lastResult: null });

    const timerRef = useRef(null);
    const t = translations[lang];

    const modesConfig = {
        classic: { label: t.modes.classic.label, icon: Clock, desc: t.modes.classic.desc },
        survival: { label: t.modes.survival.label, icon: Zap, desc: t.modes.survival.desc },
        zen: { label: t.modes.zen.label, icon: Infinity, desc: t.modes.zen.desc },
        multi: { label: t.modes.multi.label, icon: Users, desc: t.modes.multi.desc }
    };

    const difficultyConfig = {
        easy: { label: t.difficulties.easy, color: 'bg-green-500', bonus: 1 },
        medium: { label: t.difficulties.medium, color: 'bg-yellow-500', bonus: 2 },
        hard: { label: t.difficulties.hard, color: 'bg-red-500', bonus: 3 }
    };

    useEffect(() => {
        const savedScores = localStorage.getItem('mathTriviaHighScores');
        const savedLang = localStorage.getItem('mathTriviaLang');
        if (savedScores) setHighScores(JSON.parse(savedScores));
        if (savedLang) setLang(savedLang);
        document.body.style.visibility = 'visible';
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });
    }, []);

    const changeLanguage = (newLang) => {
        setLang(newLang);
        localStorage.setItem('mathTriviaLang', newLang);
    }

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        }
    };

    useEffect(() => {
        if (gameState !== 'playing') return;
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (key === 'escape') { endGameCheck(); return; }
            
            const p1Keys = ['a', 's', 'd', 'f'];
            const p1Idx = p1Keys.indexOf(key);
            if (p1Idx !== -1 && p1State.options[p1Idx] !== undefined) {
                handleAnswer(1, p1State.options[p1Idx]);
            }
            if (gameMode === 'multi') {
                const p2Keys = ['h', 'j', 'k', 'l'];
                const p2Idx = p2Keys.indexOf(key);
                if (p2Idx !== -1 && p2State.options[p2Idx] !== undefined) {
                    handleAnswer(2, p2State.options[p2Idx]);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, gameMode, p1State, p2State]);

    const getNewProblem = () => {
        const p = generateMathProblem(difficulty);
        const o = generateMathOptions(p.answer, p.type);
        return { problem: p, options: o };
    };

    const startGame = () => {
        if(soundEnabled) soundSystem.init();
        
        let initialTime = 60;
        if (gameMode === 'survival') initialTime = 10;
        if (gameMode === 'zen') initialTime = null; 
        
        setTimeLeft(initialTime);
        setGameState('playing');
        setIsNewRecord(false);
        
        const initProblem = getNewProblem();
        setP1State({ score: 0, problem: initProblem.problem, options: initProblem.options, lastResult: null });
        
        if (gameMode === 'multi') {
            const p2Init = getNewProblem();
            setP2State({ score: 0, problem: p2Init.problem, options: p2Init.options, lastResult: null });
        }
        
        if (timerRef.current) clearInterval(timerRef.current);
        
        if (gameMode !== 'zen') {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) { endGameCheck(); return 0; }
                    if (soundEnabled) { prev <= 6 ? soundSystem.playTick(true) : soundSystem.playTick(false); }
                    return prev - 1;
                });
            }, 1000);
        }
    };

    const p1Ref = useRef(p1State);
    const p2Ref = useRef(p2State);
    useEffect(() => { p1Ref.current = p1State; p2Ref.current = p2State; }, [p1State, p2State]);

    const endGameCheck = () => {
        clearInterval(timerRef.current);
        setGameState('gameover');
        
        let finalScore = gameMode === 'multi' ? Math.max(p1Ref.current.score, p2Ref.current.score) : p1Ref.current.score;
        const topScore = highScores.length > 0 ? highScores[0].score : 0;
        
        // Lógica de récord: Si no es Zen, ni Multi, y superamos el top score
        if (gameMode !== 'zen' && gameMode !== 'multi' && finalScore > topScore) {
            setIsNewRecord(true);
            if (soundEnabled) soundSystem.playWin();
        } else {
            if (soundEnabled && gameMode !== 'zen') soundSystem.playGameOver();
        }
    };

    const handleAnswer = (playerNum, selectedOption) => {
        const currentState = playerNum === 1 ? p1State : p2State;
        const setState = playerNum === 1 ? setP1State : setP2State;
        if (currentState.lastResult) return; 

        const isCorrect = selectedOption === currentState.problem.answer;
        
        if (isCorrect) {
            const points = difficultyConfig[difficulty].bonus * 10;
            const next = getNewProblem();
            
            setState(prev => ({
                ...prev,
                score: prev.score + points,
                lastResult: 'correct',
                problem: next.problem,
                options: next.options
            }));

            if (gameMode === 'survival') setTimeLeft(prev => Math.min(prev + 3, 60)); 
            if (soundEnabled) soundSystem.playCorrect();
        } else {
            setState(prev => ({
                ...prev,
                score: (gameMode === 'classic' || gameMode === 'zen') ? prev.score : Math.max(0, prev.score - 5),
                lastResult: 'wrong'
            }));
            if (gameMode === 'classic' || gameMode === 'survival') setTimeLeft(prev => Math.max(0, prev - 5));
            if (soundEnabled) soundSystem.playWrong();
        }
        setTimeout(() => { setState(prev => ({ ...prev, lastResult: null })); }, 300);
    };
    
    const handleMouseAnswer = (playerNum, opt) => handleAnswer(playerNum, opt);

    const saveHighScore = (e) => {
        e.preventDefault();
        if (!playerName.trim()) return;
        if (gameMode === 'zen') return; 

        const scoreToSave = gameMode === 'multi' ? Math.max(p1State.score, p2State.score) : p1State.score;
        const modeLabel = modesConfig[gameMode].label;
        
        const newScore = {
            id: Date.now(),
            name: playerName,
            score: scoreToSave,
            difficulty: `${difficultyConfig[difficulty].label} (${modeLabel})`,
            date: new Date().toLocaleDateString()
        };
        const newHighScores = [...highScores, newScore].sort((a, b) => b.score - a.score).slice(0, 10);
        setHighScores(newHighScores);
        localStorage.setItem('mathTriviaHighScores', JSON.stringify(newHighScores));
        setGameState('menu');
        setPlayerName('');
    };

    // Renders
    const renderMenu = () => (
        React.createElement("div", { className: "flex flex-col items-center w-full max-w-md animate-fade-in space-y-6 relative z-10 m-4" },
            
            // CONTENEDOR 1: Menú de Configuración
            React.createElement("div", { className: "w-full bg-white/90 p-6 rounded-3xl backdrop-blur-sm shadow-2xl relative space-y-4" },
                
                // Selector de Idioma
                 React.createElement("div", { className: "absolute top-4 left-4 z-50" },
                    React.createElement("div", { className: "relative" },
                        React.createElement(Globe, { className: "absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" }),
                        React.createElement("select", {
                            value: lang,
                            onChange: (e) => changeLanguage(e.target.value),
                            className: "pl-8 pr-3 py-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer hover:bg-white transition-colors"
                        },
                            React.createElement("option", { value: "es" }, "Español"),
                            React.createElement("option", { value: "en" }, "English"),
                            React.createElement("option", { value: "pt" }, "Português"),
                            React.createElement("option", { value: "fr" }, "Français"),
                            React.createElement("option", { value: "it" }, "Italiano")
                        )
                    )
                ),

                React.createElement("button", { 
                    onClick: () => setSoundEnabled(!soundEnabled),
                    className: "absolute top-4 right-4 text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-indigo-50",
                    title: soundEnabled ? "Silenciar" : "Activar sonido"
                }, soundEnabled ? React.createElement(Volume2, { className: "w-6 h-6" }) : React.createElement(VolumeX, { className: "w-6 h-6" })),

                React.createElement("div", { className: "text-center mt-8" },
                    React.createElement(Brain, { className: "w-12 h-12 text-indigo-600 mx-auto mb-1" }),
                    React.createElement("h1", { className: "text-3xl font-extrabold text-gray-800" }, t.title),
                    React.createElement("p", { className: "text-indigo-600 font-bold" }, t.subtitle),
                    React.createElement("p", { className: "text-gray-500 text-xs mt-1" }, t.chooseMode)
                ),

                React.createElement("div", { className: "w-full space-y-3" },
                    React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                        Object.entries(modesConfig).map(([key, config]) => 
                            React.createElement("button", {
                                key: key,
                                onClick: () => setGameMode(key),
                                className: `flex flex-col items-center p-3 rounded-xl border-2 transition-all ${gameMode === key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`
                            },
                                React.createElement(config.icon, { className: "w-6 h-6 mb-1" }),
                                React.createElement("span", { className: "font-bold text-sm" }, config.label)
                            )
                        )
                    ),
                    React.createElement("div", { className: "bg-blue-50 p-3 rounded-lg text-xs text-blue-800 text-center border border-blue-100" },
                        modesConfig[gameMode].desc
                    ),
                    React.createElement("div", { className: "grid grid-cols-3 gap-2" },
                        Object.entries(difficultyConfig).map(([key, config]) => 
                            React.createElement("button", {
                                key: key,
                                onClick: () => setDifficulty(key),
                                className: `p-2 rounded-lg border-2 text-xs font-bold transition-all ${difficulty === key ? `border-${config.color.split('-')[1]}-500 bg-${config.color.split('-')[1]}-50` : 'border-gray-200'}`
                            }, config.label)
                        )
                    ),
                    React.createElement("div", { className: "flex gap-2" },
                        React.createElement("button", {
                            onClick: startGame,
                            className: "flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transform hover:scale-105 transition flex justify-center gap-2"
                        }, React.createElement(Play, { className: "w-5 h-5" }), t.buttons.play),
                        
                        deferredPrompt && React.createElement("button", {
                            onClick: handleInstall,
                            className: "bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 rounded-xl shadow-lg flex flex-col items-center justify-center text-xs"
                        }, React.createElement(Download, { className: "w-5 h-5 mb-1" }), t.buttons.install)
                    )
                )
            ),
            
            // CONTENEDOR 2: Ranking
            highScores.length > 0 && React.createElement("div", { className: "w-full bg-white/90 p-6 rounded-3xl backdrop-blur-sm shadow-2xl relative" },
                React.createElement("h3", { className: "text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2" },
                    React.createElement(Trophy, { className: "w-5 h-5 text-yellow-500" }), t.gameOver.ranking
                ),
                React.createElement("div", { className: "space-y-2" }, 
                    highScores.slice(0, 5).map((s, idx) => 
                        React.createElement("div", { key: s.id || idx, className: "flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm hover:bg-gray-50 transition-colors" },
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement("span", { className: `font-bold w-6 text-center ${idx < 3 ? 'text-yellow-600 bg-yellow-100 rounded-full' : 'text-gray-400'}` }, `#${idx + 1}`),
                                React.createElement("div", { className: "flex flex-col" },
                                    React.createElement("span", { className: "font-medium text-gray-700 truncate max-w-[120px]" }, s.name),
                                    React.createElement("span", { className: "text-[10px] text-gray-400" }, s.difficulty)
                                )
                            ),
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement("span", { className: "font-bold text-indigo-600" }, `${s.score} pts`)
                            )
                        )
                    )
                )
            )
        )
    );

    const renderGameLayout = () => {
        const exitButtonClass = gameMode === 'multi' 
            ? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white text-gray-500 hover:text-red-500 p-3 rounded-full shadow-2xl border-4 border-gray-100 transition-all transform hover:scale-110" 
            : "absolute top-4 right-4 z-50 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-500 p-2 rounded-full shadow-md transition-all";

        return React.createElement("div", { className: "w-full max-w-4xl h-[100dvh] md:h-[80vh] bg-gray-200 md:bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 relative z-20" },
            
            React.createElement("button", {
                onClick: () => endGameCheck(),
                className: exitButtonClass,
                title: t.game.exitTitle
            }, React.createElement(X, { className: "w-6 h-6" })),

            gameMode !== 'multi' && React.createElement("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none" },
                gameMode === 'zen' ? (
                    React.createElement("div", { className: "bg-teal-600 text-white px-4 py-2 rounded-full shadow-xl border-4 border-white/20 backdrop-blur flex items-center gap-2" },
                        React.createElement(Infinity, { className: "w-6 h-6" })
                    )
                ) : ( 
                    React.createElement("div", { className: `bg-gray-800 text-white px-4 py-2 rounded-full shadow-xl border-4 border-white/20 backdrop-blur flex items-center gap-2 transform scale-125 ${timeLeft <= 5 ? 'animate-bounce bg-red-600' : ''}` },
                        React.createElement("span", { className: "font-mono font-black text-xl" }, timeLeft)
                    )
                )
            ),

            gameMode === 'multi' && React.createElement("div", { className: "flex-1 flex w-full md:w-1/2 h-1/2 md:h-full bg-gray-50" },
                 React.createElement("div", { className: "w-full h-full flex md:hidden transform rotate-180" },
                    React.createElement(PlayerBoard, { playerNum: 2, state: p2State, keysHint: [], isRotated: false, time: timeLeft, showTime: true, onAnswer: handleAnswer, labelPlayer: t.game.player }) 
                 ),
                 React.createElement("div", { className: "w-full h-full hidden md:flex" },
                    React.createElement(PlayerBoard, { playerNum: 2, state: p2State, keysHint: ['H', 'J', 'K', 'L'], isRotated: false, time: timeLeft, showTime: true, onAnswer: handleAnswer, labelPlayer: t.game.player })
                 )
            ),
            React.createElement("div", { className: `flex-1 flex w-full ${gameMode === 'multi' ? 'md:w-1/2 h-1/2 md:h-full' : 'h-full'} bg-white` },
                React.createElement(PlayerBoard, { playerNum: 1, state: p1State, keysHint: ['A', 'S', 'D', 'F'], isRotated: false, time: timeLeft, showTime: gameMode === 'multi', onAnswer: handleAnswer, labelPlayer: t.game.player })
            )
        );
    };

    const renderGameOver = () => {
        let title = t.gameOver.gameOver;
        let subtitle = t.gameOver.quickMind;
        let MainIcon = Award;
        let iconClass = "w-20 h-20 text-gray-400";

        if (gameMode === 'multi') {
            if (p1State.score === p2State.score) {
                 title = t.gameOver.draw;
                 subtitle = t.gameOver.drawDesc;
            } else {
                const winner = p1State.score > p2State.score ? 1 : 2;
                title = t.gameOver.playerWins.replace('{0}', winner);
                subtitle = t.gameOver.masterfulVictory;
                MainIcon = Trophy;
                iconClass = "w-24 h-24 text-yellow-500 animate-bounce";
            }
        } else if (isNewRecord) {
            title = t.gameOver.newRecord;
            subtitle = t.gameOver.beatScore;
            MainIcon = PartyPopper;
            iconClass = "w-24 h-24 text-yellow-500 animate-bounce";
        } else if (gameMode === 'zen') {
            title = t.gameOver.sessionEnded;
            subtitle = t.gameOver.goodTraining;
        }

        return React.createElement("div", { className: "w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl text-center animate-in zoom-in duration-300 relative z-10 m-4" },
            isNewRecord && React.createElement("div", { className: "absolute -top-4 left-0 right-0 text-center" },
                React.createElement("span", { className: "bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg" }, t.gameOver.newRecord)
            ),
            React.createElement("div", { className: "flex justify-center mb-4" },
                React.createElement(MainIcon, { className: iconClass })
            ),
            React.createElement("h2", { className: "text-3xl font-bold text-gray-800 mb-2" }, title),
            React.createElement("p", { className: "text-gray-500 mb-6" }, subtitle),
            
            gameMode === 'multi' ? React.createElement("div", { className: "mb-6 p-4 bg-indigo-50 rounded-xl" },
                React.createElement("div", { className: "flex justify-center gap-8 mt-2" },
                    React.createElement("div", { className: "text-center" }, 
                        React.createElement("div", { className: "text-xs text-gray-500" }, `${t.game.player} 1`), 
                        React.createElement("div", { className: "font-black text-xl" }, p1State.score)
                    ),
                    React.createElement("div", { className: "text-center" }, 
                        React.createElement("div", { className: "text-xs text-gray-500" }, `${t.game.player} 2`), 
                        React.createElement("div", { className: "font-black text-xl" }, p2State.score)
                    )
                )
            ) : React.createElement("div", { className: "mb-6" },
                React.createElement("div", { className: "text-6xl font-black text-indigo-600" }, p1State.score),
                React.createElement("div", { className: "text-gray-400 text-sm uppercase font-bold" }, t.gameOver.totalPoints)
            ),

            gameMode !== 'zen' && gameMode !== 'multi' && React.createElement("form", { onSubmit: saveHighScore, className: "mb-6" },
                React.createElement("input", {
                    type: "text",
                    maxLength: "12",
                    placeholder: t.gameOver.namePlaceholder,
                    value: playerName,
                    onChange: (e) => setPlayerName(e.target.value),
                    className: "w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none text-lg font-bold text-center mb-4",
                    autoFocus: true
                }),
                React.createElement("button", {
                    type: "submit",
                    disabled: !playerName.trim(),
                    className: "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl"
                }, t.buttons.save)
            ),
            React.createElement("button", {
                onClick: () => setGameState('menu'),
                className: "flex items-center justify-center gap-2 w-full text-gray-500 hover:text-gray-800 font-bold py-2"
            }, React.createElement(RotateCcw, { className: "w-4 h-4" }), t.buttons.menu)
        );
    };

    // --- AQUÍ ESTABA EL PROBLEMA: Se añade la variable isUrgent ---
    const isUrgent = gameMode !== 'zen' && timeLeft !== null && timeLeft <= 10;

    return React.createElement("div", { className: `min-h-screen font-sans selection:bg-indigo-200 selection:text-indigo-900 flex items-center justify-center md:p-4 transition-colors duration-500 ${isUrgent && gameState === 'playing' ? 'urgent-pulse-bg' : 'bg-gray-100 text-gray-900'}` },
        isNewRecord && gameState === 'gameover' && React.createElement(Confetti),
        React.createElement("div", { className: "fixed inset-0 pointer-events-none opacity-5 overflow-hidden" },
            React.createElement(Calculator, { className: "absolute top-10 left-10 w-32 h-32 rotate-12" }),
            React.createElement(Brain, { className: "absolute bottom-20 right-10 w-40 h-40 -rotate-12" }),
        ),
        gameState === 'menu' && renderMenu(),
        gameState === 'playing' && renderGameLayout(),
        gameState === 'gameover' && renderGameOver()
    );
};

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(MathTriviaGame));