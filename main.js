var whois = require('./whois'); // handles the connections with the whois servers
var server = require('./server'); // handles the connections with users

server.start(whois);
