/* images.js - the images of the source, each with its IIIF image service: made by bench-kit's
 * tools/iiif-map.js from the library's manifest, in place of this empty map:
 *   node kit/tools/iiif-map.js <manifest URL> --out js/images.js --credit "…"   (EDIT) */
(function (root) { root.SWImages = { manifest: '', label: '', credit: '', images: {} }; })(typeof window !== 'undefined' ? window : globalThis);
