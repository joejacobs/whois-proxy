/*
 * SESSION
 *
 * Contains all details about a session with a given user
 */ 

function Session() {
    var client = null;
    var logger = null;
    var domainName = null; // domain name submitted with the query
    var TLD = null; // top-level domain name for the query
    var ID = null; // a human-readable identifier for the session

    return {
        // getter for ID
        getID:function() {
            return ID;
        },

        // getter for domain name
        getDomainName:function() {
            return domainName;
        },

        // getter for tld
        getTLD:function() {
            return TLD;
        },

        // callback function to send data back to the user
        clientWrite:function(data) {
            logger.log('[session][' + ID + '] sending whois data back to client');
            client.write(data)
        },

        // callback function to terminate the current session
        clientEnd:function() {
            logger.log('[session][' + ID + '] terminating client connection');
            client.end();
        },

        // process a query
        initQuery:function(query) {
            parts = query.split('.');
            domainName = query.toString().trim();
            TLD = parts[parts.length-1];
        },

        // initialise
        init:function(clientObj,loggerObj) {
            client = clientObj;
            logger = loggerObj;
            ID = client.address().address + ':' + client.address().port;
        }
    }
}

module.exports = Session;
