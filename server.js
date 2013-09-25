var net = require('net');
var XRegExp = require('xregexp').XRegExp;
var Whois = require('./whois');
var Session = require('./session');

/* GLOBAL VARIABLES */

// manages the connections with the whois servers
var whois = null;

// and instance of this class
var server = null;

// domain name validation regex
var dnameRegex = XRegExp('^[a-z0-9-]+\.(([a-z]{2,}\.[a-z]{2,2})|([a-z]{2,}))$');

/* GLOBAL FUNCTIONS */

// only displays output if verbose mode is turned on
function logger(data) {
    if( server.verbose )
        return console.log(data);

    return;
}

/*
 * SERVER CLASS
 *
 * Main class that manages incoming connections from users and delegates whois queries
 * to the whois server manager (whois.js). Creates a new Session object for each query
 * that has all details of the connection to the user.
 */

// initialiser
function Server() {
    this.instance = null;
    this.verbose = false;
}

// callback function that initialises a session with a client
Server.prototype.serverControl = function(client) {
    var session = new Session();

    // callback for when data is sent from the user to the server
    function onData(data) {
        data = data.toString().trim().toLowerCase();

        if( !dnameRegex.test(data) ) {
            // domain name validation fail, return error to user
            session.clientWrite('The domain name provided is invalid');
            session.clientEnd();
            logger('[server][' + session.id + '] domain name regex failed for input: '
                    + data);
        } else {
            session.initQuery(data);
            logger('[server][' + session.id + '] query received: ' + session.dname);
            whois.query(session);
        }
    }

    session.init(client,logger);

    // we expect only one line of data from the client, ignore everything else by using
    // a one time callback function
    client.once('data', onData);
    logger( '[server][' + session.id + '] new connection: '
            + JSON.stringify( client.address() ) );
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

// launch and initialise server
server = new Server();
server.init()
