var net = require('net');

function trim(string) {
    return string.replace(/^\s*|\s*$/g, '')
}

function start(whois) {
    function serverControl(client) {
        session = {'id': client.address().address + ':' + client.address().port};
        
        function clientWriteCallback(data) {
            console.log('[server][' + session.id + '] sending whois data back to client');
            client.write(data);
        }

        function clientEndCallback() {
            console.log('[server][' + session.id + '] terminating client connection');
            client.end();
        }

        function onData(data) {
            // TODO: validate data
            session.queryDomain = trim(data.toString());
            console.log('[server][' + session.id + '] query received: ' + session.queryDomain);
            parts = session.queryDomain.split('.');
            session.tld = parts[parts.length-1];
            whois.query(session,clientWriteCallback,clientEndCallback);
        }

        client.on('data', onData);
        console.log( '[server][' + session.id + '] new session: ' + JSON.stringify( client.address() ) );
    }

    var server = net.createServer(serverControl).listen(9000);
    console.log('[server] server created on port 9000');
}

exports.start = start;
