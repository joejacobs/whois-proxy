// This class handles the connections with the users who connect to our whois server

var net = require('net');

// create an instance of the server object
function start(whois, logger) {
    var server = null;

    // handles a new connection from a user
    function serverControl(client) {

        // holds all details about the current session
        //      id: an identifier for the session
        //      query: the domain name submitted with the query
        //      tld: top-level domain name for the query
        var session = {
            'id'    : client.address().address + ':' + client.address().port,
            'query' : null,
            'tld'   : null
        };

        // callback function to send data back to the user        
        function clientWriteCallback(data) {
            logger('[server][' + session.id + '] sending whois data back to client');
            client.write(data);
        }

        // callback function to terminate the current session
        function clientEndCallback() {
            logger('[server][' + session.id + '] terminating client connection');
            client.end();
        }

        // callback for when data is sent from the user to the server
        function onData(data) {
            // TODO: validate data
            // TODO: limit each session to 1 onData callback
            session.queryDomain = data.toString().trim();
            parts = session.queryDomain.split('.');
            session.tld = parts[parts.length-1];
            logger('[server][' + session.id + '] query received: ' + session.queryDomain);

            whois.query(session,clientWriteCallback,clientEndCallback);
        }

        client.on('data', onData);
        logger( '[server][' + session.id + '] new connection: ' + JSON.stringify( client.address() ) );
    }

    // create server
    server = net.createServer(serverControl).listen(9000);
    logger('[server] server created on port 9000');
}

exports.start = start;
