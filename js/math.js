const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateSimpleExpression = (diff) => {
    const ops = diff === 'easy' ? ['+', '-'] : diff === 'medium' ? ['+', '-', '*'] : ['+', '-', '*', '/'];
    const operator = ops[Math.floor(Math.random() * ops.length)];
    let n1, n2, ans, symbol;

    switch (operator) {
        case '+': symbol = '+'; n1 = getRandomInt(1, diff === 'easy' ? 20 : 50); n2 = getRandomInt(1, diff === 'easy' ? 20 : 50); ans = n1 + n2; break;
        case '-': symbol = '-'; n1 = getRandomInt(5, diff === 'easy' ? 30 : 100); n2 = getRandomInt(1, n1); ans = n1 - n2; break;
        case '*': symbol = '×'; n1 = getRandomInt(2, diff === 'easy' ? 5 : 12); n2 = getRandomInt(2, diff === 'easy' ? 5 : 12); ans = n1 * n2; break;
        case '/': symbol = '÷'; ans = getRandomInt(2, 12); n2 = getRandomInt(2, 10); n1 = ans * n2; break;
    }
    return { display: `${n1} ${symbol} ${n2}`, value: ans };
};

export const generateMathProblem = (diff) => {
    const types = ['arithmetic'];
    if (diff !== 'easy') { types.push('unknown'); types.push('comparison'); }
    if (diff === 'hard') { types.push('power'); types.push('root'); }
    const type = types[Math.floor(Math.random() * types.length)];
    
    if (type === 'arithmetic') { const exp = generateSimpleExpression(diff); return { display: `${exp.display} = ?`, answer: exp.value, type: 'number' }; }
    if (type === 'unknown') { 
        const exp = generateSimpleExpression(diff); 
        const parts = exp.display.split(' '); const hideIndex = Math.random() > 0.5 ? 0 : 2; 
        const answer = parseInt(parts[hideIndex]); parts[hideIndex] = '?';
        return { display: `${parts.join(' ')} = ${exp.value}`, answer: answer, type: 'number' }; 
    }
    if (type === 'comparison') {
        const exp1 = generateSimpleExpression(diff); const exp2 = generateSimpleExpression(diff);
        let symbol = '='; if (exp1.value > exp2.value) symbol = '>'; if (exp1.value < exp2.value) symbol = '<';
        return { display: `${exp1.display}  ?  ${exp2.display}`, answer: symbol, type: 'symbol' };
    }
    if (type === 'power') { const base = getRandomInt(2, 15); return { display: `${base}²`, answer: base * base, type: 'number' }; }
    if (type === 'root') { const root = getRandomInt(2, 15); const val = root * root; return { display: `√${val}`, answer: root, type: 'number' }; }
};

export const generateMathOptions = (correctAnswer, type) => {
    if (type === 'symbol') return ['>', '<', '=', '≠'].sort(() => Math.random() - 0.5);
    const opts = new Set([correctAnswer]);
    while (opts.size < 4) {
        const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
        let val = correctAnswer + offset;
        if (correctAnswer >= 0 && val < 0) val = Math.abs(val);
        if (val !== correctAnswer) opts.add(val);
    }
    return Array.from(opts).sort(() => Math.random() - 0.5);
};