var Server = require('./server');
var Whois = require('./whois');
var Logger = require('./logger');

function main() {
    this.server = new Server();
    this.whois = new Whois();
    this.logger = new Logger();

    // enable console logging if needed
    if( process.argv[2] == '-v' || process.argv[2] == '--verbose' )
        this.logger.setVerbose(true);

    this.whois.init(this);
    this.server.init(this);
}

main();
