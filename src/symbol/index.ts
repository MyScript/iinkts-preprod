/**
 * @group Symbol
 * @summary Symbol types and geometries
 *
 * The symbol module provides:
 *
 * **Base Symbols** (`./base`)
 * - {@link Symbol} - Base symbol abstraction
 * - {@link Stroke} - Collection of pointers representing a stroke
 * - {@link CanvasSymbol} - Symbol for canvas rendering
 * - {@link Point} - 2D point representation
 * - {@link TBox} - Bounding box type
 *
 * **Interactive Symbols** (`./interactive`)
 * - {@link IISymbol} - Rich symbol with advanced features
 * - {@link TStroke} - Stroke with decorators and style
 * - {@link IIText} - Text symbol with font styling
 * - {@link IIEraser} - Eraser tool marker
 *
 * **Geometry** (`./geometry`)
 * - Shapes (Circle, Ellipse, Polygon)
 * - Edges (Line, Arc, PolyLine)
 * - Shape utilities
 */

// Base symbols
export * from "./base"

// Interactive symbols
export * from "./interactive"

// Geometry
export * from "./geometry"

// Symbol helpers
export * from "./SymbolHelpers"
export * from "./helpers"
