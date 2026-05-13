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
 * @group Components
 */
interface ModalFieldOption {
    value: string;
    label: string;
}
/**
 * @group Components
 */
interface ModalField {
    id: string;
    label: string;
    type: "text" | "number" | "select";
    defaultValue?: string | number;
    placeholder?: string;
    options?: ModalFieldOption[];
}
/**
 * @group Components
 */
interface ModalButton {
    label: string;
    type: "primary" | "secondary";
    callback: (values: {
        [key: string]: string;
    }) => void | Promise<void>;
}
/**
 * @group Components
 */
interface ModalConfig {
    title: string;
    fields: ModalField[];
    buttons: ModalButton[];
    customContent?: HTMLElement;
}
/**
 * @group Components
 */
declare class Modal {
    private config;
    private modal;
    private backdrop;
    private isOpen;
    constructor(config: ModalConfig);
    private createBackdrop;
    private createModal;
    private getFieldValues;
    /**
     * Open the modal
     */
    open(): void;
    /**
     * Close the modal
     */
    close(): void;
    /**
     * Remove the modal from DOM
     */
    destroy(): void;
}

/**
 * @group Components
 */
interface ChartConfig {
    width?: number;
    height?: number;
    title?: string;
    xLabel?: string;
    yLabel?: string;
    lineColor?: string;
    lineWidth?: number;
    showGrid?: boolean;
    showPoints?: boolean;
}
/**
 * @group Components
 */
declare class Chart {
    private canvas;
    private ctx;
    private config;
    private series;
    private container;
    private tableElement?;
    private viewport;
    private defaultViewport;
    private isDragging;
    private lastMousePos;
    private controlsContainer?;
    constructor(config?: ChartConfig);
    private createControls;
    private setupInteractions;
    private zoom;
    private pan;
    private resetZoom;
    /**
     * Filter outliers using IQR method
     */
    private filterOutliers;
    /**
     * Calculate default viewport based on median values
     */
    private calculateDefaultViewport;
    /**
     * Set the data points to plot
     * @param data Can be:
     *   - Single series: number[][] or { [key: string]: number }[]
     *   - Multiple series: number[][][] or { [key: string]: number }[][]
     */
    setData(data: number[][] | {
        [key: string]: number;
    }[] | number[][][] | {
        [key: string]: number;
    }[][]): void;
    private convertToPoints;
    /**
     * Get the container element (includes canvas and table)
     */
    getElement(): HTMLDivElement;
    private createTable;
    private updateTable;
    private draw;
    /**
     * Update chart configuration and redraw
     */
    updateConfig(config: Partial<ChartConfig>): void;
    /**
     * Destroy the chart
     */
    destroy(): void;
}

/**
 * @group Logger
 */
declare enum LoggerLevel {
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4
}
/**
 * @group Logger
 */
declare enum LoggerCategory {
    EDITOR = "EDITOR",
    RECOGNIZER = "RECOGNIZER",
    GRABBER = "GRABBER",
    GESTURE = "GESTURE",
    MOVE = "MOVE",
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
    SYNCHRONIZER = "SYNCHRONIZER",
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
    private log;
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
    stringToJSON(style: string): Record<string, string>;
    JSONToString(style: Record<string, string>): string;
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
    Math = "math",
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
    static getSide(box: TBox): TPoint[];
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
    get side(): TPoint[];
    get snapPoints(): TPoint[];
    isContained(wrapper: TBox): boolean;
    contains(child: TBox): boolean;
    containsPoint(point: TPoint): boolean;
    overlaps(boundaries: TBox): boolean;
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
declare abstract class IISymbolBase<T extends string = SymbolType> implements TSymbol {
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
    abstract clone(): IISymbolBase;
    abstract toJSON(): PartialDeep<IISymbolBase>;
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
declare abstract class OIEdgeBase<K = EdgeKind> extends IISymbolBase<SymbolType.Edge> {
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
declare class IIEdgeArc extends OIEdgeBase<EdgeKind.Arc> {
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
    clone(): IIEdgeArc;
    toJSON(): PartialDeep<IIEdgeArc>;
    static create(partial: PartialDeep<IIEdgeArc>): IIEdgeArc;
}

/**
 * @group Symbol
 */
declare class IIEdgeLine extends OIEdgeBase<EdgeKind.Line> {
    start: TPoint;
    end: TPoint;
    constructor(start: TPoint, end: TPoint, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: PartialDeep<TStyle>);
    get vertices(): TPoint[];
    clone(): IIEdgeLine;
    toJSON(): PartialDeep<IIEdgeLine>;
    static create(partial: PartialDeep<IIEdgeLine>): IIEdgeLine;
}

/**
 * @group Symbol
 */
declare class IIEdgePolyLine extends OIEdgeBase<EdgeKind.PolyEdge> {
    points: TPoint[];
    constructor(points: TPoint[], startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: PartialDeep<TStyle>);
    get vertices(): TPoint[];
    clone(): IIEdgePolyLine;
    toJSON(): PartialDeep<IIEdgePolyLine>;
    static create(partial: PartialDeep<IIEdgePolyLine>): IIEdgePolyLine;
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
declare abstract class OIShapeBase<K = ShapeKind> extends IISymbolBase<SymbolType.Shape> {
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
declare class IIShapeCircle extends OIShapeBase<ShapeKind.Circle> {
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
    clone(): IIShapeCircle;
    toJSON(): PartialDeep<IIShapeCircle>;
    static createBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapeCircle;
    static updateBetweenPoints(circle: IIShapeCircle, _origin: TPoint, target: TPoint): IIShapeCircle;
    static create(partial: PartialDeep<IIShapeCircle>): IIShapeCircle;
}

/**
 * @group Symbol
 */
declare class IIShapeEllipse extends OIShapeBase<ShapeKind.Ellipse> {
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
    clone(): IIShapeEllipse;
    toJSON(): PartialDeep<IIShapeEllipse>;
    static createBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapeEllipse;
    static updateBetweenPoints(ellipse: IIShapeEllipse, origin: TPoint, target: TPoint): IIShapeEllipse;
    static create(partial: PartialDeep<IIShapeEllipse>): IIShapeEllipse;
}

/**
 * @group Symbol
 */
declare class IIShapePolygon extends OIShapeBase<ShapeKind.Polygon> {
    points: TPoint[];
    constructor(points: TPoint[], style?: PartialDeep<TStyle>);
    get vertices(): TPoint[];
    get bounds(): Box;
    clone(): IIShapePolygon;
    toJSON(): PartialDeep<IIShapePolygon>;
    static create(partial: PartialDeep<IIShapePolygon>): IIShapePolygon;
    static createTriangleBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapePolygon;
    static updateTriangleBetweenPoints(poly: IIShapePolygon, origin: TPoint, target: TPoint): IIShapePolygon;
    static createParallelogramBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapePolygon;
    static updateParallelogramBetweenPoints(poly: IIShapePolygon, origin: TPoint, target: TPoint): IIShapePolygon;
    static createRectangleBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapePolygon;
    static updateRectangleBetweenPoints(poly: IIShapePolygon, origin: TPoint, target: TPoint): IIShapePolygon;
    static createRhombusBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapePolygon;
    static updateRhombusBetweenPoints(poly: IIShapePolygon, origin: TPoint, target: TPoint): IIShapePolygon;
}

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
declare class IIDecorator {
    id: string;
    kind: DecoratorKind;
    style: TStyle;
    constructor(kind: DecoratorKind, style: PartialDeep<TStyle>);
    clone(): IIDecorator;
}

/**
 * @group Symbol
 */
declare class IIStroke extends IISymbolBase<SymbolType.Stroke> {
    readonly isClosed = false;
    pointerType: string;
    length: number;
    decorators: IIDecorator[];
    pointers: Array<TPointer>;
    constructor(style?: PartialDeep<TStyle>, pointerType?: string);
    get bounds(): Box;
    static split(strokeToSplit: IIStroke, i: number): {
        before: IIStroke;
        after: IIStroke;
    };
    static substract(stroke: IIStroke, partStroke: IIStroke): {
        before?: IIStroke;
        after?: IIStroke;
    };
    get snapPoints(): TPoint[];
    get vertices(): TPoint[];
    protected computePressure(distance: number): number;
    protected filterPointByAcquisitionDelta(point: TPointer): boolean;
    addPointer(pointer: TPointer): void;
    overlaps(box: TBox): boolean;
    clone(): IIStroke;
    formatToSend(): TStrokeToSend;
    toJSON(): PartialDeep<IIStroke>;
    static create(partial: PartialDeep<IIStroke>): IIStroke;
}
/**
 * @group Symbol
 * @group Utils
 */
declare function convertPartialStrokesToOIStrokes(json: PartialDeep<TStroke>[]): IIStroke[];

/**
 * @group Symbol
 */
declare enum RecognizedKind {
    Text = "text",
    Math = "math",
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
declare abstract class IIRecognizedBase<K = RecognizedKind> extends IISymbolBase<SymbolType.Recognized> {
    readonly kind: K;
    /** JIIX element ID from recognition result */
    jiixId?: string;
    strokes: IIStroke[];
    constructor(kind: K, strokes: IIStroke[], style?: PartialDeep<TStyle>);
    get vertices(): TPoint[];
    get bounds(): Box;
    get snapPoints(): TPoint[];
    updateChildrenStyle(): void;
    overlaps(box: TBox): boolean;
    containsStroke(strokeId: string): boolean;
    removeStrokes(strokeIds: string[]): IIStroke[];
}

/**
 * @group Symbol
 */
declare class IIRecognizedArc extends IIRecognizedBase<RecognizedKind.Arc> {
    readonly isClosed = false;
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedArc;
    toJSON(): PartialDeep<IIRecognizedArc>;
    static create(partial: PartialDeep<IIRecognizedArc>): IIRecognizedArc;
}

/**
 * @group Symbol
 */
declare class IIRecognizedCircle extends IIRecognizedBase<RecognizedKind.Circle> {
    readonly isClosed = true;
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedCircle;
    toJSON(): PartialDeep<IIRecognizedCircle>;
    static create(partial: PartialDeep<IIRecognizedCircle>): IIRecognizedCircle;
}

/**
 * @group Symbol
 */
declare class IIRecognizedEllipse extends IIRecognizedBase<RecognizedKind.Ellipse> {
    readonly isClosed = true;
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedEllipse;
    toJSON(): PartialDeep<IIRecognizedEllipse>;
    static create(partial: PartialDeep<IIRecognizedEllipse>): IIRecognizedEllipse;
}

/**
 * @group Symbol
 */
declare class IIRecognizedLine extends IIRecognizedBase<RecognizedKind.Line> {
    readonly isClosed = false;
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedLine;
    toJSON(): PartialDeep<IIRecognizedLine>;
    static create(partial: PartialDeep<IIRecognizedLine>): IIRecognizedLine;
}

/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#stroke-item | Stroke item}
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
    /** IDs of child elements */
    children?: string[];
    /** Positions of children in the content */
    "children-pos"?: number[];
    /** ID of parent element */
    parent?: string;
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#word-object | Word object}
 */
type TJIIXWord = TJIIXBase & {
    id?: string;
    label: string;
    candidates?: string[];
    "first-char"?: number;
    "last-char"?: number;
    /** References to child elements (e.g., Math elements) */
    refs?: string[];
    /** Reflow label for mixed content */
    "reflow-label"?: string;
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#character-object | Character object}
 */
type TJIIXChar = TJIIXBase & {
    label: string;
    candidates?: string[];
    word: number;
    grid: TPoint[];
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#text-interpretation | Text Element }
 */
type TJIIXLine = {
    "baseline-y": number;
    "first-char"?: number;
    "last-char"?: number;
    "x-height": number;
};

/**
 * @group Exports
 * @remarks Math element type in JIIX
 */
declare enum JIIXMathExpressionType {
    Number = "number",
    Variable = "variable",
    Symbol = "symbol",
    Group = "group",
    Fraction = "fraction",
    Superscript = "superscript",
    Subscript = "subscript",
    Subsuperscript = "subsuperscript",
    SquareRoot = "square root",
    Root = "root",
    Power = "power",
    Underoverscript = "underoverscript",
    Add = "+",
    Subtract = "-",
    Multiply = "\u00D7",
    Divide = "/",
    Equal = "=",
    NotEqual = "\u2260",
    LessThan = "<",
    GreaterThan = ">",
    LessThanOrEqual = "\u2264",
    GreaterThanOrEqual = "\u2265"
}
/**
 * @group Exports
 * @remarks Union type for all possible math expression type values (derived from JIIXMathExpressionType enum)
 */
type TJIIXMathExpressionTypeValue = JIIXMathExpressionType | string;
/**
 * @group Exports
 * @remarks Symbol in a math expression
 */
type TJIIXMathSymbol = {
    symbol: string;
    candidates?: string[];
};
/**
 * @group Exports
 * @remarks Base type for math expressions
 */
type TJIIXMathExpressionBase<T = TJIIXMathExpressionTypeValue> = TJIIXBase & {
    id: string;
    type: T;
};
/**
 * @group Exports
 * @remarks Number expression in math
 */
type TJIIXMathNumber = TJIIXMathExpressionBase<JIIXMathExpressionType.Number> & {
    label: string;
    value: number;
    symbols?: TJIIXMathSymbol[];
};
/**
 * @group Exports
 * @remarks Variable expression in math (e.g., x, y, z)
 */
type TJIIXMathVariable = TJIIXMathExpressionBase<JIIXMathExpressionType.Variable> & {
    label: string;
    value?: number | string;
};
/**
 * @group Exports
 * @remarks Symbol expression in math
 */
type TJIIXMathSymbolExpression = TJIIXMathExpressionBase<JIIXMathExpressionType.Symbol> & {
    label: string;
    symbols?: TJIIXMathSymbol[];
};
/**
 * @group Exports
 * @remarks Operator expression (binary or unary)
 */
type TJIIXMathOperator = TJIIXMathExpressionBase<string> & {
    symbols?: TJIIXMathSymbol[];
    operands?: TJIIXMathExpression[];
};
/**
 * @group Exports
 * @remarks Group expression
 */
type TJIIXMathGroup = TJIIXMathExpressionBase<JIIXMathExpressionType.Group> & {
    operands?: TJIIXMathExpression[];
};
/**
 * @group Exports
 * @remarks Fraction expression
 */
type TJIIXMathFraction = TJIIXMathExpressionBase<JIIXMathExpressionType.Fraction> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Exports
 * @remarks Superscript expression (exponent)
 */
type TJIIXMathSuperscript = TJIIXMathExpressionBase<JIIXMathExpressionType.Superscript> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Exports
 * @remarks Subscript expression
 */
type TJIIXMathSubscript = TJIIXMathExpressionBase<JIIXMathExpressionType.Subscript> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Exports
 * @remarks Subsuperscript expression (both subscript and superscript)
 */
type TJIIXMathSubsuperscript = TJIIXMathExpressionBase<JIIXMathExpressionType.Subsuperscript> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Exports
 * @remarks Square root expression
 */
type TJIIXMathSquareRoot = TJIIXMathExpressionBase<JIIXMathExpressionType.SquareRoot> & {
    label?: string;
    operands?: [TJIIXMathExpression];
};
/**
 * @group Exports
 * @remarks Root expression (nth root)
 */
type TJIIXMathRoot = TJIIXMathExpressionBase<JIIXMathExpressionType.Root> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Exports
 * @remarks Power expression (exponentiation)
 */
type TJIIXMathPower = TJIIXMathExpressionBase<JIIXMathExpressionType.Power> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Exports
 * @remarks Underoverscript expression (e.g., integrals with bounds)
 */
type TJIIXMathUnderoverscript = TJIIXMathExpressionBase<JIIXMathExpressionType.Underoverscript> & {
    operands?: [TJIIXMathExpression, TJIIXMathExpression, TJIIXMathExpression];
};
/**
 * @group Exports
 * @remarks Union type for all math expressions
 */
type TJIIXMathExpression = TJIIXMathNumber | TJIIXMathVariable | TJIIXMathSymbolExpression | TJIIXMathOperator | TJIIXMathGroup | TJIIXMathFraction | TJIIXMathSuperscript | TJIIXMathSubscript | TJIIXMathSubsuperscript | TJIIXMathSquareRoot | TJIIXMathRoot | TJIIXMathPower | TJIIXMathUnderoverscript;
/**
 * @group Exports
 * @remarks Math element that can be embedded in text or standalone
 */
type TJIIXMathElement = TJIIXElementBase<"Math"> & {
    id: string;
    "bounding-box"?: TBox;
    label?: string;
    expressions?: TJIIXMathExpression[];
};

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
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix  Element type}
 */
declare enum JIIXELementType {
    Text = "Text",
    Math = "Math",
    Node = "Node",
    Edge = "Edge",
    RawContent = "Raw Content"
}
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#diagram-item-blocks | Element node kind}
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
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#text-interpretation | Text Element }
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
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#line-item | Element line}
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
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#arc-item | Element arc}
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
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/web/jiix | Exports}
 */
type TJIIXElement = TJIIXTextElement | TJIIXMathElement | TJIIXNodeElement | TJIIXEdgeElement;
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
 * {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix | Documentation}
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
    hmacKey: string | ((applicationKey: string) => Promise<string>);
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
    recognition: {
        types: ("text" | "shape" | "math" | "decoration")[];
    };
    classification: {
        types: ("text" | "shape" | "math" | "decoration" | "drawing")[];
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
type TTextGuidesConfigurationV2 = {
    enable: boolean;
    "line-gap-mm"?: number;
    "origin-y-mm"?: number;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultTextGuidesConfigurationV2: TTextGuidesConfigurationV2;
/**
 * @group Recognizer
 */
type TTextRecognizerHTTPV2ConfConfiguration = {
    customResources?: string[];
    customLexicon?: string[];
    addLKText?: boolean;
};
/**
 * @group Recognizer
 */
type TTextRecognizerHTTPV2Configuration = {
    text?: boolean;
    mimeTypes: ("text/plain" | "application/vnd.myscript.jiix")[];
    margin: TMarginConfiguration;
    guides: TTextGuidesConfigurationV2;
    configuration?: TTextRecognizerHTTPV2ConfConfiguration;
    eraser?: TEraserConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultTexConfigurationV2: TTextRecognizerHTTPV2Configuration;

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
type TShapeConvertConfiguration = {
    types?: "shape"[];
    "match-text-size"?: boolean;
};
/**
 * @group Recognizer
 */
type TShapeBeautificationConfiguration = {
    enable?: true;
};
/**
 * @group Recognizer
 */
type TShapeConfiguration = {
    mimeTypes: ("application/vnd.myscript.jiix" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "image/svg+xml")[];
    "enable-sub-blocks"?: boolean;
    convert?: TShapeConvertConfiguration;
    "session-time"?: number;
    eraser?: TEraserConfiguration;
    beautification?: TShapeBeautificationConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultShapeConvertConfiguration: TShapeConvertConfiguration;
/**
 * @group Recognizer
 * @source
 */
declare const DefaultShapeBeautificationConfiguration: TShapeBeautificationConfiguration;
/**
 * @group Recognizer
 * @source
 */
declare const DefaultShapeConfiguration: TShapeConfiguration;

/**
 * @group Recognizer
 * @source
 */
declare const DefaultMathV2Configuration: TMathConfiguration;

/**
 * @group Recognizer
 * @source
 */
declare const DefaultRawContentV2Configuration: TRawContentConfiguration;

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
 * @group Renderer
 * @summary Base renderer configuration interface
 *
 * Common configuration properties required by all renderer implementations.
 */
interface TBaseRendererConfiguration {
    minWidth: number;
    minHeight: number;
}
/**
 * @group Renderer
 * @summary Abstract base class for all renderer implementations
 *
 * Defines the common interface that both Canvas and SVG renderers
 * must implement, enabling consistent rendering behavior across
 * different output formats.
 */
declare abstract class BaseRenderer<RenderContextType, ConfigType extends TBaseRendererConfiguration = TBaseRendererConfiguration> {
    configuration: ConfigType;
    parent: HTMLElement;
    constructor(configuration: ConfigType);
    /**
     * Initialize the renderer in the given parent element
     */
    abstract init(element: HTMLElement): void;
    /**
     * Clear/reset the rendering context
     */
    abstract clear(): void;
    /**
     * Get the rendering context (Canvas2D, SVGElement, etc.)
     */
    abstract getRenderingContext(): RenderContextType;
    /**
     * Get the bounds of the rendering area
     */
    getBounds(): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/**
 * @group Renderer
 * @summary Shared geometry utility functions for renderers
 *
 * Common mathematical and geometric helper functions used by both
 * Canvas and SVG renderers for geometric calculations.
 */
/**
 * Calculate rotation angle for ellipse arc
 * @param angle - The angle in radians
 * @returns Normalized angle
 */
declare function normalizeAngle(angle: number): number;
/**
 * Calculate ellipse arc points
 * @param centerPoint - Center of the ellipse
 * @param maxRadius - Maximum radius (semi-major axis)
 * @param minRadius - Minimum radius (semi-minor axis)
 * @param orientation - Rotation of the ellipse
 * @param startAngle - Starting angle
 * @param sweepAngle - Sweep angle
 * @param angleStep - Step size for calculations
 * @returns Array of points along the ellipse arc
 */
declare function calculateEllipseArcPoints(centerPoint: TPoint, maxRadius: number, minRadius: number, orientation: number, startAngle: number, sweepAngle: number, angleStep?: number): TPoint[];

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
type TIIRendererConfiguration = TRendererConfiguration & {
    guides: TGuidesConfiguration & {
        type: "line" | "grid" | "point";
    };
};
/**
 * @group Renderer
 * @source
 */
declare const DefaultIIRendererConfiguration: TIIRendererConfiguration;

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
declare class CanvasRenderer extends BaseRenderer<CanvasRenderingContext2D, Omit<TRendererConfiguration, "guides">> {
    #private;
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
    init(element: HTMLElement, guide?: {
        x?: number;
        y?: number;
    }): void;
    drawModel(model: Model): void;
    drawPendingStroke(stroke: Stroke | undefined): void;
    resize(model: Model): void;
    destroy(): void;
    clear(): void;
    getRenderingContext(): CanvasRenderingContext2D;
}

/**
 * @group Renderer
 */
declare class SVGRenderer extends BaseRenderer<SVGSVGElement, TIIRendererConfiguration> {
    #private;
    groupGuidesId: string;
    layer: SVGSVGElement;
    definitionGroup: SVGGElement;
    verticalGuides: number[];
    horizontalGuides: number[];
    constructor(configuration: TIIRendererConfiguration);
    protected initLayer(): void;
    protected createDefs(): SVGDefsElement;
    protected createFilters(): SVGGElement;
    protected drawGuides(): void;
    protected removeGuides(): void;
    redrawGuides(): void;
    protected createSVGTools(): SVGGElement;
    init(element: HTMLElement): void;
    getAttribute(id: string, name: string): string | undefined | null;
    setAttribute(id: string, name: string, value: string): void;
    buildElementFromSymbol(symbol: TIISymbol | IIEraser): SVGGraphicsElement | undefined;
    prependElement(el: Element): void;
    changeOrderSymbol(symbolToMove: TIISymbol, position: "first" | "last" | "forward" | "backward"): void;
    appendElement(el: Element): void;
    removeElement(id: string): void;
    drawSymbol(symbol: TIISymbol | IIEraser): SVGGraphicsElement | undefined;
    replaceSymbol(id: string, symbols: TIISymbol[]): SVGGraphicsElement[] | undefined;
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
    drawConnectionBetweenBox(id: string, box1: TBox, box2: TBox, position: "corners" | "sides", attrs?: {
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
    getRenderingContext(): SVGSVGElement;
    getZoom(): number;
    setZoom(zoom: number, centerX?: number, centerY?: number): void;
    /**
     * Get current viewBox
     * @returns Current viewBox {x, y, width, height}
     */
    getViewBox(): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /**
     * Set viewBox
     * @param x X coordinate of top-left corner
     * @param y Y coordinate of top-left corner
     * @param width Width of viewBox
     * @param height Height of viewBox
     * @param redrawGuides Whether to redraw guides (default: true)
     */
    setViewBox(x: number, y: number, width: number, height: number, redrawGuides?: boolean): void;
    /**
     * Pan (translate) the viewBox
     * @param dx Horizontal translation (in viewBox coordinates)
     * @param dy Vertical translation (in viewBox coordinates)
     * @param redrawGuides Whether to redraw guides (default: true)
     */
    pan(dx: number, dy: number, redrawGuides?: boolean): void;
    /**
     * Ensure a point is visible in the viewBox by panning if necessary
     * @param point Point to make visible
     * @param margin Optional margin around the point (default: 50)
     */
    ensurePointVisible(point: TPoint, margin?: number): void;
    destroy(): void;
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
declare const SVGRendererConst: {
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
declare class SVGRendererDecoratorUtil {
    static getSVGElementFromBounds(decorator: IIDecorator, bounds: Box, baseline?: number, xHeight?: number, symbolStyle?: {
        width?: number;
        color?: string;
    }, deleting?: boolean): SVGGeometryElement | undefined;
    static getSVGElement(decorator: IIDecorator, symbol: TIISymbol): SVGGeometryElement | undefined;
}

/**
 * @group Renderer
 */
declare class SVGRendererEdgeUtil {
    static getLinePath(line: IIEdgeLine): string;
    static getPolyLinePath(line: IIEdgePolyLine): string;
    static getArcPath(arc: IIEdgeArc): string;
    static getSVGPath(edge: TIIEdge): string;
    static getSVGElement(edge: TIIEdge): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class SVGRendererEraserUtil {
    static getSVGPath(eraser: IIEraser): string;
    static getSVGElement(eraser: IIEraser): SVGPathElement;
}

/**
 * @group Renderer
 */
declare class SVGRendererTextUtil {
    static getSVGElement(text: IIText): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class SVGRendererMathUtil {
    static getSVGElement(math: IIMath): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class SVGRendererShapeUtil {
    static getPolygonePath(polygon: IIShapePolygon): string;
    static getCirclePath(circle: IIShapeCircle): string;
    static getEllipsePath(ellipse: IIShapeEllipse): string;
    static getSVGPath(shape: TIIShape): string;
    static getSVGElement(shape: TIIShape): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class SVGRendererStrokeUtil {
    protected static getArcPath(center: TPointer, radius: number): string;
    protected static getLinePath(begin: TPointer, end: TPointer, width: number): string;
    protected static getFinalPath(begin: TPointer, end: TPointer, width: number): string;
    protected static getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string;
    static getSVGPath(stroke: IIStroke): string;
    static getSVGElement(stroke: IIStroke): SVGGraphicsElement;
}

/**
 * @group Renderer
 */
declare class SVGRendererRecognizedUtil {
    static getSVGElement(recognizedSymbol: TIIRecognized): SVGGraphicsElement;
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
declare class InteractiveInkSSRSVGRenderer {
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
 * @group Menu
 * @remarks Configuration to enable/disable each action menu individually
 */
interface IIMenuActionConfig {
    /** Enable/disable Clear menu */
    clear?: boolean;
    /** Enable/disable Language menu */
    language?: boolean;
    /** Enable/disable Undo/Redo menus */
    undoRedo?: boolean;
    /** Enable/disable Zoom menus */
    zoom?: boolean;
    /** Enable/disable Convert menu */
    convert?: boolean;
    /** Enable/disable Gesture submenu */
    gesture?: boolean;
    /** Enable/disable Guide submenu */
    guide?: boolean;
    /** Enable/disable Snap submenu */
    snap?: boolean;
    /** Enable/disable Debug submenu */
    debug?: boolean;
    /** Enable/disable Math Dependencies submenu */
    math?: boolean;
    /** Enable/disable Export submenu */
    export?: boolean;
    /** Enable/disable Import submenu */
    import?: boolean;
}
/**
 * Default configuration with all menus enabled
 * @group Menu
 */
declare const defaultMenuActionConfig: Required<IIMenuActionConfig>;

/**
 * @group Menu
 */
declare class IIMenuAction {
    #private;
    editor: InteractiveInkEditor;
    id: string;
    wrapper?: HTMLElement;
    config: Required<IIMenuActionConfig>;
    private menuActions;
    constructor(editor: InteractiveInkEditor, id?: string, config?: IIMenuActionConfig);
    get model(): IIModel;
    get isMobile(): boolean;
    render(layer: HTMLElement): void;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Configuration to enable/disable each tool individually
 */
interface IIMenuToolConfig {
    /** Enable/disable Write tool (Pencil) */
    write?: boolean;
    /** Enable/disable Move tool (Hand) */
    move?: boolean;
    /** Enable/disable Select tool (Cursor) */
    select?: boolean;
    /** Enable/disable Erase tool */
    erase?: boolean;
    /** Enable/disable Shape submenu (Rectangle, Circle, etc.) */
    shape?: boolean;
    /** Enable/disable Edge submenu (Line, Arrow, etc.) */
    edge?: boolean;
}
/**
 * @group Menu
 * @remarks Default configuration with all tools enabled
 */
declare const defaultMenuToolConfig: Required<IIMenuToolConfig>;

/**
 * @group Menu
 */
declare class IIMenuTool {
    #private;
    editor: InteractiveInkEditor;
    id: string;
    wrapper?: HTMLDivElement;
    config: Required<IIMenuToolConfig>;
    private menuTools;
    constructor(editor: InteractiveInkEditor, id?: string, config?: IIMenuToolConfig);
    render(layer: HTMLElement): void;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Configuration to enable/disable each style element individually
 */
interface IIMenuStyleConfig {
    /** Enable/disable stroke color picker */
    strokeColor?: boolean;
    /** Enable/disable fill color picker */
    fillColor?: boolean;
    /** Enable/disable stroke thickness picker */
    thickness?: boolean;
    /** Enable/disable font size picker */
    fontSize?: boolean;
    /** Enable/disable font weight picker */
    fontWeight?: boolean;
    /** Enable/disable opacity picker */
    opacity?: boolean;
    /** Custom color palette */
    colors?: string[];
    /** Custom thickness list */
    thicknessList?: {
        label: string;
        value: number;
    }[];
    /** Custom font size list */
    fontSizeList?: {
        label: string;
        value: "auto" | number;
    }[];
    /** Custom font weight list */
    fontWeightList?: {
        label: string;
        value: "auto" | "normal" | "bold";
    }[];
}
/**
 * @group Menu
 * @remarks Default configuration with all styles enabled
 */
declare const defaultMenuStyleConfig: Required<IIMenuStyleConfig>;

/**
 * @group Menu
 */
declare class IIMenuStyle {
    #private;
    editor: InteractiveInkEditor;
    id: string;
    wrapper?: HTMLDivElement;
    config: Required<IIMenuStyleConfig>;
    triggerBtn?: HTMLButtonElement;
    subMenuWrapper?: HTMLDivElement;
    subMenuContent?: HTMLDivElement;
    private styleItems;
    constructor(editor: InteractiveInkEditor, id?: string, config?: IIMenuStyleConfig);
    get model(): IIModel;
    get symbolsSelected(): TIISymbol[];
    get writeShape(): boolean;
    get rowHeight(): number;
    get isMobile(): boolean;
    render(layer: HTMLElement): void;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Configuration to enable/disable each context menu individually
 */
interface IIMenuContextConfig {
    /** Enable/disable Edit menu */
    edit?: boolean;
    /** Enable/disable Decorator menu */
    decorator?: boolean;
    /** Enable/disable Reorder menu */
    reorder?: boolean;
    /** Enable/disable Export menu */
    export?: boolean;
    /** Enable/disable Convert menu */
    convert?: boolean;
    /** Enable/disable Math menu */
    math?: boolean;
    /** Enable/disable Group menu */
    group?: boolean;
    /** Enable/disable Duplicate menu */
    duplicate?: boolean;
    /** Enable/disable Remove menu */
    remove?: boolean;
    /** Enable/disable Select All menu */
    selectAll?: boolean;
}
/**
 * @group Menu
 * @remarks Default configuration with all menus enabled
 */
declare const defaultMenuContextConfig: Required<IIMenuContextConfig>;

/**
 * @group Menu
 */
declare class IIMenuContext {
    #private;
    editor: InteractiveInkEditor;
    id: string;
    wrapper?: HTMLElement;
    config: Required<IIMenuContextConfig>;
    private contextMenus;
    position: {
        x: number;
        y: number;
    };
    constructor(editor: InteractiveInkEditor, id?: string, config?: IIMenuContextConfig);
    get symbolsSelected(): TIISymbol[];
    get haveSymbolsSelected(): boolean;
    get symbolsDecorable(): (IIStroke | IIText | IIRecognizedText)[];
    get showDecorator(): boolean;
    get hasSingleMathSymbol(): boolean;
    protected updateMathMenu(): Promise<void>;
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
    style: IIMenuStyleConfig & {
        enable: boolean;
    };
    tool: IIMenuToolConfig & {
        enable: boolean;
    };
    action: IIMenuActionConfig & {
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
 * @group Menu
 * @remarks Constants shared across menu components
 */
/**
 * @group Menu
 * @remarks Default color palette available in menus
 */
declare const DEFAULT_MENU_COLORS: string[];
/**
 * @group Menu
 * @remarks Default thickness values for stroke styling
 */
declare const DEFAULT_THICKNESS_LIST: {
    label: string;
    value: number;
}[];
/**
 * @group Menu
 * @remarks Default font size values
 */
declare const DEFAULT_FONT_SIZE_LIST: {
    label: string;
    value: "auto" | number;
}[];
/**
 * @group Menu
 * @remarks Default font weight values
 */
declare const DEFAULT_FONT_WEIGHT_LIST: {
    label: string;
    value: "auto" | "normal" | "bold";
}[];

/**
 * @group Manager
 */
declare class IIMenuManager {
    #private;
    editor: InteractiveInkEditor;
    layer?: HTMLElement;
    action: IIMenuAction;
    tool: IIMenuTool;
    context: IIMenuContext;
    style: IIMenuStyle;
    constructor(editor: InteractiveInkEditor, custom?: {
        style?: IIMenuStyle;
        tool?: IIMenuTool;
        action?: IIMenuAction;
        context?: IIMenuContext;
    });
    render(layer: HTMLElement): void;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Base type for menu items
 */
interface IMenuItemBase {
    id: string;
    label?: string;
    disabled?: boolean | ((editor: InteractiveInkEditor) => boolean);
    visible?: boolean | ((editor: InteractiveInkEditor) => boolean);
}
/**
 * @group Menu
 * @remarks Union type for all menu types
 */
type TGenericMenuItem = IMenuItemBase & {
    type: string;
};
/**
 * @group Menu
 * @remarks Base class for all menu items
 */
declare abstract class BaseMenuItem<T extends HTMLElement = HTMLElement> {
    protected logger: Logger;
    protected config: TGenericMenuItem;
    protected editor: InteractiveInkEditor;
    protected element?: T;
    constructor(config: TGenericMenuItem, editor: InteractiveInkEditor);
    /**
     * Creates the HTML element
     */
    abstract createElement(): T;
    /**
     * Updates the element (for reactivity)
     */
    abstract update(): void;
    /**
     * Returns the HTML element
     */
    getElement(): T;
    /**
     * Updates the disabled state
     */
    protected updateDisabled(): void;
    /**
     * Updates the visible state
     */
    protected updateVisible(): void;
    /**
     * Destroys the element and cleans up resources
     */
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a simple button
 */
interface IMenuButton extends IMenuItemBase {
    type: "button";
    icon?: string;
    action: (editor: InteractiveInkEditor) => void | Promise<void>;
}
/**
 * @group Menu
 * @remarks Class for buttons
 */
declare class ButtonMenuItem extends BaseMenuItem<HTMLButtonElement> {
    protected config: IMenuButton;
    createElement(): HTMLButtonElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a checkbox
 */
interface IMenuCheckbox extends IMenuItemBase {
    type: "checkbox";
    getValue: (editor: InteractiveInkEditor) => boolean;
    setValue: (editor: InteractiveInkEditor, value: boolean) => void;
}
/**
 * @group Menu
 * @remarks Class for checkboxes
 */
declare class CheckboxMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: IMenuCheckbox;
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a select/dropdown menu item
 */
interface IMenuSelect extends IMenuItemBase {
    type: "select";
    options: Array<{
        label: string;
        value: string;
    }>;
    getValue: (editor: InteractiveInkEditor) => string;
    setValue: (editor: InteractiveInkEditor, value: string) => void;
}
/**
 * @group Menu
 * @remarks Class for select/dropdown menu items
 */
declare class SelectMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: IMenuSelect;
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a button list (S, M, L, XL)
 */
interface IMenuButtonList extends IMenuItemBase {
    type: "buttonlist";
    buttonType?: "square" | "round";
    options: Array<{
        label: string;
        value: string;
    }>;
    getValue: (editor: InteractiveInkEditor) => string;
    setValue: (editor: InteractiveInkEditor, value: string) => void;
}
/**
 * @group Menu
 * @remarks Class for button lists
 */
declare class ButtonListMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: IMenuButtonList;
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a file input with a validation button
 */
interface IMenuFileInput extends IMenuItemBase {
    type: "fileinput";
    accept?: string;
    multiple?: boolean;
    buttonLabel?: string;
    action: (editor: InteractiveInkEditor, files: FileList) => void | Promise<void>;
}
/**
 * @group Menu
 * @remarks Menu item for selecting and validating a file
 */
declare class FileInputMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: IMenuFileInput;
    private inputElement;
    private buttonElement;
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Submenu position type
 */
type TMenuPosition = "top" | "left" | "right" | "right-top" | "bottom" | "bottom-left" | "bottom-right";
/**
 * @group Menu
 * @remarks Union type for submenu items (without recursive submenu to avoid circularity)
 */
type TSubMenuItems = IMenuButton | IMenuCheckbox | IMenuSelect | IMenuButtonList | IMenuFileInput;
/**
 * @group Menu
 * @remarks Submenu configuration
 */
interface IMenuSubMenu extends IMenuItemBase {
    type: "submenu";
    icon?: string;
    position?: TMenuPosition;
    menuTitle?: string;
    items: (TSubMenuItems | IMenuSubMenu)[];
}
/**
 * @group Menu
 * @remarks Class for submenu items
 */
declare class SubMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: IMenuSubMenu;
    protected subMenuWrapper?: HTMLElement;
    protected subMenuContent?: HTMLDivElement;
    protected trigger?: HTMLButtonElement;
    protected arrowSpan?: HTMLSpanElement;
    protected subMenuItems: Map<string, BaseMenuItem>;
    protected closedRotation: number;
    protected openedRotation: number;
    protected getArrowRotationForPosition(position: TMenuPosition): number;
    createElement(): HTMLDivElement;
    /**
     * Opens the submenu
     */
    open(): void;
    /**
     * Closes the submenu
     */
    close(): void;
    /**
     * Toggles the submenu state
     */
    toggle(): void;
    /**
     * Unwraps the submenu (mobile mode)
     */
    unwrap(): void;
    /**
     * Wraps the submenu (desktop mode)
     */
    wrap(): void;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a color list menu item
 */
interface IMenuColorList extends IMenuItemBase {
    type: "colorlist";
    colors: string[];
    fill: boolean;
    initValue?: string;
    onChange: (color: string, editor: InteractiveInkEditor) => void;
}
/**
 * @group Menu
 * @remarks Class for color list menu items
 */
declare class ColorListMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: IMenuColorList;
    private currentValue;
    constructor(config: IMenuColorList, editor: InteractiveInkEditor);
    createElement(): HTMLDivElement;
    getValue(): string;
    setValue(color: string): void;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a range input menu item
 */
interface IMenuRange extends IMenuItemBase {
    type: "range";
    min: number;
    max: number;
    step: number;
    initValue?: number;
    onChange: (value: number, editor: InteractiveInkEditor) => void;
}
/**
 * @group Menu
 * @remarks Class for range input menu items (slider)
 */
declare class RangeMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: IMenuRange;
    private currentValue;
    private input?;
    private output?;
    constructor(config: IMenuRange, editor: InteractiveInkEditor);
    createElement(): HTMLDivElement;
    getValue(): number;
    setValue(value: number): void;
    update(): void;
}

/**
 * @group Menu
 * @remarks Utility class to create a collapsible wrapper around menu content
 */
declare class CollapsibleWrapper {
    private wrapper;
    constructor(content: HTMLElement, title: string, id?: string);
    private createWrapper;
    getElement(): HTMLDivElement;
    setActive(active: boolean): void;
    toggle(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Type union enriched with all menu item types
 */
type TAllMenuItems = TSubMenuItems | IMenuSubMenu | IMenuColorList | IMenuRange | IMenuFileInput;
/**
 * @group Menu
 * @remarks Factory function to create an instance of the appropriate menu item class
 */
declare function createMenuItemInstance(config: TAllMenuItems, editor: InteractiveInkEditor): BaseMenuItem;

/**
 * @group Menu
 * @remarks Menu action Clear
 */
declare class ClearMenuAction extends ButtonMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu action Convert
 */
declare class ConvertMenuAction extends ButtonMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu action Language - Sélection de la langue
 */
declare class LanguageMenuAction extends BaseMenuItem<HTMLDivElement> {
    private select;
    private subMenuWrapper;
    private subMenuContent;
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLDivElement;
    /**
     * Wraps/unwraps according to screen size (mobile)
     */
    wrap(): void;
    unwrap(): void;
    update(): void;
}

/**
 * @group Menu
 * @remarks Menu action Undo/Redo groupé
 */
declare class UndoRedoMenuAction extends BaseMenuItem<HTMLDivElement> {
    private undoButton;
    private redoButton;
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Menu action Zoom (In + Level + Out)
 */
declare class ZoomMenuAction extends BaseMenuItem<HTMLDivElement> {
    private zoomInButton;
    private zoomLevelSpan;
    private zoomOutButton;
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLDivElement;
    private updateZoomLevel;
    update(): void;
}

/**
 * @group Menu
 * @remarks Menu action Gesture - Détection et actions de gestes
 */
declare class GestureMenuAction extends SubMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu action Guide - Configuration des guides
 */
declare class GuideMenuAction extends SubMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu action Snap - Configuration du snap
 */
declare class SnapMenuAction extends SubMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu action Debug - Affichage des éléments de debug
 */
declare class DebugMenuAction extends SubMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu action for Math visualization and interaction controls
 */
declare class MathMenuAction extends SubMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu action Export - Export en différents formats
 */
declare class ExportMenuAction extends SubMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu action Import - Import de fichiers JSON
 */
declare class ImportMenuAction extends SubMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    private readFileAsText;
}

/**
 * @group Menu
 * @remarks Write tool - Pencil drawing
 */
declare class WriteTool extends ButtonMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLButtonElement;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Move tool - View movement
 */
declare class MoveTool extends ButtonMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLButtonElement;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Select tool - Element selection
 */
declare class SelectTool extends ButtonMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLButtonElement;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Erase tool - Element erasure
 */
declare class EraseTool extends ButtonMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLButtonElement;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Shape tool - Sub-menu for geometric shapes
 */
declare class ShapeTool extends BaseMenuItem<HTMLDivElement> {
    private subMenuButtons;
    private triggerButton?;
    private currentIcon;
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    private createShapeButton;
    createElement(): HTMLDivElement;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Edge tool - Sub-menu for lines and arrows
 */
declare class EdgeTool extends BaseMenuItem<HTMLDivElement> {
    private subMenuButtons;
    private triggerButton?;
    private currentIcon;
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    private createEdgeButton;
    createElement(): HTMLDivElement;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Menu contextuel Edit - Édite le texte sélectionné
 */
declare class EditContextMenu extends BaseMenuItem<HTMLElement> {
    protected config: TGenericMenuItem;
    editInput?: HTMLInputElement;
    editSaveBtn?: HTMLButtonElement;
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Menu contextuel Decorator - Décore les symboles sélectionnés
 */
declare class DecoratorContextMenu extends BaseMenuItem<HTMLElement> {
    protected config: TGenericMenuItem & {
        idPrefix: string;
    };
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    get symbolsDecorable(): (IIStroke | IIText | IIRecognizedText)[];
    get showDecorator(): boolean;
    get hasSingleMathSymbol(): boolean;
    protected createDecoratorSubMenu(label: string, kind: DecoratorKind): HTMLElement;
    createElement(): HTMLElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Menu contextuel Reorder - Réordonne les symboles sélectionnés
 */
declare class ReorderContextMenu extends SubMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu contextuel Export - Exporte les symboles sélectionnés
 */
declare class ExportContextMenu extends SubMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu contextuel Convert - Convertit les symboles sélectionnés
 */
declare class ConvertContextMenu extends ButtonMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu contextuel Math - Opérations mathématiques sur les symboles
 */
declare class MathContextMenu extends SubMenuItem {
    protected logger: Logger;
    readonly id: string;
    readonly idEditVariables: string;
    readonly idNumericalComputation: string;
    readonly idEvaluate: string;
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    setMenuVisibility(show: boolean, { canEditVariables, canCompute, canEvaluate }: {
        canEditVariables: boolean;
        canCompute: boolean;
        canEvaluate: boolean;
    }): void;
}

/**
 * @group Menu
 * @remarks Menu contextuel Duplicate - Duplique les symboles sélectionnés
 */
declare class DuplicateContextMenu extends BaseMenuItem<HTMLButtonElement> {
    protected config: TGenericMenuItem;
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLButtonElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Menu contextuel Remove - Supprime les symboles sélectionnés
 */
declare class RemoveContextMenu extends ButtonMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu contextuel Select All - Sélectionne tous les symboles
 */
declare class SelectAllContextMenu extends ButtonMenuItem {
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Stroke color style menu
 */
declare class StrokeColorStyle extends BaseMenuItem<HTMLDivElement> {
    private colorItem?;
    private colors;
    constructor(editor: InteractiveInkEditor, colors: string[], idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Fill color style menu
 */
declare class FillColorStyle extends BaseMenuItem<HTMLDivElement> {
    private colorItem?;
    private colors;
    constructor(editor: InteractiveInkEditor, colors: string[], idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Thickness style menu
 */
declare class ThicknessStyle extends BaseMenuItem<HTMLDivElement> {
    private thicknessItem?;
    private thicknessList;
    constructor(editor: InteractiveInkEditor, thicknessList: {
        label: string;
        value: number;
    }[], idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Font size style menu
 */
declare class FontSizeStyle extends BaseMenuItem<HTMLDivElement> {
    private fontSizeItem?;
    private fontSizeList;
    private rowHeight;
    constructor(editor: InteractiveInkEditor, fontSizeList: {
        label: string;
        value: "auto" | number;
    }[], rowHeight: number, idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Font weight style menu
 */
declare class FontWeightStyle extends BaseMenuItem<HTMLDivElement> {
    private fontWeightItem?;
    private fontWeightList;
    constructor(editor: InteractiveInkEditor, fontWeightList: {
        label: string;
        value: "auto" | "normal" | "bold";
    }[], idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Opacity style menu
 */
declare class OpacityStyle extends BaseMenuItem<HTMLDivElement> {
    private opacityItem?;
    constructor(editor: InteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
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

/**
 * @group Grabber
 */
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
 * @group Editor
 */
type TInteractiveInkEditorConfiguration = TEditorConfiguration & TRecognizerWebSocketConfiguration & {
    "undo-redo": THistoryConfiguration;
    rendering: TIIRendererConfiguration;
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
declare const DefaultInteractiveInkEditorConfiguration: TInteractiveInkEditorConfiguration;
/**
 * @group Editor
 */
declare class InteractiveInkEditorConfiguration implements TInteractiveInkEditorConfiguration {
    grabber: TGrabberConfiguration;
    logger: TLoggerConfiguration;
    server: TServerWebsocketConfiguration;
    recognition: TRecognitionWebSocketConfiguration;
    rendering: TIIRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    menu: TMenuConfiguration;
    penStyle: TStyle;
    fontStyle: {
        size: number | "auto";
        weight: "bold" | "normal" | "auto";
    };
    gesture: TGestureConfiguration;
    snap: TSnapConfiguration;
    constructor(configuration?: PartialDeep<TInteractiveInkEditorConfiguration>);
}

/**
 * @group Editor
 */
type TInteractiveInkEditorOptions = PartialDeep<EditorOptionsBase & {
    configuration: TInteractiveInkEditorConfiguration;
}> & {
    override?: {
        recognizer?: RecognizerWebSocket;
        menu?: {
            style?: IIMenuStyle;
            tool?: IIMenuTool;
            action?: IIMenuAction;
        };
    };
};
/**
 * @group Editor
 */
declare class InteractiveInkEditor extends AbstractEditor {
    #private;
    renderer: SVGRenderer;
    recognizer: RecognizerWebSocket;
    history: IIHistoryManager;
    writer: IIWriterManager;
    eraser: EraseManager;
    gesture: IIGestureManager;
    resizer: IIResizeManager;
    rotator: IIRotationManager;
    translator: IITranslateManager;
    converter: IIConversionManager;
    texter: IITextManager;
    selector: IISelectionManager;
    svgDebugger: IIDebugSVGManager;
    snaps: IISnapManager;
    move: IIMoveManager;
    synchronizer: IISynchronizerManager;
    mathOverlays: MathOverlayManager;
    mathInteractions: MathInteractionManager;
    transientInk: TransientInkManager;
    menu: IIMenuManager;
    mathComputationMode: boolean;
    constructor(rootElement: HTMLElement, options?: TInteractiveInkEditorOptions);
    get initializationPromise(): Promise<void>;
    get tool(): EditorTool;
    set tool(i: EditorTool);
    get model(): IIModel;
    get configuration(): InteractiveInkEditorConfiguration;
    set renderingConfiguration(renderingConfiguration: TIIRendererConfiguration);
    get penStyle(): TStyle;
    set penStyle(penStyle: PartialDeep<TStyle>);
    protected updateLayerState(idle: boolean): void;
    /**
     * Update layer UI with debouncing
     * @param timeout - Debounce timeout in milliseconds (default: 500ms)
     */
    updateLayerUI(timeout?: number): void;
    protected manageError(error: Error): void;
    protected setCursorStyle(): void;
    protected onContentChanged(undoRedoContext: THistoryContext): Promise<void>;
    initialize(): Promise<void>;
    changeLanguage(code: string): Promise<void>;
    protected buildShape(partialShape: PartialDeep<TIIShape>): TIIShape;
    protected buildEdge(partialEdge: PartialDeep<TIIEdge>): TIIEdge;
    protected buildRecognized(partialSymbol: PartialDeep<TIIRecognized>): TIIRecognized;
    protected buildStroke(partialSymbol: PartialDeep<IIStroke>): IIStroke;
    protected buildStrokeText(partialSymbol: PartialDeep<IIRecognizedText>): IIRecognizedText;
    protected buildText(partialSymbol: PartialDeep<IIText>): IIText;
    protected buildMath(partialSymbol: PartialDeep<IIMath>): IIMath;
    protected buildSymbol(partialSymbol: PartialDeep<TIISymbol>): TIISymbol;
    /**
     * Create a symbol from partial data
     * @param partialSymbol - Partial symbol data
     * @returns Promise resolving to created symbol
     */
    createSymbol(partialSymbol: PartialDeep<TIISymbol>): Promise<TIISymbol>;
    /**
     * Create multiple symbols from partial data
     * @param partialSymbols - Array of partial symbol data
     * @returns Promise resolving to array of created symbols
     */
    createSymbols(partialSymbols: PartialDeep<TIISymbol>[]): Promise<TIISymbol[]>;
    /** @hidden */
    protected updateTextBounds(symbol: TIISymbol): void;
    /** @hidden */
    addSymbol(sym: TIISymbol, addToHistory?: boolean): Promise<TIISymbol>;
    /**
     * Add multiple symbols to the model and renderer
     * @param symList - Array of symbols to add
     * @param addToHistory - Whether to add to history (default: true)
     * @returns Promise resolving to array of added symbols
     */
    addSymbols(symList: TIISymbol[], addToHistory?: boolean): Promise<TIISymbol[]>;
    /**
     * Update an existing symbol
     * @param sym - Symbol to update
     * @param addToHistory - Whether to add to history (default: true)
     * @returns Promise resolving to updated symbol
     */
    updateSymbol(sym: TIISymbol, addToHistory?: boolean): Promise<TIISymbol>;
    /**
     * Update multiple existing symbols
     * @param symList - Array of symbols to update
     * @param addToHistory - Whether to add to history (default: true)
     * @returns Promise resolving to array of updated symbols
     */
    updateSymbols(symList: TIISymbol[], addToHistory?: boolean): Promise<TIISymbol[]>;
    /**
     * Update style of multiple symbols
     * @param symbolIds - Array of symbol IDs to update
     * @param style - Partial style to apply
     * @param addToHistory - Whether to add to history (default: true)
     */
    updateSymbolsStyle(symbolIds: string[], style: PartialDeep<TStyle>, addToHistory?: boolean): void;
    /**
     * Update font style of text symbols
     * @param textIds - Array of text symbol IDs
     * @param options - Font style options (fontSize, fontWeight)
     */
    updateTextFontStyle(textIds: string[], { fontSize, fontWeight }: {
        fontSize?: number;
        fontWeight?: "normal" | "bold" | "auto";
    }): void;
    /**
     * Replace old symbols with new symbols
     * @param oldSymbols - Array of old symbols to be replaced
     * @param newSymbols - Array of new symbols to replace with
     * @param addToHistory - Whether to add this operation to history (default: true)
     */
    replaceSymbols(oldSymbols: TIISymbol[], newSymbols: TIISymbol[], addToHistory?: boolean): Promise<void>;
    /**
     * Change the order of a symbol in the rendering stack
     * @param symbol - Symbol to reorder
     * @param position - New position (first, last, forward, backward)
     */
    changeOrderSymbol(symbol: TIISymbol, position: "first" | "last" | "forward" | "backward"): void;
    /**
     * Change the order of multiple symbols in the rendering stack
     * @param symbols - Symbols to reorder
     * @param position - New position (first, last, forward, backward)
     */
    changeOrderSymbols(symbols: TIISymbol[], position: "first" | "last" | "forward" | "backward"): void;
    /**
     * Synchronize strokes with JIIX export
     */
    synchronizeStrokesWithJIIX(): Promise<void>;
    /**
     * Remove a symbol from the model
     * @param id - ID of symbol to remove
     * @param addToHistory - Whether to add to history (default: true)
     * @returns Promise that resolves when symbol is removed
     */
    removeSymbol(id: string, addToHistory?: boolean): Promise<void>;
    /**
     * Remove multiple symbols from the model
     * @param ids - Array of symbol IDs to remove
     * @param addToHistory - Whether to add to history (default: true)
     * @returns Promise that resolves when symbols are removed
     */
    removeSymbols(ids: string[], addToHistory?: boolean): Promise<TIISymbol[]>;
    /**
     * Select symbols by their IDs
     * @param ids - Array of symbol IDs to select
     */
    select(ids: string[]): void;
    /**
     * Select all symbols
     */
    selectAll(): void;
    /**
     * Unselect all currently selected symbols
     */
    unselectAll(): void;
    /**
     * Import strokes from point events
     * @param partialStrokes - Array of partial stroke data
     * @returns Promise resolving to updated model
     */
    importPointEvents(partialStrokes: PartialDeep<IIStroke>[]): Promise<IIModel>;
    protected triggerDownload(fileName: string, urlData: string): void;
    /**
     * Get bounding box for a list of symbols
     * @param symbols - Symbols to calculate bounds for
     * @param margin - Margin to add around bounds (default: SELECTION_MARGIN)
     * @returns Bounding box containing all symbols
     */
    getSymbolsBounds(symbols: TIISymbol[], margin?: number): Box;
    protected buildBlobFromSymbols(symbols: TIISymbol[], box: Box): Blob;
    protected getExportName(extension: string): string;
    /**
     * Download symbols as SVG file, either all symbols or only selected ones
     * @param selection - Whether to download only selected symbols (default: false, downloads all symbols)
     */
    downloadAsSVG(selection?: boolean): void;
    /**
     * Download symbols as PNG file, either all symbols or only selected ones
     * @param selection - Whether to download only selected symbols (default: false, downloads all symbols)
     */
    downloadAsPNG(selection?: boolean): void;
    /**
     * Download symbols as JSON file, either all symbols or only selected ones
     * @param selection - Whether to download only selected symbols (default: false, downloads all symbols)
     */
    downloadAsJson(selection?: boolean): void;
    /**
     * Download symbols as plain text file, either all symbols or only selected ones
     * @param selection - Whether to download only selected symbols (default: false, downloads all symbols)
     */
    downloadAsText(selection?: boolean): void;
    protected extractTextFromSymbols(symbols: TIISymbol[]): string;
    protected filterSymbolsForExport(symbols: TIISymbol[]): TIISymbol[];
    /**
     * Extract all strokes from symbols recursively
     * @param symbols - Symbols to extract strokes from
     * @returns Array of extracted strokes
     */
    extractStrokesFromSymbols(symbols: TIISymbol[] | undefined): IIStroke[];
    /**
     * Extract all text symbols recursively
     * @param symbols - Symbols to extract texts from
     * @returns Array of extracted text symbols
     */
    extractTextsFromSymbols(symbols: TIISymbol[] | undefined): IIText[];
    /**
     * Extract all math symbols recursively
     * @param symbols - Symbols to extract maths from
     * @returns Array of extracted math symbols
     */
    extractMathsFromSymbols(symbols: TIISymbol[] | undefined): IIMath[];
    protected extractBackendChanges(changes: TIIHistoryChanges): TIIHistoryBackendChanges;
    protected handleKeyDown: (event: KeyboardEvent) => void;
    protected handleWheel: (event: WheelEvent) => void;
    protected handleKeyUp: (event: KeyboardEvent) => void;
    /**
     * Undo the last action
     * @returns Promise resolving to updated model
     */
    undo(): Promise<IIModel>;
    /**
     * Redo the previously undone action
     * @returns Promise resolving to updated model
     */
    redo(): Promise<IIModel>;
    /**
     * Export content to specified MIME types
     * @param mimeTypes - Array of MIME types to export
     * @returns Promise resolving to updated model with exports
     */
    export(mimeTypes?: string[]): Promise<IIModel>;
    /**
     * Convert all symbols
     * @returns Promise that resolves when conversion is complete
     */
    convert(): Promise<void>;
    /**
     * Convert specific symbols
     * @param symbols - Symbols to convert (defaults to all symbols)
     * @returns Promise that resolves when conversion is complete
     */
    convertSymbols(symbols?: TIISymbol[]): Promise<void>;
    /**
     * Wait for the recognizer to become idle
     * @returns Promise that resolves when idle
     */
    waitForIdle(): Promise<void>;
    /**
     * Resize the editor
     * @param dimensions - New height and/or width
     * @returns Promise that resolves when resize is complete
     */
    resize({ height, width }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    /**
     * Clear all content from the editor
     * @returns Promise that resolves when cleared
     */
    clear(): Promise<void>;
    /**
     * Find a math symbol by its JIIX ID
     * @param jiixId - JIIX ID to search for
     * @returns Math symbol if found, undefined otherwise
     * @group MathSolver
     */
    findMathSymbolByJiixId(jiixId: string): IIRecognizedMath | undefined;
    /**
     * Clear solver output strokes from a math symbol
     * @param mathSymbol - The math symbol to clear solver outputs from
     * @returns Promise that resolves when strokes are removed
     * @group MathSolver
     */
    clearSolverOutputStrokes(mathSymbol: IIRecognizedMath): Promise<void>;
    /**
     * Get available math solver actions for a specific math element
     * @param blockId - The ID of the math element (jiixId)
     * @returns Promise with array of available actions
     * @group MathSolver
     */
    getAvailableActions(blockId: string): Promise<string[]>;
    /**
     * Get diagnostic result for a specific math task
     * @param blockId - The ID of the math element (jiixId)
     * @param task - The task to diagnose (e.g., "numerical-computation", "evaluation")
     * @returns Promise with diagnostic result (e.g., "ALLOWED", "NOT_ALLOWED")
     * @group MathSolver
     */
    getDiagnostic(blockId: string, task: string): Promise<string>;
    /**
     * Get numerical computation result for a math expression
     * @param blockId - The ID of the math element (jiixId)
     * @returns Promise with JIIX export containing the computed result
     * @group MathSolver
     */
    getNumericalComputation(blockId: string): Promise<TJIIXMathElement>;
    /**
     * Compute numerical result for a math symbol
     * @param mathSymbol - The math symbol to compute
     * @param drawStrokes - Whether to draw the result as strokes (default: true)
     * @returns Promise with the computation result, number of added strokes, and numeric value
     * @group MathSolver
     */
    computeMathNumericalResult(mathSymbol: IIRecognizedMath, drawStrokes?: boolean): Promise<{
        result: TJIIXMathElement;
        addedStrokesCount: number;
        value?: number;
    }>;
    /**
     * Get variables from a math expression
     * @param blockId - The ID of the math element (jiixId)
     * @returns Promise with array of variables
     * @group MathSolver
     */
    getVariables(blockId: string): Promise<TMathVariable[]>;
    /**
     * Get available math solver actions for a specific math element
     * @param blockId - The ID of the math element (jiixId)
     * @returns Promise with the value of the variable
     * @group MathSolver
     */
    getVariableValue(blockId: string, variableName: string): Promise<number>;
    /**
     * Set value for a specific variable in a math expression
     * @param blockId - The ID of the math element (jiixId)
     * @param variableName - Name of the variable to set
     * @param variableValue - Value to assign to the variable
     * @param mathSymbol - Optional math symbol (will be found if not provided)
     * @returns Promise that resolves when the variable is set
     * @group MathSolver
     */
    setVariableValue(blockId: string, variableName: string, variableValue: number, mathSymbol?: IIRecognizedMath): Promise<void>;
    /**
     * Set multiple variable values for a math symbol
     * @param mathSymbol - The math symbol to update
     * @param variableValues - Object with variable names as keys and their values
     * @returns Promise that resolves when all variables are set
     * @group MathSolver
     */
    setMathVariables(mathSymbol: IIRecognizedMath, variableValues: {
        [name: string]: number;
    }): Promise<void>;
    /**
     * Get evaluables from a math expression
     * @param blockId - The ID of the math element (jiixId)
     * @returns Promise with array of evaluables
     * @group MathSolver
     */
    getEvaluables(blockId: string): Promise<TMathEvaluable[]>;
    /**
     * Evaluate a math function for a range of input values
     * @param blockId - The ID of the math element (jiixId)
     * @param evaluation - Evaluation parameters (input/output variables, range, point count)
     * @returns Promise with array of objects { inputVar: value, outputVar: value }
     * @group MathSolver
     */
    evaluate(blockId: string, evaluation: {
        inputVariableName: string;
        outputVariableName: string;
        from: number;
        to: number;
        pointCount: number;
    }): Promise<{
        [key: string]: number;
    }[][]>;
    /**
     * Evaluate a math function for a math symbol
     * @param mathSymbol - The math symbol containing the function
     * @param evaluation - Evaluation parameters
     * @returns Promise with evaluation points
     * @group MathSolver
     */
    evaluateMathFunction(mathSymbol: IIRecognizedMath, evaluation: {
        inputVariableName: string;
        outputVariableName: string;
        from: number;
        to: number;
        pointCount: number;
    }): Promise<{
        [key: string]: number;
    }[][]>;
    /**
     * Extract solver output strokes from a JIIX export result
     * Recursively searches for solver-output items and extracts their stroke data
     * @param obj - The JIIX export object to search
     * @returns Array of stroke data with X, Y coordinates and optional F (force) and T (time)
     * @group MathSolver
     */
    protected extractSolverOutputStrokes(obj: unknown): Array<{
        X: number[];
        Y: number[];
        F?: number[];
        T?: number[];
    }>;
    /**
     * Add solver output strokes to a math symbol
     * @param result - JIIX math result containing solver output
     * @param mathSymbol - Math symbol to add strokes to
     * @param style - Optional style for the strokes
     * @returns Promise resolving to array of added strokes
     * @group MathSolver
     */
    addSolverOutputStrokes(result: TJIIXMathElement, mathSymbol: IIRecognizedMath, style?: TStyle): Promise<IIStroke[]>;
    /**
     * Recalculate all blocks that depend on a source block
     * @param sourceBlockId - ID of the source block whose value changed
     * @returns Promise that resolves when all dependents are recalculated
     * @group MathSolver
     */
    recalculateDependentBlocks(sourceBlockId: string): Promise<void>;
    /**
     * Get all dependencies for a math block
     * Returns information about which variables this block uses and from where,
     * and which other blocks depend on this block's variables
     * @param blockId - The JIIX ID of the math block
     * @returns Object containing variable sources and dependent blocks
     * @group MathSolver
     */
    getMathDependencies(blockId: string): {
        variableSources?: {
            [variableName: string]: string;
        };
        dependentBlocks?: string[];
    } | null;
    /**
     * Destroy the editor and clean up resources
     * @returns Promise that resolves when destruction is complete
     */
    destroy(): Promise<void>;
}

/**
 * @group Manager
 */
declare abstract class AbstractWriterManager {
    #private;
    grabber: PointerEventGrabber;
    editor: InteractiveInkEditor | InkEditor;
    currentSymbol?: TIISymbol;
    detectGesture: boolean;
    constructor(editor: InteractiveInkEditor | InkEditor);
    get renderer(): SVGRenderer;
    attach(layer: HTMLElement): void;
    detach(): void;
    protected abstract createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TIISymbol;
    protected abstract updateCurrentSymbol(pointer: TPointer): TIISymbol;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): void;
    abstract end(info: PointerInfo): Promise<void>;
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
declare const DefaulTEditorTriggerConfiguration: TEditorTriggerConfiguration;

/**
 * @group Editor
 */
type TInkEditorConfiguration = TEditorConfiguration & TRecognizerHTTPV2Configuration & {
    rendering: TIIRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TStyle;
};
/**
 * @group Editor
 * @source
 */
declare const DefaultInkEditorConfiguration: TInkEditorConfiguration;
/**
 * @group Editor
 */
declare class InkEditorConfiguration implements TInkEditorConfiguration {
    server: TServerHTTPConfiguration;
    recognition: TRecognizerHTTPV2RecognitionConfiguration;
    rendering: TIIRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TStyle;
    constructor(configuration?: PartialDeep<InkEditorConfiguration>);
}

declare class IWriterManager extends AbstractWriterManager {
    #private;
    editor: InkEditor;
    constructor(editor: InkEditor);
    get model(): IModel;
    protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TIISymbol;
    protected updateCurrentSymbol(pointer: TPointer): IIStroke;
    end(info: PointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
declare class IIDebugSVGManager {
    #private;
    private static readonly DEBUG_BOX_STYLES;
    editor: InteractiveInkEditor;
    constructor(editor: InteractiveInkEditor);
    get model(): IIModel;
    get renderer(): SVGRenderer;
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
    protected drawBoundingBox(symbols: TIISymbol[]): void;
    protected showBoundingBox(): void;
    protected hideBoundingBox(): void;
    debugBoundingBox(): void;
    protected drawDebugBox(box: TBox, color: string, debugType: string, infos?: string[], boxId?: string): void;
    protected trackAndDrawBox(boxId: string, box: TBox, infos: string[], debugType: string, color: string, currentBoxes: Map<string, string>, previousBoxes: Map<string, string>): void;
    protected drawRecognitionBox(box: TBox, infos?: string[], boxId?: string): void;
    protected showRecognitionBox(): Promise<void>;
    protected clearRecognitionBox(): void;
    debugRecognitionBox(): Promise<void>;
    protected drawRecognitionItemBox(box: TBox, label?: string, chars?: string[], boxId?: string): void;
    protected drawMathExpressions(expressions: {
        type: string;
        label?: string;
        "bounding-box"?: TBox;
        operands?: unknown[];
    }[], depth?: number, parentId?: string, currentBoxes?: Map<string, string>): void;
    protected showRecognitionItemBox(): Promise<void>;
    protected clearRecognitionItemBox(): void;
    debugRecognitionItemBox(): Promise<void>;
    apply(): void;
}

/**
 * @group Manager
 */
declare class IDebugSVGManager {
    #private;
    editor: InkEditor;
    constructor(editor: InkEditor);
    get model(): IModel;
    get renderer(): SVGRenderer;
    get recognitionBoxVisibility(): boolean;
    set recognitionBoxVisibility(show: boolean);
    get recognitionBoxItemsVisibility(): boolean;
    set recognitionBoxItemsVisibility(show: boolean);
    protected drawBoundingBox(symbols: TIISymbol[]): void;
    protected drawRecognitionBox(box: TBox, infos: string[], color: string, debugAttr: string): void;
    protected buildInfos(obj: object, currentPath?: string): string[];
    protected showRecognitionBox(): Promise<void>;
    protected showRecognitionBoxItems(): Promise<void>;
    protected clearRecognitionBox(): void;
    protected clearRecognitionBoxItems(): void;
    debugRecognitionBox(): Promise<void>;
    debugRecognitionBoxItems(): Promise<void>;
    apply(): void;
}

/**
 * @group Editor
 */
type TInkEditorOptions = PartialDeep<EditorOptionsBase & {
    configuration: TInkEditorConfiguration;
}> & {
    override?: {
        grabber?: PointerEventGrabber;
        recognizer?: RecognizerHTTPV2;
    };
};
/**
 * @group Editor
 */
declare class InkEditor extends AbstractEditor {
    #private;
    renderer: SVGRenderer;
    recognizer: RecognizerHTTPV2;
    history: IHistoryManager;
    writer: IWriterManager;
    eraser: EraseManager;
    debugger: IDebugSVGManager;
    constructor(rootElement: HTMLElement, options?: TInkEditorOptions);
    get penStyle(): TStyle;
    set penStyle(penStyle: PartialDeep<TStyle>);
    get initializationPromise(): Promise<void>;
    get tool(): EditorTool;
    set tool(i: EditorTool);
    get model(): IModel;
    get configuration(): InkEditorConfiguration;
    initialize(): Promise<void>;
    updateSymbolsStyle(symbolIds: string[], style: PartialDeep<TStyle>): void;
    export(requestedMimeTypes?: string[]): Promise<TExportV2>;
    resize({ height, width }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    removeStrokes(strokeIds: string[]): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Manager
 */
declare class EraseManager {
    #private;
    grabber: PointerEventGrabber;
    editor: InteractiveInkEditor | InkEditor;
    currentEraser?: IIEraser;
    charsToDelete: Map<string, Set<string>>;
    constructor(editor: InteractiveInkEditor | InkEditor);
    get renderer(): SVGRenderer;
    attach(layer: HTMLElement): void;
    detach(): void;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): void;
    end(info: PointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
declare class IIConversionManager {
    #private;
    editor: InteractiveInkEditor;
    constructor(editor: InteractiveInkEditor);
    get configuration(): {
        size: number | "auto";
        weight: "bold" | "normal" | "auto";
    };
    get model(): IIModel;
    get rowHeight(): number;
    protected computeFontSize(chars: TJIIXChar[]): number;
    buildChar(char: TJIIXChar, strokes: IIStroke[], fontSize: number): TIISymbolChar;
    buildText(word: TJIIXWord, chars: TJIIXChar[], strokes: IIStroke[], size: number | "auto"): IIText;
    convertText(text: TJIIXTextElement, strokes: IIStroke[], onlyText: boolean): {
        symbol: IIText;
        strokes: IIStroke[];
    }[] | undefined;
    buildCircle(circle: TJIIXNodeCircle, strokes: IIStroke[]): IIShapeCircle;
    buildEllipse(ellipse: TJIIXNodeEllipse, strokes: IIStroke[]): IIShapeEllipse;
    buildRectangle(rectangle: TJIIXNodeRectangle, strokes: IIStroke[]): IIShapePolygon;
    buildPolygon(polygon: TJIIXNodePolygon, strokes: IIStroke[]): IIShapePolygon;
    buildRhombus(polygon: TJIIXNodeRhombus, strokes: IIStroke[]): IIShapePolygon;
    buildTriangle(polygon: TJIIXNodeTriangle, strokes: IIStroke[]): IIShapePolygon;
    buildParallelogram(polygon: TJIIXNodeParrallelogram, strokes: IIStroke[]): IIShapePolygon;
    convertNode(node: TJIIXNodeElement, strokes: IIStroke[]): {
        symbol: TIIShape;
        strokes: IIStroke[];
    } | undefined;
    buildLine(line: TJIIXEdgeLine, strokes: IIStroke[]): IIEdgeLine;
    buildPolyEdge(polyline: TJIIXEdgePolyEdge, strokes: IIStroke[]): IIEdgePolyLine;
    buildArc(arc: TJIIXEdgeArc, strokes: IIStroke[]): IIEdgeArc;
    convertEdge(edge: TJIIXEdgeElement, strokes: IIStroke[]): {
        symbol: TIIEdge;
        strokes: IIStroke[];
    } | undefined;
    protected convertLatexToUnicode(latex: string): string;
    buildMath(mathElement: TJIIXMathElement, strokes: IIStroke[], fontSize: number): IIMath;
    convertMath(mathElement: TJIIXMathElement, strokes: IIStroke[]): {
        symbol: IIMath;
        strokes: IIStroke[];
    } | undefined;
    apply(symbols?: TIISymbol[]): Promise<void>;
}

/**
 * @group Manager
 */
declare class IIMoveManager {
    #private;
    grabber: PointerEventGrabber;
    editor: InteractiveInkEditor;
    origin?: {
        viewBoxX: number;
        viewBoxY: number;
        clientX: number;
        clientY: number;
    };
    constructor(editor: InteractiveInkEditor);
    get renderer(): SVGRenderer;
    protected updateViewBox(info: PointerInfo, redrawGuide: boolean): void;
    attach(layer: HTMLElement): void;
    detach(): void;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): void;
    end(info: PointerInfo): void;
}

/**
 * @group Manager
 */
declare class IIResizeManager {
    #private;
    editor: InteractiveInkEditor;
    interactElementsGroup?: SVGElement;
    direction: ResizeDirection;
    boundingBox: Box;
    transformOrigin: TPoint;
    keepRatio: boolean;
    constructor(editor: InteractiveInkEditor);
    get model(): IIModel;
    protected applyToStroke(stroke: IIStroke, origin: TPoint, scaleX: number, scaleY: number): IIStroke;
    protected applyToShape(shape: TIIShape, origin: TPoint, scaleX: number, scaleY: number): TIIShape;
    protected applyToEdge(edge: TIIEdge, origin: TPoint, scaleX: number, scaleY: number): TIIEdge;
    protected applyOnText(text: IIText, origin: TPoint, scaleX: number, scaleY: number): IIText;
    protected applyOnMath(math: IIMath, origin: TPoint, scaleX: number, scaleY: number): IIMath;
    protected applyOnRecognizedSymbol(recognizedSymbol: TIIRecognized, origin: TPoint, scaleX: number, scaleY: number): TIIRecognized;
    applyToSymbol(symbol: TIISymbol, origin: TPoint, scaleX: number, scaleY: number): TIISymbol;
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
declare class IIRotationManager {
    #private;
    editor: InteractiveInkEditor;
    interactElementsGroup?: SVGElement;
    center: TPoint;
    origin: TPoint;
    constructor(editor: InteractiveInkEditor);
    get model(): IIModel;
    protected applyToStroke(stroke: IIStroke, center: TPoint, angleRad: number): IIStroke;
    protected applyToShape(shape: TIIShape, center: TPoint, angleRad: number): TIIShape;
    protected applyToEdge(edge: TIIEdge, center: TPoint, angleRad: number): TIIEdge;
    protected applyOnText(text: IIText, center: TPoint, angleRad: number): IIText;
    protected applyOnMath(math: IIMath, center: TPoint, angleRad: number): IIMath;
    protected applyOnRecognizedSymbol(strokeText: TIIRecognized, center: TPoint, angleRad: number): TIIRecognized;
    applyToSymbol(symbol: TIISymbol, center: TPoint, angleRad: number): TIISymbol;
    setTransformOrigin(id: string, originX: number, originY: number): void;
    rotateElement(id: string, degree: number): void;
    start(target: Element, origin: TPoint): void;
    continue(point: TPoint): number;
    end(point: TPoint): Promise<void>;
}

/**
 * @group Manager
 */
declare class IITranslateManager {
    #private;
    editor: InteractiveInkEditor;
    interactElementsGroup?: SVGElement;
    transformOrigin: TPoint;
    constructor(editor: InteractiveInkEditor);
    get model(): IIModel;
    protected applyToStroke(stroke: IIStroke, tx: number, ty: number): IIStroke;
    protected applyToShape(shape: TIIShape, tx: number, ty: number): TIIShape;
    protected applyToEdge(edge: TIIEdge, tx: number, ty: number): TIIEdge;
    protected applyOnText(text: IIText, tx: number, ty: number): IIText;
    protected applyOnMath(math: IIMath, tx: number, ty: number): IIMath;
    protected applyOnRecognizedSymbol(recognizedSymbol: TIIRecognized, tx: number, ty: number): TIIRecognized;
    applyToSymbol(symbol: TIISymbol, tx: number, ty: number): TIISymbol;
    translate(symbols: TIISymbol[], tx: number, ty: number, addToHistory?: boolean): Promise<void>;
    translateElement(id: string, tx: number, ty: number): void;
    start(target: Element, origin: TPoint): void;
    continue(point: TPoint): {
        tx: number;
        ty: number;
    };
    end(point: TPoint): Promise<void>;
}

/**
 * @group Manager
 */
declare class IISelectionManager {
    #private;
    grabber: PointerEventGrabber;
    editor: InteractiveInkEditor;
    startSelectionPoint?: TPoint;
    endSelectionPoint?: TPoint;
    selectedGroup?: SVGGElement;
    constructor(editor: InteractiveInkEditor);
    get model(): IIModel;
    get renderer(): SVGRenderer;
    get rotator(): IIRotationManager;
    get translator(): IITranslateManager;
    get resizer(): IIResizeManager;
    get selectionBox(): Box | undefined;
    attach(layer: HTMLElement): void;
    detach(): void;
    drawSelectingRect(box: TBox): void;
    clearSelectingRect(): void;
    protected getPoint(ev: PointerEvent): TPoint;
    protected createTranslateRect(box: TBox): SVGRectElement;
    protected createRotateGroup(box: TBox): SVGGElement;
    protected createResizeGroup(box: TBox): SVGGElement;
    protected createInteractElementsGroup(symbols: TIISymbol[]): SVGGElement | undefined;
    protected createEdgeResizeGroup(edge: TIIEdge): SVGGElement;
    protected createInteractEdgeGroup(edge: TIIEdge): SVGGElement | undefined;
    drawSelectedGroup(symbols: TIISymbol[]): void;
    resetSelectedGroup(symbols: TIISymbol[]): void;
    removeSelectedGroup(): void;
    hideInteractElements(): void;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): TIISymbol[];
    end(info: PointerInfo): TIISymbol[];
    protected onContextMenu(info: PointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
declare class IISynchronizerManager {
    #private;
    editor: InteractiveInkEditor;
    static readonly SYNCHRONIZE_TIMEOUT = 30000;
    static readonly MAX_RETRY_ATTEMPTS = 3;
    constructor(editor: InteractiveInkEditor);
    get model(): IIModel;
    synchronize(): Promise<void>;
    protected cleanupMathDependencies(mathSymbols: IIRecognizedMath[]): void;
    protected enrichMathDependencies(mathSymbol: IIRecognizedMath): Promise<void>;
    protected getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(items?: TJIIXStrokeItem[]): {
        symbols: TIISymbol[];
        strokes: IIStroke[];
    };
    protected collectMathItems(expr: TJIIXMathExpression): TJIIXStrokeItem[];
    protected getMathElementItems(mathElement: TJIIXMathElement): TJIIXStrokeItem[];
    protected synchronizeTextElement(el: TJIIXTextElement, jiix: TJIIXExport): Promise<void>;
    protected updateExistingTextSymbol(existingText: IIRecognizedText, el: TJIIXTextElement, jiixAssociation: {
        symbols: TIISymbol[];
        strokes: IIStroke[];
    }): void;
    protected createNewTextSymbol(el: TJIIXTextElement, jiixAssociation: {
        symbols: TIISymbol[];
        strokes: IIStroke[];
    }): void;
    protected synchronizeEmbeddedMathElement(mathEl: TJIIXMathElement): Promise<void>;
    protected synchronizeMathElement(el: TJIIXMathElement): Promise<void>;
    protected clearDependentBlocksSolverOutputs(dependentBlockIds: string[]): Promise<void>;
    protected updateExistingMathSymbol(existingMath: IIRecognizedMath, mathEl: TJIIXMathElement, jiixAssociation: {
        symbols: TIISymbol[];
        strokes: IIStroke[];
    }, isEmbedded: boolean): Promise<void>;
    protected createNewMathSymbol(mathEl: TJIIXMathElement, jiixAssociation: {
        symbols: TIISymbol[];
        strokes: IIStroke[];
    }, isEmbedded: boolean): void;
    protected synchronizeNodeElement(el: TJIIXNodeElement): void;
    protected updateExistingNodeSymbol(existingNode: TIIRecognized, jiixAssociation: {
        symbols: TIISymbol[];
        strokes: IIStroke[];
    }): void;
    protected createNewNodeSymbol(el: TJIIXNodeElement, jiixAssociation: {
        symbols: TIISymbol[];
        strokes: IIStroke[];
    }): void;
    protected synchronizeEdgeElement(el: TJIIXEdgeElement): void;
    protected updateExistingEdgeSymbol(existingEdge: TIIRecognized, jiixAssociation: {
        symbols: TIISymbol[];
        strokes: IIStroke[];
    }): void;
    protected createNewEdgeSymbol(el: TJIIXEdgeElement, jiixAssociation: {
        symbols: TIISymbol[];
        strokes: IIStroke[];
    }): void;
}

/**
 * @group Manager
 */
declare class IITextManager {
    #private;
    editor: InteractiveInkEditor;
    constructor(editor: InteractiveInkEditor);
    get renderer(): SVGRenderer;
    get rowHeight(): number;
    get model(): IIModel;
    protected drawSymbolHidden(text: IIText): SVGGElement;
    setCharsBounds(text: IIText, textGroupEl: SVGGElement): IIText;
    setBounds(text: IIText): void;
    getElementBoundingBox(textElement: SVGElement): Box;
    getBoundingBox(text: IIText): Box;
    getSpaceWidth(fontSize: number): number;
    updateBounds(textSymbol: IIText): IIText;
    moveTextAfter(text: IIText, tx: number): TIISymbol[] | undefined;
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
 * List all action allowed on underline detected
 * @remarks
 * only usable in the case of offscreen
 */
declare enum UnderlineAction {
    Draw = "draw",
    Thicken = "thicken"
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
    underline: UnderlineAction;
    insert: InsertAction;
};
/**
 * @group Gesture
 * @source
 */
declare const DefaultGestureConfiguration: TGestureConfiguration;
/**
 * @group Gesture
 */
declare class IIGestureManager {
    #private;
    insertAction: InsertAction;
    surroundAction: SurroundAction;
    strikeThroughAction: StrikeThroughAction;
    underlineAction: UnderlineAction;
    editor: InteractiveInkEditor;
    constructor(editor: InteractiveInkEditor, gestureAction?: PartialDeep<TGestureConfiguration>);
    get renderer(): SVGRenderer;
    get recognizer(): RecognizerWebSocket;
    get translator(): IITranslateManager;
    get texter(): IITextManager;
    get model(): IIModel;
    get history(): IIHistoryManager;
    get rowHeight(): number;
    get strokeSpaceWidth(): number;
    protected isDecorable(symbol: TIISymbol): boolean;
    /**
     * Helper function to apply decorator on words that intersect with gesture stroke
     * @param symbol - The symbol to apply decorator on (can be IIText or IIRecognizedText)
     * @param gestureStroke - The gesture stroke
     * @param decoratorKind - The kind of decorator to apply
     * @returns true if at least one word was modified, false otherwise
     */
    protected applyDecoratorOnWords(symbol: IIText | IIRecognizedText, gestureStroke: IIStroke, decoratorKind: DecoratorKind): boolean;
    applySurroundGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void>;
    protected computeScratchOnStrokes(gesture: TGesture, stroke: IIStroke): IIStroke[];
    protected computeScratchOnText(gestureStroke: IIStroke, textSymbol: IIText): IIText | undefined;
    protected computeScratchOnSymbol(gestureStroke: IIStroke, gesture: TGesture, symbol: TIISymbol): {
        erased?: boolean;
        replaced?: TIISymbol[];
    };
    applyScratch(gestureStroke: IIStroke, gesture: TGesture): Promise<void>;
    applyJoinGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void>;
    protected createStrokesFromGestureSubStroke(strokeOrigin: IIStroke, subStrokes: {
        x: number[];
        y: number[];
    }[]): IIStroke[];
    protected computeSplitStroke(strokeOrigin: IIStroke, subStrokes: {
        x: number[];
        y: number[];
    }[]): {
        before?: IIStroke;
        after?: IIStroke;
    };
    protected computeChangesOnSplitStroke(gestureStroke: IIStroke, strokeIdToSplit: string, subStrokes: {
        fullStrokeId: string;
        x: number[];
        y: number[];
    }[]): TIIHistoryChanges;
    protected computeChangesOnSplitStrokeText(gestureStroke: IIStroke, strokeTextToSplit: IIRecognizedText): TIIHistoryChanges;
    protected computeChangesOnSplitText(gestureStroke: IIStroke, textToSplit: IIText): TIIHistoryChanges;
    applyInsertGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void>;
    applyUnderlineGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void>;
    applyStrikeThroughGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void | TIISymbol[]>;
    apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void>;
    getGestureFromContextLess(gestureStroke: IIStroke): Promise<TGesture | undefined>;
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
declare class IISnapManager {
    #private;
    editor: InteractiveInkEditor;
    configuration: SnapConfiguration;
    constructor(editor: InteractiveInkEditor, config?: PartialDeep<TSnapConfiguration>);
    get model(): IIModel;
    get renderer(): SVGRenderer;
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
declare class IIWriterManager extends AbstractWriterManager {
    #private;
    detectGesture: boolean;
    editor: InteractiveInkEditor;
    currentSymbolOrigin?: TPoint;
    constructor(editor: InteractiveInkEditor);
    get tool(): EditorWriteTool;
    set tool(wt: EditorWriteTool);
    get model(): IIModel;
    get renderer(): SVGRenderer;
    get history(): IIHistoryManager;
    get gestureManager(): IIGestureManager;
    get snaps(): IISnapManager;
    get recognizer(): RecognizerWebSocket;
    attach(layer: HTMLElement): void;
    detach(): void;
    protected needContextLessGesture(stroke: IIStroke): boolean;
    protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TIISymbol;
    protected updateCurrentSymbolShape(pointer: TPointer): void;
    protected updateCurrentSymbolEdge(pointer: TPointer): void;
    protected updateCurrentSymbol(pointer: TPointer): TIISymbol;
    start(info: PointerInfo): void;
    continue(info: PointerInfo): void;
    protected interactWithBackend(stroke: IIStroke): Promise<void>;
    end(info: PointerInfo): Promise<void>;
}

/**
 * Excel-like color palette for variable visualization
 * @group Manager
 */
declare class VariableColorManager {
    #private;
    private static instance;
    private static readonly EXCEL_PALETTE;
    private constructor();
    static getInstance(): VariableColorManager;
    /**
     * Get color for a variable name. Same variable always gets the same color.
     */
    getColorForVariable(variableName: string): string;
    /**
     * Get all variable colors
     */
    getAllVariableColors(): Map<string, string>;
    /**
     * Clear all variable color assignments
     */
    clear(): void;
    /**
     * Remove color assignment for a specific variable
     */
    removeVariable(variableName: string): void;
    /**
     * Get the full color palette
     */
    static getPalette(): string[];
}

/**
 * Manages transient ink overlays (temporary solver results)
 * These are removed when source blocks are modified
 * @group Manager
 */
declare class TransientInkManager {
    #private;
    renderer: SVGRenderer;
    model: IIModel;
    constructor(renderer: SVGRenderer, model: IIModel);
    /**
     * Add a transient symbol (solver output) linked to a source block
     */
    addTransientSymbol(sourceBlockId: string, symbolId: string): void;
    /**
     * Remove all transient symbols associated with a source block
     */
    clearTransientsForBlock(sourceBlockId: string): void;
    /**
     * Clear all transient symbols
     */
    clearAll(): void;
    /**
     * Get all transient symbol IDs for a block
     */
    getTransientsForBlock(sourceBlockId: string): string[];
    /**
     * Check if a symbol is transient
     */
    isTransient(symbolId: string): boolean;
    /**
     * Get all transient symbols across all blocks
     */
    getAllTransients(): Map<string, string[]>;
}

/**
 * Visual overlay configuration
 * @group Manager
 */
type TMathOverlayConfig = {
    showBlockOverlays: boolean;
    showResultPanels: boolean;
    badgeSize: number;
    borderWidth: number;
    panelPadding: number;
};
/**
 * Manages visual overlays for recognized math symbols (RecognizedKind.Math):
 * - Badges (∑ for math blocks)
 * - Borders around blocks
 * - Result panels with connection lines
 *
 * @group Manager
 */
declare class MathOverlayManager {
    #private;
    private static readonly DEFAULT_CONFIG;
    private static readonly BADGE_STYLES;
    private static readonly OVERLAY_PREFIXES;
    editor: InteractiveInkEditor;
    renderer: SVGRenderer;
    constructor(editor: InteractiveInkEditor, config?: Partial<TMathOverlayConfig>);
    get model(): IIModel;
    updateConfig(config: Partial<TMathOverlayConfig>): void;
    getConfig(): TMathOverlayConfig;
    protected drawBadge(box: TBox, id: string): void;
    protected drawBorder(box: TBox, id: string, color?: string, dashArray?: string): void;
    protected drawResultPanel(box: TBox, id: string, resultText: string): void;
    protected createHoverZone(mathSymbol: IIRecognizedMath): void;
    refresh(): void;
    protected getBlockColor(mathSymbol: IIRecognizedMath): string;
    updateOverlaysForSymbol(symbol: TIISymbol): void;
    clearAll(): void;
    clearOverlaysForBlock(id: string): void;
    /**
     * Generic method to draw a rectangle overlay on a math symbol
     * @param mathSymbol - The math symbol to draw overlay on
     * @param idPrefix - Prefix for the overlay ID
     * @param attrs - Additional SVG attributes
     */
    protected drawOverlayRect(mathSymbol: IIRecognizedMath, idPrefix: string, attrs: Partial<Record<string, string>>): void;
    highlightAsSource(mathSymbol: IIRecognizedMath, color?: string): void;
    highlightAsDependent(mathSymbol: IIRecognizedMath): void;
    /**
     * Highlight a specific variable box within an equation
     * @param box - Variable bounding box
     * @param symbolId - Parent symbol ID for unique identifier
     * @param variableName - Variable name for unique identifier and color assignment
     */
    highlightVariableBox(box: TBox, symbolId: string, variableName: string): void;
    addHoverGlow(mathSymbol: IIRecognizedMath): void;
    dimSymbol(mathSymbol: IIRecognizedMath, opacity?: number): void;
    drawDependencyArrow(fromId: string, toId: string, color: string): void;
    /**
     * Draw dependency arrow from a symbol to a specific variable box
     * @param fromId - Source symbol ID
     * @param fromBounds - Source symbol bounds
     * @param toId - Target symbol ID (for unique arrow ID)
     * @param toBox - Target variable bounding box
     * @param color - Arrow color
     */
    drawDependencyArrowToBox(fromId: string, fromBounds: TBox, toId: string, toBox: TBox, color: string): void;
    protected ensureArrowheadMarker(): void;
    clearHighlights(): void;
    clearDimming(): void;
    clearDependencyArrows(): void;
    toggleBlockOverlays(show: boolean): void;
    toggleResultPanels(show: boolean): void;
}

/**
 * Configuration for math interaction features
 * @group Manager
 */
type TMathInteractionConfig = {
    showDependencyOnHover: boolean;
    highlightOnSelect: boolean;
    dimOpacity: number;
};
/**
 * Manages interactive highlighting and visual feedback for math dependencies:
 * - Hover highlighting (sources in green, dependents in orange)
 * - Selection highlighting with dimming
 * - Dependency arrows/lines between related blocks
 * - Recursive dependency tree traversal
 *
 * @group Manager
 */
declare class MathInteractionManager {
    #private;
    private static readonly DEFAULT_CONFIG;
    private static readonly HIGHLIGHT_STYLES;
    editor: InteractiveInkEditor;
    overlayManager: MathOverlayManager;
    constructor(editor: InteractiveInkEditor, config?: Partial<TMathInteractionConfig>);
    /**
     * Update interaction configuration
     */
    updateConfig(config: Partial<TMathInteractionConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): TMathInteractionConfig;
    /**
     * Get all math symbols from the model
     */
    protected getMathSymbols(): IIRecognizedMath[];
    /**
     * Find math symbol by ID
     */
    protected findMathSymbol(symbolId: string): IIRecognizedMath | undefined;
    /**
     * Find variable bounding box in JIIX expressions recursively
     * @param expressions - Array of JIIX expressions to search
     * @param variableName - Name of the variable to find (e.g., "x", "y")
     * @returns Bounding box in pixels, or null if not found
     */
    protected findVariableBoxInExpressions(expressions: TJIIXMathExpression[], variableName: string): TBox | null;
    /**
     * Get all source blocks recursively
     * @param symbolId - Symbol ID to get sources for
     * @param visited - Set of already visited symbols to prevent infinite loops
     * @returns Set of source symbol IDs
     */
    getRecursiveSources(symbolId: string, visited?: Set<string>): Set<string>;
    /**
     * Get all dependent blocks recursively
     * @param symbolId - Symbol ID to get dependents for
     * @param visited - Set of already visited symbols to prevent infinite loops
     * @returns Set of dependent symbol IDs
     */
    getRecursiveDependents(symbolId: string, visited?: Set<string>): Set<string>;
    /**
     * Handle symbol hover event
     * @param symbolId - Symbol ID being hovered, or null to clear hover
     */
    onSymbolHover(symbolId: string | null): void;
    /**
     * Clear hover highlights
     */
    protected clearHoverHighlights(): void;
    /**
     * Handle symbol selection
     * @param symbolIds - Array of selected symbol IDs
     */
    onSymbolSelect(symbolIds: string[]): void;
    /**
     * Clear all selection highlights and dimming
     */
    protected clearSelectionHighlights(): void;
    /**
     * Draw dependency arrows between symbol and its sources/dependents
     * @param symbolId - Central symbol ID
     * @param sources - Set of source symbol IDs
     * @param dependents - Set of dependent symbol IDs
     */
    protected drawDependencyArrows(symbolId: string, sources: Set<string>, dependents: Set<string>): void;
    /**
     * Clear all highlights and reset state
     */
    clearAll(): void;
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
    emitExported(exports: TExport | TExportV2): void;
    addExportedListener(callback: (exports: TExport | TExportV2) => void): void;
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
    addSelectedListener(callback: (symbols: TIISymbol[]) => void): void;
    emitToolChanged(mode: EditorTool): void;
    addToolChangedListener(callback: (mode: EditorTool) => void): void;
    emitUIpdated(): void;
    addUIpdatedListener(callback: () => void): void;
    emitSynchronized(): void;
    addSynchronizedListener(callback: () => void): void;
    emitGestured(gesture: {
        gestureType: TGestureType;
        stroke: IIStroke;
    }): void;
    addGesturedListener(callback: (gesture: {
        gestureType: TGestureType;
        stroke: IIStroke;
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
type TIIHistoryChanges = {
    added?: TIISymbol[];
    updated?: TIISymbol[];
    erased?: TIISymbol[];
    replaced?: {
        oldSymbols: TIISymbol[];
        newSymbols: TIISymbol[];
    };
    matrix?: {
        symbols: TIISymbol[];
        matrix: TMatrixTransform;
    };
    translate?: {
        symbols: TIISymbol[];
        tx: number;
        ty: number;
    }[];
    scale?: {
        symbols: TIISymbol[];
        scaleX: number;
        scaleY: number;
        origin: TPoint;
    }[];
    rotate?: {
        symbols: TIISymbol[];
        angle: number;
        center: TPoint;
    }[];
    style?: {
        symbols: TIISymbol[];
        style?: PartialDeep<TStyle>;
        fontSize?: number;
    };
    order?: {
        symbols: TIISymbol[];
        position: "first" | "last" | "forward" | "backward";
    };
    decorator?: {
        symbol: TIISymbol;
        decorator: IIDecorator;
        added: boolean;
    }[];
    group?: {
        symbols: TIISymbol[];
    };
    ungroup?: {
        group: TIISymbol;
    };
};
/**
 * @group History
 * @remarks used to send messages to the backend on undo or redo
 */
type TIIHistoryBackendChanges = {
    added?: IIStroke[];
    erased?: IIStroke[];
    replaced?: {
        oldStrokes: IIStroke[];
        newStrokes: IIStroke[];
    };
    matrix?: {
        strokes: IIStroke[];
        matrix: TMatrixTransform;
    };
    translate?: {
        strokes: IIStroke[];
        tx: number;
        ty: number;
    }[];
    scale?: {
        strokes: IIStroke[];
        scaleX: number;
        scaleY: number;
        origin: TPoint;
    }[];
    rotate?: {
        strokes: IIStroke[];
        angle: number;
        center: TPoint;
    }[];
};
/**
 * @group History
 */
type TIIHistoryStackItem = {
    changes: TIIHistoryChanges;
    model: IIModel;
};
/**
 * @group History
 */
declare class IIHistoryManager {
    #private;
    configuration: THistoryConfiguration;
    event: EditorEvent;
    context: THistoryContext;
    stack: TIIHistoryStackItem[];
    constructor(configuration: THistoryConfiguration, event: EditorEvent);
    private updateContext;
    isChangesEmpty(changes: TIIHistoryChanges): boolean;
    init(model: IIModel): void;
    push(model: IIModel, changes: TIIHistoryChanges): void;
    update(model: IIModel): void;
    pop(): void;
    protected reverseChanges(changes: TIIHistoryChanges): TIIHistoryChanges;
    undo(): TIIHistoryStackItem;
    redo(): TIIHistoryStackItem;
    clear(): void;
}

/**
 * @group History
 */
type TIHistoryChanges = {
    added?: TIISymbol[];
    removed?: TIISymbol[];
};
/**
 * @group History
 * @remarks used to send messages to the backend on undo or redo
 */
type TIHistoryBackendChanges = {
    added?: IIStroke[];
    removed?: IIStroke[];
};
/**
 * @group History
 */
type TIHistoryStackItem = {
    changes: TIHistoryChanges;
    model: IModel;
};
/**
 * @group History
 */
declare class IHistoryManager {
    #private;
    configuration: THistoryConfiguration;
    event: EditorEvent;
    context: THistoryContext;
    stack: TIHistoryStackItem[];
    constructor(configuration: THistoryConfiguration, event: EditorEvent);
    private updateContext;
    updateModelStack(model: IModel): void;
    isChangesEmpty(changes: TIHistoryChanges): boolean;
    init(model: IModel): void;
    push(model: IModel, changes: TIHistoryChanges): void;
    pop(): void;
    protected reverseChanges(changes: TIHistoryChanges): TIHistoryChanges;
    undo(): TIHistoryStackItem;
    redo(): TIHistoryStackItem;
    clear(): void;
}

/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessage = {
    type: string;
    [key: string]: unknown;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessageError = {
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
type TRecognizerWebSocketSSRMessageHMACChallenge = TRecognizerWebSocketSSRMessage & {
    hmacChallenge: string;
    iinkSessionId: string;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessageContentPackageDescriptionMessage = TRecognizerWebSocketSSRMessage & {
    contentPartCount: number;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessagePartChange = TRecognizerWebSocketSSRMessage & {
    partIdx: number;
    partId: string;
    partCount: number;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRMessageContentChange = TRecognizerWebSocketSSRMessage & {
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
type TRecognizerWebSocketSSRMessageExport = TRecognizerWebSocketSSRMessage & {
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
type TRecognizerWebSocketSSRMessageSVGPatch = TRecognizerWebSocketSSRMessage & {
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
    emitSVGPatch(svgPatch: TRecognizerWebSocketSSRMessageSVGPatch): void;
    /**
     * @remarks only usable in the case of websocket
     */
    addSVGPatchListener(callback: (svgPatch: TRecognizerWebSocketSSRMessageSVGPatch) => void): void;
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
    UNKNOWN = "An unknown error has occurred.",
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
type TRecognitionType = "TEXT" | "MATH" | "DIAGRAM" | "Raw Content";
/**
 * @group Recognizer
 */
type TRecognitionV2Type = "TEXT" | "MATH" | "Raw Content" | "SHAPE";
/**
 * @group Recognizer
 */
type TConverstionState = "DIGITAL_EDIT" | "HANDWRITING";

/**
 * @group Recognizer
 */
type TRecognitionHTTPV1Configuration = {
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
declare const DefaulRecognitionHTTPV1ConfigurationConfiguration: TRecognitionHTTPV1Configuration;
/**
 * @group Recognizer
 */
type TRecognizerHTTPV1Configuration = {
    server: TServerHTTPConfiguration;
    recognition: TRecognitionHTTPV1Configuration;
};
/**
 * @group Recognizer
 */
declare const DefaultRecognizerHTTPV1Configuration: TRecognizerHTTPV1Configuration;
/**
 * @group Recognizer
 * @source
 */
declare class RecognizerHTTPV1Configuration implements TRecognizerHTTPV1Configuration {
    recognition: TRecognitionHTTPV1Configuration;
    server: TServerHTTPConfiguration;
    constructor(configuration?: PartialDeep<TRecognizerHTTPV1Configuration>);
}

/**
 * @group Recognizer
 */
type TRecognizerHTTPV1PostConfiguration = {
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
type TRecognizerHTTPV1PostData = {
    configuration: TRecognizerHTTPV1PostConfiguration;
    xDPI: number;
    yDPI: number;
    contentType: string;
    conversionState?: TConverstionState;
    height: number;
    width: number;
    strokeGroups: TStrokeGroupToSend[];
};
/**
 * @deprecated Use {@link RecognizerHTTPV2} instead.
 * @group Recognizer
 */
declare class RecognizerHTTPV1 {
    #private;
    configuration: RecognizerHTTPV1Configuration;
    constructor(config: PartialDeep<TRecognizerHTTPV1Configuration>);
    get url(): string;
    get postConfig(): TRecognizerHTTPV1PostConfiguration;
    protected buildData(model: Model): TRecognizerHTTPV1PostData;
    protected post(data: unknown, mimeType: string): Promise<unknown>;
    protected tryFetch(data: TRecognizerHTTPV1PostData, mimeType: string): Promise<TExport | never>;
    protected getMimeTypes(requestedMimeTypes?: string[]): string[];
    convert(model: Model, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<Model>;
    export(model: Model, requestedMimeTypes?: string[]): Promise<Model>;
    resize(model: Model): Promise<Model>;
}

/**
 * @group Recognizer
 */
type TRecognizerHTTPV2RecognitionConfiguration = {
    type: TRecognitionV2Type;
    lang: string;
    math: TMathConfiguration;
    text: TTextRecognizerHTTPV2Configuration;
    shape: TShapeConfiguration;
    "raw-content": TRawContentConfiguration;
    export: TExportConfiguration;
    convert?: TConvertionConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRecognizerHTTPV2RecognitionConfiguration: TRecognizerHTTPV2RecognitionConfiguration;
/**
 * @group Recognizer
 */
type TRecognizerHTTPV2Configuration = {
    server: TServerHTTPConfiguration;
    recognition: TRecognizerHTTPV2RecognitionConfiguration;
};
/**
 * @group Recognizer
 */
declare const DefaultRecognizerHTTPV2Configuration: TRecognizerHTTPV2Configuration;
/**
 * @group Recognizer
 * @source
 */
declare class RecognizerHTTPV2Configuration implements TRecognizerHTTPV2Configuration {
    recognition: TRecognizerHTTPV2RecognitionConfiguration;
    server: TServerHTTPConfiguration;
    constructor(configuration?: PartialDeep<TRecognizerHTTPV2Configuration>);
}

/**
 * @group Recognizer
 */
type TRecognizerHTTPV2PostConfiguration = {
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
type TRecognizerHTTPV2PostData = {
    scaleX: number;
    scaleY: number;
    configuration: TRecognizerHTTPV2PostConfiguration;
    contentType: string;
    strokes: TStrokeToSend[];
};
/**
 * @group Recognizer
 */
declare class RecognizerHTTPV2 {
    #private;
    configuration: RecognizerHTTPV2Configuration;
    constructor(config: PartialDeep<TRecognizerHTTPV2Configuration>);
    get url(): string;
    get postConfig(): TRecognizerHTTPV2PostConfiguration;
    protected formatStrokes(strokes: TStroke[]): TStrokeToSend[];
    protected buildData(strokes: TStroke[]): TRecognizerHTTPV2PostData;
    protected post(data: unknown, mimeType: string): Promise<unknown>;
    protected tryFetch(data: TRecognizerHTTPV2PostData, mimeType: string): Promise<TExportV2 | never>;
    protected getMimeTypes(requestedMimeTypes?: string[]): string[];
    send(strokes: TStroke[], requestedMimeTypes?: string[]): Promise<TExportV2>;
}

/**
 * @group Recognizer
 */
declare enum TRecognizerWebSocketMessageType {
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
    MathSolverResult = "mathSolverResult",
    Error = "error"
}
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessage<T = string> = {
    type: T;
    [key: string]: unknown;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageAuthenticated = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Authenticated>;
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageHMACChallenge = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.HMAC_Challenge> & {
    hmacChallenge: string;
    iinkSessionId: string;
};
/**
 * @group Recognizer
 */
type TInteractiveInkSessionDescriptionMessage = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.SessionDescription> & {
    contentPartCount: number;
    iinkSessionId: string;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageNewPart = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.NewPart> & {
    id: string;
    idx: null;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessagePartChange = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.PartChanged> & {
    partIdx: number;
    partId: string;
    partCount: number;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageContentChange = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.ContentChanged> & {
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
type TRecognizerWebSocketMessageExport = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Exported> & {
    partId: string;
    exports: TExport;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageGesture = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.GestureDetected> & TGesture;
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageContextlessGesture = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.ContextlessGesture> & {
    gestureType: "none" | "scratch" | "left-right" | "right-left" | "bottom-top" | "top-bottom" | "surround";
    strokeId: string;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessagePong = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Pong>;
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageIdle = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Idle>;
/**
 * @group Recognizer
 */
type TMathVariable = {
    name: string;
    value?: number;
    sourceType?: "UNDEFINED" | "API" | "API_GLOBAL" | "BLOCK" | "PREDIFINED";
    sourceId?: string;
    occurrenceCount?: number;
};
/**
 * @group Recognizer
 */
type TMathEvaluable = {
    inputName: string;
    outputName: string;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageMathSolverAvailableActions = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
    blockId: string;
    action: "available-actions";
    result: string[];
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageMathSolverGetDiagnostic = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
    blockId: string;
    action: "get-diagnostic";
    result: string;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageMathSolverNumericalComputation = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
    blockId: string;
    action: "numerical-computation";
    result: string;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageMathSolverGetVariables = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
    blockId: string;
    action: "get-variables";
    result: TMathVariable[];
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageMathSolverSetVariableValue = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
    blockId: string;
    action: "set-variable-value";
    result?: undefined;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageMathSolverGetVariableValue = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
    blockId: string;
    action: "get-variable-value";
    result: number;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageMathSolverGetEvaluables = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
    blockId: string;
    action: "get-evaluables";
    result: TMathEvaluable[];
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageMathSolverEvaluate = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
    blockId: string;
    action: "evaluate";
    result: number[][];
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageMathSolverResult = TRecognizerWebSocketMessageMathSolverAvailableActions | TRecognizerWebSocketMessageMathSolverGetDiagnostic | TRecognizerWebSocketMessageMathSolverNumericalComputation | TRecognizerWebSocketMessageMathSolverGetVariables | TRecognizerWebSocketMessageMathSolverSetVariableValue | TRecognizerWebSocketMessageMathSolverGetVariableValue | TRecognizerWebSocketMessageMathSolverGetEvaluables | TRecognizerWebSocketMessageMathSolverEvaluate;
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageError = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Error> & {
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
type TRecognizerWebSocketMessageReceived = TRecognizerWebSocketMessageAuthenticated | TRecognizerWebSocketMessageHMACChallenge | TInteractiveInkSessionDescriptionMessage | TRecognizerWebSocketMessageNewPart | TRecognizerWebSocketMessagePartChange | TRecognizerWebSocketMessageContentChange | TRecognizerWebSocketMessageExport | TRecognizerWebSocketMessageGesture | TRecognizerWebSocketMessageContextlessGesture | TRecognizerWebSocketMessagePong | TRecognizerWebSocketMessageIdle | TRecognizerWebSocketMessageMathSolverResult | TRecognizerWebSocketMessageError;

/**
 * @group Recognizer
 */
type TRecognitionWebSocketConfiguration = {
    lang: string;
    export: TExportConfiguration;
    "raw-content": {
        text?: TTextConfConfiguration;
        "session-time"?: number;
        recognition?: {
            types: ("text" | "shape" | "math")[];
        };
        classification?: {
            types: ("text" | "shape" | "math")[];
        };
        gestures?: ("underline" | "scratch-out" | "join" | "insert" | "strike-through" | "surround")[];
    };
    gesture: {
        enable: boolean;
        ignoreGestureStrokes: boolean;
    };
    math?: {
        solver?: {
            "auto-variable-management"?: {
                enable?: boolean;
                "scoping-policy"?: "closest" | "last-modified" | "last-edited";
            };
        };
    };
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRecognitionWebSocketConfiguration: TRecognitionWebSocketConfiguration;
/**
 * @group Recognizer
 */
type TRecognizerWebSocketConfiguration = {
    server: TServerWebsocketConfiguration;
    recognition: TRecognitionWebSocketConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRecognizerWebSocketConfiguration: TRecognizerWebSocketConfiguration;
/**
 * @group Recognizer
 */
declare class RecognizerWebSocketConfiguration implements TRecognizerWebSocketConfiguration {
    server: TServerWebsocketConfiguration;
    recognition: TRecognitionWebSocketConfiguration;
    constructor(configuration?: PartialDeep<TRecognizerWebSocketConfiguration>);
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
declare class RecognizerWebSocket {
    #private;
    protected socket: WebSocket;
    protected pingWorker?: Worker;
    protected pingCount: number;
    protected reconnectionCount: number;
    protected sessionId?: string;
    protected currentPartId?: string;
    protected currentErrorCode?: string | number;
    protected addStrokeDeferred?: DeferredPromise<TRecognizerWebSocketMessageGesture | undefined>;
    protected contextlessGestureDeferred: Map<string, DeferredPromise<TRecognizerWebSocketMessageContextlessGesture>>;
    protected transformStrokeDeferred?: DeferredPromise<void>;
    protected eraseStrokeDeferred?: DeferredPromise<void>;
    protected replaceStrokeDeferred?: DeferredPromise<void>;
    protected exportDeferredMap: Map<string, DeferredPromise<TExport>>;
    protected closeDeferred?: DeferredPromise<void>;
    protected waitForIdleDeferred?: DeferredPromise<void>;
    protected undoDeferred?: DeferredPromise<void>;
    protected redoDeferred?: DeferredPromise<void>;
    protected clearDeferred?: DeferredPromise<void>;
    protected availableActionsDeferred: Map<string, DeferredPromise<string[]>>;
    protected numericalComputationDeferred: Map<string, DeferredPromise<string>>;
    protected getDiagnosticDeferred: Map<string, DeferredPromise<string>>;
    protected getVariablesDeferred: Map<string, DeferredPromise<TMathVariable[]>>;
    protected setVariableValueDeferred: Map<string, DeferredPromise<void>>;
    protected getVariableValueDeferred: Map<string, DeferredPromise<number>>;
    protected getEvaluablesDeferred: Map<string, DeferredPromise<TMathEvaluable[]>>;
    protected evaluateDeferred: Map<string, DeferredPromise<number[][]>>;
    configuration: RecognizerWebSocketConfiguration;
    initialized: DeferredPromise<void>;
    url: string;
    event: RecognizerEvent;
    constructor(config: PartialDeep<TRecognizerWebSocketConfiguration>, event?: RecognizerEvent);
    get mimeTypes(): string[];
    protected rejectDeferredPending(error: Error | string): void;
    protected resetAllDeferred(): void;
    protected clearSocketListener(): void;
    protected closeCallback(evt: CloseEvent): void;
    protected openCallback(): void;
    protected manageHMACChallenge(hmacChallengeMessage: TRecognizerWebSocketMessageHMACChallenge): Promise<void>;
    protected initPing(): void;
    protected manageAuthenticated(): void;
    protected manageSessionDescriptionMessage(sessionDescriptionMessage: TInteractiveInkSessionDescriptionMessage): void;
    protected manageNewPartMessage(newPartMessage: TRecognizerWebSocketMessageNewPart): void;
    protected managePartChangeMessage(partChangeMessage: TRecognizerWebSocketMessagePartChange): void;
    protected manageContentChangedMessage(contentChangeMessage: TRecognizerWebSocketMessageContentChange): void;
    protected manageExportMessage(exportMessage: TRecognizerWebSocketMessageExport): void;
    protected manageWaitForIdle(): void;
    protected manageErrorMessage(errorMessage: TRecognizerWebSocketMessageError): void;
    protected manageGestureDetected(gestureMessage: TRecognizerWebSocketMessageGesture): void;
    protected manageContextlessGesture(gestureMessage: TRecognizerWebSocketMessageContextlessGesture): void;
    protected manageMathSolverResult(mathSolverMessage: TRecognizerWebSocketMessageMathSolverResult): void;
    protected messageCallback(message: MessageEvent<string>): void;
    newSession(config: PartialDeep<TRecognizerWebSocketConfiguration>): Promise<void>;
    init(): Promise<void>;
    send(message: TRecognizerWebSocketMessage): Promise<void>;
    protected buildAddStrokesMessage(strokes: IIStroke[], processGestures?: boolean): TRecognizerWebSocketMessage;
    addStrokes(strokes: IIStroke[], processGestures?: boolean): Promise<TRecognizerWebSocketMessageGesture | undefined>;
    getAvailableActions(blockId: string): Promise<string[]>;
    getNumericalComputation(blockId: string): Promise<TJIIXMathElement>;
    getDiagnostic(blockId: string, task: string): Promise<string>;
    getVariables(blockId: string): Promise<TMathVariable[]>;
    getVariableValue(blockId: string, variableName: string): Promise<number>;
    setVariableValue(blockId: string, variableName: string, variableValue: number): Promise<void>;
    getEvaluables(blockId: string): Promise<TMathEvaluable[]>;
    evaluate(blockId: string, evaluation: {
        inputVariableName: string;
        outputVariableName: string;
        from: number;
        to: number;
        pointCount: number;
    }): Promise<{
        [key: string]: number;
    }[][]>;
    protected buildReplaceStrokesMessage(oldStrokeIds: string[], newStrokes: IIStroke[]): TRecognizerWebSocketMessage;
    replaceStrokes(oldStrokeIds: string[], newStrokes: IIStroke[]): Promise<void>;
    protected buildTransformTranslateMessage(strokeIds: string[], tx: number, ty: number): TRecognizerWebSocketMessage;
    transformTranslate(strokeIds: string[], tx: number, ty: number): Promise<void>;
    protected buildTransformRotateMessage(strokeIds: string[], angle: number, x0?: number, y0?: number): TRecognizerWebSocketMessage;
    transformRotate(strokeIds: string[], angle: number, x0?: number, y0?: number): Promise<void>;
    protected buildTransformScaleMessage(strokeIds: string[], scaleX: number, scaleY: number, x0?: number, y0?: number): TRecognizerWebSocketMessage;
    transformScale(strokeIds: string[], scaleX: number, scaleY: number, x0?: number, y0?: number): Promise<void>;
    protected buildTransformMatrixMessage(strokeIds: string[], matrix: TMatrixTransform): TRecognizerWebSocketMessage;
    transformMatrix(strokeIds: string[], matrix: TMatrixTransform): Promise<void>;
    protected buildEraseStrokesMessage(strokeIds: string[]): TRecognizerWebSocketMessage;
    eraseStrokes(strokeIds: string[]): Promise<void>;
    recognizeGesture(stroke: IIStroke): Promise<TRecognizerWebSocketMessageContextlessGesture | undefined>;
    waitForIdle(): Promise<void>;
    protected buildUndoRedoChanges(changes: TIIHistoryBackendChanges): TRecognizerWebSocketMessage[];
    undo(actions: TIIHistoryBackendChanges): Promise<void>;
    redo(actions: TIIHistoryBackendChanges): Promise<void>;
    export(requestedMimeTypes?: string[]): Promise<TExport>;
    clear(): Promise<void>;
    close(code: number, reason: string): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRRecognitionConfiguration = {
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
declare const DefaultRecognizerWebSocketSSRRecognitionConfiguration: TRecognizerWebSocketSSRRecognitionConfiguration;
/**
 * @group Recognizer
 */
type TRecognizerWebSocketSSRConfiguration = {
    server: TServerWebsocketConfiguration;
    recognition: TRecognizerWebSocketSSRRecognitionConfiguration;
};
/**
 * @group Recognizer
 * @source
 */
declare const DefaultRecognizerWebSocketSSRConfiguration: TRecognizerWebSocketSSRConfiguration;
/**
 * @group Recognizer
 */
declare class RecognizerWebSocketSSRConfiguration implements TRecognizerWebSocketSSRConfiguration {
    recognition: TRecognizerWebSocketSSRRecognitionConfiguration;
    server: TServerWebsocketConfiguration;
    constructor(configuration?: PartialDeep<TRecognizerWebSocketSSRConfiguration>);
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
declare class RecognizerWebSocketSSR {
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
    configuration: TRecognizerWebSocketSSRConfiguration;
    initialized: DeferredPromise<void>;
    url: string;
    event: RecognizerEvent;
    constructor(config?: PartialDeep<TRecognizerWebSocketSSRConfiguration>);
    get mimeTypes(): string[];
    protected infinitePing(): void;
    protected openCallback(): void;
    protected rejectDeferredPending(error: Error): void;
    protected closeCallback(evt: CloseEvent): void;
    protected manageAckMessage(websocketMessage: TRecognizerWebSocketSSRMessage): Promise<void>;
    protected manageContentPackageDescriptionMessage(): Promise<void>;
    protected managePartChangeMessage(websocketMessage: TRecognizerWebSocketSSRMessage): void;
    protected manageExportMessage(websocketMessage: TRecognizerWebSocketSSRMessage): void;
    protected manageWaitForIdle(): Promise<void>;
    protected manageErrorMessage(websocketMessage: TRecognizerWebSocketSSRMessage): void;
    protected manageContentChangeMessage(websocketMessage: TRecognizerWebSocketSSRMessage): void;
    protected manageSVGPatchMessage(websocketMessage: TRecognizerWebSocketSSRMessage): void;
    protected messageCallback(message: MessageEvent<string>): void;
    init(height: number, width: number): Promise<void>;
    send(message: TRecognizerWebSocketSSRMessage): Promise<void>;
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
 * @group Exports
 * @remarks List all supported MIME types for export in RecognizersV2. Please note, the MIME types supported depend on the recognition type configured
 */
declare enum ExportV2Type {
    JIIX = "application/vnd.myscript.jiix",
    TEXT = "text/plain",
    LATEX = "application/x-latex"
}
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix  Element type}
 */
/**
 * @group Exports
*/
type JIIXV2RangeItem = {
    from: {
        stroke: number;
    };
    to: {
        stroke: number;
    };
};
/**
 * @group Exports
 * @remarks Only in InkRecognizer () activated with recognition.export.JIIXV2.range = true
 */
type JIIXV2Range = JIIXV2RangeItem[];
/**
 * @group Exports
 */
type JIIXV2Base = TJIIXBase & {
    range?: JIIXV2Range;
};
/**
 * @group Exports
 */
type JIIXV2ElementBase<T = TRecognitionV2Type> = JIIXV2Base & {
    id: string;
    type: T;
};
/**
 * @group Exports
 */
type JIIXV2LineSpan = {
    type: string;
    range: JIIXV2RangeItem[];
    label: string;
};
/**
 * @group Exports
 */
type JIIXV2Line = {
    type: string;
    range: JIIXV2RangeItem[];
    label: string;
    spans: JIIXV2LineSpan[];
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#word-object | Word object}
 */
type JIIXV2Expression = JIIXV2Base & TJIIXWord & {
    lines: JIIXV2Line[];
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix#text-interpretation | Text Element }
 */
type JIIXV2TextElement = JIIXV2ElementBase<"Text"> & JIIXV2Expression;
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix#text-interpretation | Math Element }
 */
type JIIXV2MathElement = JIIXV2ElementBase<"Math"> & JIIXV2Expression;
/** @group Exports
 */
type JIIXV2DrawingElement = JIIXV2ElementBase<"Drawing"> & JIIXV2Expression;
/**
 * @group Exports
 */
declare enum JIIXV2ShapeKind {
    Circle = "circle",
    Ellipse = "ellipse",
    Rectangle = "rectangle",
    Triangle = "triangle",
    IsoscelesTriangle = "isosceles triangle",
    RightTriangle = "right triangle",
    RightIsoscelesTriangle = "right isosceles triangle",
    EquilateralTriangle = "equilateral triangle",
    Quadrilateral = "quadrilateral",
    Trapezoid = "trapezoid",
    Square = "square",
    Parallelogram = "parallelogram",
    Polygon = "polygon",
    Rhombus = "rhombus",
    Line = "line",
    ArcOfEllipse = "arc of ellipse",
    ArcOfCircle = "arc of circle",
    PolyLine = "polyline",
    Arrow = "arrow",
    CurvedDoubleArrow = "curved double arrow",
    CurvedArrow = "curved arrow",
    PolylineArrow = "polyline arrow",
    PolylineDoubleArrow = "polyline double arrow",
    DoubleArrow = "double arrow"
}
/**
   * @group Exports
   */
type JIIXV2PolygonType = "triangle" | "isosceles triangle" | "right triangle" | "right isosceles triangle" | "equilateral triangle" | "quadrilateral" | "trapezoid" | "parallelogram" | "rhombus" | "rectangle" | "square";
/**
   * @group Exports
   */
type JIIXV2ShapeItemBase<K = JIIXV2ShapeKind> = JIIXV2ElementBase<K> & {
    kind: K;
};
/**
 * @group Exports
 */
type JIIXV2EllipseBase<K = JIIXV2ShapeKind.Ellipse | JIIXV2ShapeKind.Circle> = JIIXV2ShapeItemBase<JIIXV2ShapeKind.Ellipse | JIIXV2ShapeKind.Circle> & {
    kind: K;
    id: string;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    orientation: number;
    type: string;
};
/**
 * @group Exports
 */
type JIIXV2Circle = JIIXV2EllipseBase<JIIXV2ShapeKind.Circle>;
/**
 * @group Exports
 */
type JIIXV2Ellipse = JIIXV2EllipseBase<JIIXV2ShapeKind.Ellipse>;
/**
 * @group Exports
 */
type JIIXV2PrimitiveArc = {
    type: "arc";
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    phi: number;
    startAngle: number;
    sweepAngle: number;
    startDecoration?: string;
    endDecoration?: string;
};
/**
 * @group Exports
 */
type JIIXV2PrimitiveLine = {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    startDecoration?: string;
    endDecoration?: string;
};
/**
 * @group Exports
 */
type JIIXV2PolygonBase<K = JIIXV2PolygonType> = JIIXV2ShapeItemBase<K> & {
    kind: K;
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapePolygon = JIIXV2PolygonBase<JIIXV2ShapeKind.Polygon>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.Triangle>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonIsoscelesTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.IsoscelesTriangle>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonRightTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.RightTriangle>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonRightIsoscelesTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.RightIsoscelesTriangle>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonEquilateralTriangle = JIIXV2PolygonBase<JIIXV2ShapeKind.EquilateralTriangle>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonQuadrilateral = JIIXV2PolygonBase<JIIXV2ShapeKind.Quadrilateral>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonTrapezoid = JIIXV2PolygonBase<JIIXV2ShapeKind.Trapezoid>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonParallelogram = JIIXV2PolygonBase<JIIXV2ShapeKind.Parallelogram>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonRhombus = JIIXV2PolygonBase<JIIXV2ShapeKind.Rhombus>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonRectangle = JIIXV2PolygonBase<JIIXV2ShapeKind.Rectangle>;
/**
 * @group Exports
 */
type JIIXV2ShapePolygonSquare = JIIXV2PolygonBase<JIIXV2ShapeKind.Square>;
/**
 * @group Exports
 */
type JIIXV2ShapeLine = JIIXV2ShapeItemBase<JIIXV2ShapeKind.Line> & {
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeLineArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.Arrow> & {
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeLineDoubleArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.DoubleArrow> & {
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeLinePolyline = JIIXV2ShapeItemBase<JIIXV2ShapeKind.PolyLine> & {
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeLinePolylineArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.PolylineArrow> & {
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeLinePolylineDoubleArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.PolylineDoubleArrow> & {
    primitives: JIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeCurvedDoubleArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.CurvedDoubleArrow> & {
    primitives: JIIXV2PrimitiveArc[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeCurvedArrow = JIIXV2ShapeItemBase<JIIXV2ShapeKind.CurvedArrow> & {
    primitives: JIIXV2PrimitiveArc[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeArcOfEllipse = JIIXV2ShapeItemBase<JIIXV2ShapeKind.ArcOfEllipse> & {
    primitives: JIIXV2PrimitiveArc[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeArcOfCircle = JIIXV2ShapeItemBase<JIIXV2ShapeKind.ArcOfCircle> & {
    primitives: JIIXV2PrimitiveArc[];
};
/**
 * @group Exports
 */
type JIIXV2ShapeElement = JIIXV2Circle | JIIXV2Ellipse | JIIXV2ShapePolygon | JIIXV2ShapePolygonTriangle | JIIXV2ShapePolygonIsoscelesTriangle | JIIXV2ShapePolygonRightTriangle | JIIXV2ShapePolygonRightIsoscelesTriangle | JIIXV2ShapePolygonEquilateralTriangle | JIIXV2ShapePolygonQuadrilateral | JIIXV2ShapePolygonTrapezoid | JIIXV2ShapePolygonParallelogram | JIIXV2ShapePolygonRhombus | JIIXV2ShapePolygonRectangle | JIIXV2ShapePolygonSquare | JIIXV2ShapeLineArrow | JIIXV2ShapeLineDoubleArrow | JIIXV2ShapeLinePolyline | JIIXV2ShapeLinePolylineArrow | JIIXV2ShapeLinePolylineDoubleArrow | JIIXV2ShapeCurvedDoubleArrow | JIIXV2ShapeCurvedArrow | JIIXV2ShapeArcOfEllipse | JIIXV2ShapeArcOfCircle | JIIXV2ShapeLine;
/**
 * @group Exports
 * @remarks Only in InkRecognizer () activated with recognition.export.JIIXV2.range = true
 */
type JIIXV2RawContentBase<T = TRecognitionV2Type> = {
    type: T;
    range?: JIIXV2Range;
};
/**
 * @group Exports
 */
type JIIXV2RawContentItemText = JIIXV2RawContentBase<"Text"> & JIIXV2Expression;
/**
 * @group Exports
 */
type JIIXV2RawContentTextLine = {
    type: "Line";
    label: string;
    range?: JIIXV2RangeItem;
};
/**
 * @group Exports
 */
type JIIXV2RawContentShape = JIIXV2RawContentBase<"Shape"> & {
    label: string;
    shape: JIIXV2RawContentItemShape[];
};
/**
 * @group Exports
 */
type JIIXV2RawContentItemShape = JIIXV2RawContentBase<"Shape"> & {
    range: JIIXV2RangeItem[];
    elements: JIIXV2ShapeElement[];
};
/**
 * @group Exports
 */
type JIIXV2RawContentElement = JIIXV2RawContentItemText | JIIXV2RawContentItemShape;
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/web/JIIXV2 | Exports}
 */
type JIIXV2Element = JIIXV2TextElement | JIIXV2ShapeElement | JIIXV2MathElement | JIIXV2DrawingElement | JIIXV2RawContentElement;
/**
 * @group Exports
 */
type JIIXV2Export = JIIXV2Base & {
    type: string;
    id: string;
    version: string;
    elements?: JIIXV2Element[];
    label?: string;
    words?: JIIXV2Expression[];
};
/**
 * @group Exports
 * @remarks
 * List all supported MIME types for export.
 *
 * Attention the MIME types supported depend on the {@link TRecognitionType | type of recognition}
 *
 * {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/JIIXV2 | Documentation}
 */
type TExportV2 = {
    /** @hidden */
    [key: string]: unknown;
    /**
     * @remarks vnd.myscript.jiix is used for text and raw-content exports
     */
    "application/vnd.myscript.jiix"?: JIIXV2Export;
    /**
     * @remarks text/plain is only use for text export
     */
    "text/plain"?: string;
    /**
     * @remarks x-latex is only use for math export
     * @see {@link https://katex.org/docs/browser.html | katex} to render
     */
    "application/x-latex"?: string;
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
declare class IIModel {
    #private;
    readonly creationTime: number;
    modificationDate: number;
    currentSymbol?: TIISymbol;
    symbols: TIISymbol[];
    exports?: TExport;
    converts?: TExport;
    width: number;
    height: number;
    rowHeight: number;
    idle: boolean;
    constructor(width?: number, height?: number, rowHeight?: number, creationDate?: number);
    get symbolsSelected(): TIISymbol[];
    get symbolsToDelete(): TIISymbol[];
    selectSymbol(id: string): void;
    unselectSymbol(id: string): void;
    resetSelection(): void;
    getRootSymbol(id: string): TIISymbol | undefined;
    getSymbolRowIndex(symbol: TIISymbol): number;
    getSymbolsByRowOrdered(): {
        rowIndex: number;
        symbols: TIISymbol[];
    }[];
    roundToLineGuide(y: number): number;
    isSymbolAbove(source: TIISymbol, target: TIISymbol): boolean;
    isSymbolInRow(source: TIISymbol, target: TIISymbol): boolean;
    isSymbolBelow(source: TIISymbol, target: TIISymbol): boolean;
    getFirstSymbol(symbols: TIISymbol[]): TIISymbol | undefined;
    getLastSymbol(symbols: TIISymbol[]): TIISymbol | undefined;
    addSymbol(symbol: TIISymbol): void;
    updateSymbol(updatedSymbol: TIISymbol): void;
    replaceSymbol(id: string, symbols: TIISymbol[]): void;
    changeOrderSymbol(id: string, position: "first" | "last" | "forward" | "backward"): void;
    removeSymbol(id: string): void;
    extractDifferenceSymbols(model: IIModel): {
        added: TIISymbol[];
        removed: TIISymbol[];
    };
    mergeExport(exports: TExport): void;
    clone(): IIModel;
    clear(): void;
}

/**
 * @group Model
 */
declare class IModel {
    #private;
    readonly creationTime: number;
    modificationDate: number;
    currentStroke?: IIStroke;
    strokes: IIStroke[];
    exports?: TExportV2;
    converts?: TExportV2;
    width: number;
    height: number;
    rowHeight: number;
    idle: boolean;
    constructor(width?: number, height?: number, rowHeight?: number, creationDate?: number);
    get strokesToDelete(): IIStroke[];
    addStroke(stroke: IIStroke): void;
    updateStroke(updatedStroke: IIStroke): void;
    removeStroke(id: string): void;
    extractDifferenceStrokes(model: IModel): {
        added: IIStroke[];
        removed: IIStroke[];
    };
    mergeExport(exports: TExportV2): void;
    clone(): IModel;
    clear(): void;
}

/**
 * @group Symbol
 * @remarks Represents a recognized mathematical expression block
 */
declare class IIRecognizedMath extends IIRecognizedBase<RecognizedKind.Math> {
    readonly isClosed = false;
    /** Label of the math expression (e.g., "3x+2") */
    label?: string;
    /** Parent element JIIX ID if this math is embedded in text */
    parent?: string;
    /** Parsed JIIX expressions tree */
    expressions?: TJIIXMathExpression[];
    /** Stored variable values set by user */
    variableValues?: {
        [name: string]: number;
    };
    /** IDs of solver output strokes added by numerical computation */
    solverOutputStrokeIds?: string[];
    /** Computed numerical result from solver */
    computedResult?: number;
    /** Map of variable sources: variableName -> source blockId */
    variableSources?: {
        [variableName: string]: string;
    };
    /** List of blockIds that depend on this block's variables */
    dependentBlocks?: string[];
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedMath;
    toJSON(): PartialDeep<IIRecognizedMath>;
    static create(partial: PartialDeep<IIRecognizedMath>): IIRecognizedMath;
}

/**
 * @group Symbol
 */
declare class IIRecognizedPolyLine extends IIRecognizedBase<RecognizedKind.PolyEdge> {
    readonly isClosed = false;
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedPolyLine;
    toJSON(): PartialDeep<IIRecognizedPolyLine>;
    static create(partial: PartialDeep<IIRecognizedPolyLine>): IIRecognizedPolyLine;
}

/**
 * @group Symbol
 */
declare class IIRecognizedPolygon extends IIRecognizedBase<RecognizedKind.Polygone> {
    readonly isClosed = true;
    constructor(strokes: IIStroke[], style?: PartialDeep<TStyle>);
    clone(): IIRecognizedPolygon;
    toJSON(): PartialDeep<IIRecognizedPolygon>;
    static create(partial: PartialDeep<IIRecognizedPolygon>): IIRecognizedPolygon;
}

/**
 * @group Symbol
 */
type TIIRecognizedWord = {
    label: string;
    firstChar?: number;
    lastChar?: number;
    bounds?: Box;
    decorators?: IIDecorator[];
};
/**
 * @group Symbol
 */
type TIIRecognizedChar = {
    label: string;
    word: number;
    bounds?: Box;
    decorators?: IIDecorator[];
};
/**
 * @group Symbol
 */
declare class IIRecognizedText extends IIRecognizedBase<RecognizedKind.Text> {
    readonly isClosed = false;
    decorators: IIDecorator[];
    baseline: number;
    xHeight: number;
    label?: string;
    /** IDs of child elements (e.g., Math elements embedded in text) */
    children?: string[];
    /** Positions where children are inserted in the text */
    childrenPos?: number[];
    /** Words in the text with their decorators */
    words?: TIIRecognizedWord[];
    /** Characters in the text with their decorators */
    chars?: TIIRecognizedChar[];
    constructor(strokes: IIStroke[], lines: {
        baseline: number;
        xHeight: number;
    }, style?: PartialDeep<TStyle>);
    clone(): IIRecognizedText;
    toJSON(): PartialDeep<IIRecognizedText>;
    static create(partial: PartialDeep<IIRecognizedText>): IIRecognizedText;
}

/**
 * @group Symbol
 */
type TIISymbolChar = {
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
declare class IIText extends IISymbolBase<SymbolType.Text> {
    readonly isClosed = true;
    point: TPoint;
    chars: TIISymbolChar[];
    decorators: IIDecorator[];
    bounds: Box;
    rotation?: {
        degree: number;
        center: TPoint;
    };
    constructor(chars: TIISymbolChar[], point: TPoint, bounds: TBox, style?: PartialDeep<TStyle>);
    get label(): string;
    get vertices(): TPoint[];
    get snapPoints(): TPoint[];
    protected getCharCorners(char: TIISymbolChar): TPoint[];
    updateChildrenStyle(): void;
    updateChildrenFont({ fontSize, fontWeight }: {
        fontSize?: number;
        fontWeight?: "normal" | "bold";
    }): void;
    getCharsOverlaps(points: TPoint[]): TIISymbolChar[];
    overlaps(box: TBox): boolean;
    clone(): IIText;
    toJSON(): PartialDeep<IIText>;
    static create(partial: PartialDeep<IIText>): IIText;
}

/**
 * @group Symbol
 * @remarks Individual math element (number, operator, variable, etc.)
 */
type TIIMathElement = {
    id: string;
    label: string;
    fontSize: number;
    fontWeight: "normal" | "bold";
    fontFamily: string;
    color: string;
    bounds: TBox;
    position?: "superscript" | "subscript" | "normal";
};
/**
 * @group Symbol
 * @remarks Represents a converted mathematical expression with native rendering
 */
declare class IIMath extends IISymbolBase<SymbolType.Math> {
    readonly isClosed = true;
    point: TPoint;
    elements: TIIMathElement[];
    decorators: IIDecorator[];
    bounds: Box;
    rotation?: {
        degree: number;
        center: TPoint;
    };
    constructor(elements: TIIMathElement[], point: TPoint, bounds: TBox, style?: PartialDeep<TStyle>);
    get label(): string;
    get vertices(): TPoint[];
    get snapPoints(): TPoint[];
    protected getElementCorners(element: TIIMathElement): TPoint[];
    updateChildrenStyle(): void;
    updateChildrenFont({ fontSize, fontWeight, fontFamily }: {
        fontSize?: number;
        fontWeight?: "normal" | "bold";
        fontFamily?: string;
    }): void;
    getElementsOverlaps(points: TPoint[]): TIIMathElement[];
    overlaps(box: TBox): boolean;
    clone(): IIMath;
    toJSON(): PartialDeep<IIMath>;
    static create(partial: PartialDeep<IIMath>): IIMath;
}

/**
 * @group Symbol
 */
type TIIEdge = IIEdgeArc | IIEdgeLine | IIEdgePolyLine;
/**
 * @group Symbol
 */
type TIIShape = IIShapeCircle | IIShapeEllipse | IIShapePolygon;
/**
 * @group Symbol
 */
type TIIRecognized = IIRecognizedText | IIRecognizedMath | IIRecognizedArc | IIRecognizedCircle | IIRecognizedEllipse | IIRecognizedLine | IIRecognizedPolyLine | IIRecognizedPolygon;
/**
 * @group Symbol
 */
type TIISymbol = TIIEdge | TIIShape | IIStroke | IIText | IIMath | TIIRecognized;

/**
 * @group Symbol
 */
declare class IIEraser extends IISymbolBase<SymbolType.Eraser> {
    readonly isClosed = false;
    pointers: TPointer[];
    constructor();
    get bounds(): Box;
    get vertices(): TPoint[];
    get snapPoints(): TPoint[];
    clone(): IISymbolBase;
    overlaps(box: TBox): boolean;
    toJSON(): PartialDeep<IIEraser>;
}

/**
 * @group Symbol
 * @summary Symbol utility functions and type guards
 *
 * Common helper functions for symbol type checking, classification,
 * and filtering used throughout the application.
 */
/**
 * Check if symbol is a stroke
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke
 */
declare function isStroke(symbol: TSymbol): symbol is IIStroke;
/**
 * Check if symbol is text
 * @param symbol - Symbol to check
 * @returns True if symbol is text
 */
declare function isText(symbol: TSymbol): symbol is IIText;
/**
 * Check if symbol is a shape (circle, ellipse, polygon)
 * @param symbol - Symbol to check
 * @returns True if symbol is a shape
 */
declare function isShape(symbol: TSymbol): boolean;
/**
 * Check if symbol is a recognized result (text, arc, circle, etc.)
 * @param symbol - Symbol to check
 * @returns True if symbol is recognized
 */
declare function isRecognized(symbol: TSymbol): boolean;
/**
 * Type guard to check if a symbol is a recognized math symbol
 * @param symbol - The symbol to check
 * @returns True if the symbol is a recognized math symbol
 */
declare function isRecognizedMathSymbol(symbol: TIISymbol): symbol is IIRecognizedMath;
/**
 * Type guard to check if a symbol is a recognized text symbol
 * @param symbol - The symbol to check
 * @returns True if the symbol is a recognized text symbol
 */
declare function isRecognizedTextSymbol(symbol: TIISymbol): symbol is IIRecognizedText;
/**
 * Filter math symbols from an array
 * @param symbols - Array of symbols to filter
 * @returns Array of recognized math symbols
 */
declare function filterMathSymbols(symbols: TIISymbol[]): IIRecognizedMath[];

/**
 * @group Utils
 */
declare function computeDistance(p1: TPoint, p2: TPoint): number;
/**
 * @group Utils
 * @remarks Faster than computeDistance when comparing distances (avoids sqrt)
 */
declare function computeDistanceSquared(p1: TPoint, p2: TPoint): number;
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
type Mergeable = Record<string, unknown> | unknown[] | unknown;
declare const mergeDeep: (target: any, ...sources: Mergeable[]) => any;
/**
 * @group Utils
 */
declare const isDeepEqual: (object1: unknown, object2: unknown) => boolean;

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
 * @remarks "INKV1" is deprecated use "INKV2" instead.
 */
type EditorType = "INTERACTIVEINK" | "INKV1" | "INTERACTIVEINKSSR" | "INKV2";
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
 */
type TInkEditorDeprecatedConfiguration = TEditorConfiguration & TRecognizerHTTPV1Configuration & {
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
declare const DefaultInkEditorDeprecatedConfiguration: TInkEditorDeprecatedConfiguration;
/**
 * @group Editor
 */
declare class InkEditorDeprecatedConfiguration implements TInkEditorDeprecatedConfiguration {
    server: TServerHTTPConfiguration;
    recognition: TRecognitionHTTPV1Configuration;
    rendering: TRendererConfiguration;
    "undo-redo": THistoryConfiguration;
    grabber: TGrabberConfiguration;
    triggers: TEditorTriggerConfiguration;
    logger: TLoggerConfiguration;
    penStyle: TPenStyle;
    penStyleClasses?: string;
    theme: TTheme;
    constructor(configuration?: PartialDeep<TInkEditorDeprecatedConfiguration>);
}

/**
 * @group Editor
 */
type TInkEditorDeprecatedOptions = PartialDeep<EditorOptionsBase & {
    configuration: TInkEditorDeprecatedConfiguration;
}> & {
    override?: {
        grabber?: PointerEventGrabber;
        recognizer?: RecognizerHTTPV1;
    };
};
/**
 * @group Editor
 * @deprecated Use {@link InkEditor} instead.
 */
declare class InkEditorDeprecated extends AbstractEditor {
    #private;
    grabber: PointerEventGrabber;
    renderer: CanvasRenderer;
    recognizer: RecognizerHTTPV1;
    history: HistoryManager;
    styleManager: StyleManager;
    constructor(rootElement: HTMLElement, options?: TInkEditorDeprecatedOptions);
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
    get configuration(): InkEditorDeprecatedConfiguration;
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
 * @group InteractiveInkSSRSmartGuide
 */
declare class InteractiveInkSSRSmartGuide {
    #private;
    uuid: string;
    editor: InteractiveInkSSREditor;
    margin: TMarginConfiguration;
    jiix?: TJIIXExport;
    lastWord?: TJIIXWord;
    wordToChange?: TJIIXWord;
    constructor(editor: InteractiveInkSSREditor);
    init(domElement: HTMLElement, margin: TMarginConfiguration): void;
    resize(): void;
    update(exports: TJIIXExport): void;
    clear(): void;
    destroy(): void;
}

/**
 * @group Editor
 */
type TInteractiveInkSSREditorConfiguration = TEditorConfiguration & TRecognizerWebSocketSSRConfiguration & {
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
declare const DefaultInteractiveInkSSREditorConfiguration: TInteractiveInkSSREditorConfiguration;
/**
 * @group Editor
 */
declare class InteractiveInkSSREditorConfiguration implements TInteractiveInkSSREditorConfiguration {
    server: TServerWebsocketConfiguration;
    recognition: TRecognizerWebSocketSSRRecognitionConfiguration;
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
    constructor(configuration?: PartialDeep<TInteractiveInkSSREditorConfiguration>);
}

/**
 * @group Editor
 */
type TInteractiveInkSSREditorOptions = PartialDeep<EditorOptionsBase & {
    configuration: InteractiveInkSSREditorConfiguration;
}> & {
    override?: {
        grabber?: PointerEventGrabber;
        recognizer?: RecognizerWebSocketSSR;
    };
};
/**
 * @group Editor
 */
declare class InteractiveInkSSREditor extends AbstractEditor {
    #private;
    smartGuide?: InteractiveInkSSRSmartGuide;
    grabber: PointerEventGrabber;
    renderer: InteractiveInkSSRSVGRenderer;
    recognizer: RecognizerWebSocketSSR;
    history: HistoryManager;
    styleManager: StyleManager;
    constructor(rootElement: HTMLElement, options?: TInteractiveInkSSREditorOptions);
    get initializationPromise(): Promise<void>;
    get tool(): EditorTool;
    set tool(i: EditorTool);
    protected setCursorStyle(): void;
    get model(): Model;
    get configuration(): InteractiveInkSSREditorConfiguration;
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
    protected onSVGPatch(evt: TRecognizerWebSocketSSRMessageSVGPatch): void;
    protected initializeSmartGuide(): void;
    protected onContentChanged(undoRedoContext: THistoryContext): void;
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
 * @hidden
 */
type EditorVariantMap = {
    "INTERACTIVEINK": InteractiveInkEditor;
    "INKV1": InkEditorDeprecated;
    "INTERACTIVEINKSSR": InteractiveInkSSREditor;
    "INKV2": InkEditor;
};
/**
 * @group Editor
 * @hidden
 */
type EditorOptionsMap = {
    "INTERACTIVEINK": TInteractiveInkEditorOptions;
    "INKV1": TInkEditorDeprecatedOptions;
    "INTERACTIVEINKSSR": TInteractiveInkSSREditorOptions;
    "INKV2": TInkEditorOptions;
};
/**
 * @group Editor
 * @hidden
 */
declare class EditorFactory {
    private static logger;
    private static instances;
    /**
     * Creates and initializes an editor instance based on the specified type
     * Replaces any previously created instance
     *
     * @template T - The editor type to create
     * @param rootElement - The HTML element to mount the editor
     * @param type - The editor variant type
     * @param options - Configuration options specific to the editor type
     * @returns Promise resolving to the initialized editor instance
     */
    static createEditor<T extends EditorType>(rootElement: HTMLElement, type: T, options: EditorOptionsMap[T]): Promise<EditorVariantMap[T]>;
    /**
     * Retrieves the currently active editor instance
     *
     * @returns The current editor instance or undefined if none exists
     */
    static getInstance(): EditorVariantMap[EditorType] | undefined;
    /**
     * Retrieves a specific editor instance by type
     *
     * @param type - The editor type to retrieve
     * @returns The editor instance of the specified type or undefined
     */
    static getInstanceByType<T extends EditorType>(type: T): EditorVariantMap[T] | undefined;
    /**
     * Clears all stored editor instances
     */
    static clearInstances(): void;
}

/**
 * @group Editor
 * @summary Main Editor facade for loading editor instances
 *
 * This class provides a convenient interface for loading editor instances.
 * It delegates to EditorFactory for the actual implementation.
 *
 * @example
 * ```typescript
 * const editor = await Editor.load(
 *   document.getElementById("editor"),
 *   "INTERACTIVEINK",
 *   { configuration: {...} }
 * )
 * ```
 * @hideconstructor
 */
declare class Editor {
    /**
     * Loads and initializes an editor instance
     *
     * @template T - The editor type to load
     * @param rootElement - The HTML element to mount the editor
     * @param type - The editor variant type to load
     * @param options - Configuration options specific to the editor type
     * @returns Promise resolving to the initialized editor instance
     *
     * @remarks
     * This method will destroy any previously loaded editor instance before creating a new one.
     * Use {@link getInstance} to access the currently active editor.
     */
    static load<T extends EditorType>(rootElement: HTMLElement, type: T, options: EditorOptionsMap[T]): Promise<EditorVariantMap[T]>;
    /**
     * Gets the currently active editor instance
     *
     * @returns The current editor instance or undefined if none exists
     */
    static getInstance(): EditorVariantMap[EditorType] | undefined;
    /**
     * Gets a specific editor instance by type
     *
     * @template T - The editor type to retrieve
     * @param type - The editor type to retrieve
     * @returns The editor instance of the specified type or undefined
     */
    static getInstanceByType<T extends EditorType>(type: T): EditorVariantMap[T] | undefined;
}

export { AbstractEditor, AbstractWriterManager, BaseMenuItem, BaseRenderer, Box, ButtonListMenuItem, ButtonMenuItem, CanvasRenderer, CanvasRendererShape, CanvasRendererStroke, CanvasRendererText, Chart, CheckboxMenuItem, ClearMenuAction, CollapsibleWrapper, ColorListMenuItem, ConvertContextMenu, ConvertMenuAction, DEFAULT_FONT_SIZE_LIST, DEFAULT_FONT_WEIGHT_LIST, DEFAULT_MENU_COLORS, DEFAULT_THICKNESS_LIST, DebugMenuAction, DecoratorContextMenu, DecoratorKind, DefaulRecognitionHTTPV1ConfigurationConfiguration, DefaulTEditorTriggerConfiguration, DefaultConvertionConfiguration, DefaultDebugConfiguration, DefaultDiagramConfiguration, DefaultDiagramConvertConfiguration, DefaultEraserConfiguration, DefaultExportConfiguration, DefaultGestureConfiguration, DefaultGrabberConfiguration, DefaultGuidesConfiguration, DefaultHistoryConfiguration, DefaultIIRendererConfiguration, DefaultInkEditorConfiguration, DefaultInkEditorDeprecatedConfiguration, DefaultInteractiveInkEditorConfiguration, DefaultInteractiveInkSSREditorConfiguration, DefaultJiixConfiguration, DefaultListenerConfiguration, DefaultLoggerConfiguration, DefaultMarginConfiguration, DefaultMathConfiguration, DefaultMathUndoRedoConfiguration, DefaultMathV2Configuration, DefaultMenuConfiguration, DefaultPenStyle, DefaultRawContentConfiguration, DefaultRawContentV2Configuration, DefaultRecognitionRendererConfiguration, DefaultRecognitionWebSocketConfiguration, DefaultRecognizerHTTPV1Configuration, DefaultRecognizerHTTPV2Configuration, DefaultRecognizerHTTPV2RecognitionConfiguration, DefaultRecognizerWebSocketConfiguration, DefaultRecognizerWebSocketSSRConfiguration, DefaultRecognizerWebSocketSSRRecognitionConfiguration, DefaultRendererConfiguration, DefaultServerHTTPConfiguration, DefaultServerWebsocketConfiguration, DefaultShapeBeautificationConfiguration, DefaultShapeConfiguration, DefaultShapeConvertConfiguration, DefaultSnapConfiguration, DefaultSolverConfiguration, DefaultStyle, DefaultTexConfigurationV2, DefaultTextConfiguration, DefaultTextGuidesConfiguration, DefaultTextGuidesConfigurationV2, DefaultTheme, DeferredPromise, DuplicateContextMenu, EdgeDecoration, EdgeKind, EdgeTool, EditContextMenu, Editor, EditorEvent, EditorEventName, EditorFactory, EditorLayer, EditorTool, EditorWriteTool, EraseManager, EraseTool, ExportContextMenu, ExportMenuAction, ExportType, ExportV2Type, FileInputMenuItem, FillColorStyle, FontSizeStyle, FontWeightStyle, GestureMenuAction, GuideMenuAction, HistoryManager, IDebugSVGManager, IHistoryManager, IIConversionManager, IIDebugSVGManager, IIDecorator, IIEdgeArc, IIEdgeLine, IIEdgePolyLine, IIEraser, IIGestureManager, IIHistoryManager, IIMath, IIMenuAction, IIMenuContext, IIMenuManager, IIMenuStyle, IIMenuTool, IIModel, IIMoveManager, IIRecognizedArc, IIRecognizedBase, IIRecognizedCircle, IIRecognizedEllipse, IIRecognizedLine, IIRecognizedMath, IIRecognizedPolyLine, IIRecognizedPolygon, IIRecognizedText, IIResizeManager, IIRotationManager, IISelectionManager, IIShapeCircle, IIShapeEllipse, IIShapePolygon, IISnapManager, IIStroke, IISymbolBase, IISynchronizerManager, IIText, IITextManager, IITranslateManager, IIWriterManager, IModel, IWriterManager, ImportMenuAction, InkEditor, InkEditorConfiguration, InkEditorDeprecated, InkEditorDeprecatedConfiguration, InsertAction, InteractiveInkEditor, InteractiveInkEditorConfiguration, InteractiveInkSSREditor, InteractiveInkSSREditorConfiguration, InteractiveInkSSRSVGRenderer, InteractiveInkSSRSmartGuide, JIIXELementType, JIIXEdgeKind, JIIXMathExpressionType, JIIXNodeKind, JIIXV2ShapeKind, LanguageMenuAction, Logger, LoggerCategory, LoggerLevel, LoggerManager, MathContextMenu, MathInteractionManager, MathMenuAction, MathOverlayManager, MatrixTransform, Modal, Model, MoveTool, OIEdgeBase, OIShapeBase, OpacityStyle, PointerEventGrabber, RangeMenuItem, RecognizedKind, RecognizerError, RecognizerEvent, RecognizerEventName, RecognizerHTTPV1, RecognizerHTTPV1Configuration, RecognizerHTTPV2, RecognizerHTTPV2Configuration, RecognizerWebSocket, RecognizerWebSocketConfiguration, RecognizerWebSocketSSR, RecognizerWebSocketSSRConfiguration, RemoveContextMenu, ReorderContextMenu, ResizeDirection, SELECTION_MARGIN, SVGBuilder, SVGRenderer, SVGRendererConst, SVGRendererDecoratorUtil, SVGRendererEdgeUtil, SVGRendererEraserUtil, SVGRendererMathUtil, SVGRendererRecognizedUtil, SVGRendererShapeUtil, SVGRendererStrokeUtil, SVGRendererTextUtil, SVGStroker, SelectAllContextMenu, SelectMenuItem, SelectTool, ShapeKind, ShapeTool, SnapConfiguration, SnapMenuAction, StrikeThroughAction, Stroke, StrokeColorStyle, StyleHelper, StyleManager, SubMenuItem, SurroundAction, SvgElementRole, SymbolType, TRecognizerWebSocketMessageType, ThicknessStyle, TransientInkManager, UnderlineAction, UndoRedoMenuAction, VariableColorManager, WriteTool, ZoomMenuAction, calculateEllipseArcPoints, computeAngleAxeRadian, computeAngleRadian, computeAverage, computeDistance, computeDistanceBetweenPointAndSegment, computeDistanceSquared, computeHmac, computeLinksPointers, computeMiddlePointer, computeNearestPointOnSegment, computePointOnEllipse, computeRotatedPoint, convertBoundingBoxMillimeterToPixel, convertDegreeToRadian, convertMillimeterToPixel, convertPartialStrokesToOIStrokes, convertPartialStrokesToStrokes, convertPixelToMillimeter, convertRadianToDegree, createMenuItemInstance, createPointsOnSegment, createUUID, defaultMenuActionConfig, defaultMenuContextConfig, defaultMenuStyleConfig, defaultMenuToolConfig, filterMathSymbols, findIntersectBetweenSegmentAndCircle, findIntersectionBetween2Segment, getApiInfos, getAvailableFontList, getAvailableLanguageList, getClosestPoint, getClosestPoints, getInitialHistoryContext, isBetween, isDeepEqual, isPointInsideBox, isPointInsidePolygon, isRecognized, isRecognizedMathSymbol, isRecognizedTextSymbol, isShape, isStroke, isText, isValidNumber, isValidPoint, isVersionSuperiorOrEqual, mergeDeep, normalizeAngle, scalaire };
export type { ChartConfig, EditorLayerUI, EditorLayerUIInfoModal, EditorLayerUIMessage, EditorLayerUIState, EditorOptionsBase, EditorOptionsMap, EditorType, EditorVariantMap, IIMenuActionConfig, IIMenuContextConfig, IIMenuStyleConfig, IIMenuToolConfig, IMenuButton, IMenuButtonList, IMenuCheckbox, IMenuColorList, IMenuFileInput, IMenuItemBase, IMenuRange, IMenuSelect, IMenuSubMenu, JIIXV2Base, JIIXV2Circle, JIIXV2DrawingElement, JIIXV2Element, JIIXV2ElementBase, JIIXV2Ellipse, JIIXV2EllipseBase, JIIXV2Export, JIIXV2Expression, JIIXV2Line, JIIXV2LineSpan, JIIXV2MathElement, JIIXV2PolygonBase, JIIXV2PolygonType, JIIXV2PrimitiveArc, JIIXV2PrimitiveLine, JIIXV2Range, JIIXV2RangeItem, JIIXV2RawContentBase, JIIXV2RawContentElement, JIIXV2RawContentItemShape, JIIXV2RawContentItemText, JIIXV2RawContentShape, JIIXV2RawContentTextLine, JIIXV2ShapeArcOfCircle, JIIXV2ShapeArcOfEllipse, JIIXV2ShapeCurvedArrow, JIIXV2ShapeCurvedDoubleArrow, JIIXV2ShapeElement, JIIXV2ShapeItemBase, JIIXV2ShapeLine, JIIXV2ShapeLineArrow, JIIXV2ShapeLineDoubleArrow, JIIXV2ShapeLinePolyline, JIIXV2ShapeLinePolylineArrow, JIIXV2ShapeLinePolylineDoubleArrow, JIIXV2ShapePolygon, JIIXV2ShapePolygonEquilateralTriangle, JIIXV2ShapePolygonIsoscelesTriangle, JIIXV2ShapePolygonParallelogram, JIIXV2ShapePolygonQuadrilateral, JIIXV2ShapePolygonRectangle, JIIXV2ShapePolygonRhombus, JIIXV2ShapePolygonRightIsoscelesTriangle, JIIXV2ShapePolygonRightTriangle, JIIXV2ShapePolygonSquare, JIIXV2ShapePolygonTrapezoid, JIIXV2ShapePolygonTriangle, JIIXV2TextElement, ModalButton, ModalConfig, ModalField, ModalFieldOption, PartialDeep, PointerInfo, TAllMenuItems, TAngleUnit, TApiInfos, TBaseRendererConfiguration, TBox, TCanvasShapeEllipseSymbol, TCanvasShapeLineSymbol, TCanvasShapeTableLineSymbol, TCanvasShapeTableSymbol, TCanvasTextSymbol, TCanvasTextUnderlineSymbol, TCanvasUnderLineSymbol, TConverstionState, TConvertionConfiguration, TDiagramConfiguration, TDiagramConvertConfiguration, TEditorConfiguration, TEditorTriggerConfiguration, TEraserConfiguration, TExport, TExportConfiguration, TExportV2, TGenericMenuItem, TGesture, TGestureConfiguration, TGestureType, TGrabberConfiguration, TGuidesConfiguration, THistoryConfiguration, THistoryContext, TIHistoryBackendChanges, TIHistoryChanges, TIHistoryStackItem, TIIEdge, TIIHistoryBackendChanges, TIIHistoryChanges, TIIHistoryStackItem, TIIMathElement, TIIRecognized, TIIRecognizedChar, TIIRecognizedWord, TIIRendererConfiguration, TIIShape, TIISymbol, TIISymbolChar, TImageConfiguration, TImageViewportConfiguration, TInkEditorConfiguration, TInkEditorDeprecatedConfiguration, TInkEditorDeprecatedOptions, TInkEditorOptions, TInteractiveInkEditorConfiguration, TInteractiveInkEditorOptions, TInteractiveInkSSREditorConfiguration, TInteractiveInkSSREditorOptions, TInteractiveInkSessionDescriptionMessage, TJIIXBase, TJIIXChar, TJIIXEdgeArc, TJIIXEdgeElement, TJIIXEdgeElementBase, TJIIXEdgeLine, TJIIXEdgePolyEdge, TJIIXElement, TJIIXElementBase, TJIIXExport, TJIIXLine, TJIIXMathElement, TJIIXMathExpression, TJIIXMathExpressionBase, TJIIXMathExpressionTypeValue, TJIIXMathFraction, TJIIXMathGroup, TJIIXMathNumber, TJIIXMathOperator, TJIIXMathPower, TJIIXMathRoot, TJIIXMathSquareRoot, TJIIXMathSubscript, TJIIXMathSubsuperscript, TJIIXMathSuperscript, TJIIXMathSymbol, TJIIXMathSymbolExpression, TJIIXMathUnderoverscript, TJIIXMathVariable, TJIIXNodeCircle, TJIIXNodeElement, TJIIXNodeElementBase, TJIIXNodeEllipse, TJIIXNodeParrallelogram, TJIIXNodePolygon, TJIIXNodeRectangle, TJIIXNodeRhombus, TJIIXNodeTriangle, TJIIXStrokeItem, TJIIXTextElement, TJIIXWord, TJiixConfiguration, TListenerConfiguration, TLoggerConfiguration, TMarginConfiguration, TMathConfiguration, TMathEvaluable, TMathInteractionConfig, TMathMLExport, TMathMLFlavor, TMathOverlayConfig, TMathUndoRedoConfiguration, TMathVariable, TMatrixTransform, TMenuConfiguration, TMenuPosition, TPenStyle, TPoint, TPointer, TRawContentConfiguration, TRecognitionHTTPV1Configuration, TRecognitionPositions, TRecognitionRendererConfiguration, TRecognitionRendererDebugConfiguration, TRecognitionType, TRecognitionV2Type, TRecognitionWebSocketConfiguration, TRecognizerHTTPV1Configuration, TRecognizerHTTPV1PostConfiguration, TRecognizerHTTPV1PostData, TRecognizerHTTPV2Configuration, TRecognizerHTTPV2PostConfiguration, TRecognizerHTTPV2PostData, TRecognizerHTTPV2RecognitionConfiguration, TRecognizerWebSocketConfiguration, TRecognizerWebSocketMessage, TRecognizerWebSocketMessageAuthenticated, TRecognizerWebSocketMessageContentChange, TRecognizerWebSocketMessageContextlessGesture, TRecognizerWebSocketMessageError, TRecognizerWebSocketMessageExport, TRecognizerWebSocketMessageGesture, TRecognizerWebSocketMessageHMACChallenge, TRecognizerWebSocketMessageIdle, TRecognizerWebSocketMessageMathSolverAvailableActions, TRecognizerWebSocketMessageMathSolverEvaluate, TRecognizerWebSocketMessageMathSolverGetDiagnostic, TRecognizerWebSocketMessageMathSolverGetEvaluables, TRecognizerWebSocketMessageMathSolverGetVariableValue, TRecognizerWebSocketMessageMathSolverGetVariables, TRecognizerWebSocketMessageMathSolverNumericalComputation, TRecognizerWebSocketMessageMathSolverResult, TRecognizerWebSocketMessageMathSolverSetVariableValue, TRecognizerWebSocketMessageNewPart, TRecognizerWebSocketMessagePartChange, TRecognizerWebSocketMessagePong, TRecognizerWebSocketMessageReceived, TRecognizerWebSocketSSRConfiguration, TRecognizerWebSocketSSRMessage, TRecognizerWebSocketSSRMessageContentChange, TRecognizerWebSocketSSRMessageContentPackageDescriptionMessage, TRecognizerWebSocketSSRMessageError, TRecognizerWebSocketSSRMessageExport, TRecognizerWebSocketSSRMessageHMACChallenge, TRecognizerWebSocketSSRMessagePartChange, TRecognizerWebSocketSSRMessageSVGPatch, TRecognizerWebSocketSSRRecognitionConfiguration, TRendererConfiguration, TRoundingMode, TScheme, TSegment, TServerHTTPConfiguration, TServerWebsocketConfiguration, TShapeBeautificationConfiguration, TShapeConfiguration, TShapeConvertConfiguration, TSnapConfiguration, TSnapLineInfos, TSnapNudge, TSolverConfiguration, TSolverOptions, TStroke, TStrokeGroup, TStrokeGroupToSend, TStrokeToSend, TStyle, TSubMenuItems, TSymbol, TTextConfConfiguration, TTextConfiguration, TTextGuidesConfiguration, TTextGuidesConfigurationV2, TTextRecognizerHTTPV2ConfConfiguration, TTextRecognizerHTTPV2Configuration, TTheme, TThemeMath, TThemeMathSolved, TThemeText, TUndoRedoMode, TUpdatePatch, TUpdatePatchAppendChild, TUpdatePatchInsertBefore, TUpdatePatchRemoveAttribut, TUpdatePatchRemoveChild, TUpdatePatchRemoveElement, TUpdatePatchReplaceAll, TUpdatePatchReplaceELement, TUpdatePatchSetAttribut, TUpdatePatchType };
//# sourceMappingURL=iink.d.ts.map
