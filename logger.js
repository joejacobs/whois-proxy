/*
 * LOGGER
 *
 * Contains all details about a session with a given user
 */ 

function Logger() {
    var verbose = false;

    return {
        setVerbose:function(value) {
            if( typeof value != 'boolean' )
                throw new TypeError('value of verbose must be boolean');

            verbose = value;
        },

        log:function(message) {
            if( verbose )
                return console.log(message);

            return;
        }
    }
}

module.exports = Logger;
