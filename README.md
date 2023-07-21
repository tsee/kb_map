# What's this?

This is a simple (and fairly hacky) single page Javascript web application
that allows designing your own custom boards that are size compatible with
the Kingdom Builder. The boards can be emitted as PDFs that can be printed,
cut out, and glued on cardboard to make playable boards.

# Installation / Setup

You just need a few JS modules and a simple static webserver to server the
content.

0. Install `npm` (Node.js package manager) via your OS package manager (or otherwise).

1. Install module dependencies into local directory:

  $ npm i jspdf

2. Optional: Install static-server package and run it from the local
directory or alternatively serve with a webserver of your choice:

  $ npm i static-server
  $ ./node_modules/static-server/bin/static-server.js

Then point your web browser at http://localhost:9080 if you're using the
out of the box config of static-server.

# License

## Code

The code in this repository is in the public domain - using the
[CC0](https://creativecommons.org/share-your-work/public-domain/cc0/) license.

## Artwork

I'm not an artist, okay? So I liberally used free/freely licensed artwork. That resulted in a
hodgepodge that's a bit of an eyesore. Best I can do for now. Better free art contributions
very welcome.

The favicon was generated using the following font:

- Font Title: KoHo
- Font Author: Copyright 2018 The KoHo Project Authors (https://github.com/cadsondemak/Koho)
- Font Source: http://fonts.gstatic.com/s/koho/v16/K2F-fZ5fmddNBikefJbSOos.ttf
- Font License: SIL Open Font License, 1.1 (http://scripts.sil.org/OFL))

All of the tiles used were published as freely reusable. If this was mistaken,
please contact me so I can remove them.

### First tileset: "Stylized Roads, Rivers and Mountains"

2d art asset by Ruslan Kim
email: kim.ruslan89@gmail.com
Current version: v1.0 in December 2022

### grass.png

Modified version of `hexGrass04.png` from "Stylized Roads, Rivers and Mountains".

### canyon.png

Modified version of `hexLavaGround01.png` from "Stylized Roads, Rivers and Mountains".

### mountain.png

Modified version of `mountain.png` from "Stylized Roads, Rivers and Mountains".

### desert.png

Modified version of `hexSand.png` from "Stylized Roads, Rivers and Mountains".

### water.png

Modified version of `hex_snow_01.png` from "Stylized Roads, Rivers and Mountains".

### forest.png, flowers.png, castle.png

Modified version of `hexGrass04.png` from "Stylized Roads, Rivers and Mountains".

Pine, flower, castle icons from https://www.iconpacks.net/, terms at
https://www.iconpacks.net/terms/ allowing free personal or commercial reuse
as long as it's not used to create a product that competes with iconpacks.net
(but read the actual terms instead of taking my interpretation for granted).

