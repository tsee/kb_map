"use strict";

import {
  KBMap,
  TileType,
  tile_types,
  HexValue,
} from './map_storage.js';

import { Point, OffsetCoord, Layout } from '../vendor/hexagons/lib-module.js';

export function generate_pdf(cfg, map) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'cm',
    format: 'a4',
  });

  const tile_side_in_cm = 1.4;
  const tile_width_in_cm = Math.sqrt(3) * tile_side_in_cm;
  const tile_height_in_cm = 2 * tile_side_in_cm; // for pointy side up

  const print_layout = new Layout(
    Layout.pointy,
    // tile sizes in both dimensions in cm.
    new Point(tile_width_in_cm / Math.sqrt(3), tile_height_in_cm / 2),
    // origin coords
    new Point(0, 0)
  );

  let draw_x_offset_cm = 1.5;
  let draw_y_offset_cm = 1.5;

  // local helper function to reduce copy/paste.
  // Yes, 'tis not the height of programming.
  let draw_hex_helper = function(v) {
    let tt = tile_types[v.type];
    let p = print_layout.hexToPixel(v.hex);

    doc.addImage(
        tt.img, 'PNG',
        p.x + draw_x_offset_cm,
        p.y + draw_y_offset_cm,
        tile_width_in_cm,
        tile_height_in_cm,
        v.type
    );
  };

  // Now iterate over the map draw everything up to column 5 (by offset
  // coordinates, not axial/cube coordinates!) on the first page,
  // then add a page, iterate AGAIN and draw the rest.
  map.iterate(function(v) {
      if (OffsetCoord.roffsetFromCube(1, v.hex).col >= 6)
        return;
      draw_hex_helper(v);
  });

  doc.addPage();
  draw_x_offset_cm = -10;
  map.iterate(function(v) {
      if (OffsetCoord.roffsetFromCube(1, v.hex).col < 6)
        return;
      draw_hex_helper(v);
  });

  doc.save("map.pdf");
}

