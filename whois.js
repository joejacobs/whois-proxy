var net = require('net');
var ianaServer = {host:'whois.iana.org', port:43};
var whoisServers = {};

function trim(string) {
    return string.replace(/^\s*|\s*$/g, '')
}

function doWhois(session,clientWriteCallback,clientEndCallback) {
    console.log('[whois][' + session.id + '] running whois lookup');

    var whoisConnection = net.connect(whoisServers[session.tld],function() {
            console.log('[whois][' + session.id + '] connected to whois server, sending query');
            whoisConnection.write(session.queryDomain + '\r\n');
    });

    function afterWhoisCallback(data) {
        afterWhois(session,data,clientWriteCallback);
    }

    function endWhoisCallback() {
        console.log('[whois][' + session.id + '] whois server connection ended');
        clientEndCallback();
    }

    whoisConnection.on('data',afterWhoisCallback);
    whoisConnection.on('end',endWhoisCallback);
}

function doIana(session,clientWriteCallback,clientEndCallback) {
    console.log('[whois][' + session.id + '] getting whois server from iana');

    var ianaConnection = net.connect(ianaServer,function() {
            console.log('[whois][' + session.id + '] connected to iana, sending query');
            ianaConnection.write(session.queryDomain + '\r\n');
    });

    function afterIanaCallback(data) {
        afterIana(session,data);
    }

    function endIanaCallback() {
        endIana(session,clientWriteCallback,clientEndCallback);
    }

    ianaConnection.on('data',afterIanaCallback);
    ianaConnection.on('end',endIanaCallback);
}

function afterWhois(session,data,clientWriteCallback) {
    console.log('[whois][' + session.id + '] received data from whois server');
    // TODO: validate data
    clientWriteCallback(data.toString());
}

function afterIana(session,data) {
    console.log('[whois][' + session.id + '] received data from iana');

    if( session.tld in whoisServers ) return;

    // TODO: validate data

    var lines = data.toString().split('\n');

    for( x in lines ) {
        if( lines[x].charAt(0) == '%' ) continue;
        if( trim(lines[x]) == '' ) continue;

        if( lines[x].split(':')[0] == 'refer' ) {
            console.log( '[whois][' + session.id + '] refer tag found: ' + trim(lines[x]) );
            whoisServers[session.tld] = {host:trim( lines[x].split(':')[1] ), port:43};
            return;
        }
    }
}

function endIana(session,clientWriteCallback,clientEndCallback) {
    console.log('[whois][' + session.id + '] iana connection ended');

    if( !(session.tld in whoisServers) ) {
        console.log('[whois][' + session.id + '] refer tag not found');
        clientWriteCallback('Could not find whois servers for that domain name');
        clientEndCallback();
    } else {
        doWhois(session,clientWriteCallback,clientEndCallback);
    }
}

function query(session,clientWriteCallback,clientEndCallback) {
    console.log('[whois][' + session.id + '] query received for ' + session.queryDomain);

    if( !(session.tld in whoisServers) ) {
        console.log('[whois][' + session.id + '] whois server not found for ' + session.tld);
        doIana(session,clientWriteCallback,clientEndCallback);
    } else {
        console.log('[whois][' + session.id + '] whois server found ' + JSON.stringify( whoisServers[session.tld] ) );
        doWhois(session,clientWriteCallback,clientEndCallback);
    }
}

exports.query = query;
