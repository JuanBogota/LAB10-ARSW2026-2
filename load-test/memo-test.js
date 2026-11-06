// Uso: node load-test/memo-test.js <baseUrl> [n1,n2,n3...]
// Ejemplo: node load-test/memo-test.js https://MI-APP.azurewebsites.net 10,100,1000,5000,1000000
// Corra el script, espere >= 5 minutos sin tocar la funcion y vuelvalo a correr con los mismos valores.
const base = (process.argv[2] || '').replace(/\/$/, '');
const values = (process.argv[3] || '10,100,1000,5000,1000000').split(',').map(Number);
if (!base) { console.error('Falta baseUrl'); process.exit(1); }

(async () => {
    console.log(`[${new Date().toLocaleTimeString()}] ${base}/api/FibonacciMemo`);
    console.log('nth\tHTTP\tms(total)\tcacheHit\tcacheSize(antes->despues)\tinstancia\tuptime(s)');
    for (const nth of values) {
        const t0 = Date.now();
        try {
            const r = await fetch(`${base}/api/FibonacciMemo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nth })
            });
            const j = await r.json().catch(() => ({}));
            console.log([nth, r.status, Date.now() - t0, j.cacheHit,
                `${j.cacheSizeBefore ?? '-'}->${j.cacheSizeAfter ?? j.cacheSize ?? '-'}`,
                (j.instanceId || '').slice(0, 8), j.instanceUptimeSeconds, j.error || ''].join('\t'));
        } catch (e) {
            console.log([nth, 'ERR', Date.now() - t0, e.message].join('\t'));
        }
    }
})();
