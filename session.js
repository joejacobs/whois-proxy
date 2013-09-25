// Contains all details about a session with a given user

function Session() {
    var client = null;
    var dname = null; // domain name submitted with the query
    var tld = null; // top-level domain name for the query
    var id = null; // a human-readable identifier for the session
    var logger = null;
}

// initialise
Session.prototype.init = function(client,logger) {
    this.client = client;
    this.logger = logger;
    this.id = client.address().address + ':' + client.address().port;
}

// process a query
Session.prototype.initQuery = function(query) {
    parts = query.split('.');
    this.dname = query.toString().trim();
    this.tld = parts[parts.length-1];
}

// callback function to send data back to the user
Session.prototype.clientWrite = function(data) {
    this.logger('[session][' + this.id + '] sending whois data back to client');
    this.client.write(data)
}

// callback function to terminate the current session
Session.prototype.clientEnd = function() {
    this.logger('[session][' + this.id + '] terminating client connection');
    this.client.end();
}

module.exports = Session;
