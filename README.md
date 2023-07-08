# What's this?

This is a simple (and fairly hacky) single page Javascript web application
that allows designing your own custom boards that are size compatible with
the Kingdom Builder. The boards can be emitted as PDFs that can be printed,
cut out, and glued on cardboard to make playable boards.

# Installation / Setup

You just need a few JS modules and a simple static webserver to server the
content.

1. Install module dependencies into local directory:

  $ npm i jspdf

2. Optional: Install static-server package and run it from the local
directory or alternatively serve with a webserver of your choice:

  $ npm i static-server
  $ ./node_modules/static-server/bin/static-server.js

Then point your web browser at http://localhost:9080 if you're using the
out of the box config of static-server.

