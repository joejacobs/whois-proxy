// the whois server manager, handles all communication with the whois servers and IANA

var net = require('net');
var logger = null;

function Whois() {
    this.ianaServer = {host:'whois.iana.org', port:43};// the IANA server details

    // Once we know the whois server for a tld, we store it here so we don't have to
    // re-query IANA for the details. Each server has the following form
    //      host: the hostname
    //      port: port number, always 43
    this.whoisServers = {};
}

// Perform the actual whois lookup
// TODO: add hard whois option for .com and .net
Whois.prototype.doWhois = function(session,obj) {
    var connection = null;

    logger('[whois][' + session.id + '] running whois lookup');

    // Connect to the whois server. For .com and .net, the format of the query is
    // slightly different
    connection = net.connect(this.whoisServers[session.tld],function() {
        logger('[whois][' + session.id + '] connected to whois server, sending query');

        if( session.tld == 'com' || session.tld == 'net' )
            connection.write('domain ' + session.dname + '\r\n');
        else
            connection.write(session.dname + '\r\n');
    });

    // dummy callback function for receiving data from the whois server
    function receiveCallback(data) {
        obj.receiveWhois(session,data);
    }

    // callback function for terminating connection with whois server
    function endCallback() {
        logger('[whois][' + session.id + '] whois server connection ended');
        session.clientEnd();
    }

    connection.on('data',receiveCallback);
    connection.on('end',endCallback);
}

// callback function for receiving data from the whois server
Whois.prototype.receiveWhois = function(session,data) {
    logger('[whois][' + session.id + '] received data from whois server');
    // TODO: validate data
    session.clientWrite(data.toString());
}

// queries the IANA server to get the whois server for a tld
Whois.prototype.doIANA = function(session,obj) {
    var connection = null;

    logger('[whois][' + session.id + '] getting whois server from IANA');

    connection = net.connect(this.ianaServer,function() {
        logger('[whois][' + session.id + '] connected to IANA, sending query');
        connection.write(session.dname + '\r\n');
    });

    // dummy callback function for receiving data from IANA
    function receiveCallback(data) {
        obj.receiveIANA(data,session);
    }

    // dummy callback function for terminating connection with IANA
    function endCallback() {
        obj.endIANA(session);
    }

    connection.on('data',receiveCallback);
    connection.on('end',endCallback);
}

// callback function for receiving data from IANA, parses through the data looking for
// the whois server details (begins with 'refer:')
Whois.prototype.receiveIANA = function(data,session) {
    logger('[whois][' + session.id + '] received data from IANA');

    if( session.tld in this.whoisServers ) return;

    // TODO: validate data

    var lines = data.toString().split('\n');

    for( x in lines ) {
        if( lines[x].charAt(0) == '%' ) continue;// ignore comments
        if( lines[x].trim() == '' ) continue;// ignore blank lines

        // look for the refer tag ( something like "refer: whois.server.tld" ), it should
        // always be at port 43
        if( lines[x].split(':')[0] == 'refer' ) {
            logger( '[whois] refer tag found: ' + lines[x].trim() );

            this.whoisServers[session.tld] = {
                host:lines[x].split(':')[1].trim(),
                port:43
            };

            return;
        }
    }
}

// callback function from terminating the connection with IANA, if we got the whois
// server details query it. Otherwise return an error message to the user
Whois.prototype.endIANA = function(session) {
    logger('[whois][' + session.id + '] IANA connection ended');

    if( session.tld in this.whoisServers ) {
        this.doWhois(session,this);
    } else {
        logger('[whois][' + session.id + '] refer tag not found');
        session.clientWrite('Could not find whois servers for that domain name');
        session.clientEnd();
    }
}

// called by the main server class to trigger a whois search. if we have the whois server
// details query it, otherwise query IANA first
Whois.prototype.query = function(session) {
    logger('[whois][' + session.id + '] query received for ' + session.dname);

    if( session.tld in this.whoisServers ) {
        logger('[whois][' + session.id + '] whois server found '
                + JSON.stringify( this.whoisServers[session.tld] ) );

        this.doWhois(session,this);
    } else {
        logger('[whois][' + session.id + '] whois server not found for '
                + session.tld);

        this.doIANA(session,this);
    }
}

// initialise the whois manager, just saves the logger so we can access it here
Whois.prototype.init = function(logger_obj) {
    logger = logger_obj;
    logger('[whois] whois server manager initialised');
}

module.exports = Whois;
