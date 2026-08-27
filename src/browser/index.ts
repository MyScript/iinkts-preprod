/**
 * @group Browser
 * @summary DOM-bound helpers with zero internal dependencies
 *
 * These cannot live in `core`, which stays DOM-free so the library can run headless.
 */
export * from "./RafCoalescer"
export * from "./svgTransform"
