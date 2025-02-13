/**
 * @group Editor
 * @summary
 * List the possibilities of interactions
 */
declare enum EditorTool {
    Write = "write",
    Erase = "erase",
    /**
     * @remarks only usable in the case of offscreen
     */
    Select = "select",
    /**
     * @remarks only usable in the case of offscreen
     */
    Move = "move"
}
/**
 * @group Editor
 * @summary
 * List all the shapes that can be drawn
 * @remarks
 * only usable in the case of offscreen
 */
declare enum EditorWriteTool {
    Pencil = "pencil",
    Rectangle = "rectangle",
    Rhombus = "rhombus",
    Circle = "circle",
    Ellipse = "ellipse",
    Triangle = "triangle",
    Parallelogram = "parallelogram",
    Line = "line",
    Arrow = "arrow",
    DoubleArrow = "double-arrow"
}
/**
 * @group Renderer
 * @summary
 * List all svg elements roles
 * @remarks
 * only usable in the case of offscreen
 */
declare enum SvgElementRole {
    Guide = "guide",
    InteractElementsGroup = "interact-elements-group",
    Translate = "translate",
    Resize = "resize",
    Rotate = "rotate"
}
/**
 * @group Renderer
 * @summary
 * List all svg elements resize direction
 * @remarks
 * only usable in the case of offscreen
 */
declare const enum ResizeDirection {
    North = "n-resize",
    East = "e-resize",
    South = "s-resize",
    West = "w-resize",
    NorthEast = "ne-resize",
    NorthWest = "nw-resize",
    SouthEast = "se-resize",
    SouthWest = "sw-resize"
}
/**
 * @group Renderer
 */
declare const SELECTION_MARGIN: 10;

/**
 * @group Logger
 */
declare enum LoggerLevel {
    DEBUG = "1",
    INFO = "2",
    WARN = "3",
    ERROR = "4"
}
/**
 * @group Logger
 */
declare enum LoggerCategory {
    EDITOR = "EDITOR",
    RECOGNIZER = "RECOGNIZER",
    GRABBER = "GRABBER",
    GESTURE = "GESTURE",
    EDITOR_EVENT = "EDITOR_EVENT",
    MODEL = "MODEL",
    RENDERER = "RENDERER",
    SMARTGUIDE = "SMARTGUIDE",
    STYLE = "STYLE",
    HISTORY = "HISTORY",
    SYMBOL = "SYMBOL",
    WRITE = "WRITE",
    TRANSFORMER = "TRANSFORMER",
    CONVERTER = "CONVERTER",
    SELECTION = "SELECTION",
    SVGDEBUG = "SVGDEBUG",
    MENU = "MENU"
}
/**
 * @group Logger
 */
declare class Logger {
    category: LoggerCategory;
    level: LoggerLevel;
    constructor(category: LoggerCategory, level: LoggerLevel);
    debug(functionName: string, ...data: any): void;
    info(functionName: string, ...data: any): void;
    warn(functionName: string, ...data: any): void;
    error(functionName: string, ...error: any): void;
}

/**
 * @group Logger
 */
type TLoggerConfiguration = {
    [key in keyof typeof LoggerCategory]: LoggerLevel;
};
/**
 * @group Logger
 * @source
 */
declare const DefaultLoggerConfiguration: TLoggerConfiguration;

/**
 * @group Logger
 */
declare class LoggerManager {
    #private;
    static getLogger(name: LoggerCategory): Logger;
    static setLoggerLevel(config: TLoggerConfiguration): void;
}

/**
 * @group Utils
 */
declare class DeferredPromise<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (value: Error | string) => void;
    isFullFilled: boolean;
    isPending: boolean;
    constructor();
}

/**
 * @group Symbol
 */
type TPoint = {
    x: number;
    y: number;
};
/**
 * @group Symbol
 */
type TPointer = TPoint & {
    t: number;
    p: number;
};
/**
 * @group Symbol
 */
type TSegment = {
    p1: TPoint;
    p2: TPoint;
};
/**
 * @group Symbol
 */
declare function isValidPoint(p?: PartialDeep<TPoint>): boolean;

/**
 * @group Symbol
 */
type TBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};
/**
 * @group Symbol
 */
declare class Box implements TBox {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(boundindBox: TBox);
    static createFromBoxes(boxes: TBox[]): Box;
    static createFromPoints(points: TPoint[]): Box;
    static getCorners(box: TBox): TPoint[];
    static getCenter(box: TBox): TPoint;
    static getSides(box: TBox): TSegment[];
    static isContained(box: TBox, wrapper: TBox): boolean;
    static containsPoint(box: TBox, point: TPoint): boolean;
    static contains(box: TBox, child: TBox): boolean;
    static overlaps(box1: TBox, box2: TBox): boolean;
    get xMin(): number;
    get xMid(): number;
    get xMax(): number;
    get yMin(): number;
    get yMid(): number;
    get yMax(): number;
    get corners(): TPoint[];
    get center(): TPoint;
    get snapPoints(): TPoint[];
    isContained(wrapper: TBox): boolean;
    contains(child: TBox): boolean;
    containsPoint(point: TPoint): boolean;
    overlaps(boundaries: TBox): boolean;
}

/**
 * @group Style
 * @property {String} color=#000000 Color (supported formats rgb() rgba() hsl() hsla() #rgb #rgba #rrggbb #rrggbbaa)
 * @property {String} width in px

 */
type TStyle = {
    [key: string]: string | number | undefined;
    width: number;
    color: string;
    opacity?: number;
    fill?: string;
};
/**
 * @group Style
 * @source
 */
declare const DefaultStyle: TStyle;

/**
 * @group Style
 * @property {String} -myscript-pen-width=1 Width of strokes and primitives in mm (no other unit is supported yet)
 * @property {String} -myscript-pen-fill-style=none
 * @property {String} -myscript-pen-fill-color=#FFFFFF00 Color filled inside the area delimited by strokes and primitives
 */
type TPenStyle = PartialDeep<TStyle> & {
    "-myscript-pen-width"?: number;
    "-myscript-pen-fill-style"?: string;
    "-myscript-pen-fill-color"?: string;
};
/**
 * @group Style
 * @source
 */
declare const DefaultPenStyle: TPenStyle;

/**
 * @group Style
 */
type TThemeMath = {
    "font-family": string;
};
/**
 * @group Style
 */
type TThemeMathSolved = {
    "font-family": string;
    color: string;
};
/**
 * @group Style
 */
type TThemeText = {
    "font-family": string;
    "font-size": number;
};
/**
 * @group Style
 */
type TTheme = {
    ink: TPenStyle;
    ".math": TThemeMath;
    ".math-solved": TThemeMathSolved;
    ".text": TThemeText;
    [key: string]: unknown;
};
/**
 * @group Style
 * @source
 */
declare const DefaultTheme: TTheme;

/**
 * @group Style
 */
declare const StyleHelper: {
    themeToCSS(json: TTheme): string;
    themeToJSON(style: string): TTheme;
    penStyleToCSS(penStyle: TPenStyle): string;
    penStyleToJSON(penStyleString: string): TPenStyle;
    stringToJSON(style: string): {
        [key: string]: string;
    };
    JSONToString(style: {
        [key: string]: string;
    }): string;
};

/**
 * @group Style
 */
declare class StyleManager {
    #private;
    constructor(penStyle?: PartialDeep<TPenStyle>, theme?: PartialDeep<TTheme>);
    get currentPenStyle(): TPenStyle;
    get penStyle(): TPenStyle;
    setPenStyle(style?: PartialDeep<TPenStyle>): void;
    get theme(): TTheme;
    setTheme(theme?: PartialDeep<TTheme>): void;
    get penStyleClasses(): string;
    setPenStyleClasses(penStyleClass?: string): void;
}

/**
 * @group Symbol
 */
declare enum SymbolType {
    Stroke = "stroke",
    Group = "group",
    Shape = "shape",
    Edge = "edge",
    Text = "text",
    Eraser = "eraser",
    Recognized = "recognized"
}
/**
 * @group Symbol
 */
interface TSymbol {
    id: string;
    creationTime: number;
    modificationDate: number;
    type: string;
    style: PartialDeep<TStyle>;
}

/**
 * @group Symbol
 */
type TCanvasShapeEllipseSymbol = TSymbol & {
    centerPoint: TPoint;
    maxRadius: number;
    minRadius: number;
    orientation: number;
    startAngle: number;
    sweepAngle: number;
    beginDecoration?: string;
    endDecoration?: string;
    beginTangentAngle: number;
    endTangentAngle: number;
};
/**
 * @group Symbol
 */
type TCanvasShapeLineSymbol = TSymbol & {
    firstPoint: TPoint;
    lastPoint: TPoint;
    beginDecoration?: string;
    endDecoration?: string;
    beginTangentAngle: number;
    endTangentAngle: number;
};
/**
 * @group Symbol
 */
type TCanvasShapeTableLineSymbol = {
    p1: TPoint;
    p2: TPoint;
};
/**
 * @group Symbol
 */
type TCanvasShapeTableSymbol = TSymbol & {
    lines: TCanvasShapeTableLineSymbol[];
};
/**
 * @group Symbol
 */
type TCanvasUnderLineSymbol = TSymbol & {
    data: {
        firstCharacter: number;
        lastCharacter: number;
    };
};
/**
 * @group Symbol
 */
type TCanvasTextSymbol = TSymbol & {
    label: string;
    data: {
        topLeftPoint: TPoint;
        height: number;
        width: number;
        textHeight: number;
        justificationType: string;
    };
};
/**
 * @group Symbol
 */
type TCanvasTextUnderlineSymbol = TCanvasTextSymbol & {
    underlineList: TCanvasUnderLineSymbol[];
};

/**
 * @group Symbol
 */
declare enum DecoratorKind {
    Highlight = "highlight",
    Surround = "surround",
    Underline = "underline",
    Strikethrough = "strikethrough"
}
/**
 * @group Symbol
 */
declare class OIDecorator {
    id: string;
    kind: DecoratorKind;
    style: TStyle;
    constructor(kind: DecoratorKind, style: PartialDeep<TStyle>);
    clone(): OIDecorator;
}

/**
 * @group Transform
 * @remarks Represents a 2D affine transform, defined as a 3x3 matrix with an implicit third raw of <code>[ 0 0 1 ]</code>
 */
type TMatrixTransform = {
    /**
     * @remarks scaling x
     */
    xx: number;
    /**
     * @remarks shearing x
     */
    yx: number;
    /**
     * @remarks translation x
     */
    tx: number;
    /**
     * @remarks shearing y
     */
    xy: number;
    /**
     * @remarks scaling y
     */
    yy: number;
    /**
     * @remarks translation y
     */
    ty: number;
};
/**
 * @group Transform
 * @remarks Represents a 2D affine transform, defined as a 3x3 matrix with an implicit third raw of <code>[ 0 0 1 ]</code>
 */
declare class MatrixTransform implements TMatrixTransform {
    xx: number;
    yx: number;
    xy: number;
    yy: number;
    tx: number;
    ty: number;
    constructor(xx: number, yx: number, xy: number, yy: number, tx: number, ty: number);
    static identity(): MatrixTransform;
    static applyToPoint(mat: TMatrixTransform, point: TPoint): TPoint;
    static rotation(mat: TMatrixTransform): number;
    static toCssString(matrix: TMatrixTransform): string;
    invert(): this;
    multiply(m: TMatrixTransform): MatrixTransform;
    translate(tx: number, ty: number): MatrixTransform;
    rotate(radian: number, center?: TPoint): MatrixTransform;
    scale(x: number, y: number, center?: TPoint): MatrixTransform;
    applyToPoint(point: TPoint): TPoint;
    clone(): MatrixTransform;
    toCssString(): string;
}

/**
 * @group Symbol
 */
declare abstract class OISymbolBase<T extends string = SymbolType> implements TSymbol {
    readonly type: T;
    abstract readonly isClosed: boolean;
    style: TStyle;
    id: string;
    creationTime: number;
    modificationDate: number;
    selected: boolean;
    deleting: boolean;
    transform: MatrixTransform;
    constructor(type: T, style?: PartialDeep<TStyle>);
    abstract get vertices(): TPoint[];
    abstract get snapPoints(): TPoint[];
    get edges(): TSegment[];
    abstract overlaps(box: TBox): boolean;
    abstract clone(): OISymbolBase;
    abstract toJSON(): PartialDeep<OISymbolBase>;
    isIntersected(seg: TSegment): boolean;
}

/**
 * @group Symbol
 */
declare enum EdgeKind {
    Line = "line",
    PolyEdge = "polyedge",
    Arc = "arc"
}
/**
 * @group Symbol
 */
declare enum EdgeDecoration {
    Arrow = "arrow-head"
}
/**
 * @group Symbol
 */
declare abstract class OIEdgeBase<K = EdgeKind> extends OISymbolBase<SymbolType.Edge> {
    readonly kind: K;
    readonly isClosed = false;
    startDecoration?: EdgeDecoration;
    endDecoration?: EdgeDecoration;
    constructor(kind: K, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: PartialDeep<TStyle>);
    abstract get vertices(): TPoint[];
    get bounds(): Box;
    get snapPoints(): TPoint[];
    overlaps(box: TBox): boolean;
    abstract clone(): OIEdgeBase;
}

/**
 * @group Symbol
 */
declare class OIEdgeArc extends OIEdgeBase<EdgeKind.Arc> {
    center: TPoint;
    startAngle: number;
    sweepAngle: number;
    radiusX: number;
    radiusY: number;
    phi: number;
    protected _vertices: Map<string, TPoint[]>;
    constructor(center: TPoint, startAngle: number, sweepAngle: number, radiusX: number, radiusY: number, phi: number, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: PartialDeep<TStyle>);
    protected get verticesId(): string;
    protected computedVertices(): TPoint[];
    get vertices(): TPoint[];
    get snapPoints(): TPoint[];
    clone(): OIEdgeArc;
    toJSON(): PartialDeep<OIEdgeArc>;
    static create(partial: PartialDeep<OIEdgeArc>): OIEdgeArc;
}

/**
 * @group Symbol
 */
declare class OIEdgeLine extends OIEdgeBase<EdgeKind.Line> {
    start: TPoint;
    end: TPoint;
    constructor(start: TPoint, end: TPoint, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: PartialDeep<TStyle>);
    get vertices(): TPoint[];
    clone(): OIEdgeLine;
    toJSON(): PartialDeep<OIEdgeLine>;
    static create(partial: PartialDeep<OIEdgeLine>): OIEdgeLine;
}

/**
 * @group Symbol
 */
declare class OIEdgePolyLine extends OIEdgeBase<EdgeKind.PolyEdge> {
    points: TPoint[];
    constructor(points: TPoint[], startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: PartialDeep<TStyle>);
    get vertices(): TPoint[];
    clone(): OIEdgePolyLine;
    toJSON(): PartialDeep<OIEdgePolyLine>;
    static create(partial: PartialDeep<OIEdgePolyLine>): OIEdgePolyLine;
}

/**
 * @group Symbol
 */
declare enum ShapeKind {
    Circle = "circle",
    Ellipse = "ellipse",
    Polygon = "polygon",
    Table = "table"
}
/**
 * @group Symbol
 */
declare abstract class OIShapeBase<K = ShapeKind> extends OISymbolBase<SymbolType.Shape> {
    readonly kind: K;
    readonly isClosed = true;
    constructor(kind: K, style?: PartialDeep<TStyle>);
    get bounds(): Box;
    get snapPoints(): TPoint[];
    overlaps(box: TBox): boolean;
}

/**
 * @group Symbol
 */
declare class OIShapeCircle extends OIShapeBase<ShapeKind.Circle> {
    center: TPoint;
    radius: number;
    protected _vertices: Map<string, TPoint[]>;
    protected _bounds: Map<string, Box>;
    constructor(center: TPoint, radius: number, style?: PartialDeep<TStyle>);
    protected get verticesId(): string;
    protected computedVertices(): TPoint[];
    protected computedBondingBox(): Box;
    get bounds(): Box;
    get vertices(): TPoint[];
    overlaps(box: TBox): boolean;
    clone(): OIShapeCircle;
    toJSON(): PartialDeep<OIShapeCircle>;
    static createBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): OIShapeCircle;
    static updateBetweenPoints(circle: OIShapeCircle, origin: TPoint, target: TPoint): OIShapeCircle;
    static create(partial: PartialDeep<OIShapeCircle>): OIShapeCircle;
}

/**
 * @group Symbol
 */
declare class OIShapeEllipse extends OIShapeBase<ShapeKind.Ellipse> {
    center: TPoint;
    radiusX: number;
    radiusY: number;
    orientation: number;
    protected _vertices: Map<string, TPoint[]>;
    constructor(center: TPoint, radiusX: number, radiusY: number, orientation: number, style?: PartialDeep<TStyle>);
    protected get verticesId(): string;
    protected computedVertices(): TPoint[];
    get vertices(): TPoint[];
    overlaps(box: TBox): boolean;
    clone(): OIShapeEllipse;
    toJSON(): PartialDeep<OIShapeEllipse>;
    static createBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): OIShapeEllipse;
    static updateBetweenPoints(ellipse: OIShapeEllipse, origin: TPoint, target: TPoint): OIShapeEllipse;
    static create(partial: PartialDeep<OIShapeEllipse>): OIShapeEllipse;
}

/**
 * @group Symbol
 */
declare class OIShapePolygon extends OIShapeBase<ShapeKind.Polygon> {
    points: TPoint[];
    constructor(points: TPoint[], style?: PartialDeep<TStyle>);
    get vertices(): TPoint[];
    get bounds(): Box;
    clone(): OIShapePolygon;
    toJSON(): PartialDeep<OIShapePolygon>;
    static create(partial: PartialDeep<OIShapePolygon>): OIShapePolygon;
    static createTriangleBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): OIShapePolygon;
    static updateTriangleBetweenPoints(poly: OIShapePolygon, origin: TPoint, target: TPoint): OIShapePolygon;
    static createParallelogramBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): OIShapePolygon;
    static updateParallelogramBetweenPoints(poly: OIShapePolygon, origin: TPoint, target: TPoint): OIShapePolygon;
    static createRectangleBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): OIShapePolygon;
    static updateRectangleBetweenPoints(poly: OIShapePolygon, origin: TPoint, target: TPoint): OIShapePolygon;
    static createRhombusBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): OIShapePolygon;
    static updateRhombusBetweenPoints(poly: OIShapePolygon, origin: TPoint, target: TPoint): OIShapePolygon;
}

/**
 * @group Symbol
 */
type TStrokeToSend = {
    id: string;
    pointerType: string;
    x: number[];
    y: number[];
    t: number[];
    p: number[];
};
/**
 * @group Symbol
 */
type TStrokeGroupToSend = {
    penStyle?: string;
    strokes: TStrokeToSend[];
};
/**
 * @group Symbol
 */
type TStroke = TSymbol & {
    style: TPenStyle;
    pointerType: string;
    pointers: TPointer[];
    length: number;
};
/**
 * @group Symbol
 */
type TStrokeGroup = {
    penStyle: TPenStyle;
    strokes: Stroke[];
};
/**
 * @group Symbol
 */
declare class Stroke implements TStroke {
    type: SymbolType;
    id: string;
    creationTime: number;
    modificationDate: number;
    style: TPenStyle;
    pointerType: string;
    pointers: TPointer[];
    length: number;
    constructor(style: TPenStyle, pointerType?: string);
    clone(): Stroke;
    formatToSend(): TStrokeToSend;
}
/**
 * @group Symbol
 * @group Utils
 */
declare function convertPartialStrokesToStrokes(json: PartialDeep<TStroke>[]): Stroke[];

/**
 * @group Symbol
 */
declare class OIStroke extends OISymbolBase<SymbolType.Stroke> {
    readonly isClosed = false;
    pointerType: string;
    length: number;
    decorators: OIDecorator[];
    pointers: Array<TPointer>;
    constructor(style?: PartialDeep<TStyle>, pointerType?: string);
    get bounds(): Box;
    static split(strokeToSplit: OIStroke, i: number): {
        before: OIStroke;
        after: OIStroke;
    };
    static substract(stroke: OIStroke, partStroke: OIStroke): {
        before?: OIStroke;
        after?: OIStroke;
    };
    get snapPoints(): TPoint[];
    get vertices(): TPoint[];
    protected computePressure(distance: number): number;
    protected filterPointByAcquisitionDelta(point: TPointer): boolean;
    addPointer(pointer: TPointer): void;
    overlaps(box: TBox): boolean;
    clone(): OIStroke;
    formatToSend(): TStrokeToSend;
    toJSON(): PartialDeep<OIStroke>;
    static create(partial: PartialDeep<OIStroke>): OIStroke;
}
/**
 * @group Symbol
 * @group Utils
 */
declare function convertPartialStrokesToOIStrokes(json: PartialDeep<TStroke>[]): OIStroke[];

/**
 * @group Symbol
 */
declare enum RecognizedKind {
    Text = "text",
    Line = "line",
    PolyEdge = "polyedge",
    Arc = "arc",
    Circle = "circle",
    Ellipse = "ellipse",
    Polygone = "polygone"
}
/**
 * @group Symbol
 */
declare abstract class OIRecognizedBase<K = RecognizedKind> extends OISymbolBase<SymbolType.Recognized> {
    readonly kind: K;
    strokes: OIStroke[];
    constructor(kind: K, strokes: OIStroke[], style?: PartialDeep<TStyle>);
    get vertices(): TPoint[];
    get bounds(): Box;
    get snapPoints(): TPoint[];
    updateChildrenStyle(): void;
    overlaps(box: TBox): boolean;
    containsStroke(strokeId: string): boolean;
    removeStrokes(strokeIds: string[]): OIStroke[];
}

/**
 * @group Symbol
 */
declare class OIRecognizedArc extends OIRecognizedBase<RecognizedKind.Arc> {
    readonly isClosed = false;
    constructor(strokes: OIStroke[], style?: PartialDeep<TStyle>);
    clone(): OIRecognizedArc;
    toJSON(): PartialDeep<OIRecognizedArc>;
    static create(partial: PartialDeep<OIRecognizedArc>): OIRecognizedArc;
}

/**
 * @group Symbol
 */
declare class OIRecognizedCircle extends OIRecognizedBase<RecognizedKind.Circle> {
    readonly isClosed = true;
    constructor(strokes: OIStroke[], style?: PartialDeep<TStyle>);
    clone(): OIRecognizedCircle;
    toJSON(): PartialDeep<OIRecognizedCircle>;
    static create(partial: PartialDeep<OIRecognizedCircle>): OIRecognizedCircle;
}

/**
 * @group Symbol
 */
declare class OIRecognizedEllipse extends OIRecognizedBase<RecognizedKind.Ellipse> {
    readonly isClosed = true;
    constructor(strokes: OIStroke[], style?: PartialDeep<TStyle>);
    clone(): OIRecognizedEllipse;
    toJSON(): PartialDeep<OIRecognizedEllipse>;
    static create(partial: PartialDeep<OIRecognizedEllipse>): OIRecognizedEllipse;
}

/**
 * @group Symbol
 */
declare class OIRecognizedLine extends OIRecognizedBase<RecognizedKind.Line> {
    readonly isClosed = false;
    constructor(strokes: OIStroke[], style?: PartialDeep<TStyle>);
    clone(): OIRecognizedLine;
    toJSON(): PartialDeep<OIRecognizedLine>;
    static create(partial: PartialDeep<OIRecognizedLine>): OIRecognizedLine;
}

/**
 * @group Symbol
 */
declare class OIRecognizedPolyLine extends OIRecognizedBase<RecognizedKind.PolyEdge> {
    readonly isClosed = false;
    constructor(strokes: OIStroke[], style?: PartialDeep<TStyle>);
    clone(): OIRecognizedPolyLine;
    toJSON(): PartialDeep<OIRecognizedPolyLine>;
    static create(partial: PartialDeep<OIRecognizedPolyLine>): OIRecognizedPolyLine;
}

/**
 * @group Symbol
 */
declare class OIRecognizedPolygon extends OIRecognizedBase<RecognizedKind.Polygone> {
    readonly isClosed = true;
    constructor(strokes: OIStroke[], style?: PartialDeep<TStyle>);
    clone(): OIRecognizedPolygon;
    toJSON(): PartialDeep<OIRecognizedPolygon>;
    static create(partial: PartialDeep<OIRecognizedPolygon>): OIRecognizedPolygon;
}

/**
 * @group Symbol
 */
declare class OIRecognizedText extends OIRecognizedBase<RecognizedKind.Text> {
    readonly isClosed = false;
    decorators: OIDecorator[];
    baseline: number;
    xHeight: number;
    label?: string;
    constructor(strokes: OIStroke[], lines: {
        baseline: number;
        xHeight: number;
    }, style?: PartialDeep<TStyle>);
    clone(): OIRecognizedText;
    toJSON(): PartialDeep<OIRecognizedText>;
    static create(partial: PartialDeep<OIRecognizedText>): OIRecognizedText;
}

/**
 * @group Symbol
 */
type TOISymbolChar = {
    id: string;
    label: string;
    fontSize: number;
    fontWeight: "normal" | "bold";
    color: string;
    bounds: TBox;
};
/**
 * @group Symbol
 */
declare class OIText extends OISymbolBase<SymbolType.Text> {
    readonly isClosed = true;
    point: TPoint;
    chars: TOISymbolChar[];
    decorators: OIDecorator[];
    bounds: Box;
    rotation?: {
        degree: number;
        center: TPoint;
    };
    constructor(chars: TOISymbolChar[], point: TPoint, bounds: TBox, style?: PartialDeep<TStyle>);
    get label(): string;
    get vertices(): TPoint[];
    get snapPoints(): TPoint[];
    protected getCharCorners(char: TOISymbolChar): TPoint[];
    updateChildrenStyle(): void;
    updateChildrenFont({ fontSize, fontWeight }: {
        fontSize?: number;
        fontWeight?: "normal" | "bold";
    }): void;
    getCharsOverlaps(points: TPoint[]): TOISymbolChar[];
    overlaps(box: TBox): boolean;
    clone(): OIText;
    toJSON(): PartialDeep<OIText>;
    static create(partial: PartialDeep<OIText>): OIText;
}

/**
 * @group Symbol
 */
declare class OISymbolGroup extends OISymbolBase<SymbolType.Group> {
    readonly isClosed = false;
    children: TOISymbol[];
    decorators: OIDecorator[];
    constructor(children: TOISymbol[], style?: PartialDeep<TStyle>);
    get snapPoints(): TPoint[];
    get vertices(): TPoint[];
    get bounds(): Box;
    updateChildrenStyle(): void;
    overlaps(box: TBox): boolean;
    containsSymbol(strokeId: string): boolean;
    containsOnlyStroke(): boolean;
    extractText(): OIText[];
    extractStrokes(): OIStroke[];
    removeChilds(symbolIds: string[]): OISymbolGroup;
    static containsOnlyStroke(group: OISymbolGroup): boolean;
    static extractText(group: OISymbolGroup): OIText[];
    static extractStrokes(group: OISymbolGroup): OIStroke[];
    static containsSymbol(group: OISymbolGroup, symbolId: string): boolean;
    static removeChilds(group: OISymbolGroup, symbolIds: string[]): OISymbolGroup;
    clone(): OISymbolGroup;
    toJSON(): PartialDeep<OISymbolGroup>;
}

/**
 * @group Symbol
 */
declare class OIEraser extends OISymbolBase<SymbolType.Eraser> {
    readonly isClosed = false;
    pointers: TPointer[];
    constructor();
    get bounds(): Box;
    get vertices(): TPoint[];
    get snapPoints(): TPoint[];
    clone(): OISymbolBase;
    overlaps(box: TBox): boolean;
    toJSON(): PartialDeep<OIEraser>;
}

/**
 * @group Symbol
 */
type TOIEdge = OIEdgeArc | OIEdgeLine | OIEdgePolyLine;
/**
 * @group Symbol
 */
type TOIShape = OIShapeCircle | OIShapeEllipse | OIShapePolygon;
/**
 * @group Symbol
 */
type TOIRecognized = OIRecognizedText | OIRecognizedArc | OIRecognizedCircle | OIRecognizedEllipse | OIRecognizedLine | OIRecognizedPolyLine | OIRecognizedPolygon;
/**
 * @group Symbol
 */
type TOISymbol = TOIEdge | TOIShape | OIStroke | OISymbolGroup | OIText | TOIRecognized;

/**
 * @group Utils
 */
declare function computeDistance(p1: TPoint, p2: TPoint): number;
/**
 * @group Utils
 */
declare function computeAngleAxeRadian(begin: TPoint, end: TPoint): number;
/**
 * @group Utils
 */
declare function createPointsOnSegment(p1: TPoint, p2: TPoint, spaceBetweenPoint?: number): TPoint[];
/**
 * @group Utils
 */
declare function scalaire(v1: TPoint, v2: TPoint): number;
/**
 * @group Utils
 */
declare function computeNearestPointOnSegment(p: TPoint, seg: TSegment): TPoint;
/**
 * @group Utils
 */
declare function isPointInsideBox(point: TPoint, box: TBox): boolean;
/**
 * @group Utils
 */
declare function convertRadianToDegree(radian: number): number;
/**
 * @group Utils
 */
declare function convertDegreeToRadian(degree: number): number;
/**
 * @group Utils
 */
declare function computeRotatedPoint(point: TPoint, center: TPoint, radian: number): TPoint;
/**
 * @group Utils
 */
declare function computePointOnEllipse(center: TPoint, radiusX: number, radiusY: number, phi: number, theta: number): TPoint;
/**
 * @group Utils
 */
declare function computeDistanceBetweenPointAndSegment(p: TPoint, seg: TSegment): number;
/**
 * @group Utils
 */
declare function findIntersectionBetween2Segment(seg1: TSegment, seg2: TSegment): TPoint | undefined;
/**
 * @group Utils
 */
declare function findIntersectBetweenSegmentAndCircle(seg: TSegment, c: TPoint, r: number): TPoint[];
/**
 * @group Utils
 */
declare function computeAngleRadian(p1: TPoint, center: TPoint, p2: TPoint): number;
/**
 * @group Utils
 */
declare function getClosestPoints(points1: TPoint[], points2: TPoint[]): {
    p1: TPoint;
    p2: TPoint;
};
/**
 * @group Utils
 */
declare function getClosestPoint(points: TPoint[], point: TPoint): {
    point?: TPoint;
    index: number;
};
/**
 * @group Utils
 */
declare function isPointInsidePolygon(point: TPoint, points: TPoint[]): boolean;

/**
 * @group Utils
 */
declare const isVersionSuperiorOrEqual: (source: string, target: string) => boolean;

/**
 * @group Utils
 */
declare function computeHmac(message: string, applicationKey: string, hmacKey: string): Promise<string>;

/**
 * @group Utils
 */
declare function convertMillimeterToPixel(mm: number): number;
/**
 * @group Utils
 */
declare function convertPixelToMillimeter(px: number): number;
/**
 * @group Utils
 */
declare function convertBoundingBoxMillimeterToPixel(box?: TBox): TBox;

/**
 * @group Utils
 */
declare function createUUID(): string;

/**
 * @group Utils
 */
declare function isValidNumber(x: unknown): boolean;
/**
 * @group Utils
 */
declare function isBetween(val: number, min: number, max: number): boolean;
/**
 * @group Utils
 */
declare function computeAverage(arr: number[]): number;

/**
 * @group Utils
 */
declare const mergeDeep: (target: any, ...sources: any[]) => any;
/**
 * @group Utils
 */
declare const isDeepEqual: (object1: any, object2: any) => boolean;

/**
 * @group History
 */
type THistoryContext = {
    canUndo: boolean;
    canRedo: boolean;
    empty: boolean;
    stackIndex: number;
    possibleUndoCount: number;
};
/**
 * @group History
 */
declare const getInitialHistoryContext: () => THistoryContext;

/**
 * @group Exports
 * @remarks List all supported MIME types for export. Please note, the MIME types supported depend on the recognition type configured
 */
declare enum ExportType {
    JIIX = "application/vnd.myscript.jiix",
    TEXT = "text/plain",
    LATEX = "application/x-latex",
    MATHML = "application/mathml+xml",
    SVG = "image/svg+xml",
    OFFICE_DOCUMENT = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
}
/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix  Element type}
 */
declare enum JIIXELementType {
    Text = "Text",
    Node = "Node",
    Edge = "Edge",
    RawContent = "Raw Content"
}
/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#diagram-item-blocks | Element node kind}
 */
declare enum JIIXNodeKind {
    Circle = "circle",
    Ellipse = "ellipse",
    Rectangle = "rectangle",
    Triangle = "triangle",
    Parallelogram = "parallelogram",
    Polygon = "polygon",
    Rhombus = "rhombus"
}
/**
 * @group Exports
 */
declare enum JIIXEdgeKind {
    Line = "line",
    PolyEdge = "polyedge",
    Arc = "arc"
}
/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#stroke-item | Stroke item}
 */
type TJIIXStrokeItem = {
    type: "stroke";
    id: string;
    "full-id"?: string;
    timestamp?: string;
    X?: number[];
    Y?: number[];
    F?: number[];
    T?: number[];
};
/**
 * @group Exports
 */
type TJIIXBase = {
    "bounding-box"?: TBox;
    items?: TJIIXStrokeItem[];
};
/**
 * @group Exports
 */
type TJIIXElementBase<T = string> = TJIIXBase & {
    id: string;
    type: T;
};
/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#word-object | Word object}
 */
type TJIIXWord = TJIIXBase & {
    id?: string;
    label: string;
    candidates?: string[];
    "first-char"?: number;
    "last-char"?: number;
};
/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#character-object | Character object}
 */
type TJIIXChar = TJIIXBase & {
    label: string;
    candidates?: string[];
    word: number;
    grid: TPoint[];
};
/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#text-interpretation | Text Element }
 */
type TJIIXLine = {
    "baseline-y": number;
    "first-char"?: number;
    "last-char"?: number;
    "x-height": number;
};
/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#text-interpretation | Text Element }
 */
type TJIIXTextElement = TJIIXElementBase<JIIXELementType.Text> & {
    id: string;
    "bounding-box"?: TBox;
    label: string;
    words?: TJIIXWord[];
    chars?: TJIIXChar[];
    lines?: TJIIXLine[];
};
/**
 * @group Exports
 */
type TJIIXNodeElementBase<K = string> = TJIIXElementBase<JIIXELementType.Node> & {
    id: string;
    kind: K;
};
/**
 * @group Exports
 */
type TJIIXNodeCircle = TJIIXNodeElementBase<JIIXNodeKind.Circle> & {
    id: string;
    cx: number;
    cy: number;
    r: number;
};
/**
 * @group Exports
 */
type TJIIXNodeEllipse = TJIIXNodeElementBase<JIIXNodeKind.Ellipse> & {
    id: string;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    orientation: number;
};
/**
 * @group Exports
 */
type TJIIXNodeRectangle = TJIIXNodeElementBase<JIIXNodeKind.Rectangle> & {
    id: string;
    height: number;
    width: number;
    x: number;
    y: number;
};
/**
 * @group Exports
 */
type TJIIXNodeTriangle = TJIIXNodeElementBase<JIIXNodeKind.Triangle> & {
    id: string;
    points: number[];
};
/**
 * @group Exports
 */
type TJIIXNodeParrallelogram = TJIIXNodeElementBase<JIIXNodeKind.Parallelogram> & {
    id: string;
    points: number[];
};
/**
 * @group Exports
 */
type TJIIXNodePolygon = TJIIXNodeElementBase<JIIXNodeKind.Polygon> & {
    id: string;
    points: number[];
};
/**
 * @group Exports
 */
type TJIIXNodeRhombus = TJIIXNodeElementBase<JIIXNodeKind.Rhombus> & {
    id: string;
    points: number[];
};
/**
 * @group Exports
 */
type TJIIXNodeElement = TJIIXNodeCircle | TJIIXNodeEllipse | TJIIXNodeRectangle | TJIIXNodeTriangle | TJIIXNodeParrallelogram | TJIIXNodePolygon | TJIIXNodeRhombus;
/**
 * @group Exports
 */
type TJIIXEdgeElementBase<K = string> = TJIIXElementBase<JIIXELementType.Edge> & {
    kind: K;
};
/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#line-item | Element line}
 */
type TJIIXEdgeLine = TJIIXEdgeElementBase<JIIXEdgeKind.Line> & {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    p1Decoration?: EdgeDecoration;
    p2Decoration?: EdgeDecoration;
};
/**
 * @group Exports
 */
type TJIIXEdgePolyEdge = TJIIXEdgeElementBase<JIIXEdgeKind.PolyEdge> & {
    edges: TJIIXEdgeLine[];
};
/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix/#arc-item | Element arc}
 */
type TJIIXEdgeArc = TJIIXEdgeElementBase<JIIXEdgeKind.Arc> & {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    phi: number;
    startAngle: number;
    sweepAngle: number;
    startDecoration?: EdgeDecoration;
    endDecoration?: EdgeDecoration;
};
/**
 * @group Exports
 */
type TJIIXEdgeElement = TJIIXEdgeLine | TJIIXEdgePolyEdge | TJIIXEdgeArc;
/**
 * @group Exports
 * @remarks {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/web/jiix | Exports}
 */
type TJIIXElement = TJIIXTextElement | TJIIXNodeElement | TJIIXEdgeElement;
/**
 * @group Exports
 */
type TJIIXExport = {
    type: string;
    id: string;
    "bounding-box"?: TBox;
    version: string;
    elements?: TJIIXElement[];
    label?: string;
    words?: TJIIXWord[];
    chars?: TJIIXChar[];
};
/**
 * @group Exports
 * @remarks
 * List all supported MIME types for export.
 *
 * Attention the MIME types supported depend on the {@link TRecognitionType | type of recognition}
 *
 * {@link https://developer.preprod.myscript.com/docs/interactive-ink/latest/reference/jiix | Documentation}
 */
type TExport = {
    /** @hidden */
    [key: string]: unknown;
    /**
     * @remarks vnd.myscript.jiix is used for text and raw-content exports
     */
    "application/vnd.myscript.jiix"?: TJIIXExport;
    /**
     * @remarks text/plain is only use for text export
     */
    "text/plain"?: string;
    /**
     * @remarks x-latex is only use for math export
     * @see {@link https://katex.org/docs/browser.html | katex} to render
     */
    "application/x-latex"?: string;
    /**
     * @remarks mathml+xml is only use for math export
     * @see {@link https://www.w3.org/Math/whatIsMathML.html | Mathematical Markup Language}
     */
    "application/mathml+xml"?: string;
    /**
     * @remarks svg+xml is only use for diagram export
     */
    "image/svg+xml"?: string;
    /**
     * @remarks vnd.openxmlformats-officedocument.presentationml.presentation is only use for diagram export
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Blob | Blob}
     */
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"?: Blob;
};

/**
 * @group Model
 */
type TRecognitionPositions = {
    lastSentPosition: number;
    lastReceivedPosition: number;
};
/**
 * @group Model
 */
declare class Model {
    #private;
    readonly creationTime: number;
    modificationDate: number;
    positions: TRecognitionPositions;
    currentSymbol?: Stroke;
    symbols: Stroke[];
    exports?: TExport;
    converts?: TExport;
    width: number;
    height: number;
    rowHeight: number;
    idle: boolean;
    constructor(width?: number, height?: number, rowHeight?: number, creationDate?: number);
    protected computePressure(distance: number, globalDistance: number): number;
    protected filterPointByAcquisitionDelta(stroke: Stroke, point: TPointer, lastPointer?: TPointer): boolean;
    getStrokeFromPoint(point: TPoint): Stroke[];
    addPoint(stroke: Stroke, pointer: TPointer): void;
    addStroke(stroke: Stroke): void;
    updateStroke(updatedStroke: Stroke): void;
    removeStroke(id: string): void;
    removeStrokesFromPoint(point: TPoint): string[];
    extractUnsentStrokes(): Stroke[];
    initCurrentStroke(point: TPointer, pointerType: string, style: TPenStyle, dpi?: number): void;
    appendToCurrentStroke(point: TPointer): void;
    endCurrentStroke(point: TPointer): void;
    updatePositionSent(position?: number): void;
    updatePositionReceived(): void;
    mergeExport(exports: TExport): void;
    mergeConvert(converts: TExport): void;
    clone(): Model;
    clear(): void;
}

/**
 * @group Model
 */
declare class OIModel {
    #private;
    readonly creationTime: number;
    modificationDate: number;
    currentSymbol?: TOISymbol;
    symbols: TOISymbol[];
    exports?: TExport;
    converts?: TExport;
    width: number;
    height: number;
    rowHeight: number;
    idle: boolean;
    constructor(width?: number, height?: number, rowHeight?: number, creationDate?: number);
    get symbolsSelected(): TOISymbol[];
    get symbolsToDelete(): TOISymbol[];
    selectSymbol(id: string): void;
    unselectSymbol(id: string): void;
    resetSelection(): void;
    getRootSymbol(id: string): TOISymbol | undefined;
    getSymbolRowIndex(symbol: TOISymbol): number;
    getSymbolsByRowOrdered(): {
        rowIndex: number;
        symbols: TOISymbol[];
    }[];
    roundToLineGuide(y: number): number;
    isSymbolAbove(source: TOISymbol, target: TOISymbol): boolean;
    isSymbolInRow(source: TOISymbol, target: TOISymbol): boolean;
    isSymbolBelow(source: TOISymbol, target: TOISymbol): boolean;
    getFirstSymbol(symbols: TOISymbol[]): TOISymbol | undefined;
    getLastSymbol(symbols: TOISymbol[]): TOISymbol | undefined;
    addSymbol(symbol: TOISymbol): void;
    updateSymbol(updatedSymbol: TOISymbol): void;
    replaceSymbol(id: string, symbols: TOISymbol[]): void;
    changeOrderSymbol(id: string, position: "first" | "last" | "forward" | "backward"): void;
    removeSymbol(id: string): void;
    extractDifferenceSymbols(model: OIModel): {
        added: TOISymbol[];
        removed: TOISymbol[];
    };
    mergeExport(exports: TExport): void;
    clone(): OIModel;
    clear(): void;
}

/**
 * @group Gesture
 * @summary List all authorized gestures
 */
type TGestureType = "UNDERLINE" | "SCRATCH" | "JOIN" | "INSERT" | "STRIKETHROUGH" | "SURROUND";
/**
 * @group Gesture
 * @remarks
 *  when gestureType = "INSERT", subStrokes represent the two parts
 *  when gestureType = "SCRATCH", subStrokes represent the part to substract at the stroke corresponding fullStrokeId
 */
type TGesture = {
    gestureType: TGestureType;
    gestureStrokeId: string;
    strokeIds: string[];
    strokeBeforeIds: string[];
    strokeAfterIds: string[];
    subStrokes?: {
        fullStrokeId: string;
        x: number[];
        y: number[];
    }[];
};
/**
 * @group Gesture
 * @summary
 * List all action allowed on surround detected
 * @remarks
 * only usable in the case of offscreen
 */
declare enum SurroundAction {
    Select = "select",
    Surround = "surround",
    Highlight = "highlight"
}
/**
 * @group Gesture
 * @summary
 * List all action allowed on strikeThrough detected
 * @remarks
 * only usable in the case of offscreen
 */
declare enum StrikeThroughAction {
    Erase = "erase",
    Draw = "draw"
}
/**
 * @group Gesture
 * @summary
 * List all action allowed on split detected
 * @remarks
 * only usable in the case of offscreen
 */
declare enum InsertAction {
    /**
     * @remarks Add line break on gesture place
     */
    LineBreak = "line-break",
    /**
     * @remarks Insert place in gesture place
     */
    Insert = "insert"
}

/**
 * @group Gesture
 * @source
 */
type TGestureConfiguration = {
    surround: SurroundAction;
    strikeThrough: StrikeThroughAction;
    insert: InsertAction;
};
/**
 * @group Gesture
 * @source
 */
declare const DefaultGestureConfiguration: TGestureConfiguration;

/**
 * @group Renderer
 */
type TGuidesConfiguration = {
    enable: boolean;
    gap: number;
};
/**
 * @group Renderer
 * @source
 */
declare const DefaultGuidesConfiguration: TGuidesConfiguration;
/**
 * @group Renderer
 */
type TRendererConfiguration = {
    minHeight: number;
    minWidth: number;
    guides: TGuidesConfiguration;
};
/**
 * @group Renderer
 * @source
 */
declare const DefaultRendererConfiguration: TRendererConfiguration;
/**
 * @group Renderer
 */
type TOIRendererConfiguration = TRendererConfiguration & {
    guides: TGuidesConfiguration & {
        type: "line" | "grid" | "point";
    };
};
/**
 * @group Renderer
 * @source
 */
declare const DefaultOIRendererConfiguration: TOIRendererConfiguration;

/**
 * @group Renderer
 */
declare class CanvasRendererShape {
    #private;
    symbols: {
        table: string;
        ellipse: string;
        line: string;
    };
    protected phi(angle: number): number;
    protected drawEllipseArc(context2D: CanvasRenderingContext2D, shapeEllipse: TCanvasShapeEllipseSymbol): TPoint[];
    protected drawLine(context2D: CanvasRenderingContext2D, p1: TPoint, p2: TPoint): void;
    protected drawArrowHead(context2D: CanvasRenderingContext2D, headPoint: TPoint, angle: number, length: number): void;
    protected drawShapeEllipse(context2D: CanvasRenderingContext2D, shapeEllipse: TCanvasShapeEllipseSymbol): void;
    protected drawShapeLine(context2D: CanvasRenderingContext2D, shapeLine: TCanvasShapeLineSymbol): void;
    draw(context2D: CanvasRenderingContext2D, symbol: TSymbol): void;
}

/**
 * @group Renderer
 */
declare class CanvasRendererStroke {
    #private;
    protected renderArc(context2d: CanvasRenderingContext2D, center: TPointer, radius: number): void;
    protected renderLine(context2d: CanvasRenderingContext2D, begin: TPointer, end: TPointer, width: number): void;
    protected renderFinal(context2d: CanvasRenderingContext2D, begin: TPointer, end: TPointer, width: number): void;
    protected renderQuadratic(context2d: CanvasRenderingContext2D, begin: TPointer, end: TPointer, ctrl: TPointer, width: number): void;
    draw(context2d: CanvasRenderingContext2D, stroke: Stroke): void;
}

/**
 * @group Renderer
 */
declare class CanvasRendererText {
    #private;
    symbols: {
        char: string;
        string: string;
        textLine: string;
    };
    protected drawUnderline(context2D: CanvasRenderingContext2D, textUnderline: TCanvasTextUnderlineSymbol, underline: TCanvasUnderLineSymbol): void;
    protected drawText(context2D: CanvasRenderingContext2D, text: TCanvasTextSymbol): void;
    protected drawTextLine(context2D: CanvasRenderingContext2D, textUnderline: TCanvasTextUnderlineSymbol): void;
    draw(context2D: CanvasRenderingContext2D, symbol: TSymbol): void;
}

/**
 * @group Renderer
 */
declare class CanvasRenderer {
    #private;
    configuration: Omit<TRendererConfiguration, "guides">;
    strokeRenderer: CanvasRendererStroke;
    shapeRenderer: CanvasRendererShape;
    textRenderer: CanvasRendererText;
    context: {
        parent: HTMLElement;
        renderingCanvas: HTMLCanvasElement;
        renderingCanvasContext: CanvasRenderingContext2D;
        capturingCanvas: HTMLCanvasElement;
        capturingCanvasContext: CanvasRenderingContext2D;
    };
    constructor(config: Omit<TRendererConfiguration, "guides">);
    protected createCanvas(type: string): HTMLCanvasElement;
    protected resizeContent(): void;
    protected drawSymbol(context2D: CanvasRenderingContext2D, symbol: TSymbol): void;
    init(element: HTMLElement): void;
    drawModel(model: Model): void;
    drawPendingStroke(stroke: Stroke | undefined): void;
    resize(model: Model): void;
    destroy(): void;
}

/**
 * @group Renderer
 */
declare class OISVGRenderer {
    #private;
    groupGuidesId: string;
    configuration: TOIRendererConfiguration;
    parent: HTMLElement;
    layer: SVGSVGElement;
    definitionGroup: SVGGElement;
    verticalGuides: number[];
    horizontalGuides: number[];
    constructor(configuration: TOIRendererConfiguration);
    protected initLayer(): void;
    protected createDefs(): SVGDefsElement;
    protected createFilters(): SVGGElement;
    protected drawGuides(): void;
    protected removeGuides(): void;
    protected createSVGTools(): SVGGElement;
    init(element: HTMLElement): void;
    getAttribute(id: string, name: string): string | undefined | null;
    setAttribute(id: string, name: string, value: string): void;
    buildElementFromSymbol(symbol: TOISymbol | OIEraser): SVGGraphicsElement | undefined;
    prependElement(el: Element): void;
    changeOrderSymbol(symbolToMove: TOISymbol, position: "first" | "last" | "forward" | "backward"): void;
    appendElement(el: Element): void;
    removeElement(id: string): void;
    drawSymbol(symbol: TOISymbol | OIEraser): SVGGraphicsElement | undefined;
    replaceSymbol(id: string, symbols: TOISymbol[]): SVGGraphicsElement[] | undefined;
    removeSymbol(id: string): void;
    drawCircle(point: TPoint, radius: number, attrs?: {
        [key: string]: string;
    }): void;
    drawRect(box: TBox, attrs?: {
        [key: string]: string;
    }): void;
    drawLine(p1: TPoint, p2: TPoint, attrs?: {
        [key: string]: string;
    }): void;
    drawConnectionBetweenBox(id: string, box1: TBox, box2: TBox, attrs?: {
        [key: string]: string;
    }): void;
    resize(height: number, width: number): void;
    getElementById(id: string): SVGGraphicsElement | null;
    getElements({ tagName, attrs }: {
        tagName?: string;
        attrs?: {
            [key: string]: string;
        };
    }): NodeListOf<Element>;
    clearElements({ tagName, attrs }: {
        tagName?: string;
        attrs?: {
            [key: string]: string;
        };
    }): void;
    clear(): void;
    destroy(): void;
}

/**
 * @group Renderer
 */
declare const OISVGRendererConst: {
    arrowHeadStartMarker: string;
    arrowHeadEndMaker: string;
    selectionFilterId: string;
    removalFilterId: string;
    crossMarker: string;
    noSelection: string;
};

/**
 * @group Renderer
 */
declare class OISVGRendererDecoratorUtil {
    static getSVGElement(decorator: OIDecorator, symbol: TOISymbol): SVGGeometryElement | undefined;
}

/**
 * @group Renderer
 */
declare class OISVGRendererEdgeUtil {
    static getLinePath(line: OIEdgeLine): string;
    static getPolyLinePath(line: OIEdgePolyLine): string;
    static getArcPath(arc: OIEdgeArc): string;
    static getSVGPath(edge: TOIEdge): string;
    static getSVGElement(edge: TOIEdge): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class OISVGRendererEraserUtil {
    static getSVGPath(eraser: OIEraser): string;
    static getSVGElement(eraser: OIEraser): SVGPathElement;
}

/**
 * @group Renderer
 */
declare class OISVGRendererGroupUtil {
    static getChildElement(symbol: TOISymbol | OIEraser): SVGGraphicsElement | undefined;
    static getSVGElement(symbolGroup: OISymbolGroup): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class OISVGRendererTextUtil {
    static getSVGElement(text: OIText): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class OISVGRendererShapeUtil {
    static getPolygonePath(polygon: OIShapePolygon): string;
    static getCirclePath(circle: OIShapeCircle): string;
    static getEllipsePath(ellipse: OIShapeEllipse): string;
    static getSVGPath(shape: TOIShape): string;
    static getSVGElement(shape: TOIShape): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class OISVGRendererStrokeUtil {
    protected static getArcPath(center: TPointer, radius: number): string;
    protected static getLinePath(begin: TPointer, end: TPointer, width: number): string;
    protected static getFinalPath(begin: TPointer, end: TPointer, width: number): string;
    protected static getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string;
    static getSVGPath(stroke: OIStroke): string;
    static getSVGElement(stroke: OIStroke): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class OISVGRendererRecognizedUtil {
    static getSVGElement(recognizedSymbol: TOIRecognized): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class SVGBuilder {
    static createLayer(boundingBox: TBox, attrs?: {
        [key: string]: string;
    }): SVGSVGElement;
    static createFilter(id: string, attrs?: {
        [key: string]: string;
    }): SVGFilterElement;
    static createDefs(): SVGDefsElement;
    static createMarker(id: string, attrs?: {
        [key: string]: string;
    }): SVGMarkerElement;
    static createComponentTransfert(): SVGFEComponentTransferElement;
    static createDropShadow({ dx, dy, deviation, color, opacity }: {
        dx?: number | undefined;
        dy?: number | undefined;
        deviation?: number | undefined;
        color?: string | undefined;
        opacity?: number | undefined;
    }): SVGFEDropShadowElement;
    static createTransfertFunctionTable(type: "feFuncA" | "feFuncB" | "feFuncG" | "feFuncR", values: string): SVGFEFuncAElement;
    static createGroup(attrs?: {
        [key: string]: string;
    }): SVGGElement;
    static createLine(p1: TPoint, p2: TPoint, attrs?: {
        [key: string]: string;
    }): SVGLineElement;
    static createCircle(p: TPoint, r: number, attrs?: {
        [key: string]: string;
    }): SVGCircleElement;
    static createPath(attrs?: {
        [key: string]: string;
    }): SVGPathElement;
    static createPolygon(points: number[], attrs?: {
        [key: string]: string;
    }): SVGPolylineElement;
    static createRect(box: TBox, attrs?: {
        [key: string]: string;
    }): SVGRectElement;
    static createTSpan(text: string, attrs?: {
        [key: string]: string;
    }): SVGTSpanElement;
    static createForeignObject(box: TBox, node: HTMLElement, attrs?: {
        [key: string]: string;
    }): SVGForeignObjectElement;
    static createText(p: TPoint, text: string, attrs?: {
        [key: string]: string;
    }): SVGTextElement;
}

/**
 * @group Renderer
 */
declare class SVGStroker {
    protected getArcPath(center: TPointer, radius: number): string;
    protected getLinePath(begin: TPointer, end: TPointer, width: number): string;
    protected getFinalPath(begin: TPointer, end: TPointer, width: number): string;
    protected getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string;
    protected buildSVGPath(stroke: TStroke): string;
    drawStroke(svgElement: SVGElement, stroke: TStroke, attrs?: {
        name: string;
        value: string;
    }[]): void;
}

/**
 * @group Renderer
 */
declare class WSSVGRenderer {
    #private;
    config: TRendererConfiguration;
    stroker: SVGStroker;
    context: {
        parent: HTMLElement;
    };
    constructor(config: TRendererConfiguration);
    init(element: HTMLElement): void;
    protected drawStroke(svgElement: SVGElement, stroke: TStroke): void;
    protected replaceAll(layerName: string, update: TUpdatePatchReplaceAll): void;
    protected replaceElement(update: TUpdatePatchReplaceELement): void;
    protected appendChild(layerName: string, update: TUpdatePatchAppendChild): void;
    protected removeChild(update: TUpdatePatchRemoveChild): void;
    protected removeElement(update: TUpdatePatchRemoveElement): void;
    protected insertBefore(update: TUpdatePatchInsertBefore): void;
    protected setAttribute(update: TUpdatePatchSetAttribut): void;
    protected removeAttribute(update: TUpdatePatchRemoveAttribut): void;
    updateLayer(layerName: string, update: TUpdatePatch): void;
    updatesLayer(layerName: string, updates: TUpdatePatch[]): void;
    clearPendingStroke(): void;
    drawPendingStroke(stroke: TStroke): void;
    clearErasingStrokes(): void;
    resize(model: Model): void;
    destroy(): void;
}

/**
 * @group Manager
 */
declare class OIConversionManager {
    #private;
    editor: EditorOffscreen;
    constructor(editor: EditorOffscreen);
    get configuration(): {
        size: number | "auto";
        weight: "bold" | "normal" | "auto";
    };
    get model(): OIModel;
    get rowHeight(): number;
    protected computeFontSize(chars: TJIIXChar[]): number;
    buildChar(char: TJIIXChar, strokes: OIStroke[], fontSize: number): TOISymbolChar;
    buildText(word: TJIIXWord, chars: TJIIXChar[], strokes: OIStroke[], size: number | "auto"): OIText;
    convertText(text: TJIIXTextElement, strokes: OIStroke[], onlyText: boolean): {
        symbol: OIText;
        strokes: OIStroke[];
    }[] | undefined;
    buildCircle(circle: TJIIXNodeCircle, strokes: OIStroke[]): OIShapeCircle;
    buildEllipse(ellipse: TJIIXNodeEllipse, strokes: OIStroke[]): OIShapeEllipse;
    buildRectangle(rectangle: TJIIXNodeRectangle, strokes: OIStroke[]): OIShapePolygon;
    buildPolygon(polygon: TJIIXNodePolygon, strokes: OIStroke[]): OIShapePolygon;
    buildRhombus(polygon: TJIIXNodeRhombus, strokes: OIStroke[]): OIShapePolygon;
    buildTriangle(polygon: TJIIXNodeTriangle, strokes: OIStroke[]): OIShapePolygon;
    buildParallelogram(polygon: TJIIXNodeParrallelogram, strokes: OIStroke[]): OIShapePolygon;
    convertNode(node: TJIIXNodeElement, strokes: OIStroke[]): {
        symbol: TOIShape;
        strokes: OIStroke[];
    } | undefined;
    buildLine(line: TJIIXEdgeLine, strokes: OIStroke[]): OIEdgeLine;
    buildPolyEdge(polyline: TJIIXEdgePolyEdge, strokes: OIStroke[]): OIEdgePolyLine;
    buildArc(arc: TJIIXEdgeArc, strokes: OIStroke[]): OIEdgeArc;
    convertEdge(edge: TJIIXEdgeElement, strokes: OIStroke[]): {
        symbol: TOIEdge;
        strokes: OIStroke[];
    } | undefined;
    apply(symbols?: TOISymbol[]): Promise<void>;
}

/**
 * @group Manager
 */
declare class OIResizeManager {
    #private;
    editor: EditorOffscreen;
    interactElementsGroup?: SVGElement;
    direction: ResizeDirection;
    boundingBox: Box;
    transformOrigin: TPoint;
    keepRatio: boolean;
    constructor(editor: EditorOffscreen);
    get model(): OIModel;
    protected applyToStroke(stroke: OIStroke, origin: TPoint, scaleX: number, scaleY: number): OIStroke;
    protected applyToShape(shape: TOIShape, origin: TPoint, scaleX: number, scaleY: number): TOIShape;
    protected applyToEdge(edge: TOIEdge, origin: TPoint, scaleX: number, scaleY: number): TOIEdge;
    protected applyOnText(text: OIText, origin: TPoint, scaleX: number, scaleY: number): OIText;
    protected applyOnGroup(group: OISymbolGroup, origin: TPoint, scaleX: number, scaleY: number): OISymbolGroup;
    protected applyOnRecognizedSymbol(recognizedSymbol: TOIRecognized, origin: TPoint, scaleX: number, scaleY: number): TOIRecognized;
    applyToSymbol(symbol: TOISymbol, origin: TPoint, scaleX: number, scaleY: number): TOISymbol;
    setTransformOrigin(id: string, originX: number, originY: number): void;
    scaleElement(id: string, sx: number, sy: number): void;
    start(target: Element, origin: TPoint): void;
    continue(point: TPoint): {
        scaleX: number;
        scaleY: number;
    };
    end(point: TPoint): Promise<void>;
}

/**
 * @group Manager
 */
declare class OIRotationManager {
    #private;
    editor: EditorOffscreen;
    interactElementsGroup?: SVGElement;
    center: TPoint;
    origin: TPoint;
    constructor(editor: EditorOffscreen);
    get model(): OIModel;
    protected applyToStroke(stroke: OIStroke, center: TPoint, angleRad: number): OIStroke;
    protected applyToShape(shape: TOIShape, center: TPoint, angleRad: number): TOIShape;
    protected applyToEdge(edge: TOIEdge, center: TPoint, angleRad: number): TOIEdge;
    protected applyOnText(text: OIText, center: TPoint, angleRad: number): OIText;
    protected applyOnGroup(group: OISymbolGroup, center: TPoint, angleRad: number): OISymbolGroup;
    protected applyOnRecognizedSymbol(strokeText: TOIRecognized, center: TPoint, angleRad: number): TOIRecognized;
    applyToSymbol(symbol: TOISymbol, center: TPoint, angleRad: number): TOISymbol;
    setTransformOrigin(id: string, originX: number, originY: number): void;
    rotateElement(id: string, degree: number): void;
    start(target: Element, origin: TPoint): void;
    continue(point: TPoint): number;
    end(point: TPoint): Promise<void>;
}

/**
 * @group Grabber
 */
type TListenerConfiguration = {
    capture: boolean;
    passive: boolean;
};
/**
 * @group Grabber
 * @source
 */
declare const DefaultListenerConfiguration: TListenerConfiguration;
/**
 * @group Grabber
 */
type TGrabberConfiguration = {
    listenerOptions: TListenerConfiguration;
    xyFloatPrecision: number;
    timestampFloatPrecision: number;
    delayLongTouch: number;
};
/**
 * @group Grabber
 * @source
 */
declare const DefaultGrabberConfiguration: TGrabberConfiguration;

type PointerInfo = {
    clientX: number;
    clientY: number;
    isPrimary: boolean;
    type: string;
    pointerType: string;
    target: HTMLElement;
    pointer: TPointer;
    button: number;
    buttons: number;
};
/**
 * @group Grabber
 */
declare class PointerEventGrabber {
    #private;
    protected configuration: TGrabberConfiguration;
    protected layerCapture: HTMLElement;
    protected capturing: boolean;
    protected pointerType?: string;
    protected prevent: (e: Event) => void;
    onPointerDown?: (info: PointerInfo) => void;
    onPointerMove?: (info: PointerInfo) => void;
    onPointerUp?: (info: PointerInfo) => void;
    onContextMenu?: (info: PointerInfo) => void;
    constructor(configuration: TGrabberConfiguration);
    protected roundFloat(oneFloat: number, requestedFloatPrecision: number): number;
    protected extractPointer(event: MouseEvent | TouchEvent): TPointer;
    protected getPointerInfos(evt: PointerEvent): PointerInfo;
    protected pointerDownHandler: (evt: PointerEvent) => void;
    protected pointerMoveHandler: (evt: PointerEvent) => void;
    protected pointerUpHandler: (evt: PointerEvent) => void;
    protected pointerOutHandler: (evt: PointerEvent) => void;
    protected contextMenuHandler: (evt: MouseEvent) => void;
    stopPointerEvent(): void;
    attach(layerCapture: HTMLElement): void;
    detach(): void;
}

/**
 * @group Manager
 */
declare class OISelectionManager {
    #private;
    grabber: PointerEventGrabber;
    editor: EditorOffscreen;
    startSelectionPoint?: TPoint;
    endSelectionPoint?: TPoint;
    selectedGroup?: SVGGElement;
    constructor(editor: EditorOffscreen);
    get model(): OIModel;
    get renderer(): OISVGRenderer;
    get rotator(): OIRotationManager;
    get translator(): OITranslateManager;
    get resizer(): OIResizeManager;
    get selectionBox(): Box | undefined;
    attach(layer: HTMLElement): void;
    detach(): void;
    drawSelectingRect(box: TBox): void;
    clearSelectingRect(): void;
    protected getPoint(ev: PointerEvent): TPoint;
    protected createTranslateRect(box: TBox): SVGRectElement;
    protected createRotateGroup(box: TBox): SVGGElement;
    protected createResizeGroup(box: TBox): SVGGElement;
    protected createInteractElementsGroup(symbols: TOISymbol[]): SVGGElement | undefined;
    protected createEdgeResizeGroup(edge: TOIEdge): SVGGElement;
    protected createInteractEdgeGroup(edge: TOIEdge): SVGGElement | undefined;
    drawSelectedGroup(symbols: TOISymbol[]): void;
    resetSelectedGroup(symbols: TOISymbol[]): void;
    removeSelectedGroup(): void;
    hideInteractElements(): void;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): TOISymbol[];
    end(info: PointerInfo): TOISymbol[];
    protected onContextMenu(info: PointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
declare class OITextManager {
    #private;
    editor: EditorOffscreen;
    constructor(editor: EditorOffscreen);
    get renderer(): OISVGRenderer;
    get rowHeight(): number;
    get model(): OIModel;
    protected drawSymbolHidden(text: OIText): SVGGElement;
    setCharsBounds(text: OIText, textGroupEl: SVGGElement): OIText;
    setBounds(text: OIText): void;
    getElementBoundingBox(textElement: SVGElement): Box;
    getBoundingBox(text: OIText): Box;
    getSpaceWidth(fontSize: number): number;
    updateBounds(textSymbol: OIText): OIText;
    moveTextAfter(text: OIText, tx: number): TOISymbol[] | undefined;
}

/**
 * @group Snap
 */
type TSnapConfiguration = {
    guide: boolean;
    symbol: boolean;
    angle: number;
};
/**
 * @group Snap
 * @source
 */
declare const DefaultSnapConfiguration: TSnapConfiguration;
/**
 * @group Snap
 */
declare class SnapConfiguration implements TSnapConfiguration {
    guide: boolean;
    symbol: boolean;
    angle: number;
    constructor(config?: PartialDeep<TSnapConfiguration>);
}

/**
 * @group Snap
 */
type TSnapNudge = TPoint;
/**
 * @group Snap
 */
type TSnapLineInfos = {
    nudge: TSnapNudge;
    verticales: TSegment[];
    horizontales: TSegment[];
};
/**
 * @group Snap
 */
declare class OISnapManager {
    #private;
    editor: EditorOffscreen;
    configuration: SnapConfiguration;
    constructor(editor: EditorOffscreen, config?: PartialDeep<TSnapConfiguration>);
    get model(): OIModel;
    get renderer(): OISVGRenderer;
    get selectionSnapPoints(): TPoint[];
    get otherSnapPoints(): TPoint[];
    get snapThreshold(): number;
    protected getNearestVerticalGuide(x: number): number;
    protected getNearestHorizontalGuide(y: number): number;
    protected getGuidePointToSnap(point: TPoint): TPoint;
    drawSnapToElementLines(lines: TSegment[]): void;
    clearSnapToElementLines(): void;
    protected getSnapLinesInfos(sourcePoints: TPoint[], targetPoints: TPoint[]): TSnapLineInfos;
    snapResize(point: TPoint, horizontal?: boolean, vertical?: boolean): TPoint;
    snapTranslate(tx: number, ty: number): TSnapNudge;
    snapRotation(angleDegree: number): number;
}

/**
 * @group Manager
 */
declare class OIWriteManager {
    #private;
    grabber: PointerEventGrabber;
    editor: EditorOffscreen;
    detectGesture: boolean;
    currentSymbolOrigin?: TPoint;
    constructor(editor: EditorOffscreen);
    get tool(): EditorWriteTool;
    set tool(wt: EditorWriteTool);
    get model(): OIModel;
    get renderer(): OISVGRenderer;
    get history(): OIHistoryManager;
    get gestureManager(): OIGestureManager;
    get snaps(): OISnapManager;
    get recognizer(): OIRecognizer;
    attach(layer: HTMLElement): void;
    detach(): void;
    protected needContextLessGesture(stroke: OIStroke): boolean;
    protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TOISymbol;
    protected updateCurrentSymbolShape(pointer: TPointer): void;
    protected updateCurrentSymbolEdge(pointer: TPointer): void;
    protected updateCurrentSymbol(pointer: TPointer): TOISymbol;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): void;
    protected interactWithBackend(stroke: OIStroke): Promise<void>;
    end(info: PointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
declare class OIEraseManager {
    #private;
    grabber: PointerEventGrabber;
    editor: EditorOffscreen;
    currentEraser?: OIEraser;
    constructor(editor: EditorOffscreen);
    get model(): OIModel;
    get renderer(): OISVGRenderer;
    attach(layer: HTMLElement): void;
    detach(): void;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): void;
    end(info: PointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
declare class OIDebugSVGManager {
    #private;
    editor: EditorOffscreen;
    constructor(editor: EditorOffscreen);
    get model(): OIModel;
    get renderer(): OISVGRenderer;
    get snapPointsVisibility(): boolean;
    set snapPointsVisibility(show: boolean);
    get verticesVisibility(): boolean;
    set verticesVisibility(show: boolean);
    get boundingBoxVisibility(): boolean;
    set boundingBoxVisibility(show: boolean);
    get recognitionBoxVisibility(): boolean;
    set recognitionBoxVisibility(show: boolean);
    get recognitionItemBoxVisibility(): boolean;
    set recognitionItemBoxVisibility(show: boolean);
    protected showSnapPoints(): void;
    protected hideSnapPoints(): void;
    debugSnapPoints(): void;
    protected showVertices(): void;
    protected hideVertices(): void;
    debugVertices(): void;
    protected drawBoundingBox(symbols: TOISymbol[]): void;
    protected showBoundingBox(): void;
    protected hideBoundingBox(): void;
    debugBoundingBox(): void;
    protected drawRecognitionBox(box: TBox, infos?: string[]): void;
    protected showRecognitionBox(): Promise<void>;
    protected clearRecognitionBox(): void;
    debugRecognitionBox(): Promise<void>;
    protected drawRecognitionItemBox(box: TBox, label?: string, chars?: string[]): void;
    protected showRecognitionItemBox(): Promise<void>;
    protected clearRecognitionItemBox(): void;
    debugRecognitionItemBox(): Promise<void>;
    apply(): void;
}

/**
 * @group Manager
 */
declare class OIMoveManager {
    grabber: PointerEventGrabber;
    editor: EditorOffscreen;
    origin?: {
        left: number;
        top: number;
        x: number;
        y: number;
    };
    constructor(editor: EditorOffscreen);
    get renderer(): OISVGRenderer;
    attach(layer: HTMLElement): void;
    detach(): void;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): void;
    end(info: PointerInfo): void;
}

/**
 * @group Menu
 */
type TMenuItem = {
    id: string;
    label: string;
    type: "button" | "checkbox" | "select" | "list" | "colors";
    disabled?: boolean;
};
/**
 * @group Menu
 */
type TMenuItemButton = TMenuItem & {
    type: "button";
    icon?: string;
    callback: () => void;
};
/**
 * @group Menu
 */
type TMenuItemButtonList = TMenuItem & {
    type: "list";
    initValue: string;
    values: {
        label: string;
        value: string;
    }[];
    callback: (value: string) => void;
};
/**
 * @group Menu
 */
type TMenuItemColorList = TMenuItem & {
    type: "colors";
    initValue: string;
    values: string[];
    fill: boolean;
    callback: (value: string) => void;
};
/**
 * @group Menu
 */
type TMenuItemBoolean = TMenuItem & {
    type: "checkbox";
    initValue: boolean | "indeterminate";
    callback: (value: boolean) => void;
};
/**
 * @group Menu
 */
type TMenuItemSelect = TMenuItem & {
    type: "select";
    initValue: string;
    values: {
        label: string;
        value: string;
    }[];
    callback: (value: string) => void;
};
/**
 * @group Menu
 */
declare abstract class OIMenu {
    thicknessList: {
        label: string;
        value: number;
    }[];
    fontSizeList: ({
        label: string;
        value: string;
    } | {
        label: string;
        value: number;
    })[];
    fontWeightList: {
        label: string;
        value: string;
    }[];
    colors: string[];
    protected createWrapCollapsible(el: Node, title: string): HTMLDivElement;
    protected createMenuItemBoolean(item: TMenuItemBoolean): HTMLDivElement;
    protected createMenuItemSelect(item: TMenuItemSelect): HTMLDivElement;
    protected createMenuItemButton(item: TMenuItemButton): HTMLElement;
    protected createMenuItemButtonList(item: TMenuItemButtonList): HTMLElement;
    protected createMenuItemColorList(item: TMenuItemColorList): HTMLDivElement;
    protected createColorList(item: TMenuItemColorList): HTMLDivElement;
    protected createMenuItem(item: TMenuItem): HTMLElement;
    abstract render(domElement: HTMLElement): void;
    abstract update(): void;
    abstract show(): void;
    abstract hide(): void;
    abstract destroy(): void;
}

/**
 * @group Menu
 */
type TSubMenuParam = {
    trigger: HTMLElement;
    menuTitle?: string;
    subMenu: HTMLElement;
    position: "top" | "left" | "right" | "right-top" | "bottom" | "bottom-left" | "bottom-right";
};
/**
 * @group Menu
 */
declare class OIMenuSub {
    element: HTMLDivElement;
    content: HTMLElement;
    constructor(param: TSubMenuParam);
    open(): void;
    close(): void;
    toggle(): void;
    unwrap(): void;
    wrap(): void;
}

/**
 * @group Menu
 */
declare class OIMenuAction extends OIMenu {
    #private;
    editor: EditorOffscreen;
    id: string;
    wrapper?: HTMLElement;
    menuLanguage: OIMenuSub;
    menuClear?: HTMLButtonElement;
    menuUndo?: HTMLButtonElement;
    menuRedo?: HTMLButtonElement;
    menuConvert?: HTMLButtonElement;
    guideGaps: {
        label: string;
        value: string;
    }[];
    constructor(editor: EditorOffscreen, id?: string);
    get model(): OIModel;
    get isMobile(): boolean;
    protected createMenuClear(): HTMLElement;
    protected createMenuLanguage(): HTMLElement;
    protected createMenuUndo(): HTMLElement;
    protected createMenuRedo(): HTMLElement;
    protected createMenuConvert(): HTMLElement;
    protected createMenuGesture(): HTMLDivElement;
    protected createMenuGuide(): HTMLDivElement;
    protected createMenuSnap(): HTMLDivElement;
    protected createMenuDebug(): HTMLDivElement;
    protected createMenuExport(): HTMLElement;
    protected readFileAsText(file: File): Promise<string>;
    protected createMenuImport(): HTMLElement;
    protected unselectAll(): void;
    protected closeAllSubMenu(): void;
    render(layer: HTMLElement): void;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 */
declare class OIMenuTool extends OIMenu {
    #private;
    editor: EditorOffscreen;
    id: string;
    wrapper?: HTMLDivElement;
    writeBtn?: HTMLButtonElement;
    menuSelect?: HTMLButtonElement;
    menuMove?: HTMLButtonElement;
    menuErase?: HTMLButtonElement;
    menuShape?: HTMLButtonElement;
    subMenuShape?: {
        rectangle: HTMLButtonElement;
        circle: HTMLButtonElement;
        triangle: HTMLButtonElement;
        ellipse: HTMLButtonElement;
        rhombus: HTMLButtonElement;
    };
    menuEdge?: HTMLButtonElement;
    subMenuEdge?: {
        line: HTMLButtonElement;
        arrow: HTMLButtonElement;
        doubleArrow: HTMLButtonElement;
    };
    constructor(editor: EditorOffscreen, id?: string);
    protected createMenuWrite(): HTMLElement;
    protected createMenuMove(): HTMLElement;
    protected createMenuSelect(): HTMLElement;
    protected createMenuErase(): HTMLElement;
    protected createShapeSubMenu(icon: string, tool: EditorWriteTool): HTMLButtonElement;
    protected createMenuShape(): HTMLElement;
    protected createEdgeSubMenu(square: string, tool: EditorWriteTool): HTMLButtonElement;
    protected createMenuEdge(): HTMLElement;
    protected unselectAll(): void;
    update(): void;
    render(layer: HTMLElement): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 */
declare class OIMenuStyle extends OIMenu {
    #private;
    editor: EditorOffscreen;
    id: string;
    wrapper?: HTMLDivElement;
    subMenu?: OIMenuSub;
    triggerBtn?: HTMLButtonElement;
    menuColorStroke?: HTMLDivElement;
    menuColorFill?: HTMLDivElement;
    menuThickness?: HTMLDivElement;
    menuFontSize?: HTMLDivElement;
    menuFontWeight?: HTMLDivElement;
    menuStrokeOpacity?: HTMLDivElement;
    constructor(editor: EditorOffscreen, id?: string);
    get model(): OIModel;
    get symbolsSelected(): TOISymbol[];
    get writeShape(): boolean;
    get rowHeight(): number;
    get isMobile(): boolean;
    protected createMenuStroke(): HTMLDivElement;
    protected createMenuColorFill(): HTMLDivElement;
    protected createMenuThickness(): HTMLDivElement;
    protected createMenuFontSize(): HTMLDivElement;
    protected createMenuFontWeight(): HTMLDivElement;
    protected createMenuOpacity(): HTMLDivElement;
    render(layer: HTMLElement): void;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 */
declare class OIMenuContext extends OIMenu {
    #private;
    editor: EditorOffscreen;
    id: string;
    wrapper?: HTMLElement;
    editMenu?: HTMLDivElement;
    editInput?: HTMLInputElement;
    editSaveBtn?: HTMLButtonElement;
    reorderMenu?: HTMLDivElement;
    decoratorMenu?: HTMLDivElement;
    menuExport?: HTMLDivElement;
    duplicateBtn?: HTMLButtonElement;
    groupBtn?: HTMLButtonElement;
    convertBtn?: HTMLButtonElement;
    removeBtn?: HTMLButtonElement;
    position: {
        x: number;
        y: number;
        scrollTop: number;
        scrollLeft: number;
    };
    constructor(editor: EditorOffscreen, id?: string);
    get symbolsSelected(): TOISymbol[];
    get haveSymbolsSelected(): boolean;
    get symbolsDecorable(): (OIStroke | OIText | OISymbolGroup | OIRecognizedText)[];
    get showDecorator(): boolean;
    protected createMenuEdit(): HTMLElement;
    protected createMenuDuplicate(): HTMLElement;
    protected createMenuGroup(): HTMLElement;
    protected createMenuConvert(): HTMLElement;
    protected createMenuRemove(): HTMLButtonElement;
    protected createMenuReorder(): HTMLElement;
    protected createDecoratorSubMenu(label: string, kind: DecoratorKind): HTMLElement;
    protected createMenuDecorator(): HTMLElement;
    protected createMenuExport(): HTMLElement;
    protected createMenuSelectAll(): HTMLElement;
    protected updateDecoratorSubMenu(): void;
    protected updateGroupMenu(): void;
    update(): void;
    render(layer: HTMLElement): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 */
type TMenuConfiguration = {
    enable: boolean;
    style: {
        enable: boolean;
    };
    tool: {
        enable: boolean;
    };
    action: {
        enable: boolean;
    };
    context: {
        enable: boolean;
    };
};
/**
 * @group Menu
 * @source
 */
declare const DefaultMenuConfiguration: TMenuConfiguration;

/**
 * @group Manager
 */
declare class OIMenuManager {
    #private;
    editor: EditorOffscreen;
    layer?: HTMLElement;
    action: OIMenuAction;
    tool: OIMenuTool;
    context: OIMenuContext;
    style: OIMenuStyle;
    constructor(editor: EditorOffscreen, custom?: {
        style?: OIMenuStyle;
        tool?: OIMenuTool;
        action?: OIMenuAction;
        context?: OIMenuContext;
    });
    render(layer: HTMLElement): void;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Editor
 */
type TEditorOffscreenConfiguration = TEditorConfiguration & TOIRecognizerConfiguration & {
    "undo-redo": THistoryConfiguration;
    rendering: TOIRendererConfiguration;
    grabber: TGrabberConfiguration;
    menu: TMenuConfiguration;
    penStyle: TStyle;
    fontStyle: {
        size: number | "auto";
        weight: "bold" | "normal" | "auto";
    };
    gesture: TGestureConfiguration;
    snap: TSnapConfiguration;
};
/**
 * @group Editor
 * @source
 */
declare const DefaultEditorOffscreenConfiguration: TEditorOffscreenConfiguration;
/**
 * @group Editor
 */
declare class EditorOffscreenConfiguration implements TEditorOffscreenConfiguration {
    grabber: TGrabberConfiguration;
    logger: TLoggerConfiguration;
    server: TServerWebsocketConfiguration;
    recognition: TOIRecognitionConfiguration;
    rendering: TOIRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    menu: TMenuConfiguration;
    penStyle: TStyle;
    fontStyle: {
        size: number | "auto";
        weight: "bold" | "normal" | "auto";
    };
    gesture: TGestureConfiguration;
    snap: TSnapConfiguration;
    constructor(configuration?: PartialDeep<TEditorOffscreenConfiguration>);
}

/**
 * @group Editor
 */
type TEditorOffscreenOptions = PartialDeep<EditorOptionsBase & {
    configuration: TEditorOffscreenConfiguration;
}> & {
    override?: {
        recognizer?: OIRecognizer;
        menu?: {
            style?: OIMenuStyle;
            tool?: OIMenuTool;
            action?: OIMenuAction;
        };
    };
};
/**
 * @group Editor
 */
declare class EditorOffscreen extends AbstractEditor {
    #private;
    renderer: OISVGRenderer;
    recognizer: OIRecognizer;
    history: OIHistoryManager;
    writer: OIWriteManager;
    eraser: OIEraseManager;
    gesture: OIGestureManager;
    resizer: OIResizeManager;
    rotator: OIRotationManager;
    translator: OITranslateManager;
    converter: OIConversionManager;
    texter: OITextManager;
    selector: OISelectionManager;
    svgDebugger: OIDebugSVGManager;
    snaps: OISnapManager;
    move: OIMoveManager;
    menu: OIMenuManager;
    constructor(rootElement: HTMLElement, options?: TEditorOffscreenOptions);
    get initializationPromise(): Promise<void>;
    get tool(): EditorTool;
    set tool(i: EditorTool);
    get model(): OIModel;
    get configuration(): EditorOffscreenConfiguration;
    set renderingConfiguration(renderingConfiguration: TOIRendererConfiguration);
    get penStyle(): TStyle;
    set penStyle(penStyle: PartialDeep<TStyle>);
    protected updateLayerState(idle: boolean): void;
    updateLayerUI(timeout?: number): void;
    manageError(error: Error): void;
    protected setCursorStyle(): void;
    protected onContentChanged(undoRedoContext: THistoryContext): Promise<void>;
    initialize(): Promise<void>;
    changeLanguage(code: string): Promise<void>;
    protected buildShape(partialShape: PartialDeep<TOIShape>): TOIShape;
    protected buildEdge(partialEdge: PartialDeep<TOIEdge>): TOIEdge;
    protected buildRecognized(partialSymbol: PartialDeep<TOIRecognized>): TOIRecognized;
    protected buildGroup(partialGroup: PartialDeep<OISymbolGroup>): OISymbolGroup;
    protected buildStroke(partialSymbol: PartialDeep<OIStroke>): OIStroke;
    protected buildStrokeText(partialSymbol: PartialDeep<OIRecognizedText>): OIRecognizedText;
    protected buildText(partialSymbol: PartialDeep<OIText>): OIText;
    protected buildSymbol(partialSymbol: PartialDeep<TOISymbol>): TOISymbol;
    createSymbol(partialSymbol: PartialDeep<TOISymbol>): Promise<TOISymbol>;
    createSymbols(partialSymbols: PartialDeep<TOISymbol>[]): Promise<TOISymbol[]>;
    /** @hidden */
    protected updateTextBounds(symbol: TOISymbol): void;
    /** @hidden */
    addSymbol(sym: TOISymbol, addToHistory?: boolean): Promise<TOISymbol>;
    /** @hidden */
    addSymbols(symList: TOISymbol[], addToHistory?: boolean): Promise<TOISymbol[]>;
    updateSymbol(sym: TOISymbol, addToHistory?: boolean): Promise<TOISymbol>;
    updateSymbols(symList: TOISymbol[], addToHistory?: boolean): Promise<TOISymbol[]>;
    updateSymbolsStyle(symbolIds: string[], style: PartialDeep<TStyle>, addToHistory?: boolean): void;
    updateTextFontStyle(textIds: string[], { fontSize, fontWeight }: {
        fontSize?: number;
        fontWeight?: "normal" | "bold" | "auto";
    }): void;
    replaceSymbols(oldSymbols: TOISymbol[], newSymbols: TOISymbol[], addToHistory?: boolean): Promise<void>;
    changeOrderSymbol(symbol: TOISymbol, position: "first" | "last" | "forward" | "backward"): void;
    changeOrderSymbols(symbols: TOISymbol[], position: "first" | "last" | "forward" | "backward"): void;
    groupSymbols(symbols: TOISymbol[]): OISymbolGroup;
    ungroupSymbol(group: OISymbolGroup): TOISymbol[];
    synchronizeStrokesWithJIIX(force?: boolean): Promise<void>;
    removeSymbol(id: string, addToHistory?: boolean): Promise<void>;
    removeSymbols(ids: string[], addToHistory?: boolean): Promise<TOISymbol[]>;
    select(ids: string[]): void;
    selectAll(): void;
    unselectAll(): void;
    importPointEvents(partialStrokes: PartialDeep<OIStroke>[]): Promise<OIModel>;
    protected triggerDownload(fileName: string, urlData: string): void;
    getSymbolsBounds(symbols: TOISymbol[], margin?: number): Box;
    protected buildBlobFromSymbols(symbols: TOISymbol[], box: Box): Blob;
    protected getExportName(extension: string): string;
    downloadAsSVG(selection?: boolean): void;
    downloadAsPNG(selection?: boolean): void;
    downloadAsJson(selection?: boolean): void;
    extractStrokesFromSymbols(symbols: TOISymbol[] | undefined): OIStroke[];
    extractTextsFromSymbols(symbols: TOISymbol[] | undefined): OIText[];
    protected extractBackendChanges(changes: TOIHistoryChanges): TOIHistoryBackendChanges;
    undo(): Promise<OIModel>;
    redo(): Promise<OIModel>;
    export(mimeTypes?: string[]): Promise<OIModel>;
    convert(): Promise<void>;
    convertSymbols(symbols?: TOISymbol[]): Promise<void>;
    waitForIdle(): Promise<void>;
    resize({ height, width }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Manager
 */
declare class OITranslateManager {
    #private;
    editor: EditorOffscreen;
    interactElementsGroup?: SVGElement;
    transformOrigin: TPoint;
    constructor(editor: EditorOffscreen);
    get model(): OIModel;
    protected applyToStroke(stroke: OIStroke, tx: number, ty: number): OIStroke;
    protected applyToShape(shape: TOIShape, tx: number, ty: number): TOIShape;
    protected applyToEdge(edge: TOIEdge, tx: number, ty: number): TOIEdge;
    protected applyOnText(text: OIText, tx: number, ty: number): OIText;
    protected applyOnGroup(group: OISymbolGroup, tx: number, ty: number): OISymbolGroup;
    protected applyOnRecognizedSymbol(recognizedSymbol: TOIRecognized, tx: number, ty: number): TOIRecognized;
    applyToSymbol(symbol: TOISymbol, tx: number, ty: number): TOISymbol;
    translate(symbols: TOISymbol[], tx: number, ty: number, addToHistory?: boolean): Promise<void>;
    translateElement(id: string, tx: number, ty: number): void;
    start(target: Element, origin: TPoint): void;
    continue(point: TPoint): {
        tx: number;
        ty: number;
    };
    end(point: TPoint): Promise<void>;
}

/**
 * @group Gesture
 */
declare class OIGestureManager {
    #private;
    insertAction: InsertAction;
    surroundAction: SurroundAction;
    strikeThroughAction: StrikeThroughAction;
    editor: EditorOffscreen;
    constructor(editor: EditorOffscreen, gestureAction?: PartialDeep<TGestureConfiguration>);
    get renderer(): OISVGRenderer;
    get recognizer(): OIRecognizer;
    get translator(): OITranslateManager;
    get texter(): OITextManager;
    get model(): OIModel;
    get history(): OIHistoryManager;
    get rowHeight(): number;
    get strokeSpaceWidth(): number;
    applySurroundGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>;
    protected computeScratchOnStrokes(gesture: TGesture, stroke: OIStroke): OIStroke[];
    protected computeScratchOnText(gestureStroke: OIStroke, textSymbol: OIText): OIText | undefined;
    protected computeScratchOnSymbol(gestureStroke: OIStroke, gesture: TGesture, symbol: TOISymbol): {
        erased?: boolean;
        replaced?: TOISymbol[];
    };
    applyScratch(gestureStroke: OIStroke, gesture: TGesture): Promise<void>;
    applyJoinGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>;
    protected createStrokesFromGestureSubStroke(strokeOrigin: OIStroke, subStrokes: {
        x: number[];
        y: number[];
    }[]): OIStroke[];
    protected computeSplitStroke(strokeOrigin: OIStroke, subStrokes: {
        x: number[];
        y: number[];
    }[]): {
        before?: OIStroke;
        after?: OIStroke;
    };
    protected computeSplitStrokeInGroup(gestureStroke: OIStroke, group: OISymbolGroup, subStrokes: {
        fullStrokeId: string;
        x: number[];
        y: number[];
    }[]): OISymbolGroup[];
    protected computeChangesOnSplitStroke(gestureStroke: OIStroke, strokeIdToSplit: string, subStrokes: {
        fullStrokeId: string;
        x: number[];
        y: number[];
    }[]): TOIHistoryChanges;
    protected computeChangesOnSplitGroup(gestureStroke: OIStroke, groupToSplit: OISymbolGroup): TOIHistoryChanges;
    protected computeChangesOnSplitStrokeText(gestureStroke: OIStroke, strokeTextToSplit: OIRecognizedText): TOIHistoryChanges;
    protected computeChangesOnSplitText(gestureStroke: OIStroke, textToSplit: OIText): TOIHistoryChanges;
    applyInsertGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>;
    applyUnderlineGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>;
    applyStrikeThroughGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void | TOISymbol[]>;
    apply(gestureStroke: OIStroke, gesture: TGesture): Promise<void>;
    getGestureFromContextLess(gestureStroke: OIStroke): Promise<TGesture | undefined>;
}

/**
 * @group Editor
 * @remarks Lists all events that can be listened to on the editor or DOM element
 * @example
 * You can run code on "EditorEventName" raised by using
 * ```ts
 * editor.event.addEventListener(EditorEventName.CHANGED, (evt) => console.log(evt.detail))
 * ```
 */
declare enum EditorEventName {
    /**
     * @remarks event emitted when history has changed i.e. the context of undo-redo
     */
    CHANGED = "changed",
    /**
     * @remarks event emitted when clearing is complete
     */
    CLEARED = "cleared",
    /**
     * @remarks event emitted after the conversion is complete
     */
    CONVERTED = "converted",
    /**
     * @remarks event emitted when the editor encounters an error
     */
    ERROR = "error",
    /**
     * @remarks event emitted on click on pointer events
     */
    POINTEREVENTS = "pointer_events",
    /**
     * @remarks event emitted after
     */
    NOTIF = "notif",
    /**
     * @remarks event emitted after the end of the export
     */
    EXPORTED = "exported",
    /**
     * @remarks event emitted after the end of the import
     */
    IMPORTED = "imported",
    /**
     * @remarks event emitted when the server is idle after a job
     */
    IDLE = "idle",
    /**
     * @remarks event emitted after full editor initialization
     */
    LOADED = "loaded",
    /**
     * @remarks event emitted session opened
     */
    SESSION_OPENED = "session-opened",
    /**
     * @remarks event emitted after selection change
     */
    SELECTED = "selected",
    /**
     * @remarks event emitted after tool change
     */
    TOOL_CHANGED = "tool-changed",
    /**
     * @remarks event emitted after mode change
     */
    UI_UPDATED = "ui-updated",
    /**
     * @remarks event emitted after stroke synchronized with jiix
     */
    SYNCHRONIZED = "synchronized",
    /**
     * @remarks event emitted after applying a gesture
     */
    GESTURED = "gestured"
}
/**
 * @group Editor
 */
declare class EditorEvent extends EventTarget {
    #private;
    protected abortController: AbortController;
    element: Element;
    constructor(element: Element);
    removeAllListeners(): void;
    protected emit(type: string, data?: unknown): void;
    emitSessionOpened(sessionId: string): void;
    addSessionOpenedListener(callback: (sessionId: string) => void): void;
    emitLoaded(): void;
    addLoadedListener(callback: () => void): void;
    emitNotif(notif: {
        message: string;
        timeout?: number;
    }): void;
    addNotifListener(callback: (notif: {
        message: string;
        timeout?: number;
    }) => void): void;
    emitError(err: Error): void;
    addErrorListener(callback: (err: Error) => void): void;
    emitExported(exports: TExport): void;
    addExportedListener(callback: (exports: TExport) => void): void;
    emitChanged(undoRedoContext: THistoryContext): void;
    addChangedListener(callback: (context: THistoryContext) => void): void;
    emitIdle(idle: boolean): void;
    addIdleListener(callback: (idle: boolean) => void): void;
    emitCleared(): void;
    addClearedListener(callback: () => void): void;
    emitConverted(exports: TExport): void;
    addConvertedListener(callback: (exports: TExport) => void): void;
    emitImported(exports: TExport): void;
    addImportedListener(callback: (exports: TExport) => void): void;
    emitSelected(symbols: TSymbol[]): void;
    addSelectedListener(callback: (symbols: TOISymbol[]) => void): void;
    emitToolChanged(mode: EditorTool): void;
    addToolChangedListener(callback: (mode: EditorTool) => void): void;
    emitUIpdated(): void;
    addUIpdatedListener(callback: () => void): void;
    emitSynchronized(): void;
    addSynchronizedListener(callback: () => void): void;
    emitGestured(gesture: {
        gestureType: TGestureType;
        stroke: OIStroke;
    }): void;
    addGesturedListener(callback: (gesture: {
        gestureType: TGestureType;
        stroke: OIStroke;
    }) => void): void;
}

/**
 * @group History
 */
type THistoryConfiguration = {
    maxStackSize: number;
};
/**
 * @group History
 * @source
 */
declare const DefaultHistoryConfiguration: THistoryConfiguration;

/**
 * @group History
 */
declare class HistoryManager {
    #private;
    configuration: THistoryConfiguration;
    event: EditorEvent;
    context: THistoryContext;
    stack: Model[];
    constructor(configuration: THistoryConfiguration, event: EditorEvent);
    private updateContext;
    push(model: Model): void;
    updateStack(model: Model): void;
    undo(): Model;
    redo(): Model;
}

/**
 * @group History
 */
type TOIHistoryChanges = {
    added?: TOISymbol[];
    updated?: TOISymbol[];
    erased?: TOISymbol[];
    replaced?: {
        oldSymbols: TOISymbol[];
        newSymbols: TOISymbol[];
    };
    matrix?: {
        symbols: TOISymbol[];
        matrix: TMatrixTransform;
    };
    translate?: {
        symbols: TOISymbol[];
        tx: number;
        ty: number;
    }[];
    scale?: {
        symbols: TOISymbol[];
        scaleX: number;
        scaleY: number;
        origin: TPoint;
    }[];
    rotate?: {
        symbols: TOISymbol[];
        angle: number;
        center: TPoint;
    }[];
    style?: {
        symbols: TOISymbol[];
        style?: PartialDeep<TStyle>;
        fontSize?: number;
    };
    order?: {
        symbols: TOISymbol[];
        position: "first" | "last" | "forward" | "backward";
    };
    decorator?: {
        symbol: TOISymbol;
        decorator: OIDecorator;
        added: boolean;
    }[];
    group?: {
        symbols: TOISymbol[];
    };
    ungroup?: {
        group: TOISymbol;
    };
};
/**
 * @group History
 * @remarks used to send messages to the backend on undo or redo
 */
type TOIHistoryBackendChanges = {
    added?: OIStroke[];
    erased?: OIStroke[];
    replaced?: {
        oldStrokes: OIStroke[];
        newStrokes: OIStroke[];
    };
    matrix?: {
        strokes: OIStroke[];
        matrix: TMatrixTransform;
    };
    translate?: {
        strokes: OIStroke[];
        tx: number;
        ty: number;
    }[];
    scale?: {
        strokes: OIStroke[];
        scaleX: number;
        scaleY: number;
        origin: TPoint;
    }[];
    rotate?: {
        strokes: OIStroke[];
        angle: number;
        center: TPoint;
    }[];
};
/**
 * @group History
 */
type TOIHistoryStackItem = {
    changes: TOIHistoryChanges;
    model: OIModel;
};
/**
 * @group History
 */
declare class OIHistoryManager {
    #private;
    configuration: THistoryConfiguration;
    event: EditorEvent;
    context: THistoryContext;
    stack: TOIHistoryStackItem[];
    constructor(configuration: THistoryConfiguration, event: EditorEvent);
    private updateContext;
    isChangesEmpty(changes: TOIHistoryChanges): boolean;
    init(model: OIModel): void;
    push(model: OIModel, changes: TOIHistoryChanges): void;
    update(model: OIModel): void;
    pop(): void;
    protected reverseChanges(changes: TOIHistoryChanges): TOIHistoryChanges;
    undo(): TOIHistoryStackItem;
    redo(): TOIHistoryStackItem;
    clear(): void;
}

/**
 * @group Recognizer
 */
type TWSMessageEvent = {
    type: string;
    [key: string]: unknown;
};
/**
 * @group Recognizer
 */
type TWSMessageEventError = {
    type: string;
    code?: number | string;
    message?: string;
    data?: {
        code: number | string;
        message: string;
    };
};
/**
 * @group Recognizer
 */
type TWSMessageEventHMACChallenge = TWSMessageEvent & {
    hmacChallenge: string;
    iinkSessionId: string;
};
/**
 * @group Recognizer
 */
type TWSMessageEventContentPackageDescriptionMessage = TWSMessageEvent & {
    contentPartCount: number;
};
/**
 * @group Recognizer
 */
type TWSMessageEventPartChange = TWSMessageEvent & {
    partIdx: number;
    partId: string;
    partCount: number;
};
/**
 * @group Recognizer
 */
type TWSMessageEventContentChange = TWSMessageEvent & {
    partId: string;
    canUndo: boolean;
    canRedo: boolean;
    empty: boolean;
    undoStackIndex: number;
    possibleUndoCount: number;
};
/**
 * @group Recognizer
 */
type TWSMessageEventExport = TWSMessageEvent & {
    partId: string;
    exports: TExport;
};
/**
 * @group Recognizer
 */
type TUpdatePatchType = "REPLACE_ALL" | "REMOVE_ELEMENT" | "REPLACE_ELEMENT" | "REMOVE_CHILD" | "APPEND_CHILD" | "INSERT_BEFORE" | "REMOVE_ATTRIBUTE" | "SET_ATTRIBUTE";
/**
 * @group Recognizer
 */
type TUpdatePatch = {
    type: TUpdatePatchType;
};
/**
 * @group Recognizer
 */
type TUpdatePatchReplaceAll = TUpdatePatch & {
    type: "REPLACE_ALL";
    svg: string;
};
/**
 * @group Recognizer
 */
type TUpdatePatchReplaceELement = TUpdatePatch & {
    type: "REPLACE_ELEMENT";
    id: string;
    svg: string;
};
/**
 * @group Recognizer
 */
type TUpdatePatchInsertBefore = TUpdatePatch & {
    type: "INSERT_BEFORE";
    refId: string;
    svg: string;
};
/**
 * @group Recognizer
 */
type TUpdatePatchRemoveElement = TUpdatePatch & {
    type: "REMOVE_ELEMENT";
    id: string;
};
/**
 * @group Recognizer
 */
type TUpdatePatchAppendChild = TUpdatePatch & {
    type: "APPEND_CHILD";
    parentId?: string;
    svg: string;
};
/**
 * @group Recognizer
 */
type TUpdatePatchRemoveChild = TUpdatePatch & {
    type: "REMOVE_CHILD";
    parentId: string;
    index: number;
};
/**
 * @group Recognizer
 */
type TUpdatePatchRemoveAttribut = TUpdatePatch & {
    type: "REMOVE_ATTRIBUTE";
    id?: string;
    name: string;
};
/**
 * @group Recognizer
 */
type TUpdatePatchSetAttribut = TUpdatePatch & {
    type: "SET_ATTRIBUTE";
    id?: string;
    name: string;
    value: string;
};
/**
 * @group Recognizer
 */
type TWSMessageEventSVGPatch = TWSMessageEvent & {
    updates: TUpdatePatch[];
    layer: ("MODEL" | "CAPTURE");
};

/**
 * @group Recognizer
 * @summary
 * Lists all events that can be listened to on the editor or DOM element
 * @example
 * You can run code on "RecognizerEventName" raised by using
 * ```ts
 * recognizer.events.addEventListener(RecognizerEventName.CONTENT_CHANGED, (evt) => console.log(evt.detail))
 * ```
 */
declare enum RecognizerEventName {
    /**
     * @summary event emitted at the start of connection initialization
     */
    START_INITIALIZATION = "start-initialization",
    /**
     * @summary event emitted after full recognizer initialization
     */
    END_INITIALIZATION = "end-initialization",
    /**
     * @summary event emitted after receiving an "contentChanged" message
     */
    CONTENT_CHANGED = "content-changed",
    /**
     * @summary event emitted after receiving an "idle" message
     */
    IDLE = "idle",
    /**
     * @summary event emitted after receiving an "exported" message
     */
    EXPORTED = "exported",
    /**
     * @summary event emitted when the recognizer encounters an error
     */
    ERROR = "error",
    /**
     * @remarks event emitted after connection closed
     */
    CONNECTION_CLOSE = "connection-close",
    /**
     * @summary
     * event emitted after receiving an "svgPatch" message
     * @remarks
     * only usable in the case of websocket
     */
    SVG_PATCH = "svg-patch",
    /**
     * @summary event emitted session opened
     */
    SESSION_OPENED = "session-opened"
}
/**
 * @group Recognizer
 */
declare class RecognizerEvent extends EventTarget {
    protected abortController: AbortController;
    constructor();
    removeAllListeners(): void;
    protected emit(type: string, data?: unknown): void;
    emitStartInitialization(): void;
    addStartInitialization(callback: () => void): void;
    emitEndtInitialization(): void;
    addEndInitialization(callback: () => void): void;
    emitSessionOpened(sessionId: string): void;
    addSessionOpenedListener(callback: (sessionId: string) => void): void;
    emitContentChanged(undoRedoContext: THistoryContext): void;
    addContentChangedListener(callback: (context: THistoryContext) => void): void;
    emitIdle(idle: boolean): void;
    addIdleListener(callback: (idle: boolean) => void): void;
    emitExported(exports: TExport): void;
    addExportedListener(callback: (exports: TExport) => void): void;
    emitError(err: Error): void;
    addErrorListener(callback: (err: Error) => void): void;
    emitConnectionClose({ code, message }: {
        code: number;
        message?: string;
    }): void;
    addConnectionCloseListener(callback: ({ code, message }: {
        code: number;
        message?: string;
    }) => void): void;
    /**
     * @remarks only use in the case of websocket
     */
    emitSVGPatch(svgPatch: TWSMessageEventSVGPatch): void;
    /**
     * @remarks only usable in the case of websocket
     */
    addSVGPatchListener(callback: (svgPatch: TWSMessageEventSVGPatch) => void): void;
}

/**
 * @group Recognizer
 * @remarks List all errors generated by the backend with their descriptions
 */
declare enum RecognizerError {
    NO_ACTIVITY = "Session closed due to no activity. Without a connection on your part, it will be permanently lost after an hour.",
    WRONG_CREDENTIALS = "Application credentials are invalid. Please check or regenerate your application key and hmackey.",
    TOO_OLD = "Session is too old. Max Session Duration Reached.",
    NO_SESSION_FOUND = "No sessions found. Without activation for 1 hour, sessions are deleted from the server. To avoid losing your work, use the json export, then import it this will create a new session.",
    UNKNOW = "An unknown error has occurred.",
    ABNORMAL_CLOSURE = "MyScript recognition server is not reachable.",
    CANT_ESTABLISH = "Unable to establish a connection to MyScript recognition server. Check the host and your connectivity.",
    GOING_AWAY = "MyScript recognition server is going away, either because of a server failure or because the browser is navigating away from the page that opened the connection.",
    PROTOCOL_ERROR = "MyScript recognition server terminated the connection due to a protocol error.",
    UNSUPPORTED_DATA = "MyScript recognition server terminated the connection because the endpoint received data of a type it cannot accept. (For example, a text-only endpoint received binary data.)",
    INVALID_FRAME_PAYLOAD = "MyScript recognition server terminated the connection because a message was received that contained inconsistent data (e.g., non-UTF-8 data within a text message).",
    POLICY_VIOLATION = "MyScript recognition server terminated the connection because it received a message that violates its policy.",
    MESSAGE_TOO_BIG = "MyScript recognition server terminated the connection because a data frame was received that is too large.",
    INTERNAL_ERROR = "MyScript recognition server terminated the connection because it encountered an unexpected condition that prevented it from fulfilling the request.",
    SERVICE_RESTART = "MyScript recognition server terminated the connection because it is restarting.",
    TRY_AGAIN = "MyScript recognition server terminated the connection due to a temporary condition, e.g. it is overloaded and is casting off some of its clients.",
    BAD_GATEWAY = "MyScript recognition server was acting as a gateway or proxy and received an invalid response from the upstream server.",
    TLS_HANDSHAKE = "MyScript recognition server connection was closed due to a failure to perform a TLS handshake"
}

/**
 * @group Recognizer
 */
declare enum TOIMessageType {
    HMAC_Challenge = "hmacChallenge",
    Authenticated = "authenticated",
    SessionDescription = "sessionDescription",
    NewPart = "newPart",
    PartChanged = "partChanged",
    ContentChanged = "contentChanged",
    Idle = "idle",
    Pong = "pong",
    Exported = "exported",
    GestureDetected = "gestureDetected",
    ContextlessGesture = "contextlessGesture",
    Error = "error"
}
/**
 * @group Recognizer
 * @remarks use to type message to send to backend
 */
type TOIMessageEvent = {
    type: string;
    [key: string]: unknown;
};
/**
 * @group Recognizer
 */
type TOIMessage<T = string> = {
    type: T;
};
/**
 * @group Recognizer
 */
type TOIMessageEventAuthenticated = TOIMessage<TOIMessageType.Authenticated>;
/**
 * @group Recognizer
 */
type TOIMessageEventHMACChallenge = TOIMessage<TOIMessageType.HMAC_Challenge> & {
    hmacChallenge: string;
    iinkSessionId: string;
};
/**
 * @group Recognizer
 */
type TOISessionDescriptionMessage = TOIMessage<TOIMessageType.SessionDescription> & {
    contentPartCount: number;
    iinkSessionId: string;
};
/**
 * @group Recognizer
 */
type TOIMessageEventNewPart = TOIMessage<TOIMessageType.NewPart> & {
    id: string;
    idx: null;
};
/**
 * @group Recognizer
 */
type TOIMessageEventPartChange = TOIMessage<TOIMessageType.PartChanged> & {
    partIdx: number;
    partId: string;
    partCount: number;
};
/**
 * @group Recognizer
 */
type TOIMessageEventContentChange = TOIMessage<TOIMessageType.ContentChanged> & {
    partId: string;
    canUndo: boolean;
    canRedo: boolean;
    empty: boolean;
    undoStackIndex: number;
    possibleUndoCount: number;
};
/**
 * @group Recognizer
 */
type TOIMessageEventExport = TOIMessage<TOIMessageType.Exported> & {
    partId: string;
    exports: TExport;
};
/**
 * @group Recognizer
 */
type TOIMessageEventGesture = TOIMessage<TOIMessageType.GestureDetected> & TGesture;
/**
 * @group Recognizer
 */
type TOIMessageEventContextlessGesture = TOIMessage<TOIMessageType.ContextlessGesture> & {
    gestureType: "none" | "scratch" | "left-right" | "right-left" | "bottom-top" | "top-bottom" | "surround";
    strokeId: string;
};
/**
 * @group Recognizer
 */
type TOIMessageEventPong = TOIMessage<TOIMessageType.Pong>;
/**
 * @group Recognizer
 */
type TOIMessageEventIdle = TOIMessage<TOIMessageType.Idle>;
/**
 * @group Recognizer
 */
type TOIMessageEventError = TOIMessage<TOIMessageType.Error> & {
    code?: number | string;
    message?: string;
    data?: {
        code: number | string;
        message: string;
    };
};
/**
 * @group Recognizer
 */
type TOIMessageReceived = TOIMessageEventAuthenticated | TOIMessageEventHMACChallenge | TOISessionDescriptionMessage | TOIMessageEventNewPart | TOIMessageEventPartChange | TOIMessageEventContentChange | TOIMessageEventExport | TOIMessageEventGesture | TOIMessageEventContextlessGesture | TOIMessageEventPong | TOIMessageEventIdle | TOIMessageEventError;

/**
 * @group Recognizer
 */
type TEraserConfiguration = {
    "erase-precisely": boolean;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultEraserConfiguration: TEraserConfiguration;

/**
 * @group Recognizer
 */
type TMarginConfiguration = {
    bottom: number;
    left: number;
    right: number;
    top: number;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultMarginConfiguration: TMarginConfiguration;

/**
 * @group Recognizer
 */
type TTextGuidesConfiguration = {
    enable: boolean;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultTextGuidesConfiguration: TTextGuidesConfiguration;
/**
 * @group Recognizer
 */
type TTextConfConfiguration = {
    customResources?: string[];
    customLexicon?: string[];
    addLKText?: boolean;
};
/**
 * @group Recognizer
 */
type TTextConfiguration = {
    text?: boolean;
    mimeTypes: ("text/plain" | "application/vnd.myscript.jiix")[];
    margin: TMarginConfiguration;
    guides?: TTextGuidesConfiguration;
    configuration?: TTextConfConfiguration;
    eraser?: TEraserConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultTextConfiguration: TTextConfiguration;

/**
 * @group Recognizer
 */
type TDiagramConvertConfiguration = {
    types?: ("text" | "shape")[];
    "match-text-size"?: boolean;
};
/**
 * @group Recognizer
 */
type TDiagramConfiguration = {
    mimeTypes: ("application/vnd.myscript.jiix" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "image/svg+xml")[];
    "enable-sub-blocks"?: boolean;
    text?: TTextConfConfiguration;
    convert?: TDiagramConvertConfiguration;
    "session-time"?: number;
    eraser?: TEraserConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultDiagramConvertConfiguration: TDiagramConvertConfiguration;
/**
 * @group Recognizer
 * @source
 */
declare const DefaultDiagramConfiguration: TDiagramConfiguration;

/**
 * @group Recognizer
 */
type TImageViewportConfiguration = {
    x: number;
    y: number;
    width: number;
    height: number;
};
/**
 * @group Recognizer
 */
type TImageConfiguration = {
    guides: boolean;
    viewport: TImageViewportConfiguration;
};
/**
 * @group Recognizer
 */
type TJiixConfiguration = {
    "bounding-box": boolean;
    strokes: boolean;
    ids: boolean;
    "full-stroke-ids": boolean;
    text: {
        chars: boolean;
        words: boolean;
        lines?: boolean;
    };
    style?: boolean;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultJiixConfiguration: TJiixConfiguration;
/**
 * @group Recognizer
 */
type TMathMLFlavor = {
    name: string;
};
/**
 * @group Recognizer
 */
type TMathMLExport = {
    flavor: TMathMLFlavor;
};
/**
 * @group Recognizer
 */
type TExportConfiguration = {
    "image-resolution"?: number;
    image?: TImageConfiguration;
    jiix: TJiixConfiguration;
    mathml?: TMathMLExport;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultExportConfiguration: TExportConfiguration;

/**
 * @group Recognizer
 */
type TRoundingMode = "half up" | "truncate";
/**
 * @group Recognizer
 */
type TAngleUnit = "deg" | "rad";
/**
 * @group Recognizer
 */
type TSolverOptions = "algebraic" | "numeric";
/**
 * @group Recognizer
 */
type TSolverConfiguration = {
    enable?: boolean;
    "fractional-part-digits"?: number;
    "decimal-separator"?: string;
    "rounding-mode"?: TRoundingMode;
    "angle-unit"?: TAngleUnit;
    options?: TSolverOptions;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultSolverConfiguration: TSolverConfiguration;
/**
 * @group Recognizer
 */
type TUndoRedoMode = "stroke" | "session";
/**
 * @group Recognizer
 */
type TMathUndoRedoConfiguration = {
    mode: TUndoRedoMode;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultMathUndoRedoConfiguration: TMathUndoRedoConfiguration;
/**
 * @group Recognizer
 */
type TMathConfiguration = {
    mimeTypes: ("application/x-latex" | "application/mathml+xml" | "application/vnd.myscript.jiix")[];
    solver?: TSolverConfiguration;
    margin: TMarginConfiguration;
    "undo-redo"?: TMathUndoRedoConfiguration;
    customGrammar?: string;
    customGrammarId?: string;
    customGrammarContent?: string;
    eraser?: TEraserConfiguration;
    "session-time"?: number;
    "recognition-timeout"?: number;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultMathConfiguration: TMathConfiguration;

/**
 * @group Recognizer
 */
type TRawContentConfiguration = {
    text?: TTextConfConfiguration;
    "session-time"?: number;
    recognition?: {
        types: ("text" | "shape")[];
    };
    classification?: {
        types: ("text" | "shape")[];
    };
    eraser?: TEraserConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRawContentConfiguration: TRawContentConfiguration;

/**
 * @group Recognizer
 */
type TRecognitionRendererDebugConfiguration = {
    "draw-text-boxes": boolean;
    "draw-image-boxes": boolean;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultDebugConfiguration: TRecognitionRendererDebugConfiguration;
/**
 * @group Recognizer
 */
type TRecognitionRendererConfiguration = {
    debug: TRecognitionRendererDebugConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRecognitionRendererConfiguration: TRecognitionRendererConfiguration;

/**
 * @group Recognizer
 */
type TConvertionConfiguration = {
    force?: {
        "on-stylesheet-change": boolean;
    };
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultConvertionConfiguration: TConvertionConfiguration;

/**
 * @group Recognizer
 */
type TScheme = "https" | "http";
/**
 * @group Recognizer
 */
type TServerHTTPConfiguration = {
    scheme: TScheme;
    host: string;
    applicationKey: string;
    hmacKey: string;
    version?: string;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultServerHTTPConfiguration: TServerHTTPConfiguration;
/**
 * @group Recognizer
 */
type TServerWebsocketConfiguration = TServerHTTPConfiguration & {
    websocket: {
        pingEnabled: boolean;
        pingDelay: number;
        maxPingLostCount: number;
        autoReconnect: boolean;
        maxRetryCount: number;
        fileChunkSize: number;
    };
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultServerWebsocketConfiguration: TServerWebsocketConfiguration;

/**
 * @group Recognizer
 */
type TOIRecognitionConfiguration = {
    lang: string;
    export: TExportConfiguration;
    "raw-content": {
        text?: TTextConfConfiguration;
        "session-time"?: number;
        recognition?: {
            types: ("text" | "shape")[];
        };
        classification?: {
            types: ("text" | "shape")[];
        };
        gestures?: ("underline" | "scratch-out" | "join" | "insert" | "strike-through" | "surround")[];
    };
    gesture: {
        enable: boolean;
        ignoreGestureStrokes: boolean;
    };
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultOffscreenRecognitionConfiguration: TOIRecognitionConfiguration;
/**
 * @group Recognizer
 */
type TOIRecognizerConfiguration = {
    server: TServerWebsocketConfiguration;
    recognition: TOIRecognitionConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultOIRecognizerConfiguration: TOIRecognizerConfiguration;
/**
 * @group Recognizer
 */
declare class OIRecognizerConfiguration implements TOIRecognizerConfiguration {
    server: TServerWebsocketConfiguration;
    recognition: TOIRecognitionConfiguration;
    constructor(configuration?: PartialDeep<TOIRecognizerConfiguration>);
}

/**
 * A websocket dialog have this sequence :
 * --------------- Client --------------------------------------------------------------- Server ---------------
 * { type: "authenticate" }                           ==================>
 *                                                    <==================       { type: "hmacChallenge" }
 * { type: "hmac" }                                   ==================>
 *                                                    <==================       { type: "authenticated" }
 * { type: "initSession" | "restoreSession" }         ==================>
 *                                                    <==================       { type: "sessionDescription" }
 * { type: "newContentPart" | "openContentPart" }     ==================>
 *                                                    <==================       { type: "partChanged" }
 * { type: "addStrokes" }                             ==================>
 *                                                    <==================       { type: "contentChanged" }
 * { type: "transform" }                              ==================>
 *                                                    <==================       { type: "contentChanged" }
 * { type: "eraseStrokes" }                           ==================>
 *                                                    <==================       { type: "contentChanged" }
 */
/**
 * @group Recognizer
 */
declare class OIRecognizer {
    #private;
    protected socket: WebSocket;
    protected pingWorker?: Worker;
    protected pingCount: number;
    protected reconnectionCount: number;
    protected sessionId?: string;
    protected currentPartId?: string;
    protected currentErrorCode?: string | number;
    protected addStrokeDeferred?: DeferredPromise<TOIMessageEventGesture | undefined>;
    protected contextlessGestureDeferred: Map<string, DeferredPromise<TOIMessageEventContextlessGesture>>;
    protected transformStrokeDeferred?: DeferredPromise<void>;
    protected eraseStrokeDeferred?: DeferredPromise<void>;
    protected replaceStrokeDeferred?: DeferredPromise<void>;
    protected exportDeferredMap: Map<string, DeferredPromise<TExport>>;
    protected closeDeferred?: DeferredPromise<void>;
    protected waitForIdleDeferred?: DeferredPromise<void>;
    protected undoDeferred?: DeferredPromise<void>;
    protected redoDeferred?: DeferredPromise<void>;
    protected clearDeferred?: DeferredPromise<void>;
    configuration: OIRecognizerConfiguration;
    initialized: DeferredPromise<void>;
    url: string;
    event: RecognizerEvent;
    constructor(config: PartialDeep<TOIRecognizerConfiguration>, event?: RecognizerEvent);
    get mimeTypes(): string[];
    protected rejectDeferredPending(error: Error | string): void;
    protected resetAllDeferred(): void;
    protected clearSocketListener(): void;
    protected closeCallback(evt: CloseEvent): void;
    protected openCallback(): void;
    protected manageHMACChallenge(hmacChallengeMessage: TOIMessageEventHMACChallenge): Promise<void>;
    protected initPing(): void;
    protected manageAuthenticated(): void;
    protected manageSessionDescriptionMessage(sessionDescriptionMessage: TOISessionDescriptionMessage): void;
    protected manageNewPartMessage(newPartMessage: TOIMessageEventNewPart): void;
    protected managePartChangeMessage(partChangeMessage: TOIMessageEventPartChange): void;
    protected manageContentChangedMessage(contentChangeMessage: TOIMessageEventContentChange): void;
    protected manageExportMessage(exportMessage: TOIMessageEventExport): void;
    protected manageWaitForIdle(): void;
    protected manageErrorMessage(errorMessage: TOIMessageEventError): void;
    protected manageGestureDetected(gestureMessage: TOIMessageEventGesture): void;
    protected manageContextlessGesture(gestureMessage: TOIMessageEventContextlessGesture): void;
    protected messageCallback(message: MessageEvent<string>): void;
    newSession(config: PartialDeep<TOIRecognizerConfiguration>): Promise<void>;
    init(): Promise<void>;
    send(message: TOIMessageEvent): Promise<void>;
    protected buildAddStrokesMessage(strokes: OIStroke[], processGestures?: boolean): TOIMessageEvent;
    addStrokes(strokes: OIStroke[], processGestures?: boolean): Promise<TOIMessageEventGesture | undefined>;
    protected buildReplaceStrokesMessage(oldStrokeIds: string[], newStrokes: OIStroke[]): TOIMessageEvent;
    replaceStrokes(oldStrokeIds: string[], newStrokes: OIStroke[]): Promise<void>;
    protected buildTransformTranslateMessage(strokeIds: string[], tx: number, ty: number): TOIMessageEvent;
    transformTranslate(strokeIds: string[], tx: number, ty: number): Promise<void>;
    protected buildTransformRotateMessage(strokeIds: string[], angle: number, x0?: number, y0?: number): TOIMessageEvent;
    transformRotate(strokeIds: string[], angle: number, x0?: number, y0?: number): Promise<void>;
    protected buildTransformScaleMessage(strokeIds: string[], scaleX: number, scaleY: number, x0?: number, y0?: number): TOIMessageEvent;
    transformScale(strokeIds: string[], scaleX: number, scaleY: number, x0?: number, y0?: number): Promise<void>;
    protected buildTransformMatrixMessage(strokeIds: string[], matrix: TMatrixTransform): TOIMessageEvent;
    transformMatrix(strokeIds: string[], matrix: TMatrixTransform): Promise<void>;
    protected buildEraseStrokesMessage(strokeIds: string[]): TOIMessageEvent;
    eraseStrokes(strokeIds: string[]): Promise<void>;
    recognizeGesture(stroke: OIStroke): Promise<TOIMessageEventContextlessGesture | undefined>;
    waitForIdle(): Promise<void>;
    protected buildUndoRedoChanges(changes: TOIHistoryBackendChanges): TOIMessageEvent[];
    undo(actions: TOIHistoryBackendChanges): Promise<void>;
    redo(actions: TOIHistoryBackendChanges): Promise<void>;
    export(requestedMimeTypes?: string[]): Promise<TExport>;
    clear(): Promise<void>;
    close(code: number, reason: string): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Recognizer
 */
type TRecognitionType = "TEXT" | "MATH" | "DIAGRAM" | "Raw Content" | "SHAPE";
/**
 * @group Recognizer
 */
type TConverstionState = "DIGITAL_EDIT" | "HANDWRITING";

/**
 * @group Recognizer
 */
type TRestRecognitionConfiguration = {
    type: TRecognitionType;
    lang: string;
    math: TMathConfiguration;
    text: TTextConfiguration;
    diagram: TDiagramConfiguration;
    "raw-content": TRawContentConfiguration;
    renderer: TRecognitionRendererConfiguration;
    export: TExportConfiguration;
    convert?: TConvertionConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRestRecognitionConfiguration: TRestRecognitionConfiguration;
/**
 * @group Recognizer
 */
type TRestRecognizerConfiguration = {
    server: TServerHTTPConfiguration;
    recognition: TRestRecognitionConfiguration;
};
/**
 * @group Recognizer
 */
declare const DefaultRestRecognizerConfiguration: TRestRecognizerConfiguration;
/**
 * @group Recognizer
 * @source
 */
declare class RestRecognizerConfiguration implements TRestRecognizerConfiguration {
    recognition: TRestRecognitionConfiguration;
    server: TServerHTTPConfiguration;
    constructor(configuration?: PartialDeep<TRestRecognizerConfiguration>);
}

/**
 * @group Recognizer
 */
type TRestPostConfiguration = {
    lang: string;
    diagram?: TDiagramConfiguration;
    math?: TMathConfiguration;
    "raw-content"?: TRawContentConfiguration;
    text?: TTextConfiguration;
    export: TExportConfiguration;
};
/**
 * @group Recognizer
 */
type TRestPostData = {
    configuration: TRestPostConfiguration;
    xDPI: number;
    yDPI: number;
    contentType: string;
    conversionState?: TConverstionState;
    height: number;
    width: number;
    strokeGroups: TStrokeGroupToSend[];
};
/**
 * @group Recognizer
 */
declare class RestRecognizer {
    #private;
    configuration: RestRecognizerConfiguration;
    constructor(config: PartialDeep<TRestRecognizerConfiguration>);
    get url(): string;
    get postConfig(): TRestPostConfiguration;
    protected buildData(model: Model): TRestPostData;
    protected post(data: unknown, mimeType: string): Promise<unknown>;
    protected tryFetch(data: TRestPostData, mimeType: string): Promise<TExport | never>;
    protected getMimeTypes(requestedMimeTypes?: string[]): string[];
    convert(model: Model, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<Model>;
    export(model: Model, requestedMimeTypes?: string[]): Promise<Model>;
    resize(model: Model): Promise<Model>;
}

/**
 * @group Recognizer
 */
type TWSRecognitionConfiguration = {
    type: Omit<TRecognitionType, "DIAGRAM" | "Raw Content">;
    lang: string;
    math: TMathConfiguration;
    text: TTextConfiguration;
    renderer: TRecognitionRendererConfiguration;
    export: TExportConfiguration;
    convert?: TConvertionConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultWSRecognitionConfiguration: TWSRecognitionConfiguration;
/**
 * @group Recognizer
 */
type TWSRecognizerConfiguration = {
    server: TServerWebsocketConfiguration;
    recognition: TWSRecognitionConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultWSRecognizerConfiguration: TWSRecognizerConfiguration;
/**
 * @group Recognizer
 */
declare class WSRecognizerConfiguration implements TWSRecognizerConfiguration {
    recognition: TWSRecognitionConfiguration;
    server: TServerWebsocketConfiguration;
    constructor(configuration?: PartialDeep<TWSRecognizerConfiguration>);
}

/**
 * A websocket dialog have this sequence :
 * --------------------------- Client --------------------------------------------------- Server ----------------------------------
 * init: send newContentPackage or restoreIInkSession           ==================>
 *                                                              <==================       ack
 * answer ack:
 *  send the hmac (if enable)                                   ==================>
 *  send the configuration                                      ==================>
 *                                                              <==================       contentPackageDescription
 * answer contentPackageDescription:
 *  send newContentPart or openContentPart                      ==================>
 *                                                              <==================        partChanged
 *                                                              <==================        contentChanged
 *                                                              <==================        newPart
 *                                                              <==================        svgPatch
 *
 * setPenStyle (send the parameters)                            ==================>
 * setTheme (send the parameters)                               ==================>
 * setPenStyleClasses (send the parameters)                     ==================>
 *                                                              <==================        svgPatch
 * addStrokes (send the strokes ) ============>
 *                                                              <==================        update
 */
/**
 * @group Recognizer
 */
declare class WSRecognizer {
    #private;
    protected socket: WebSocket;
    protected pingCount: number;
    protected reconnectionCount: number;
    protected viewSizeHeight: number;
    protected viewSizeWidth: number;
    protected sessionId?: string;
    currentPartId?: string;
    protected currentErrorCode?: string | number;
    protected penStyle?: TPenStyle;
    protected penStyleClasses?: string;
    protected theme?: TTheme;
    protected connected?: DeferredPromise<void>;
    protected ackDeferred?: DeferredPromise<void>;
    protected addStrokeDeferred?: DeferredPromise<TExport>;
    protected exportDeferred?: DeferredPromise<TExport>;
    protected convertDeferred?: DeferredPromise<TExport>;
    protected importDeferred?: DeferredPromise<TExport>;
    protected resizeDeferred?: DeferredPromise<void>;
    protected undoDeferred?: DeferredPromise<TExport>;
    protected redoDeferred?: DeferredPromise<TExport>;
    protected clearDeferred?: DeferredPromise<TExport>;
    protected importPointEventsDeferred?: DeferredPromise<TExport>;
    protected waitForIdleDeferred?: DeferredPromise<void>;
    configuration: TWSRecognizerConfiguration;
    initialized: DeferredPromise<void>;
    url: string;
    event: RecognizerEvent;
    constructor(config?: PartialDeep<TWSRecognizerConfiguration>);
    get mimeTypes(): string[];
    protected infinitePing(): void;
    protected openCallback(): void;
    protected rejectDeferredPending(error: Error): void;
    protected closeCallback(evt: CloseEvent): void;
    protected manageAckMessage(websocketMessage: TWSMessageEvent): Promise<void>;
    protected manageContentPackageDescriptionMessage(): Promise<void>;
    protected managePartChangeMessage(websocketMessage: TWSMessageEvent): void;
    protected manageExportMessage(websocketMessage: TWSMessageEvent): void;
    protected manageWaitForIdle(): Promise<void>;
    protected manageErrorMessage(websocketMessage: TWSMessageEvent): void;
    protected manageContentChangeMessage(websocketMessage: TWSMessageEvent): void;
    protected manageSVGPatchMessage(websocketMessage: TWSMessageEvent): void;
    protected messageCallback(message: MessageEvent<string>): void;
    init(height: number, width: number): Promise<void>;
    send(message: TWSMessageEvent): Promise<void>;
    addStrokes(strokes: Stroke[]): Promise<TExport>;
    setPenStyle(penStyle: TPenStyle): Promise<void>;
    setPenStyleClasses(penStyleClasses: string): Promise<void>;
    setTheme(theme: TTheme): Promise<void>;
    export(model: Model, requestedMimeTypes?: string[]): Promise<Model>;
    import(model: Model, data: Blob, mimeType?: string): Promise<Model>;
    resize(model: Model): Promise<Model>;
    importPointEvents(strokes: Stroke[]): Promise<TExport>;
    convert(model: Model, conversionState?: TConverstionState): Promise<Model>;
    waitForIdle(): Promise<void>;
    undo(model: Model): Promise<Model>;
    redo(model: Model): Promise<Model>;
    clear(model: Model): Promise<Model>;
    close(code: number, reason: string): void;
    destroy(): void;
}

/**
 * @group Recognizer
 */
type TRecognizerInkRecognitionConfiguration = {
    type: TRecognitionType;
    lang: string;
    math: TMathConfiguration;
    text: TTextConfiguration;
    diagram: TDiagramConfiguration;
    "raw-content": TRawContentConfiguration;
    renderer: TRecognitionRendererConfiguration;
    export: TExportConfiguration;
    convert?: TConvertionConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRecognizerInkRecognitionConfiguration: TRecognizerInkRecognitionConfiguration;
/**
 * @group Recognizer
 */
type TRecognizerInkConfiguration = {
    server: TServerHTTPConfiguration;
    recognition: TRecognizerInkRecognitionConfiguration;
};
/**
 * @group Recognizer
 */
declare const DefaultRecognizerInkConfiguration: TRecognizerInkConfiguration;
/**
 * @group Recognizer
 * @source
 */
declare class RecognizerInkConfiguration implements TRecognizerInkConfiguration {
    recognition: TRecognizerInkRecognitionConfiguration;
    server: TServerHTTPConfiguration;
    constructor(configuration?: PartialDeep<TRecognizerInkConfiguration>);
}

/**
 * @group Recognizer
 */
type TRecognizerInkPostConfiguration = {
    lang: string;
    diagram?: TDiagramConfiguration;
    math?: TMathConfiguration;
    "raw-content"?: TRawContentConfiguration;
    text?: TTextConfiguration;
    export: TExportConfiguration;
};
/**
 * @group Recognizer
 */
type TRecognizerInkPostData = {
    scaleX: number;
    scaleY: number;
    configuration: TRecognizerInkPostConfiguration;
    contentType: string;
    strokes: TStrokeToSend[];
};
/**
 * @group Recognizer
 */
declare class RecognizerInk {
    #private;
    protected configuration: RecognizerInkConfiguration;
    constructor(config: PartialDeep<TRecognizerInkConfiguration>);
    get url(): string;
    get postConfig(): TRecognizerInkPostConfiguration;
    protected formatStrokes(strokes: TStroke[]): TStrokeToSend[];
    protected buildData(strokes: TStroke[]): TRecognizerInkPostData;
    protected post(data: unknown, mimeType: string): Promise<unknown>;
    protected tryFetch(data: TRecognizerInkPostData, mimeType: string): Promise<TExport | never>;
    protected getMimeTypes(requestedMimeTypes?: string[]): string[];
    send(strokes: TStroke[]): Promise<TExport>;
}

/**
 * @group Utils
 */
type PartialDeep<T> = T extends object ? {
    [P in keyof T]?: PartialDeep<T[P]>;
} : T;

/**
 * @group Utils
 */
declare function getAvailableFontList(configuration: PartialDeep<{
    server: TServerHTTPConfiguration;
    recognition: {
        lang: string;
    };
}>): Promise<Array<string>>;

/**
 * @group Utils
 */
declare function getAvailableLanguageList(configuration: PartialDeep<{
    server: TServerHTTPConfiguration;
}>): Promise<{
    result: {
        [key: string]: string;
    };
}>;

/**
 * @group Utils
 */
declare function computeLinksPointers(point: TPointer, angle: number, width: number): TPoint[];
/**
 * @group Utils
 */
declare function computeMiddlePointer(point1: TPointer, point2: TPointer): TPointer;

/**
 * @group Utils
 */
type TApiInfos = {
    version: string;
    gitCommit: string;
    nativeVersion: string;
};
/**
 * @group Utils
 */
declare function getApiInfos(configuration?: PartialDeep<{
    server: TServerHTTPConfiguration;
}>): Promise<TApiInfos>;

/**
 * @group Editor
 */
type EditorLayerUIInfoModal = {
    root: HTMLDivElement;
    text: HTMLParagraphElement;
};
/**
 * @group Editor
 */
type EditorLayerUIMessage = {
    root: HTMLDivElement;
    overlay: HTMLDivElement;
    modal: EditorLayerUIInfoModal;
};
/**
 * @group Editor
 */
type EditorLayerUIState = {
    root: HTMLDivElement;
    busy: HTMLDivElement;
};
/**
 * @group Editor
 */
type EditorLayerUI = {
    root: HTMLDivElement;
    loader: HTMLDivElement;
    message: EditorLayerUIMessage;
    state: EditorLayerUIState;
};
/**
 * @group Editor
 */
declare class EditorLayer {
    root: HTMLElement;
    ui: EditorLayerUI;
    rendering: HTMLElement;
    onCloseModal?: (inError?: boolean) => void;
    constructor(root: HTMLElement, rootClassCss?: string);
    render(): void;
    createLoader(): HTMLDivElement;
    showLoader(): void;
    hideLoader(): void;
    createMessageOverlay(): HTMLDivElement;
    closeMessageModal(): void;
    hideMessageModal(): void;
    createMessageModal(): EditorLayerUIInfoModal;
    createMessage(): EditorLayerUIMessage;
    showMessageInfo(notif: {
        message: string;
        timeout?: number;
    }): void;
    showMessageError(err: Error | string): void;
    createBusy(): HTMLDivElement;
    createState(): EditorLayerUIState;
    showState(): void;
    hideState(): void;
    updateState(idle: boolean): void;
    createLayerUI(): EditorLayerUI;
    createLayerRender(): HTMLDivElement;
    destroy(): void;
}

/**
 * @hidden
 * @group Editor
 */
type TEditorConfiguration = {
    logger: TLoggerConfiguration;
};
/**
 * @group Editor
 */
type EditorType = "WEBSOCKET" | "REST" | "OFFSCREEN" | "REST-RECOGNIZER";
/**
 * @hidden
 * @group Editor
 */
type EditorOptionsBase = {
    configuration: TEditorConfiguration;
    override?: {
        cssClass?: string;
    };
};
/**
 * @hidden
 * @group Editor
 */
declare abstract class AbstractEditor {
    #private;
    logger: Logger;
    layers: EditorLayer;
    event: EditorEvent;
    info?: TApiInfos;
    constructor(rootElement: HTMLElement, options?: PartialDeep<EditorOptionsBase>);
    get loggerConfiguration(): TLoggerConfiguration;
    set loggerConfiguration(loggerConfig: TLoggerConfiguration);
    abstract initialize(): Promise<void>;
    abstract clear(): Promise<void>;
    abstract destroy(): Promise<void>;
    loadInfo(server: TServerHTTPConfiguration): Promise<TApiInfos>;
}

/**
 * @group Editor
 * @remarks
 * Configure when the action is triggered.
 *
 * POINTER_UP :   Action is triggered on every PenUP.
 *                This is the recommended mode for CDK V3 WebSocket recognitions.
 *
 * QUIET_PERIOD : Action is triggered after a quiet period in milli-seconds on every pointer up.
 *                The value is set to 1000 for example recognition will be triggered when the user stops writing for 1 seconds.
 *                This is the recommended mode for all REST discoveries.
 *
 * DEMAND :       Action is triggered on external demande
 */
type TEditorTriggerConfiguration = {
    exportContent: "QUIET_PERIOD" | "POINTER_UP" | "DEMAND";
    exportContentDelay: number;
    resizeTriggerDelay: number;
};
/**
 * @group Editor
 * @source
 */
declare const DefaultEditorTriggerConfiguration: TEditorTriggerConfiguration;

/**
 * @group Editor
 */
type TEditorRestConfiguration = TEditorConfiguration & TRestRecognizerConfiguration & {
    rendering: TRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
};
/**
 * @group Editor
 * @source
 */
declare const DefaultEditorRestConfiguration: TEditorRestConfiguration;
/**
 * @group Editor
 */
declare class EditorRestConfiguration implements TEditorRestConfiguration {
    server: TServerHTTPConfiguration;
    recognition: TRestRecognitionConfiguration;
    rendering: TRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
    constructor(configuration?: PartialDeep<TEditorRestConfiguration>);
}

/**
 * @group Editor
 */
type TEditorRestOptions = PartialDeep<EditorOptionsBase & {
    configuration: TEditorRestConfiguration;
}> & {
    override?: {
        grabber?: PointerEventGrabber;
        recognizer?: RestRecognizer;
    };
};
/**
 * @group Editor
 */
declare class EditorRest extends AbstractEditor {
    #private;
    grabber: PointerEventGrabber;
    renderer: CanvasRenderer;
    recognizer: RestRecognizer;
    history: HistoryManager;
    styleManager: StyleManager;
    constructor(rootElement: HTMLElement, options?: TEditorRestOptions);
    protected onPointerDown(info: PointerInfo): void;
    protected onPointerMove(info: PointerInfo): void;
    protected onPointerUp(info: PointerInfo): Promise<void>;
    get initializationPromise(): Promise<void>;
    get tool(): EditorTool;
    set tool(i: EditorTool);
    protected setCursorStyle(): void;
    get model(): Model;
    get currentPenStyle(): TPenStyle;
    get penStyle(): TPenStyle;
    set penStyle(penStyle: TPenStyle | undefined);
    get penStyleClasses(): string;
    set penStyleClasses(penStyleClasses: string | undefined);
    get theme(): TTheme;
    set theme(theme: PartialDeep<TTheme>);
    get configuration(): EditorRestConfiguration;
    initialize(): Promise<void>;
    drawCurrentStroke(): void;
    updateModelRendering(): Promise<Model>;
    export(mimeTypes?: string[]): Promise<Model>;
    convert(params?: {
        conversionState?: TConverstionState;
        mimeTypes?: string[];
    }): Promise<Model>;
    importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<Model>;
    resize({ height, width }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group WSSmartGuide
 */
declare class WSSmartGuide {
    #private;
    uuid: string;
    editor: EditorWebSocket;
    margin: TMarginConfiguration;
    jiix?: TJIIXExport;
    lastWord?: TJIIXWord;
    wordToChange?: TJIIXWord;
    constructor(editor: EditorWebSocket);
    init(domElement: HTMLElement, margin: TMarginConfiguration): void;
    resize(): void;
    update(exports: TJIIXExport): void;
    clear(): void;
    destroy(): void;
}

/**
 * @group Editor
 */
type TEditorWebSocketConfiguration = TEditorConfiguration & TWSRecognizerConfiguration & {
    rendering: TRendererConfiguration;
    smartGuide: {
        enable: boolean;
    };
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
};
/**
 * @group Editor
 * @source
 */
declare const DefaultEditorWebSocketConfiguration: TEditorWebSocketConfiguration;
/**
 * @group Editor
 */
declare class EditorWebSocketConfiguration implements TEditorWebSocketConfiguration {
    server: TServerWebsocketConfiguration;
    recognition: TWSRecognitionConfiguration;
    rendering: TRendererConfiguration;
    smartGuide: {
        enable: boolean;
    };
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
    constructor(configuration?: PartialDeep<TEditorWebSocketConfiguration>);
}

/**
 * @group Editor
 */
type TEditorWebsocketOptions = PartialDeep<EditorOptionsBase & {
    configuration: EditorWebSocketConfiguration;
}> & {
    override?: {
        grabber?: PointerEventGrabber;
        recognizer?: WSRecognizer;
    };
};
/**
 * @group Editor
 */
declare class EditorWebSocket extends AbstractEditor {
    #private;
    smartGuide?: WSSmartGuide;
    grabber: PointerEventGrabber;
    renderer: WSSVGRenderer;
    recognizer: WSRecognizer;
    history: HistoryManager;
    styleManager: StyleManager;
    constructor(rootElement: HTMLElement, options?: TEditorWebsocketOptions);
    get initializationPromise(): Promise<void>;
    get tool(): EditorTool;
    set tool(i: EditorTool);
    protected setCursorStyle(): void;
    get model(): Model;
    get configuration(): EditorWebSocketConfiguration;
    get currentPenStyle(): TPenStyle;
    get penStyle(): TPenStyle;
    set penStyle(penStyle: PartialDeep<TPenStyle>);
    get penStyleClasses(): string;
    set penStyleClasses(penClass: string);
    get theme(): TTheme;
    set theme(theme: PartialDeep<TTheme>);
    protected syncStyle(): Promise<void>;
    protected onExport(exports: TExport): void;
    protected onPointerDown(info: PointerInfo): void;
    protected onPointerMove(info: PointerInfo): void;
    protected onPointerUp(info: PointerInfo): Promise<void>;
    protected onSVGPatch(evt: TWSMessageEventSVGPatch): void;
    protected initializeSmartGuide(): void;
    protected onContetChaned(undoRedoContext: THistoryContext): void;
    protected onError(error: Error): void;
    initialize(): Promise<void>;
    drawCurrentStroke(): void;
    synchronizeModelWithBackend(): Promise<Model>;
    waitForIdle(): Promise<void>;
    export(mimeTypes?: string[]): Promise<Model>;
    convert(params?: {
        conversionState?: TConverstionState;
    }): Promise<Model>;
    import(data: Blob | string | TJIIXExport, mimeType?: string): Promise<Model>;
    importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<Model>;
    resize({ height, width }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    undo(): Promise<Model>;
    redo(): Promise<Model>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Editor
 */
type TEditorInkConfiguration = TEditorConfiguration & TRestRecognizerConfiguration & {
    renderer: TRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    penStyle: TStyle;
    logger: TLoggerConfiguration;
};
/**
 * @group Editor
 * @source
 */
declare const DefaultEditorInkConfiguration: TEditorInkConfiguration;
/**
 * @group Editor
 */
declare class EditorInkConfiguration implements TEditorInkConfiguration {
    server: TServerHTTPConfiguration;
    recognition: TRestRecognitionConfiguration;
    renderer: TRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TStyle;
    constructor(configuration?: PartialDeep<EditorInkConfiguration>);
}

/**
 * @group Editor
 */
type TEditorInkOptions = PartialDeep<EditorOptionsBase & {
    configuration: TEditorInkConfiguration;
}> & {
    override?: {
        grabber?: PointerEventGrabber;
        recognizer?: RecognizerInk;
    };
};
/**
 * @group Editor
 */
declare class EditorInk extends AbstractEditor {
    #private;
    grabber: PointerEventGrabber;
    renderer: CanvasRenderer;
    recognizer: RecognizerInk;
    history: HistoryManager;
    constructor(rootElement: HTMLElement, options?: TEditorInkOptions);
    protected onPointerDown(info: PointerInfo): void;
    protected onPointerMove(info: PointerInfo): void;
    protected onPointerUp(info: PointerInfo): Promise<void>;
    get penStyle(): TStyle;
    set penStyle(penStyle: PartialDeep<TStyle>);
    get initializationPromise(): Promise<void>;
    get tool(): EditorTool;
    set tool(i: EditorTool);
    protected setCursorStyle(): void;
    get model(): Model;
    get configuration(): EditorInkConfiguration;
    initialize(): Promise<void>;
    drawCurrentStroke(): void;
    updateModelRendering(): Promise<Model>;
    importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<Model>;
    resize({ height, width }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Editor
 * @hideconstructor
 */
declare class Editor {
    protected static logger: Logger;
    protected static instance: EditorOffscreen | EditorRest | EditorWebSocket | EditorInk | undefined;
    static load<T extends EditorType>(rootElement: HTMLElement, type: T, options: T extends "OFFSCREEN" ? TEditorOffscreenOptions : T extends "REST" ? TEditorRestOptions : TEditorWebsocketOptions extends "REST-RECOGNIZER" ? TEditorInkOptions : TEditorWebsocketOptions): Promise<T extends "OFFSCREEN" ? EditorOffscreen : T extends "REST" ? EditorRest : EditorWebSocket extends "REST-RECOGNIZER" ? EditorInk : EditorWebSocket>;
    static getInstance(): EditorOffscreen | EditorRest | EditorWebSocket | EditorInk | undefined;
}

export { AbstractEditor, Box, CanvasRenderer, CanvasRendererShape, CanvasRendererStroke, CanvasRendererText, DecoratorKind, DefaultConvertionConfiguration, DefaultDebugConfiguration, DefaultDiagramConfiguration, DefaultDiagramConvertConfiguration, DefaultEditorInkConfiguration, DefaultEditorOffscreenConfiguration, DefaultEditorRestConfiguration, DefaultEditorTriggerConfiguration, DefaultEditorWebSocketConfiguration, DefaultEraserConfiguration, DefaultExportConfiguration, DefaultGestureConfiguration, DefaultGrabberConfiguration, DefaultGuidesConfiguration, DefaultHistoryConfiguration, DefaultJiixConfiguration, DefaultListenerConfiguration, DefaultLoggerConfiguration, DefaultMarginConfiguration, DefaultMathConfiguration, DefaultMathUndoRedoConfiguration, DefaultMenuConfiguration, DefaultOIRecognizerConfiguration, DefaultOIRendererConfiguration, DefaultOffscreenRecognitionConfiguration, DefaultPenStyle, DefaultRawContentConfiguration, DefaultRecognitionRendererConfiguration, DefaultRecognizerInkConfiguration, DefaultRecognizerInkRecognitionConfiguration, DefaultRendererConfiguration, DefaultRestRecognitionConfiguration, DefaultRestRecognizerConfiguration, DefaultServerHTTPConfiguration, DefaultServerWebsocketConfiguration, DefaultSnapConfiguration, DefaultSolverConfiguration, DefaultStyle, DefaultTextConfiguration, DefaultTextGuidesConfiguration, DefaultTheme, DefaultWSRecognitionConfiguration, DefaultWSRecognizerConfiguration, DeferredPromise, EdgeDecoration, EdgeKind, Editor, EditorEvent, EditorEventName, EditorInk, EditorInkConfiguration, EditorLayer, type EditorLayerUI, type EditorLayerUIInfoModal, type EditorLayerUIMessage, type EditorLayerUIState, EditorOffscreen, EditorOffscreenConfiguration, type EditorOptionsBase, EditorRest, EditorRestConfiguration, EditorTool, type EditorType, EditorWebSocket, EditorWebSocketConfiguration, EditorWriteTool, ExportType, HistoryManager, InsertAction, JIIXELementType, JIIXEdgeKind, JIIXNodeKind, Logger, LoggerCategory, LoggerLevel, LoggerManager, MatrixTransform, Model, OIConversionManager, OIDebugSVGManager, OIDecorator, OIEdgeArc, OIEdgeBase, OIEdgeLine, OIEdgePolyLine, OIEraseManager, OIEraser, OIGestureManager, OIHistoryManager, OIMenu, OIMenuAction, OIMenuContext, OIMenuManager, OIMenuStyle, OIMenuSub, OIMenuTool, OIModel, OIMoveManager, OIRecognizedArc, OIRecognizedBase, OIRecognizedCircle, OIRecognizedEllipse, OIRecognizedLine, OIRecognizedPolyLine, OIRecognizedPolygon, OIRecognizedText, OIRecognizer, OIRecognizerConfiguration, OIResizeManager, OIRotationManager, OISVGRenderer, OISVGRendererConst, OISVGRendererDecoratorUtil, OISVGRendererEdgeUtil, OISVGRendererEraserUtil, OISVGRendererGroupUtil, OISVGRendererRecognizedUtil, OISVGRendererShapeUtil, OISVGRendererStrokeUtil, OISVGRendererTextUtil, OISelectionManager, OIShapeBase, OIShapeCircle, OIShapeEllipse, OIShapePolygon, OISnapManager, OIStroke, OISymbolBase, OISymbolGroup, OIText, OITextManager, OITranslateManager, OIWriteManager, type PartialDeep, PointerEventGrabber, type PointerInfo, RecognizedKind, RecognizerError, RecognizerEvent, RecognizerEventName, RecognizerInk, RecognizerInkConfiguration, ResizeDirection, RestRecognizer, RestRecognizerConfiguration, SELECTION_MARGIN, SVGBuilder, SVGStroker, ShapeKind, SnapConfiguration, StrikeThroughAction, Stroke, StyleHelper, StyleManager, SurroundAction, SvgElementRole, SymbolType, type TAngleUnit, type TApiInfos, type TBox, type TCanvasShapeEllipseSymbol, type TCanvasShapeLineSymbol, type TCanvasShapeTableLineSymbol, type TCanvasShapeTableSymbol, type TCanvasTextSymbol, type TCanvasTextUnderlineSymbol, type TCanvasUnderLineSymbol, type TConverstionState, type TConvertionConfiguration, type TDiagramConfiguration, type TDiagramConvertConfiguration, type TEditorConfiguration, type TEditorInkConfiguration, type TEditorInkOptions, type TEditorOffscreenConfiguration, type TEditorOffscreenOptions, type TEditorRestConfiguration, type TEditorRestOptions, type TEditorTriggerConfiguration, type TEditorWebSocketConfiguration, type TEditorWebsocketOptions, type TEraserConfiguration, type TExport, type TExportConfiguration, type TGesture, type TGestureConfiguration, type TGestureType, type TGrabberConfiguration, type TGuidesConfiguration, type THistoryConfiguration, type THistoryContext, type TImageConfiguration, type TImageViewportConfiguration, type TJIIXBase, type TJIIXChar, type TJIIXEdgeArc, type TJIIXEdgeElement, type TJIIXEdgeElementBase, type TJIIXEdgeLine, type TJIIXEdgePolyEdge, type TJIIXElement, type TJIIXElementBase, type TJIIXExport, type TJIIXLine, type TJIIXNodeCircle, type TJIIXNodeElement, type TJIIXNodeElementBase, type TJIIXNodeEllipse, type TJIIXNodeParrallelogram, type TJIIXNodePolygon, type TJIIXNodeRectangle, type TJIIXNodeRhombus, type TJIIXNodeTriangle, type TJIIXStrokeItem, type TJIIXTextElement, type TJIIXWord, type TJiixConfiguration, type TListenerConfiguration, type TLoggerConfiguration, type TMarginConfiguration, type TMathConfiguration, type TMathMLExport, type TMathMLFlavor, type TMathUndoRedoConfiguration, type TMatrixTransform, type TMenuConfiguration, type TMenuItem, type TMenuItemBoolean, type TMenuItemButton, type TMenuItemButtonList, type TMenuItemColorList, type TMenuItemSelect, type TOIEdge, type TOIHistoryBackendChanges, type TOIHistoryChanges, type TOIHistoryStackItem, type TOIMessage, type TOIMessageEvent, type TOIMessageEventAuthenticated, type TOIMessageEventContentChange, type TOIMessageEventContextlessGesture, type TOIMessageEventError, type TOIMessageEventExport, type TOIMessageEventGesture, type TOIMessageEventHMACChallenge, type TOIMessageEventIdle, type TOIMessageEventNewPart, type TOIMessageEventPartChange, type TOIMessageEventPong, type TOIMessageReceived, TOIMessageType, type TOIRecognitionConfiguration, type TOIRecognized, type TOIRecognizerConfiguration, type TOIRendererConfiguration, type TOISessionDescriptionMessage, type TOIShape, type TOISymbol, type TOISymbolChar, type TPenStyle, type TPoint, type TPointer, type TRawContentConfiguration, type TRecognitionPositions, type TRecognitionRendererConfiguration, type TRecognitionRendererDebugConfiguration, type TRecognitionType, type TRecognizerInkConfiguration, type TRecognizerInkPostConfiguration, type TRecognizerInkPostData, type TRecognizerInkRecognitionConfiguration, type TRendererConfiguration, type TRestPostConfiguration, type TRestPostData, type TRestRecognitionConfiguration, type TRestRecognizerConfiguration, type TRoundingMode, type TScheme, type TSegment, type TServerHTTPConfiguration, type TServerWebsocketConfiguration, type TSnapConfiguration, type TSnapLineInfos, type TSnapNudge, type TSolverConfiguration, type TSolverOptions, type TStroke, type TStrokeGroup, type TStrokeGroupToSend, type TStrokeToSend, type TStyle, type TSubMenuParam, type TSymbol, type TTextConfConfiguration, type TTextConfiguration, type TTextGuidesConfiguration, type TTheme, type TThemeMath, type TThemeMathSolved, type TThemeText, type TUndoRedoMode, type TUpdatePatch, type TUpdatePatchAppendChild, type TUpdatePatchInsertBefore, type TUpdatePatchRemoveAttribut, type TUpdatePatchRemoveChild, type TUpdatePatchRemoveElement, type TUpdatePatchReplaceAll, type TUpdatePatchReplaceELement, type TUpdatePatchSetAttribut, type TUpdatePatchType, type TWSMessageEvent, type TWSMessageEventContentChange, type TWSMessageEventContentPackageDescriptionMessage, type TWSMessageEventError, type TWSMessageEventExport, type TWSMessageEventHMACChallenge, type TWSMessageEventPartChange, type TWSMessageEventSVGPatch, type TWSRecognitionConfiguration, type TWSRecognizerConfiguration, WSRecognizer, WSRecognizerConfiguration, WSSVGRenderer, WSSmartGuide, computeAngleAxeRadian, computeAngleRadian, computeAverage, computeDistance, computeDistanceBetweenPointAndSegment, computeHmac, computeLinksPointers, computeMiddlePointer, computeNearestPointOnSegment, computePointOnEllipse, computeRotatedPoint, convertBoundingBoxMillimeterToPixel, convertDegreeToRadian, convertMillimeterToPixel, convertPartialStrokesToOIStrokes, convertPartialStrokesToStrokes, convertPixelToMillimeter, convertRadianToDegree, createPointsOnSegment, createUUID, findIntersectBetweenSegmentAndCircle, findIntersectionBetween2Segment, getApiInfos, getAvailableFontList, getAvailableLanguageList, getClosestPoint, getClosestPoints, getInitialHistoryContext, isBetween, isDeepEqual, isPointInsideBox, isPointInsidePolygon, isValidNumber, isValidPoint, isVersionSuperiorOrEqual, mergeDeep, scalaire };
//# sourceMappingURL=iink.d.ts.map
