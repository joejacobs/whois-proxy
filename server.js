// This object handles the connections with the users who connect to our whois server

var net = require('net');

// trims a string to remove any whitespace before and after
function trim(string) {
    return string.replace(/^\s*|\s*$/g, '')
}

// create an instance of the server object
function start(whois) {

    // handles a new connection from a user
    function serverControl(client) {

        // holds all details about the current session
        //      id: an identifier for the session
        //      query: the domain name submitted with the query
        //      tld: top-level domain name for the query
        session = {'id': client.address().address + ':' + client.address().port};

        // callback function to send data back to the user        
        function clientWriteCallback(data) {
            console.log('[server][' + session.id + '] sending whois data back to client');
            client.write(data);
        }

        // callback function to terminate the current session
        function clientEndCallback() {
            console.log('[server][' + session.id + '] terminating client connection');
            client.end();
        }

        // callback for when data is sent from the user to the server
        function onData(data) {
            // TODO: validate data
            // TODO: limit each session to 1 onData callback
            session.queryDomain = trim(data.toString());
            console.log('[server][' + session.id + '] query received: ' + session.queryDomain);
            parts = session.queryDomain.split('.');
            session.tld = parts[parts.length-1];
            whois.query(session,clientWriteCallback,clientEndCallback);
        }

        client.on('data', onData);
        console.log( '[server][' + session.id + '] new session: ' + JSON.stringify( client.address() ) );
    }

    // create server
    var server = net.createServer(serverControl).listen(9000);
    console.log('[server] server created on port 9000');
}

exports.start = start;
