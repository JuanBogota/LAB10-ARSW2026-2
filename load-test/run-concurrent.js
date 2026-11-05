const newman = require('newman');
const path = require('path');

const CONCURRENT = parseInt(process.argv[2] || '10', 10);
const NTH = process.argv[3] || '1000';
const BASE_URL = process.env.BASE_URL;

if (!BASE_URL) {
  console.error('Define la variable BASE_URL (ej: https://mi-app.azurewebsites.net)');
  process.exit(1);
}

function runOne(id) {
  return new Promise((resolve) => {
    const start = Date.now();
    newman.run({
      collection: path.join(__dirname, 'Fibonacci.postman_collection.json'),
      envVar: [
        { key: 'baseUrl', value: BASE_URL },
        { key: 'nth', value: NTH }
      ],
      timeoutRequest: 600000,
      reporters: ['cli'],
      reporter: { cli: { silent: true } }
    }, (err, summary) => {
      const exec = summary && summary.run.executions[0];
      const resp = exec && exec.response;
      resolve({
        id,
        status: resp ? resp.code : 'SIN RESPUESTA',
        ms: resp ? resp.responseTime : Date.now() - start,
        error: err ? err.message : (exec && exec.requestError ? exec.requestError.message : null)
      });
    });
  });
}

(async () => {
  console.log(`Enviando ${CONCURRENT} peticiones concurrentes a ${BASE_URL}/api/Fibonacci con nth=${NTH}`);
  const t0 = Date.now();
  const results = await Promise.all(Array.from({ length: CONCURRENT }, (_, i) => runOne(i + 1)));
  const total = Date.now() - t0;
  results.forEach((r) =>
    console.log(`#${r.id}  HTTP ${r.status}  ${r.ms} ms${r.error ? '  ERROR: ' + r.error : ''}`)
  );
  const ok = results.filter((r) => r.status === 200).length;
  console.log(`\nOK: ${ok}/${CONCURRENT}   Tiempo total: ${total} ms`);
})();