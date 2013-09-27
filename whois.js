var net = require('net');

/*
 * WHOIS
 *
 * The whois server manager, handles all communication with the whois servers and IANA.
 * IANA holds information about whois servers for all top-level domain names. So we query
 * their servers if we don't know the whois server for a particular tld.
 */

// initialiser
function Whois() {
    // the IANA server details
    var ianaServer = {host:'whois.iana.org', port:43};

    // Once we know the whois server for a tld, we store it here so we don't have to
    // re-query IANA for the details. Each server has the following form
    //      host: the hostname
    //      port: port number, always 43
    var whoisServers = {};

    // Perform the actual whois lookup
    // TODO: add hard whois option for .com and .net
    var doWhois = function(session) {
        var connection = null;

        logger.log('[whois][' + session.getID() + '] running whois lookup');

        // Connect to the whois server. For .com and .net, the format of the query is
        // slightly different
        connection = net.connect(whoisServers[session.getTLD()],function() {
            logger.log('[whois][' + session.getID()
                + '] connected to whois server, sending query');

            if( session.getTLD() == 'com' || session.getTLD() == 'net' )
                connection.write('domain ' + session.getDomainName() + '\r\n');
            else
                connection.write(session.getDomainName() + '\r\n');
        });

        // dummy callback function for receiving data from the whois server
        function receiveCallback(data) {
            receiveWhois(session,data);
        }

        // callback function for terminating connection with whois server
        function endCallback() {
            logger.log('[whois][' + session.getID() + '] whois server connection ended');
            session.clientEnd();
        }

        connection.on('data',receiveCallback);
        connection.on('end',endCallback);
    }

    // callback function for receiving data from the whois server
    var receiveWhois = function(session,data) {
        logger.log('[whois][' + session.getID() + '] received data from whois server');
        session.clientWrite(data.toString());
    }

    // queries the IANA server to get the whois server for a tld
    var doIANA = function(session) {
        var connection = null;

        logger.log('[whois][' + session.getID() + '] getting whois server from IANA');

        connection = net.connect(ianaServer,function() {
            logger.log('[whois][' + session.getID()
                + '] connected to IANA, sending query');
            connection.write(session.getDomainName() + '\r\n');
        });

        // dummy callback function for receiving data from IANA
        function receiveCallback(data) {
            receiveIANA(data,session);
        }

        // dummy callback function for terminating connection with IANA
        function endCallback() {
            endIANA(session);
        }

        connection.on('data',receiveCallback);
        connection.on('end',endCallback);
    }

    // callback function for receiving data from IANA, parses through the data looking
    // for the whois server details (begins with 'refer:')
    var receiveIANA = function(data,session) {
        logger.log('[whois][' + session.getID() + '] received data from IANA');

        if( session.getTLD() in whoisServers ) return;

        var lines = data.toString().trim().split('\n');

        for( x in lines ) {
            if( lines[x].charAt(0) == '%' ) continue;// ignore comments
            if( lines[x].trim() == '' ) continue;// ignore blank lines

            // look for the refer tag ( something like "refer: whois.server.tld" ), it
            // should always be at port 43
            if( lines[x].split(':')[0] == 'refer' ) {
                logger.log( '[whois] refer tag found: ' + lines[x].trim() );

                whoisServers[session.getTLD()] = {
                    host:lines[x].split(':')[1].trim(),
                    port:43
                };

                return;
            }
        }
    }

    // callback function from terminating the connection with IANA, if we got the whois
    // server details query it. Otherwise return an error message to the user
    var endIANA = function(session) {
        logger.log('[whois][' + session.getID() + '] IANA connection ended');

        if( session.getTLD() in whoisServers ) {
            doWhois(session);
        } else {
            logger.log('[whois][' + session.getID() + '] refer tag not found');
            session.clientWrite('Could not find whois servers for that domain name');
            session.clientEnd();
        }
    }

    return {
        // called by the main server class to trigger a whois search. if we have the
        // whois server details query it, otherwise query IANA first
        query:function(session) {
            logger.log( '[whois][' + session.getID() + '] query received for '
                    + session.getDomainName() );

            if( session.getTLD() in whoisServers ) {
                logger.log('[whois][' + session.getID() + '] whois server found '
                        + JSON.stringify( whoisServers[session.getTLD()] ) );

                doWhois(session);
            } else {
                logger.log('[whois][' + session.getID() + '] whois server not found for '
                        + session.getTLD());

                doIANA(session);
            }
        },

        // initialise the whois manager, just saves the logger so we can access it here
        init:function(main) {
            logger = main.logger;
            logger.log('[whois] whois server manager initialised');
        }
    }
}

module.exports = Whois;
