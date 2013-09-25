whois-server
============

A simple no-frills (bleeding edge, not for production use) whois server

Description
-----------

A simple no-frills (bleeding edge, not for production use) whois server. Acts as the middle-man between your client (PHP script, iOS app, etc.) and the actual whois servers so you don't need to store a list of whois servers in your client.

* written in node.js (mainly as an exercise for me to learn node.js)
* seems to work as expected
* hardcoded to run on port 9000
* no caching of results so if we are blocked by the whois server, we'll just return the error message to the user
* doesn't have/need a list of whois servers since we get this automatically from IANA
* the whois servers for different TLDs are cached so we don't need to keep querying the IANA server
* currently no validation in place for data received from the client/whois servers (very dangerous!) 

Requirements
------------
* [node.js] (http://nodejs.org/)
* [net module] (http://nodejs.org/api/net.html)

Usage
-----
    node server.js

If you would like to turn on verbose output to console

    node server.js --verbose
or

    node server.js -v`

TODO
----
* Validation!
* Hard whois for .com and .net
* Caching
* Extract common data (eg. name servers and expiry date).
* Make text parsing non-blocking (?)
