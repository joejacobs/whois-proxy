var net = require('net');
var ianaServer = {host:'whois.iana.org', port:43};
var whoisServers = {};

function trim(string) {
    return string.replace(/^\s*|\s*$/g, '')
}

function doWhois(queryDomain,tld,clientWriteCallback,clientEndCallback) {
    console.log('[whois] running whois lookup');

    var whoisConnection = net.connect(whoisServers[tld],function() {
	    console.log('[whois] connected to whois server, sending query');
	    whoisConnection.write(queryDomain + '\r\n');
    });

    function afterWhoisCallback(data) {
	console.log('[whois] received callback from whois server');
	afterWhois(data,clientWriteCallback);
    }

    function endWhoisCallback() {
	console.log('[whois] whois server connection ended');
	clientEndCallback();
    }

    whoisConnection.on('data',afterWhoisCallback);
    whoisConnection.on('end',endWhoisCallback);
}

function doIana(queryDomain,tld,clientWriteCallback,clientEndCallback) {
    console.log('[whois] getting whois server from iana');

    var ianaConnection = net.connect(ianaServer,function() {
	    console.log('[whois] connected to iana, sending query');
	    ianaConnection.write(queryDomain + '\r\n');
    });

    function afterIanaCallback(data) {
	console.log('[whois] received callback from iana');
	afterIana(data,tld);
    }

    function endIanaCallback() {
	console.log('[whois] iana connection ended');
	endIana(queryDomain,tld,clientWriteCallback,clientEndCallback);
    }

    ianaConnection.on('data',afterIanaCallback);
    ianaConnection.on('end',endIanaCallback);
}

function afterWhois(data,clientWriteCallback) {
    console.log('[whois] received data from whois server');
    // TODO: validate data
    clientWriteCallback(data.toString());
}

function afterIana(data,tld) {
    if( tld in whoisServers ) return;

    // TODO: validate data

    var lines = data.toString().split('\n');

    for( x in lines ) {
	if( lines[x].charAt(0) == '%' ) continue;
	if( trim(lines[x]) == '' ) continue;

        if( lines[x].split(':')[0] == 'refer' ) {
	    console.log( '[whois] refer tag found: ' + trim(lines[x]) );
            whoisServers[tld] = {host:trim( lines[x].split(':')[1] ), port:43};
            return;
        }
    }
}

function endIana(queryDomain,tld,clientWriteCallback,clientEndCallback) {
    if( !(tld in whoisServers) ) {
	console.log('[whois] refer tag not found');
	clientWriteCallback('Could not find whois servers for that domain name');
	clientEndCallback();
    } else {
	doWhois(queryDomain,tld,clientWriteCallback,clientEndCallback);
    }
}

function query(queryDomain,tld,clientWriteCallback,clientEndCallback) {
    console.log('[whois] query received for ' + queryDomain);

    if( !(tld in whoisServers) ) {
	console.log('[whois] whois server not found for ' + tld);
	doIana(queryDomain,tld,clientWriteCallback,clientEndCallback);
    } else {
	console.log('[whois] whois server found ' + JSON.stringify( whoisServers[tld] ) );
	doWhois(queryDomain,tld,clientWriteCallback,clientEndCallback);
    }
}

exports.query = query;