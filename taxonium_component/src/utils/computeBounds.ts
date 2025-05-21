export default function computeBounds(vs: any, deckSize: {width:number; height:number} | null) {
  if (!deckSize) return vs;
  const zoom = Array.isArray(vs.zoom) ? vs.zoom : [vs.zoom, vs.zoom];
  const real_width = deckSize.width / 2 ** zoom[0];
  const real_height = deckSize.height / 2 ** zoom[1];
  vs.real_width = real_width;
  vs.real_height = real_height;
  vs.min_x = vs.target[0] - real_width / 2;
  vs.max_x = vs.target[0] + real_width / 2;
  vs.min_y = vs.target[1] - real_height / 2;
  vs.max_y = vs.target[1] + real_height / 2;
  return vs;
}
