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

# License

The code in this repository is in the public domain - using the
[CC0](https://creativecommons.org/share-your-work/public-domain/cc0/) license.

The favicon was generated using the following font:

- Font Title: KoHo
- Font Author: Copyright 2018 The KoHo Project Authors (https://github.com/cadsondemak/Koho)
- Font Source: http://fonts.gstatic.com/s/koho/v16/K2F-fZ5fmddNBikefJbSOos.ttf
- Font License: SIL Open Font License, 1.1 (http://scripts.sil.org/OFL))
