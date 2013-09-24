var whois = require('./whois'); // handles the connections with the whois servers
var server = require('./server'); // handles the connections with users
var logger = function(){};

// enable console logging if needed
if( process.argv[2] == '-v' || process.argv[2] == '--verbose' )
    logger = console.log;

whois.start(logger);
server.start(whois,logger);
