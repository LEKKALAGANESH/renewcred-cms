/**
 * Postgres connectivity probe.
 *
 * Prisma collapses every connection failure into `P1001: Can't reach database
 * server`, which reads as an outage even when the server is healthy and the
 * real fault is an unparseable URL, an intercepted port, or a missing IPv6
 * route. This speaks the wire protocol directly and prints what the server
 * actually said, so the failing layer is named in one step.
 *
 *   node scripts/pg-probe.mjs <host> <port> <user> <database>
 *
 * A healthy tenant answers 'S' to SSLRequest, then sends an
 * AuthenticationRequest. See docs/DATA_WORKFLOW.md.
 */
import net from 'node:net';
import tls from 'node:tls';

const HANDSHAKE_TIMEOUT_MS = 15_000;
const SSL_REQUEST_CODE = 80877103;
const PROTOCOL_VERSION_3 = Buffer.from([0x00, 0x03, 0x00, 0x00]);

const [host, port, user, database] = process.argv.slice(2);

if (!host || !port || !user || !database) {
  console.error('usage: node scripts/pg-probe.mjs <host> <port> <user> <database>');
  process.exit(2);
}

/** Frames a StartupMessage: int32 length, protocol version, null-terminated pairs. */
function startupMessage() {
  const body = Buffer.concat([
    PROTOCOL_VERSION_3,
    Buffer.from(`user\0${user}\0database\0${database}\0\0`, 'utf8'),
  ]);
  const framed = Buffer.alloc(4 + body.length);
  framed.writeInt32BE(framed.length, 0);
  body.copy(framed, 4);
  return framed;
}

function sslRequest() {
  const message = Buffer.alloc(8);
  message.writeInt32BE(8, 0);
  message.writeInt32BE(SSL_REQUEST_CODE, 4);
  return message;
}

/** Decodes the server's first reply — ErrorResponse carries the useful detail. */
function describeReply(buffer) {
  const tag = String.fromCharCode(buffer[0]);
  if (tag === 'E') {
    return buffer
      .subarray(5, buffer.length - 1)
      .toString('utf8')
      .split('\0')
      .filter(Boolean)
      .map((field) => `${field[0]}=${field.slice(1)}`)
      .join(' | ');
  }
  if (tag === 'R') {
    return `AuthenticationRequest (method ${buffer.readInt32BE(5)}) — tenant accepted`;
  }
  return `tag=${tag} len=${buffer.length}`;
}

function report(outcome) {
  console.log(`RESULT: ${outcome}`);
}

const socket = net.connect({ host, port: Number(port) }, () => socket.write(sslRequest()));
socket.setTimeout(HANDSHAKE_TIMEOUT_MS);
socket.once('timeout', () => {
  report('TIMEOUT before SSLRequest reply — port accepts TCP but no Postgres behind it');
  socket.destroy();
});
socket.once('error', (error) => report(`SOCKET ERROR ${error.code ?? error.message}`));

socket.once('data', (reply) => {
  const supportsTls = reply.toString('utf8', 0, 1) === 'S';
  console.log(
    `SSLRequest reply: ${reply.toString('utf8', 0, 1)} (TLS ${supportsTls ? 'supported' : 'refused'})`
  );
  if (!supportsTls) {
    socket.end();
    return;
  }

  const secure = tls.connect({ socket, servername: host, rejectUnauthorized: false }, () =>
    secure.write(startupMessage())
  );
  secure.setTimeout(HANDSHAKE_TIMEOUT_MS);
  secure.once('timeout', () => {
    report('TIMEOUT after StartupMessage');
    secure.destroy();
  });
  secure.once('error', (error) => report(`TLS ERROR ${error.code ?? error.message}`));
  secure.once('data', (response) => {
    report(describeReply(response));
    secure.destroy();
  });
});
