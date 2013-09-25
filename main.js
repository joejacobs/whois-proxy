var Server = require('./server'); // handles the connections with users and delegates queries to the whois server manager
var server = new Server();
server.init();
