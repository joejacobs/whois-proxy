var net = require('net');
var XRegExp = require('xregexp').XRegExp;
var Session = require('./session');

/*
 * SERVER CLASS
 *
 * Main class that manages incoming connections from users and delegates whois queries
 * to the whois server manager (whois.js). Creates a new Session object for each query
 * that has all details of the connection to the user.
 */

function Server() {
    var netServer = null; // the net module server
    var whois = null; // manages the connections with the whois servers
    var logger = null;
 
    // domain name validation regex
    var dnameRegex = XRegExp('^[a-z0-9-]+\.(([a-z]{2,}\.[a-z]{2,2})|([a-z]{2,}))$');

    // callback for when the user sends data to the server
    var dataListener = function(data,session) {
        data = data.toString().trim().toLowerCase();

        if( !dnameRegex.test(data) ) {
            // domain name validation failed, return error to user
            session.clientWrite('The domain name provided is invalid');
            session.clientEnd();
            logger.log( '[server][' + session.getID() + '] domain name regex failed for'
                    + ' input: ' + data );
        } else {
            session.initQuery(data);
            logger.log( '[server][' + session.getID() + '] query received: '
                    + session.getDomainName() );
            whois.query(session);
        }
    }

    // callback function that initialises a session with a client
    var connectionListener = function(client) {
        var session = new Session();
        session.init(client,logger);

        function dataListenerDummy(data) {
            dataListener(data,session);
        }

        // we expect only one line of data from the client, ignore everything else by
        // using a one time callback function
        client.once( 'data', dataListenerDummy );
        logger.log( '[server][' + session.getID() + '] new connection: '
                + JSON.stringify( client.address() ) );
    }

    return {
        // getter for verbose
        isVerbose:function() {
            return verbose;
        }, 

        // initialises the Server class
        init:function(main) {
            // get logger object
            logger = main.logger;

            // create whois server manager object
            whois = main.whois;

            // create server
            netServer = net.createServer(connectionListener).listen(9000);
            logger.log('[server] server created on port 9000');
        }
    }
}

module.exports = Server;
