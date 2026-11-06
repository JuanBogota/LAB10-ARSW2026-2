var bigInt = require("big-integer");

// Cache en memoria del proceso (modulo). Vive mientras la instancia de la Function siga encendida.
const memo = new Map();
memo.set(0, bigInt.zero);
memo.set(1, bigInt.one);

// Marca de cuando arranco esta instancia: sirve para detectar reinicios / instancias nuevas.
const instanceStart = Date.now();

// Fibonacci recursivo con memoization.
function fib(n) {
    if (memo.has(n)) return memo.get(n);
    const value = fib(n - 1).add(fib(n - 2));
    memo.set(n, value);
    return value;
}

module.exports = async function (context, req) {
    context.log('FibonacciMemo: request received');

    const raw = (req.body && req.body.nth !== undefined) ? req.body.nth : req.query.nth;
    const nth = Number(raw);

    if (!Number.isInteger(nth) || nth < 0) {
        context.res = { status: 400, body: { error: 'nth must be an integer >= 0' } };
        return;
    }

    const cacheHit = memo.has(nth);
    const sizeBefore = memo.size;
    const t0 = Date.now();

    let answer;
    try {
        answer = fib(nth);
    } catch (e) {
        // Con n grande (p. ej. 1.000.000) la recursion supera el limite de la pila de Node.
        context.res = {
            status: 500,
            body: {
                error: e instanceof RangeError ? 'Stack overflow: recursion demasiado profunda para este nth' : String(e),
                nth,
                cacheSize: memo.size,
                instanceId: process.env.WEBSITE_INSTANCE_ID || 'local',
                instanceUptimeSeconds: Math.round((Date.now() - instanceStart) / 1000)
            }
        };
        return;
    }

    const text = answer.toString();
    context.res = {
        headers: { 'Content-Type': 'application/json' },
        body: {
            nth,
            digits: text.length,
            resultPreview: text.length > 40 ? text.slice(0, 40) + '...' : text,
            cacheHit,                       // true si el valor ya estaba en memoria antes de la peticion
            cacheSizeBefore: sizeBefore,
            cacheSizeAfter: memo.size,      // vuelve a 2 si la instancia se reinicio
            elapsedMs: Date.now() - t0,
            instanceId: process.env.WEBSITE_INSTANCE_ID || 'local',
            instanceUptimeSeconds: Math.round((Date.now() - instanceStart) / 1000)
        }
    };
};
