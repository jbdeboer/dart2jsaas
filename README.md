dart2jsaas
==========

Dart2JS-as-a-service is a node module which compiles Dart applications to Javascript without any additional configuration.

It is designed to seamlessly port Dartium-centric workflows to production browsers.

How It Works
------------

When dart2jsaas is given the location of a Dart file with a main() function, it will use the server to crawl all
of the application's dependencies.  It then feeds the entire set of Dart files to dart2js and returns the generated
Javascript.

It does not depend on the the filesystem, pub or pubspec.lock.  As long as the app loads correctly in Dartium, dart2jsaas
will be able to compile the app into Javascript.

One Configuration
-----------------

dart2jsaas allow you to use the same deployment configuration for both Dartium and dart2js.  Since dart2jsaas does
not depend on the filesystem, it works with on-the-fly generated Dart code and configurations where code is
served from multiple locations.

Usage
-----

Simple, command-line integration is possible.  See cmdline.js.
Middleware for connect / express is included as well.

To see dart2jsaas in action, check out karma and the karma-dart project.

Testing
-------

We are using jasmine-node.

npm install jasmine-node -g
jasmine-node spec/
