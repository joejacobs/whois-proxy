// the main server class, handles incoming connections from users and delegates queries
// to the whois server manager (whois.js). creates a new session object for each query
// that has all details of the connection to the user.

var net = require('net');
var Whois = require('./whois');
var Session = require('./session');

// Global variables
var whois = null; // manages the connections with the whois servers
var server = null; // an instance of this class

// Global functions

// only displays output if verbose mode is turned on
function logger(data) {
    if( server.verbose )
        return console.log(data);

    return;
}

// initialiser for the main Server class that manages incoming connections from users
function Server() {
    this.instance = null;
    this.verbose = false;
}

// callback function that initialises a session with a client
Server.prototype.serverControl = function(client) {
    var session = new Session();

    // callback for when data is sent from the user to the server
    function onData(data) {
        data = data.toString().toLowerCase();
        // TODO: validate data
        // TODO: limit each session to 1 onData callback
        session.initQuery(data);
        logger('[server][' + session.id + '] query received: ' + session.dname);
        whois.query(session);
    }

    session.init(client,logger);
    client.on('data', onData);
    logger( '[server][' + session.id + '] new connection: ' + JSON.stringify( client.address() ) );
}

// initialises the Server class
Server.prototype.init = function() {
    // enable console logging if needed
    if( process.argv[2] == '-v' || process.argv[2] == '--verbose' )
        this.verbose = true;

    // create server
    this.instance = net.createServer(this.serverControl).listen(9000);
    logger('[server] server created on port 9000');

    // create whois server manager object
    whois = new Whois();
    whois.init(logger);
}

server = new Server();
server.init()
