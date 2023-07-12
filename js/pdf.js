import {
  KBMap,
  TileType,
  tile_types,
  HexValue,
} from './map_storage.js';

import { Point, OffsetCoord, Layout } from '../vendor/hexagons/lib-module.js';

export function generate_pdf(cfg, map, layout) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'cm',
    format: 'a4',
  });

  let draw_x_offset_cm = 0.5;
  let draw_y_offset_cm = 1.0;

  // local helper function to reduce copy/paste.
  // Yes, 'tis not the height of programming.
  let draw_hex_helper = function(v) {
    let tt = tile_types[v.type];
    let p = layout.hexToPixel(v.hex);
    const px_to_cm = 96/72 / (72/2.54);
    doc.addImage(
        tt.img, 'PNG',
        p.x * px_to_cm + draw_x_offset_cm,
        p.y * px_to_cm + draw_y_offset_cm,
        cfg.tile_width * px_to_cm,
        cfg.tile_height * px_to_cm,
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
  draw_x_offset_cm = -17;
  map.iterate(function(v) {
      if (OffsetCoord.roffsetFromCube(1, v.hex).col < 6)
        return;
      draw_hex_helper(v);
  });

  doc.save("map.pdf");
}

