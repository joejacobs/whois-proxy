var net = require('net');

function trim(string) {
    return string.replace(/^\s*|\s*$/g, '')
}

function start(whois) {
    function serverControl(client) {
	function clientWriteCallback(data) {
	    console.log('[server] sending whois data back to client');
	    client.write(data);
	}

	function clientEndCallback() {
	    console.log('[server] terminating connection with client');
	    client.end();
	}

	function onData(data) {
	    // TODO: validate data
	    queryDomain = trim(data.toString());
	    console.log('[server] query received: ' + queryDomain);
	    parts = queryDomain.split('.');
	    tld = parts[parts.length-1];
	    whois.query(queryDomain,tld,clientWriteCallback,clientEndCallback);
	}

	client.on('data', onData);
	console.log('[server] client connected');
    }

    var server = net.createServer(serverControl).listen(9000);
    console.log('[server] server created on port 9000');
}

exports.start = start;