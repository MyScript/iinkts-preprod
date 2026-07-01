/**
 * @group Components
 */
type TChartConfig = {
    width?: number;
    height?: number;
    title?: string;
    xLabel?: string;
    yLabel?: string;
    lineColor?: string;
    lineWidth?: number;
    showGrid?: boolean;
    showPoints?: boolean;
    seriesColors?: string[];
};
/**
 * @group Components
 */
declare class Chart {
    private static readonly CHART_MARGIN;
    private static readonly SERIES_COLORS;
    private canvas;
    private ctx;
    private config;
    private series;
    private container;
    private viewport;
    private defaultViewport;
    private isDragging;
    private lastMousePos;
    private controlsContainer?;
    constructor(config?: TChartConfig);
    private createControls;
    private setupInteractions;
    /**
     * Set cursor style
     */
    private setCursor;
    /**
     * Check if a point is valid (not NaN or Infinite)
     */
    private isValidPoint;
    /**
     * Get series colors
     */
    private getSeriesColors;
    private zoom;
    private pan;
    private resetZoom;
    /**
     * Get chart dimensions accounting for margins
     */
    private getChartDimensions;
    /**
     * Compute range with padding for axis bounds
     */
    private computeRangeWithPadding;
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
    private draw;
    /**
     * Calculate viewport bounds (with or without custom viewport)
     */
    private calculateViewportBounds;
    /**
     * Get scale functions for converting data coordinates to canvas coordinates
     */
    private getScaleFunctions;
    /**
     * Calculate axis positions (cross at origin if possible)
     */
    private calculateAxisPositions;
    /**
     * Draw chart title
     */
    private drawTitle;
    /**
     * Draw grid lines
     */
    private drawGrid;
    /**
     * Draw chart border
     */
    private drawChartBorder;
    /**
     * Draw X and Y axes
     */
    private drawAxes;
    /**
     * Draw axis labels
     */
    private drawAxisLabels;
    /**
     * Draw X-axis tick marks and labels
     */
    private drawXAxisTicks;
    /**
     * Draw Y-axis tick marks and labels
     */
    private drawYAxisTicks;
    /**
     * Draw all curve series
     */
    private drawCurves;
    /**
     * Draw points for all series
     */
    private drawPoints;
    /**
     * Update chart configuration and redraw
     */
    updateConfig(config: Partial<TChartConfig>): void;
    /**
     * Destroy the chart
     */
    destroy(): void;
}

/** @group DOM */
type TButtonElConfig = {
    id?: string;
    label?: string;
    html?: string;
    icon?: string;
    className?: string | string[];
    disabled?: boolean;
    title?: string;
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary" | "tertiary" | "success" | "danger" | "warning" | "info";
    onClick?: (e: MouseEvent) => void;
    onPointerUp?: (e: PointerEvent) => void;
    onPointerDown?: (e: PointerEvent) => void;
};
/** @group DOM */
declare function buildButton(config: TButtonElConfig): HTMLButtonElement;

/** @group DOM */
type TContainerElConfig = {
    id?: string;
    className?: string | string[];
    style?: string;
    text?: string;
    html?: string;
    title?: string;
};
/** @group DOM */
declare function buildDiv(config?: TContainerElConfig): HTMLDivElement;
/** @group DOM */
declare function buildSpan(config?: TContainerElConfig): HTMLSpanElement;
/** @group DOM */
declare function buildP(config?: TContainerElConfig): HTMLParagraphElement;
/** @group DOM */
declare function buildH3(config?: TContainerElConfig): HTMLHeadingElement;
/** @group DOM */
declare function buildSection(config?: TContainerElConfig): HTMLElement;
/** @group DOM */
declare function buildStyle(cssText: string, dataAttr?: Record<string, string>): HTMLStyleElement;

/** @group DOM */
type TInputElConfig = {
    id?: string;
    value?: string | number;
    placeholder?: string;
    disabled?: boolean;
    step?: string | number;
    min?: number;
    max?: number;
    name?: string;
    fullWidth?: boolean;
};
/** @group DOM */
type TCheckboxElConfig = {
    id?: string;
    checked?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
    name?: string;
};
/** @group DOM */
type TRangeElConfig = {
    id?: string;
    min: number;
    max: number;
    step: number;
    value?: number;
    name?: string;
};
/** @group DOM */
type TFileInputElConfig = {
    id?: string;
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
};
/** @group DOM */
declare function buildTextInput(config: TInputElConfig): HTMLInputElement;
/** @group DOM */
declare function buildNumberInput(config: TInputElConfig): HTMLInputElement;
/** @group DOM */
declare function buildCheckbox(config: TCheckboxElConfig): HTMLInputElement;
/** @group DOM */
declare function buildRange(config: TRangeElConfig): HTMLInputElement;
/** @group DOM */
declare function buildFileInput(config: TFileInputElConfig): HTMLInputElement;

/** @group DOM */
type TLabelElConfig = {
    text: string;
    htmlFor?: string;
    className?: string | string[];
    style?: string;
};
/** @group DOM */
declare function buildLabel(config: TLabelElConfig): HTMLLabelElement;

/** @group DOM */
type TOutputElConfig = {
    id?: string;
    htmlFor?: string;
    text?: string;
};
/** @group DOM */
declare function buildOutput(config?: TOutputElConfig): HTMLOutputElement;

/** @group DOM */
type TSelectElOption = {
    value: string;
    label: string;
    selected?: boolean;
};
/** @group DOM */
type TSelectElConfig = {
    id: string;
    options?: TSelectElOption[];
    defaultValue?: string;
    disabled?: boolean;
    className?: string;
    customStyle?: string;
    onChange?: (value: string) => void;
};
/** @group DOM */
declare function buildOption(opt: TSelectElOption): HTMLOptionElement;
/** @group DOM */
declare function buildSelect(config: TSelectElConfig): HTMLSelectElement;

/** @group DOM */
type TTableBaseElConfig = {
    id?: string;
    className?: string | string[];
    style?: string;
};
/** @group DOM */
type TTableCellElConfig = TTableBaseElConfig & {
    text?: string;
    colSpan?: number;
};
/** @group DOM */
declare function buildTable(config?: TTableBaseElConfig): HTMLTableElement;
/** @group DOM */
declare function buildTHead(config?: TTableBaseElConfig): HTMLTableSectionElement;
/** @group DOM */
declare function buildTBody(config?: TTableBaseElConfig): HTMLTableSectionElement;
/** @group DOM */
declare function buildTr(config?: TTableBaseElConfig): HTMLTableRowElement;
/** @group DOM */
declare function buildTd(config?: TTableCellElConfig): HTMLTableCellElement;
/** @group DOM */
declare function buildTh(config?: TTableCellElConfig): HTMLTableCellElement;

/**
 * @group DOM
 * @remarks Static utility class for DOM element creation.
 */
declare class DOMFactory {
    private constructor();
    static div(config?: TContainerElConfig): HTMLDivElement;
    static span(config?: TContainerElConfig): HTMLSpanElement;
    static p(config?: TContainerElConfig): HTMLParagraphElement;
    static h3(config?: TContainerElConfig): HTMLHeadingElement;
    static section(config?: TContainerElConfig): HTMLElement;
    static style(cssText: string, dataAttr?: Record<string, string>): HTMLStyleElement;
    static canvas(config?: {
        id?: string;
        className?: string;
    }): HTMLCanvasElement;
    static label(config: TLabelElConfig): HTMLLabelElement;
    static button(config: TButtonElConfig): HTMLButtonElement;
    static textInput(config: TInputElConfig): HTMLInputElement;
    static numberInput(config: TInputElConfig): HTMLInputElement;
    static checkbox(config: TCheckboxElConfig): HTMLInputElement;
    static range(config: TRangeElConfig): HTMLInputElement;
    static fileInput(config: TFileInputElConfig): HTMLInputElement;
    static select(config: TSelectElConfig): HTMLSelectElement;
    static option(opt: TSelectElOption): HTMLOptionElement;
    static output(config?: TOutputElConfig): HTMLOutputElement;
    static table(config?: TTableBaseElConfig): HTMLTableElement;
    static thead(config?: TTableBaseElConfig): HTMLTableSectionElement;
    static tbody(config?: TTableBaseElConfig): HTMLTableSectionElement;
    static tr(config?: TTableBaseElConfig): HTMLTableRowElement;
    static td(config?: TTableCellElConfig): HTMLTableCellElement;
    static th(config?: TTableCellElConfig): HTMLTableCellElement;
    static colorDot(color: string, size?: string): HTMLSpanElement;
    static statusBadge(available: boolean): HTMLSpanElement;
    static labeledInput(config: {
        id: string;
        label: string;
        type?: string;
        defaultValue?: string | number;
        placeholder?: string;
        min?: number;
        max?: number;
        step?: string | number;
        labelSize?: string;
        gap?: string;
    }): {
        wrapper: HTMLDivElement;
        input: HTMLInputElement;
        label: HTMLLabelElement;
    };
}

/** @group DOM */
declare function buildCanvas(config?: {
    id?: string;
    className?: string;
}): HTMLCanvasElement;

/**
 * @group Constants
 * @remarks Human-readable messages for MathDiagnostic error codes
 */
declare const MathDiagnosticMessages: {
    [key: string]: {
        title: string;
        message: string;
        severity: "success" | "warning" | "error" | "info";
    };
};
/**
 * @group Utilities
 * @summary Get diagnostic message for a given diagnostic code
 * @param diagnostic - The diagnostic code (e.g., "ALLOWED", "DIVISION_BY_ZERO")
 * @returns Message object with title, message, and severity
 */
declare function getMathDiagnosticMessage(diagnostic: string): {
    title: string;
    message: string;
    severity: "success" | "warning" | "error" | "info";
};

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
    MANAGER = "MANAGER",
    STYLE = "STYLE",
    HISTORY = "HISTORY",
    SYMBOL = "SYMBOL",
    WRITE = "WRITE",
    TRANSFORMER = "TRANSFORMER",
    CONVERTER = "CONVERTER",
    SELECTION = "SELECTION",
    SYNCHRONIZER = "SYNCHRONIZER",
    SVGDEBUG = "SVGDEBUG",
    MENU = "MENU",
    JIIX_QUERY = "JIIX_QUERY",
    KEYBOARD = "KEYBOARD",
    MATH = "MATH",
    SNAP = "SNAP",
    TEXT = "TEXT"
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
 * @source
 */
declare const DefaultMathV2Configuration: TMathConfiguration;

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
 * @source
 */
declare const DefaultRawContentV2Configuration: TRawContentConfiguration;

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
type TRecognitionTypeBase = "TEXT" | "MATH" | "Raw Content";
/**
 * @group Recognizer
 */
type TRecognitionTypeV1 = TRecognitionTypeBase | "DIAGRAM";
/**
 * @group Recognizer
 */
type TRecognitionTypeV2 = TRecognitionTypeBase | "SHAPE";
/**
 * @group Recognizer
 */
type TConverstionState = "DIGITAL_EDIT" | "HANDWRITING";

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
declare function mapCloseCodeToMessage(code: number): string | null;

/**
 * @group Utilities
 */
declare function computeHmac(message: string, applicationKey: string, hmacKey: string): Promise<string>;

/**
 * @group Utilities
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
 * @group Utilities
 */
type TPartialDeep<T> = T extends object ? {
    [P in keyof T]?: TPartialDeep<T[P]>;
} : T;

/**
 * @group Utilities
 */
declare function getAvailableFontList(configuration: TPartialDeep<{
    server: TServerHTTPConfiguration;
    recognition: {
        lang: string;
    };
}>): Promise<Array<string>>;

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
declare function isValidPoint(p?: TPartialDeep<TPoint>): boolean;

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
declare const BoxOps: {
    createFromBoxes(boxes: TBox[]): TBox;
    createFromPoints(points: TPoint[]): TBox;
    getCorners(box: TBox): TPoint[];
    getSide(box: TBox): TPoint[];
    getCenter(box: TBox): TPoint;
    getSides(box: TBox): TSegment[];
    getSnapPoints(box: TBox): TPoint[];
    isContained(box: TBox, wrapper: TBox): boolean;
    containsPoint(box: TBox, point: TPoint): boolean;
    contains(box: TBox, child: TBox): boolean;
    overlaps(box1: TBox, box2: TBox): boolean;
};

/**
 * Oriented Bounding Box
 * @group Symbol
 */
type TOBB = {
    center: TPoint;
    width: number;
    height: number;
    angle: number;
};
/**
 * @group Symbol
 */
declare const OBBOps: {
    create(center: TPoint, width: number, height: number, angle?: number): TOBB;
    fromBox(box: TBox): TOBB;
    toBox(obb: TOBB): TBox;
    createFromPoints(points: TPoint[]): TOBB;
    createFromOBBs(obbs: TOBB[]): TOBB;
    getCorners(obb: TOBB): TPoint[];
    getSides(obb: TOBB): TSegment[];
    getSnapPoints(obb: TOBB): TPoint[];
    containsPoint(obb: TOBB, point: TPoint): boolean;
    overlaps(a: TOBB, b: TOBB): boolean;
    overlapsBox(obb: TOBB, box: TBox): boolean;
    isContained(obb: TOBB, box: TBox): boolean;
    contains(a: TOBB, b: TOBB): boolean;
};

/**
 * @group Symbol
 */
type TEdgeArc = TBaseSymbol & {
    type: SymbolType.Edge;
    kind: EdgeKind.Arc;
    style: TStyle;
    center: TPoint;
    startAngle: number;
    sweepAngle: number;
    radiusX: number;
    radiusY: number;
    phi: number;
    startDecoration?: EdgeDecoration;
    endDecoration?: EdgeDecoration;
    vertices: TPoint[];
    bounds: TOBB;
    snapPoints: TPoint[];
    edges: TSegment[];
};
/**
 * @group Symbol
 */
declare const EdgeArcOps: {
    create(center: TPoint, startAngle: number, sweepAngle: number, radiusX: number, radiusY: number, phi: number, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: TPartialDeep<TStyle>): TEdgeArc;
    createFromPartial(partial: TPartialDeep<TEdgeArc>): TEdgeArc;
    computeVertices(arc: TEdgeArc): TPoint[];
    updateDerivedFields(arc: TEdgeArc): void;
    getResizePoints(arc: TEdgeArc): {
        point: TPoint;
        vertexIndex: number;
    }[];
    overlaps(arc: TEdgeArc, box: TBox): boolean;
    getSVGPath(arc: TEdgeArc): string;
};

/**
 * Anchor point on a symbol, expressed as normalized 0-1 coordinates within the symbol's bounds.
 * (0,0) = top-left, (1,1) = bottom-right.
 * Stored as normalized values so the anchor remains valid when the target symbol moves or resizes.
 * @group Symbol
 */
type TAnchor = {
    symbolId: string;
    normalizedX: number;
    normalizedY: number;
    /** Intersection of the edge with the shape border, in world coordinates. */
    entryPoint?: {
        x: number;
        y: number;
    };
};
/**
 * Resolve a normalized anchor to an absolute TPoint given the target symbol's bounding box.
 * @group Symbol
 */
declare function resolveAnchorPoint(anchor: TAnchor, bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
}): {
    x: number;
    y: number;
};
/**
 * Compute normalized anchor coordinates from an absolute point and target bounds.
 * Result is clamped to [0, 1].
 * @group Symbol
 */
declare function computeNormalizedAnchor(point: {
    x: number;
    y: number;
}, bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
}): {
    normalizedX: number;
    normalizedY: number;
};

/**
 * @group Symbol
 */
type TEdgeLine = TBaseSymbol & {
    type: SymbolType.Edge;
    kind: EdgeKind.Line;
    style: TStyle;
    startDecoration?: EdgeDecoration;
    endDecoration?: EdgeDecoration;
    startAnchor?: TAnchor;
    endAnchor?: TAnchor;
    start: TPoint;
    end: TPoint;
    vertices: TPoint[];
    bounds: TOBB;
    snapPoints: TPoint[];
    edges: TSegment[];
};
/**
 * @group Symbol
 */
declare const EdgeLineOps: {
    create(start: TPoint, end: TPoint, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: TPartialDeep<TStyle>): TEdgeLine;
    createFromPartial(partial: TPartialDeep<TEdgeLine>): TEdgeLine;
    updateDerivedFields(line: TEdgeLine): void;
    getResizePoints(line: TEdgeLine): {
        point: TPoint;
        vertexIndex: number;
    }[];
    overlaps(line: TEdgeLine, box: TBox): boolean;
    getSVGPath(line: TEdgeLine): string;
};

/**
 * @group Symbol
 */
type TEdgePolyLine = TBaseSymbol & {
    type: SymbolType.Edge;
    kind: EdgeKind.PolyEdge;
    style: TStyle;
    startDecoration?: EdgeDecoration;
    endDecoration?: EdgeDecoration;
    startAnchor?: TAnchor;
    endAnchor?: TAnchor;
    points: TPoint[];
    vertices: TPoint[];
    bounds: TOBB;
    snapPoints: TPoint[];
    edges: TSegment[];
};
/**
 * @group Symbol
 */
declare const EdgePolyLineOps: {
    create(points: TPoint[], startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: TPartialDeep<TStyle>): TEdgePolyLine;
    createFromPartial(partial: TPartialDeep<TEdgePolyLine>): TEdgePolyLine;
    updateDerivedFields(polyline: TEdgePolyLine): void;
    getResizePoints(polyline: TEdgePolyLine): {
        point: TPoint;
        vertexIndex: number;
    }[];
    overlaps(polyline: TEdgePolyLine, box: TBox): boolean;
    getSVGPath(polyline: TEdgePolyLine): string;
};

/**
 * @group Symbol
 */
type TEdge = TEdgeArc | TEdgeLine | TEdgePolyLine;
/**
 * @group Symbol
 */
declare const EdgeOps: {
    /**
     * @group Symbol
     * @summary Check if symbol is an edge (line, arc, polyline)
     * @param symbol - Symbol to check
     * @returns True if symbol is an edge
     */
    isEdge(symbol: TBaseSymbol): symbol is TEdge;
    /**
     * @group Symbol
     * @summary Type guard to check if an edge is a line
     * @param edge - The edge to check
     * @returns True if the edge is a line
     */
    isLineEdge(edge: TBaseSymbol): edge is TEdgeLine;
    /**
     * @group Symbol
     * @summary Type guard to check if an edge is an arc
     * @param edge - The edge to check
     * @returns True if the edge is an arc
     */
    isArcEdge(edge: TBaseSymbol): edge is TEdgeArc;
    /**
     * @group Symbol
     * @summary Type guard to check if an edge is a polyline
     * @param edge - The edge to check
     * @returns True if the edge is a polyline
     */
    isPolyEdge(edge: TBaseSymbol): edge is TEdgePolyLine;
    /**
     * @group Symbol
     * @summary Update derived fields (bounds, vertices, snapPoints, edges) for any TEdge.
     */
    updateEdgeDerivedFields(edge: TEdge): void;
    /**
     * @group Symbol
     * @summary Get resize points for any TEdge.
     */
    getEdgeResizePoints(edge: TEdge): {
        point: TPoint;
        vertexIndex: number;
    }[];
    /**
     * @group Symbol
     * @summary Create a TEdge from partial data — dispatches by kind.
     */
    createEdgeFromPartial(partial: TPartialDeep<TEdge>): TEdge;
    computeEdgeBounds(vertices: TPoint[], style: TStyle, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration): TOBB;
};

/**
 * @group Symbol
 */
type TRotation = {
    degree: number;
    center: TPoint;
};
/**
 * @group Symbol
 */
type TTypesetChild = {
    id: string;
    label: string;
    color: string;
    bounds: TBox;
    fontSize: number;
    fontWeight: "normal" | "bold";
};
/**
 * @group Symbol
 */
declare function computeTypesetVertices(bounds: TBox, rotation?: TRotation): TPoint[];
/**
 * @group Symbol
 */
declare function computeTypesetSnapPoints(bounds: TBox, point: TPoint, rotation?: TRotation): TPoint[];
/**
 * @group Symbol
 */
declare function computeClosedEdges(vertices: TPoint[]): TSegment[];

/**
 * @group Symbol
 * @remarks Individual math element (number, operator, variable, etc.)
 */
type TMathElement = TTypesetChild & {
    fontFamily: string;
    position?: "superscript" | "subscript" | "normal";
};
/**
 * @group Symbol
 * @remarks Represents a converted mathematical expression with native rendering
 */
type TMath = TBaseSymbol & {
    type: SymbolType.Math;
    style: TStyle;
    point: TPoint;
    elements: TMathElement[];
    decorators: TDecorator[];
    bounds: TOBB;
    rotation?: TRotation;
    vertices: TPoint[];
    snapPoints: TPoint[];
    edges: TSegment[];
};
/**
 * @group Symbol
 * @summary Check if symbol is math
 * @param symbol - Symbol to check
 * @returns True if symbol is math
 */
declare function isMath(symbol: TBaseSymbol): symbol is TMath;
/**
 * @group Symbol
 */
declare const MathOps: {
    create(elements: TMathElement[], point: TPoint, boundsBox: TBox, style?: TPartialDeep<TStyle>): TMath;
    createFromPartial(partial: TPartialDeep<TMath>): TMath;
    updateDerivedFields(math: TMath): void;
    overlaps(math: TMath, box: TBox): boolean;
    getChildrenOverlaps(math: TMath, points: TPoint[]): TMathElement[];
    updateChildrenStyle(math: TMath): void;
    updateChildrenFont(math: TMath, { fontSize, fontWeight, fontFamily, }: {
        fontSize?: number;
        fontWeight?: "normal" | "bold";
        fontFamily?: string;
    }): void;
    getLabel(math: TMath): string;
    toJSON(math: TMath): TPartialDeep<TMath>;
};

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
type TShapeCircle = TBaseSymbol & {
    type: SymbolType.Shape;
    kind: ShapeKind.Circle;
    style: TStyle;
    center: TPoint;
    radius: number;
    vertices: TPoint[];
    bounds: TOBB;
    snapPoints: TPoint[];
    edges: TSegment[];
};
/**
 * @group Symbol
 */
declare const ShapeCircleOps: {
    create(center: TPoint, radius: number, style?: TPartialDeep<TStyle>): TShapeCircle;
    createFromPartial(partial: TPartialDeep<TShapeCircle>): TShapeCircle;
    updateDerivedFields(circle: TShapeCircle): void;
    overlaps(circle: TShapeCircle, box: TBox): boolean;
    createBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapeCircle;
    updateBetweenPoints(circle: TShapeCircle, _origin: TPoint, target: TPoint): void;
    getSVGPath(circle: TShapeCircle): string;
};

/**
 * @group Symbol
 */
type TShapeEllipse = TBaseSymbol & {
    type: SymbolType.Shape;
    kind: ShapeKind.Ellipse;
    style: TStyle;
    center: TPoint;
    radiusX: number;
    radiusY: number;
    orientation: number;
    vertices: TPoint[];
    bounds: TOBB;
    snapPoints: TPoint[];
    edges: TSegment[];
};
/**
 * @group Symbol
 */
declare const ShapeEllipseOps: {
    create(center: TPoint, radiusX: number, radiusY: number, orientation: number, style?: TPartialDeep<TStyle>): TShapeEllipse;
    createFromPartial(partial: TPartialDeep<TShapeEllipse>): TShapeEllipse;
    updateDerivedFields(ellipse: TShapeEllipse): void;
    overlaps(ellipse: TShapeEllipse, box: TBox): boolean;
    createBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapeEllipse;
    updateBetweenPoints(ellipse: TShapeEllipse, origin: TPoint, target: TPoint): void;
    getSVGPath(ellipse: TShapeEllipse): string;
};

/**
 * @group Symbol
 */
type TShapePolygon = TBaseSymbol & {
    type: SymbolType.Shape;
    kind: ShapeKind.Polygon;
    style: TStyle;
    points: TPoint[];
    vertices: TPoint[];
    bounds: TOBB;
    snapPoints: TPoint[];
    edges: TSegment[];
};
/**
 * @group Symbol
 */
declare const ShapePolygonOps: {
    create(points: TPoint[], style?: TPartialDeep<TStyle>): TShapePolygon;
    createFromPartial(partial: TPartialDeep<TShapePolygon>): TShapePolygon;
    updateDerivedFields(polygon: TShapePolygon): void;
    overlaps(polygon: TShapePolygon, box: TBox): boolean;
    createTriangleBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon;
    updateTriangleBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void;
    createParallelogramBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon;
    updateParallelogramBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void;
    createRectangleBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon;
    updateRectangleBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void;
    createRhombusBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon;
    updateRhombusBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void;
    getSVGPath(polygon: TShapePolygon): string;
};

/**
 * @group Symbol
 */
type TShape = TShapeCircle | TShapeEllipse | TShapePolygon;
/**
 * @group Symbol
 */
declare const ShapeOps: {
    /**
     * @group Symbol
     * @summary Check if symbol is a shape (circle, ellipse, polygon)
     * @param symbol - Symbol to check
     * @returns True if symbol is a shape
     */
    isShape(symbol: TBaseSymbol): symbol is TShape;
    /**
     * @group Symbol
     * @summary Type guard to check if a shape is a circle
     * @param shape - The shape to check
     * @returns True if the shape is a circle
     */
    isCircleShape(shape: TBaseSymbol): shape is TShapeCircle;
    /**
     * @group Symbol
     * @summary Type guard to check if a shape is an ellipse
     * @param shape - The shape to check
     * @returns True if the shape is an ellipse
     */
    isEllipseShape(shape: TBaseSymbol): shape is TShapeEllipse;
    /**
     * @group Symbol
     * @summary Type guard to check if a shape is a polygon
     * @param shape - The shape to check
     * @returns True if the shape is a polygon
     */
    isPolygonShape(shape: TBaseSymbol): shape is TShapePolygon;
    /**
     * @group Symbol
     * @summary Update derived fields (bounds, vertices, snapPoints, edges) for any TShape.
     */
    updateShapeDerivedFields(shape: TShape): void;
    /**
     * @group Symbol
     * @summary Create a TShape from partial data — dispatches by kind.
     */
    createShapeFromPartial(partial: TPartialDeep<TShape>): TShape;
};

/**
 * @group Symbol
 */
type TStrokeMinimal = {
    id: string;
    pointerType: string;
    pointers: TPointer[];
};
/**
 * @group Symbol
 */
type TStroke = TBaseSymbol & TStrokeMinimal & {
    readonly type: SymbolType.Stroke;
    style: TStyle;
    length: number;
    bounds: TOBB;
    snapPoints: TPoint[];
    vertices: TPointer[];
    edges: TSegment[];
    jiixBlockId?: string;
    jiixBlockType?: "Text" | "Math" | "Node" | "Edge" | "Decorator";
    isSolverOutput?: boolean;
    decoratorKind?: DecoratorKind;
};
/**
 * @group Symbol
 * @summary Check if symbol is a stroke
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke
 */
declare function isStroke(symbol: TBaseSymbol): symbol is TStroke;
/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Math JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Math JIIX block type
 */
declare function isRecognizedMath(symbol: TBaseSymbol): symbol is TStroke;
/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Solver Output JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Solver Output JIIX block type
 */
declare function isStrokeSolverOutput(symbol: TBaseSymbol): symbol is TStroke;
/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Text JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Text JIIX block type
 */
declare function isRecognizedText(symbol: TBaseSymbol): symbol is TStroke;
/**
 * @group Symbol
 */
declare const StrokeOps: {
    create(style?: TPartialDeep<TStyle>, pointerType?: string): TStroke;
    updateBounds(stroke: TStroke): void;
    _computePressure(stroke: TStroke, distance: number): number;
    _filterPointByAcquisitionDelta(stroke: TStroke, point: TPointer): boolean;
    addPointer(stroke: TStroke, pointer: TPointer): void;
    overlaps(stroke: TStroke, box: TBox): boolean;
    split(strokeToSplit: TStroke, i: number): {
        before: TStroke;
        after: TStroke;
    };
    substract(stroke: TStroke, partStroke: TStroke): {
        before?: TStroke;
        after?: TStroke;
    };
    createFromPartial(partial: TPartialDeep<TStroke>): TStroke;
    _getArcPath(center: TPointer, radius: number): string;
    _getLinePath(begin: TPointer, end: TPointer, width: number): string;
    _getFinalPath(begin: TPointer, end: TPointer, width: number): string;
    _getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string;
    getSVGPath(stroke: TStroke): string;
    formatToSend(stroke: TStrokeMinimal): {
        id: string;
        pointerType: string;
        p: number[];
        t: number[];
        x: number[];
        y: number[];
    };
};

/**
 * @group Symbol
 */
type TSymbolChar = TTypesetChild;
/**
 * @group Symbol
 */
type TText = TBaseSymbol & {
    type: SymbolType.Text;
    style: TStyle;
    point: TPoint;
    chars: TSymbolChar[];
    decorators: TDecorator[];
    bounds: TOBB;
    rotation?: TRotation;
    vertices: TPoint[];
    snapPoints: TPoint[];
    edges: TSegment[];
};
/**
 * @group Symbol
 * @summary Check if symbol is text
 * @param symbol - Symbol to check
 * @returns True if symbol is text
 */
declare function isText(symbol: TBaseSymbol): symbol is TText;
/**
 * @group Symbol
 */
declare const TextOps: {
    create(chars: TSymbolChar[], point: TPoint, boundsBox: TBox, style?: TPartialDeep<TStyle>): TText;
    createFromPartial(partial: TPartialDeep<TText>): TText;
    updateDerivedFields(text: TText): void;
    overlaps(text: TText, box: TBox): boolean;
    getChildrenOverlaps(text: TText, points: TPoint[]): TSymbolChar[];
    updateChildrenStyle(text: TText): void;
    updateChildrenFont(text: TText, { fontSize, fontWeight, }: {
        fontSize?: number;
        fontWeight?: "normal" | "bold";
    }): void;
    getLabel(text: TText): string;
    toJSON(text: TText): TPartialDeep<TText>;
};

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
    Decorator = "decorator"
}
/**
 * @group Symbol
 */
type TBaseSymbol = {
    id: string;
    creationTime: number;
    modificationDate: number;
    type: string;
    style: TPartialDeep<TStyle>;
};
/**
 * @group Symbol
 */
type TSymbol = TEdge | TShape | TStroke | TText | TMath | TDecorator;

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
 * Standalone decorator symbol that references the strokes or text it decorates.
 * When standalone (in model.symbols): targetIds contains the referenced stroke IDs
 * and hasBounds is true with word-level bounding box.
 * When embedded (in TText.decorators[]): targetIds is empty and hasBounds is false
 * (the parent symbol's bounds are used at render time).
 * @group Symbol
 */
type TDecorator = TBaseSymbol & {
    type: SymbolType.Decorator;
    style: TStyle;
    kind: DecoratorKind;
    targetIds: string[];
    bounds: TOBB;
    hasBounds: boolean;
    vertices: TPoint[];
    snapPoints: TPoint[];
    edges: TSegment[];
    baseline?: number;
    xHeight?: number;
};
/**
 * @group Symbol
 * @summary Check if symbol is a standalone decorator
 */
declare function isDecorator(symbol: TBaseSymbol): symbol is TDecorator;
/**
 * @group Symbol
 */
declare const DecoratorOps: {
    create(kind: DecoratorKind, style: TPartialDeep<TStyle>, targetIds?: string[], bounds?: TBox): TDecorator;
    setBounds(decorator: TDecorator, bounds: TOBB): void;
    overlaps(decorator: TDecorator, box: TBox): boolean;
};

/**
 * @group Symbol
 */
type TEraser = {
    id: string;
    type: SymbolType.Eraser;
    style: TStyle;
    pointers: TPointer[];
};
/**
 * @group Symbol
 */
declare const EraserOps: {
    create(width?: number): TEraser;
    getBounds(eraser: TEraser): TBox;
};

/**
 * @group Symbol
 * @summary Clone any TSymbol — all types are now plain objects, use structuredClone.
 */
declare function cloneSymbol(symbol: TSymbol): TSymbol;

/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasShapeEllipseSymbol = TBaseSymbol & {
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
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasShapeLineSymbol = TBaseSymbol & {
    firstPoint: TPoint;
    lastPoint: TPoint;
    beginDecoration?: string;
    endDecoration?: string;
    beginTangentAngle: number;
    endTangentAngle: number;
};
/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasShapeTableLineSymbol = {
    p1: TPoint;
    p2: TPoint;
};
/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasShapeTableSymbol = TBaseSymbol & {
    lines: TCanvasShapeTableLineSymbol[];
};
/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasUnderLineSymbol = TBaseSymbol & {
    data: {
        firstCharacter: number;
        lastCharacter: number;
    };
};
/**
 * @group Symbol
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasTextSymbol = TBaseSymbol & {
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
 * @deprecated Legacy v1 canvas symbol types
 */
type TCanvasTextUnderlineSymbol = TCanvasTextSymbol & {
    underlineList: TCanvasUnderLineSymbol[];
};

/**
 * @group Symbol
 * @deprecated Use {@link TStroke} from stroke/ for new code
 */
type TLegacyStroke = TBaseSymbol & TStrokeMinimal & {
    style: TPenStyle;
    length: number;
};
/**
 * @group Symbol
 * @deprecated Use {@link TStroke} from stroke/ for new code
 */
declare class Stroke implements TLegacyStroke {
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
}
/**
 * @group Symbol
 * @deprecated Use {@link StrokeOps.createFromPartial} from stroke/ for new code
 */
declare function convertPartialStrokesToStrokes(json: TPartialDeep<TLegacyStroke>[]): Stroke[];

/**
 * Mathematical constants for geometric calculations
 * @group Constants
 */
declare const TWO_PI: number;
/**
 * @group Utilities
 */
declare function computeDistance(p1: TPoint, p2: TPoint): number;
/**
 * @group Utilities
 * @remarks Faster than computeDistance when comparing distances (avoids sqrt)
 */
declare function computeDistanceSquared(p1: TPoint, p2: TPoint): number;
/**
 * @group Utilities
 */
declare function computeAngleAxeRadian(begin: TPoint, end: TPoint): number;
/**
 * @group Utilities
 */
declare function createPointsOnSegment(p1: TPoint, p2: TPoint, spaceBetweenPoint?: number): TPoint[];
/**
 * @group Utilities
 */
declare function scalaire(v1: TPoint, v2: TPoint): number;
/**
 * @group Utilities
 */
declare function computeNearestPointOnSegment(p: TPoint, seg: TSegment): TPoint;
/**
 * @group Utilities
 */
declare function isPointInsideBox(point: TPoint, box: TBox): boolean;
/**
 * Returns the point on the box perimeter where a ray from the box center toward `target` exits.
 * Used to find natural arrow connection points between two boxes.
 * @group Utilities
 */
declare function getBoxConnectionPoint(box: TBox, target: TPoint): TPoint;
/**
 * @group Utilities
 */
declare function convertRadianToDegree(radian: number): number;
/**
 * @group Utilities
 */
declare function convertDegreeToRadian(degree: number): number;
/**
 * @group Utilities
 */
declare function computeRotatedPoint(point: TPoint, center: TPoint, radian: number): TPoint;
/**
 * @group Utilities
 */
declare function computePointOnEllipse(center: TPoint, radiusX: number, radiusY: number, phi: number, theta: number): TPoint;
/**
 * Inverse of computePointOnEllipse: compute angle θ such that the point on the ellipse
 * nearest to the given position corresponds to that angle. Projects the point onto the ellipse.
 * @group Utilities
 */
declare function computeAngleFromPointOnEllipse(center: TPoint, radiusX: number, radiusY: number, phi: number, point: TPoint): number;
/**
 * @group Utilities
 */
declare function computeDistanceBetweenPointAndSegment(p: TPoint, seg: TSegment): number;
/**
 * @group Utilities
 */
declare function findIntersectionBetween2Segment(seg1: TSegment, seg2: TSegment): TPoint | undefined;
/**
 * @group Utilities
 */
declare function findIntersectBetweenSegmentAndCircle(seg: TSegment, c: TPoint, r: number): TPoint[];
/**
 * @group Utilities
 */
declare function computeAngleRadian(p1: TPoint, center: TPoint, p2: TPoint): number;
/**
 * @group Utilities
 */
declare function getClosestPoints(points1: TPoint[], points2: TPoint[]): {
    p1: TPoint;
    p2: TPoint;
};
/**
 * @group Utilities
 */
declare function getClosestPoint(points: TPoint[], point: TPoint): {
    point?: TPoint;
    index: number;
};
/**
 * @group Utilities
 */
declare function isPointInsidePolygon(point: TPoint, points: TPoint[]): boolean;
/**
 * Calculate rotation angle for ellipse arc
 * @group Utilities
 * @param angle - The angle in radians
 * @returns Normalized angle
 */
declare function normalizeAngle(angle: number): number;
/**
 * @group Utilities
 * @param centerPoint - Center of the ellipse
 * @param maxRadius - Maximum radius (semi-major axis)
 * @param minRadius - Minimum radius (semi-minor axis)
 * @param orientation - Rotation of the ellipse
 * @param startAngle - Starting angle
 * @param sweepAngle - Sweep angle
 * @param angleStep - Step size for calculations
 * @returns Array of points along the ellipse arc
 */
declare function computeEllipseArcPoints(centerPoint: TPoint, maxRadius: number, minRadius: number, orientation: number, startAngle: number, sweepAngle: number, angleStep?: number): TPoint[];

/**
 * @group Utilities
 */
type TApiInfos = {
    version: string;
    gitCommit: string;
    nativeVersion: string;
};
/**
 * @group Utilities
 */
declare function getApiInfos(configuration?: TPartialDeep<{
    server: TServerHTTPConfiguration;
}>): Promise<TApiInfos>;

/**
 * @group Utilities
 */
declare function getAvailableLanguageList(configuration: TPartialDeep<{
    server: TServerHTTPConfiguration;
}>): Promise<{
    result: {
        [key: string]: string;
    };
}>;

/**
 * @group Utilities
 */
declare function isBetween(val: number, min: number, max: number): boolean;
/**
 * @group Utilities
 */
declare function computeAverage(arr: number[]): number;
/**
 * @group Utilities
 * @summary Compute approximate average radius of an ellipse
 * @remarks Computes sqrt((radiusX^2 + radiusY^2) / 2) - a geometric average
 * used for ellipse perimeter and arc length approximations
 * @param radiusX - Horizontal radius
 * @param radiusY - Vertical radius
 * @returns Approximate average radius
 */
declare function computeEllipseRadiusAverage(radiusX: number, radiusY: number): number;

/**
 * @group Utilities
 */
type TMergeable = Record<string, unknown> | unknown[] | unknown;
/**
 * @group Utilities
 */
declare const mergeDeep: (target: any, ...sources: TMergeable[]) => any;
/**
 * @group Utilities
 */
declare const isDeepEqual: (object1: unknown, object2: unknown) => boolean;
/**
 * @group Utilities
 */
declare const isDeepEqualIgnoring: (object1: unknown, object2: unknown, ignoredKeys: string[]) => boolean;

/**
 * @group Utilities
 */
declare function computeLinksPointers(point: TPointer, angle: number, width: number): TPoint[];
/**
 * @group Utilities
 */
declare function computeMiddlePointer(point1: TPointer, point2: TPointer): TPointer;

/**
 * @group Utilities
 */
declare function convertMillimeterToPixel(mm: number): number;
/**
 * @group Utilities
 */
declare function convertPixelToMillimeter(px: number): number;
/**
 * @group Utilities
 */
declare function convertBoundingBoxMillimeterToPixel(box?: TBox): TBox;

/**
 * @group Utilities
 */
declare function createUUID(): string;

/**
 * Validation utilities for common type checking and validation patterns
 * @group Utilities
 */
/**
 * Assert that server config has both scheme and host. Throws if either is missing.
 * @group Utilities
 */
declare function assertServerConfig(server: {
    scheme?: string;
    host?: string;
} | undefined, errorPrefix: string): asserts server is {
    scheme: string;
    host: string;
};
/**
 * Check if two numbers are valid and finite
 * @group Utilities
 */
declare function areValidCoordinates(x: number, y: number): boolean;
/**
 * Check if a value is a valid number (not null, not undefined, not NaN, finite)
 * @group Utilities
 * @param x - Value to check
 * @returns True if value is a valid number
 */
declare function isValidNumber(x: unknown): boolean;

/**
 * @group Utilities
 */
declare const isVersionSuperiorOrEqual: (source: string, target: string) => boolean;

/**
 * @group Styles
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
 * @group Styles
 * @source
 */
declare const DefaultStyle: TStyle;

/**
 * @group Styles
 * @property {String} -myscript-pen-width=1 Width of strokes and primitives in mm (no other unit is supported yet)
 * @property {String} -myscript-pen-fill-style=none
 * @property {String} -myscript-pen-fill-color=#FFFFFF00 Color filled inside the area delimited by strokes and primitives
 */
type TPenStyle = TPartialDeep<TStyle> & {
    "-myscript-pen-width"?: number;
    "-myscript-pen-fill-style"?: string;
    "-myscript-pen-fill-color"?: string;
};
/**
 * @group Styles
 * @source
 */
declare const DefaultPenStyle: TPenStyle;

/**
 * @group Styles
 */
type TThemeMath = {
    "font-family": string;
};
/**
 * @group Styles
 */
type TThemeMathSolved = {
    "font-family": string;
    color: string;
};
/**
 * @group Styles
 */
type TThemeText = {
    "font-family": string;
    "font-size": number;
};
/**
 * @group Styles
 */
type TTheme = {
    ink: TPenStyle;
    ".math": TThemeMath;
    ".math-solved": TThemeMathSolved;
    ".text": TThemeText;
    [key: string]: unknown;
};
/**
 * @group Styles
 * @source
 */
declare const DefaultTheme: TTheme;

/**
 * @group Styles
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
 * @group Styles
 */
declare class StyleManager {
    #private;
    constructor(penStyle?: TPartialDeep<TPenStyle>, theme?: TPartialDeep<TTheme>);
    get currentPenStyle(): TPenStyle;
    get penStyle(): TPenStyle;
    setPenStyle(style?: TPartialDeep<TPenStyle>): void;
    get theme(): TTheme;
    setTheme(theme?: TPartialDeep<TTheme>): void;
    get penStyleClasses(): string;
    setPenStyleClasses(penStyleClass?: string): void;
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
declare function computeEdgeBounds(vertices: TPoint[], style: TStyle, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration): TOBB;

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
type TJIIXMathElement = TJIIXElementBase<JIIXElementType.Math> & {
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
declare enum JIIXElementType {
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
type TJIIXTextElement = TJIIXElementBase<JIIXElementType.Text> & {
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
type TJIIXNodeElementBase<K = string> = TJIIXElementBase<JIIXElementType.Node> & {
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
type TJIIXNodeParallelogram = TJIIXNodeElementBase<JIIXNodeKind.Parallelogram> & {
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
type TJIIXNodeElement = TJIIXNodeCircle | TJIIXNodeEllipse | TJIIXNodeRectangle | TJIIXNodeTriangle | TJIIXNodeParallelogram | TJIIXNodePolygon | TJIIXNodeRhombus;
/**
 * @group Exports
 */
type TJIIXEdgeElementBase<K = string> = TJIIXElementBase<JIIXElementType.Edge> & {
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
 * Attention the MIME types supported depend on the {@link TRecognitionTypeV1 | type of recognition}
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
type TJIIXV2RangeItem = {
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
type TJIIXV2Range = TJIIXV2RangeItem[];
/**
 * @group Exports
 */
type TJIIXV2Base = TJIIXBase & {
    range?: TJIIXV2Range;
};
/**
 * @group Exports
 */
type TJIIXV2ElementBase<T = TRecognitionTypeV2> = TJIIXV2Base & {
    id: string;
    type: T;
};
/**
 * @group Exports
 */
type TJIIXV2LineSpan = {
    type: string;
    range: TJIIXV2RangeItem[];
    label: string;
};
/**
 * @group Exports
 */
type TJIIXV2Line = {
    type: string;
    range: TJIIXV2RangeItem[];
    label: string;
    spans: TJIIXV2LineSpan[];
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix/#word-object | Word object}
 */
type TJIIXV2Expression = TJIIXV2Base & TJIIXWord & {
    lines: TJIIXV2Line[];
};
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix#text-interpretation | Text Element }
 */
type TJIIXV2TextElement = TJIIXV2ElementBase<"Text"> & TJIIXV2Expression;
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/jiix#text-interpretation | Math Element }
 */
type TJIIXV2MathElement = TJIIXV2ElementBase<"Math"> & TJIIXV2Expression;
/** @group Exports
 */
type TJIIXV2DrawingElement = TJIIXV2ElementBase<"Drawing"> & TJIIXV2Expression;
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
type TJIIXV2PolygonType = "triangle" | "isosceles triangle" | "right triangle" | "right isosceles triangle" | "equilateral triangle" | "quadrilateral" | "trapezoid" | "parallelogram" | "rhombus" | "rectangle" | "square";
/**
 * @group Exports
 */
type TJIIXV2ShapeItemBase<K = JIIXV2ShapeKind> = TJIIXV2ElementBase<K> & {
    kind: K;
};
/**
 * @group Exports
 */
type TJIIXV2EllipseBase<K = JIIXV2ShapeKind.Ellipse | JIIXV2ShapeKind.Circle> = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.Ellipse | JIIXV2ShapeKind.Circle> & {
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
type TJIIXV2Circle = TJIIXV2EllipseBase<JIIXV2ShapeKind.Circle>;
/**
 * @group Exports
 */
type TJIIXV2Ellipse = TJIIXV2EllipseBase<JIIXV2ShapeKind.Ellipse>;
/**
 * @group Exports
 */
type TJIIXV2PrimitiveArc = {
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
type TJIIXV2PrimitiveLine = {
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
type TJIIXV2PolygonBase<K = TJIIXV2PolygonType> = TJIIXV2ShapeItemBase<K> & {
    kind: K;
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type TJIIXV2ShapePolygon = TJIIXV2PolygonBase<JIIXV2ShapeKind.Polygon>;
/**
 * @group Exports
 */
type TJIIXV2ShapePolygonTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.Triangle>;
/**
 * @group Exports
 */
type TJIIXV2ShapePolygonIsoscelesTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.IsoscelesTriangle>;
/**
 * @group Exports
 */
type TJIIXV2ShapePolygonRightTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.RightTriangle>;
/**
 * @group Exports
 */
type TJIIXV2ShapePolygonRightIsoscelesTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.RightIsoscelesTriangle>;
/**
 * @group Exports
 */
type TJIIXV2ShapePolygonEquilateralTriangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.EquilateralTriangle>;
/**
 * @group Exports
 */
type TJIIXV2ShapePolygonQuadrilateral = TJIIXV2PolygonBase<JIIXV2ShapeKind.Quadrilateral>;
/**
 * @group Exports
 */
type TJIIXV2ShapePolygonTrapezoid = TJIIXV2PolygonBase<JIIXV2ShapeKind.Trapezoid>;
/**
 * @group Exports
 */
type TJIIXV2ShapePolygonParallelogram = TJIIXV2PolygonBase<JIIXV2ShapeKind.Parallelogram>;
/**
 * @group Exports
 */
type TJIIXV2ShapePolygonRhombus = TJIIXV2PolygonBase<JIIXV2ShapeKind.Rhombus>;
/**
 * @group Exports
 */
type TJIIXV2ShapePolygonRectangle = TJIIXV2PolygonBase<JIIXV2ShapeKind.Rectangle>;
/**
 * @group Exports
 */
type TJIIXV2ShapePolygonSquare = TJIIXV2PolygonBase<JIIXV2ShapeKind.Square>;
/**
 * @group Exports
 */
type TJIIXV2ShapeLine = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.Line> & {
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type TJIIXV2ShapeLineArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.Arrow> & {
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type TJIIXV2ShapeLineDoubleArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.DoubleArrow> & {
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type TJIIXV2ShapeLinePolyline = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.PolyLine> & {
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type TJIIXV2ShapeLinePolylineArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.PolylineArrow> & {
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type TJIIXV2ShapeLinePolylineDoubleArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.PolylineDoubleArrow> & {
    primitives: TJIIXV2PrimitiveLine[];
};
/**
 * @group Exports
 */
type TJIIXV2ShapeCurvedDoubleArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.CurvedDoubleArrow> & {
    primitives: TJIIXV2PrimitiveArc[];
};
/**
 * @group Exports
 */
type TJIIXV2ShapeCurvedArrow = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.CurvedArrow> & {
    primitives: TJIIXV2PrimitiveArc[];
};
/**
 * @group Exports
 */
type TJIIXV2ShapeArcOfEllipse = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.ArcOfEllipse> & {
    primitives: TJIIXV2PrimitiveArc[];
};
/**
 * @group Exports
 */
type TJIIXV2ShapeArcOfCircle = TJIIXV2ShapeItemBase<JIIXV2ShapeKind.ArcOfCircle> & {
    primitives: TJIIXV2PrimitiveArc[];
};
/**
 * @group Exports
 */
type TJIIXV2ShapeElement = TJIIXV2Circle | TJIIXV2Ellipse | TJIIXV2ShapePolygon | TJIIXV2ShapePolygonTriangle | TJIIXV2ShapePolygonIsoscelesTriangle | TJIIXV2ShapePolygonRightTriangle | TJIIXV2ShapePolygonRightIsoscelesTriangle | TJIIXV2ShapePolygonEquilateralTriangle | TJIIXV2ShapePolygonQuadrilateral | TJIIXV2ShapePolygonTrapezoid | TJIIXV2ShapePolygonParallelogram | TJIIXV2ShapePolygonRhombus | TJIIXV2ShapePolygonRectangle | TJIIXV2ShapePolygonSquare | TJIIXV2ShapeLineArrow | TJIIXV2ShapeLineDoubleArrow | TJIIXV2ShapeLinePolyline | TJIIXV2ShapeLinePolylineArrow | TJIIXV2ShapeLinePolylineDoubleArrow | TJIIXV2ShapeCurvedDoubleArrow | TJIIXV2ShapeCurvedArrow | TJIIXV2ShapeArcOfEllipse | TJIIXV2ShapeArcOfCircle | TJIIXV2ShapeLine;
/**
 * @group Exports
 * @remarks Only in InkRecognizer () activated with recognition.export.JIIXV2.range = true
 */
type TJIIXV2RawContentBase<T = TRecognitionTypeV2> = {
    type: T;
    range?: TJIIXV2Range;
};
/**
 * @group Exports
 */
type TJIIXV2RawContentItemText = TJIIXV2RawContentBase<"Text"> & TJIIXV2Expression;
/**
 * @group Exports
 */
type TJIIXV2RawContentTextLine = {
    type: "Line";
    label: string;
    range?: TJIIXV2RangeItem;
};
/**
 * @group Exports
 */
type TJIIXV2RawContentShape = TJIIXV2RawContentBase<"Shape"> & {
    label: string;
    shape: TJIIXV2RawContentItemShape[];
};
/**
 * @group Exports
 */
type TJIIXV2RawContentItemShape = TJIIXV2RawContentBase<"Shape"> & {
    range: TJIIXV2RangeItem[];
    elements: TJIIXV2ShapeElement[];
};
/**
 * @group Exports
 */
type TJIIXV2RawContentElement = TJIIXV2RawContentItemText | TJIIXV2RawContentItemShape;
/**
 * @group Exports
 * @remarks {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/web/JIIXV2 | Exports}
 */
type TJIIXV2Element = TJIIXV2TextElement | TJIIXV2ShapeElement | TJIIXV2MathElement | TJIIXV2DrawingElement | TJIIXV2RawContentElement;
/**
 * @group Exports
 */
type TJIIXV2Export = TJIIXV2Base & {
    type: string;
    id: string;
    version: string;
    elements?: TJIIXV2Element[];
    label?: string;
    words?: TJIIXV2Expression[];
};
/**
 * @group Exports
 * @remarks
 * List all supported MIME types for export.
 *
 * Attention the MIME types supported depend on the {@link TRecognitionTypeV1 | type of recognition}
 *
 * {@link https://developer.myscript.com/docs/interactive-ink/latest/reference/JIIXV2 | Documentation}
 */
type TExportV2 = {
    /** @hidden */
    [key: string]: unknown;
    /**
     * @remarks vnd.myscript.jiix is used for text and raw-content exports
     */
    "application/vnd.myscript.jiix"?: TJIIXV2Export;
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
declare class IIModel {
    #private;
    readonly creationTime: number;
    modificationDate: number;
    currentSymbol?: TSymbol;
    symbols: TSymbol[];
    exports?: TExport;
    rowHeight: number;
    idle: boolean;
    selectedIds: Set<string>;
    deletingIds: Set<string>;
    constructor(rowHeight?: number, creationDate?: number);
    get symbolsSelected(): TSymbol[];
    get symbolsDeleting(): TSymbol[];
    /**
     * Get all Text blocks from JIIX export
     * @returns Array of Text elements from the JIIX export, or empty array if no export available
     */
    get textBlocks(): TJIIXTextElement[];
    /**
     * Get all Math blocks from JIIX export
     * @returns Array of Math elements from the JIIX export, or empty array if no export available
     */
    get mathBlocks(): TJIIXMathElement[];
    selectSymbol(id: string): void;
    unselectSymbol(id: string): void;
    resetSelection(): void;
    getRootSymbol(id: string): TSymbol | undefined;
    getSymbolRowIndex(symbol: TSymbol): number;
    getSymbolsByRowOrdered(): {
        rowIndex: number;
        symbols: TSymbol[];
    }[];
    roundToLineGuide(y: number): number;
    isSymbolAbove(source: TSymbol, target: TSymbol): boolean;
    isSymbolInRow(source: TSymbol, target: TSymbol): boolean;
    isSymbolBelow(source: TSymbol, target: TSymbol): boolean;
    getFirstSymbol(symbols: TSymbol[]): TSymbol | undefined;
    getLastSymbol(symbols: TSymbol[]): TSymbol | undefined;
    addSymbol(symbol: TSymbol): void;
    updateSymbol(updatedSymbol: TSymbol): void;
    replaceSymbol(id: string, symbols: TSymbol[]): void;
    changeOrderSymbol(id: string, position: "first" | "last" | "forward" | "backward"): void;
    removeSymbol(id: string): void;
    extractDifferenceSymbols(model: IIModel): {
        added: TSymbol[];
        removed: TSymbol[];
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
    currentStroke?: TStroke;
    strokes: TStroke[];
    exports?: TExportV2;
    converts?: TExportV2;
    width: number;
    height: number;
    rowHeight: number;
    idle: boolean;
    deletingIds: Set<string>;
    constructor(width?: number, height?: number, rowHeight?: number, creationDate?: number);
    get strokesToDelete(): TStroke[];
    addStroke(stroke: TStroke): void;
    updateStroke(updatedStroke: TStroke): void;
    removeStroke(id: string): void;
    extractDifferenceStrokes(model: IModel): {
        added: TStroke[];
        removed: TStroke[];
    };
    mergeExport(exports: TExportV2): void;
    clone(): IModel;
    clear(): void;
}

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
    layer: "MODEL" | "CAPTURE";
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
    emitEndInitialization(): void;
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
type TRecognitionHTTPV1Configuration = {
    type: TRecognitionTypeV1;
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
    constructor(configuration?: TPartialDeep<TRecognizerHTTPV1Configuration>);
}

/**
 * @group Symbol
 * @deprecated Use {@link TStroke} from stroke/ for new code
 */
type TStrokeGroup = {
    penStyle: TPenStyle;
    strokes: Stroke[];
};
/**
 * @group Symbol
 * @deprecated Use {@link TStroke} with {@link RecognizerHTTPV2}
 */
type TStrokeGroupToSend = {
    penStyle?: string;
    strokes: {
        id: string;
        pointerType: string;
        x: number[];
        y: number[];
        t: number[];
        p: number[];
    }[];
};
/**
 * @group Recognizer
 * @deprecated Use {@link RecognizerHTTPV2} instead.
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
    constructor(config: TPartialDeep<TRecognizerHTTPV1Configuration>);
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
    type: TRecognitionTypeV2;
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
    constructor(configuration?: TPartialDeep<TRecognizerHTTPV2Configuration>);
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
    strokes: {
        id: string;
        pointerType: string;
        x: number[];
        y: number[];
        t: number[];
        p: number[];
    }[];
};
/**
 * @group Recognizer
 */
declare class RecognizerHTTPV2 {
    #private;
    configuration: RecognizerHTTPV2Configuration;
    constructor(config: TPartialDeep<TRecognizerHTTPV2Configuration>);
    get url(): string;
    get postConfig(): TRecognizerHTTPV2PostConfiguration;
    protected buildData(strokes: TStrokeMinimal[]): TRecognizerHTTPV2PostData;
    protected post(data: unknown, mimeType: string): Promise<unknown>;
    protected tryFetch(data: TRecognizerHTTPV2PostData, mimeType: string): Promise<TExportV2 | never>;
    protected getMimeTypes(requestedMimeTypes?: string[]): string[];
    send(strokes: TStrokeMinimal[], requestedMimeTypes?: string[]): Promise<TExportV2>;
}

/**
 * @group Utilities
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
 * @group Utilities
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
            "angle-unit"?: "deg" | "rad";
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
    constructor(configuration?: TPartialDeep<TRecognizerWebSocketConfiguration>);
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
    sourceType?: "UNDEFINED" | "API" | "API_GLOBAL" | "BLOCK" | "PREDEFINED";
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
type TRecognizerWebSocketMessageMathSolverRemoveVariableValue = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
    blockId: string;
    action: "remove-variable-value";
    result?: undefined;
};
/**
 * @group Recognizer
 */
type TMathVariableDefinition = {
    name: string;
    value: number;
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageMathSolverAsVariableDefinition = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
    blockId: string;
    action: "as-variable-definition";
    result: TMathVariableDefinition;
};
/**
 * @group Recognizer
 */
type TMathVariableDefinitionInfo = {
    value: number;
    sourceType: "UNDEFINED" | "API" | "API_GLOBAL" | "BLOCK" | "PREDEFINED";
    blockId: string;
};
/**
 * @group Recognizer
 */
type TMathVariableDefinitions = {
    name: string;
    definitions: TMathVariableDefinitionInfo[];
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageMathSolverGetVariableDefinitions = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
    action: "get-variable-definitions";
    result: TMathVariableDefinitions[];
};
/**
 * @group Recognizer
 */
type TRecognizerWebSocketMessageMathSolverResult = TRecognizerWebSocketMessageMathSolverAvailableActions | TRecognizerWebSocketMessageMathSolverGetDiagnostic | TRecognizerWebSocketMessageMathSolverNumericalComputation | TRecognizerWebSocketMessageMathSolverGetVariables | TRecognizerWebSocketMessageMathSolverSetVariableValue | TRecognizerWebSocketMessageMathSolverGetVariableValue | TRecognizerWebSocketMessageMathSolverGetEvaluables | TRecognizerWebSocketMessageMathSolverRemoveVariableValue | TRecognizerWebSocketMessageMathSolverAsVariableDefinition | TRecognizerWebSocketMessageMathSolverGetVariableDefinitions | TRecognizerWebSocketMessageMathSolverEvaluate;
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
    protected boundOpenCallback: () => void;
    protected boundCloseCallback: (evt: CloseEvent) => void;
    protected boundMessageCallback: (message: MessageEvent<string>) => void;
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
    protected availableActionsDeferred: Map<string, DeferredPromise<string[]>[]>;
    protected numericalComputationDeferred: Map<string, DeferredPromise<string>[]>;
    protected getDiagnosticDeferred: Map<string, DeferredPromise<string>[]>;
    protected getVariablesDeferred: Map<string, DeferredPromise<TMathVariable[]>[]>;
    protected setVariableValueDeferred: Map<string, DeferredPromise<void>[]>;
    protected getVariableValueDeferred: Map<string, DeferredPromise<number>[]>;
    protected removeVariableValueDeferred: Map<string, DeferredPromise<void>[]>;
    protected asVariableDefinitionDeferred: Map<string, DeferredPromise<TMathVariableDefinition>[]>;
    protected getVariableDefinitionsDeferred: DeferredPromise<TMathVariableDefinitions[]>[];
    protected getEvaluablesDeferred: Map<string, DeferredPromise<TMathEvaluable[]>[]>;
    protected evaluateDeferred: Map<string, DeferredPromise<number[][]>[]>;
    configuration: RecognizerWebSocketConfiguration;
    initialized: DeferredPromise<void>;
    url: string;
    event: RecognizerEvent;
    constructor(config: TPartialDeep<TRecognizerWebSocketConfiguration>, event?: RecognizerEvent);
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
    protected resolveFirstInQueue<T>(map: Map<string, DeferredPromise<T>[]>, blockId: string | undefined, value?: T): void;
    protected manageMathSolverResult(mathSolverMessage: TRecognizerWebSocketMessageMathSolverResult): void;
    protected messageCallback(message: MessageEvent<string>): void;
    newSession(config: TPartialDeep<TRecognizerWebSocketConfiguration>): Promise<void>;
    init(): Promise<void>;
    send(message: TRecognizerWebSocketMessage): Promise<void>;
    protected buildAddStrokesMessage(strokes: TStroke[], processGestures?: boolean): TRecognizerWebSocketMessage;
    addStrokes(strokes: TStroke[], processGestures?: boolean): Promise<TRecognizerWebSocketMessageGesture | undefined>;
    getAvailableActions(blockId: string): Promise<string[]>;
    getNumericalComputation(blockId: string): Promise<TJIIXMathElement>;
    getDiagnostic(blockId: string, task: string): Promise<string>;
    getVariables(blockId: string): Promise<TMathVariable[]>;
    getVariableValue(blockId: string, variableName: string): Promise<number>;
    setVariableValue(blockId: string, variableName: string, variableValue: number): Promise<void>;
    removeVariableValue(blockId: string, variableName: string): Promise<void>;
    asVariableDefinition(blockId: string): Promise<TMathVariableDefinition>;
    getVariableDefinitions(): Promise<TMathVariableDefinitions[]>;
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
    protected buildReplaceStrokesMessage(oldStrokeIds: string[], newStrokes: TStroke[]): TRecognizerWebSocketMessage;
    replaceStrokes(oldStrokeIds: string[], newStrokes: TStroke[]): Promise<void>;
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
    recognizeGesture(stroke: TStroke): Promise<TRecognizerWebSocketMessageContextlessGesture | undefined>;
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
    type: Omit<TRecognitionTypeV1, "DIAGRAM" | "Raw Content">;
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
    constructor(configuration?: TPartialDeep<TRecognizerWebSocketSSRConfiguration>);
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
    protected boundOpenCallback: () => void;
    protected boundCloseCallback: (evt: CloseEvent) => void;
    protected boundMessageCallback: (message: MessageEvent<string>) => void;
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
    constructor(config?: TPartialDeep<TRecognizerWebSocketSSRConfiguration>);
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
 * @group Editor
 */
type TEditorLayerUIState = {
    root: HTMLDivElement;
    busy: HTMLDivElement;
};
/**
 * @group Editor
 */
type TEditorLayerUI = {
    root: HTMLDivElement;
    loader: HTMLDivElement;
    state: TEditorLayerUIState;
};
/**
 * @group Editor
 */
declare class EditorLayer {
    #private;
    root: HTMLElement;
    ui: TEditorLayerUI;
    rendering: HTMLElement;
    onCloseModal?: (inError?: boolean) => void;
    constructor(root: HTMLElement, rootClassCss?: string);
    render(): void;
    createLoader(): HTMLDivElement;
    showLoader(): void;
    hideLoader(): void;
    clearModal(): void;
    showMessageInfo(notif: {
        message: string;
        timeout?: number;
    }): void;
    showMessageError(err: Error | string): void;
    createBusy(): HTMLDivElement;
    createState(): TEditorLayerUIState;
    showState(): void;
    hideState(): void;
    updateState(idle: boolean): void;
    createLayerUI(): TEditorLayerUI;
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
type TEditorType = "INTERACTIVEINK" | "INKV1" | "INTERACTIVEINKSSR" | "INKV2";
/**
 * @hidden
 * @group Editor
 */
type TEditorOptionsBase = {
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
    /** Logger instance for this editor. */
    logger: Logger;
    /** DOM layer manager handling rendering, UI, and modal elements. */
    layers: EditorLayer;
    /** Event bus for subscribing to editor lifecycle and content events. */
    event: EditorEvent;
    /** Server API information (version, etc.) loaded on first connection. */
    info?: TApiInfos;
    constructor(rootElement: HTMLElement, options?: TPartialDeep<TEditorOptionsBase>);
    get loggerConfiguration(): TLoggerConfiguration;
    set loggerConfiguration(loggerConfig: TLoggerConfiguration);
    abstract initialize(): Promise<void>;
    abstract clear(): Promise<void>;
    abstract destroy(): Promise<void>;
    abstract resize(dims?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    protected startResizeObserver(): void;
    protected stopResizeObserver(): void;
    loadInfo(server: TServerHTTPConfiguration): Promise<TApiInfos>;
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
type TPointerInfo = {
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
    onPointerDown?: (info: TPointerInfo) => void;
    onPointerMove?: (info: TPointerInfo) => void;
    onPointerUp?: (info: TPointerInfo) => void;
    onContextMenu?: (info: TPointerInfo) => void;
    constructor(configuration: TGrabberConfiguration);
    protected roundFloat(oneFloat: number, requestedFloatPrecision: number): number;
    protected extractPointer(event: MouseEvent | TouchEvent): TPointer;
    protected getPointerInfos(evt: PointerEvent): TPointerInfo;
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
 * @group Renderer
 * @summary Base renderer configuration interface
 *
 * Common configuration properties required by all renderer implementations.
 */
type TBaseRendererConfiguration = {
    minWidth: number;
    minHeight: number;
};
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
    draw(context2D: CanvasRenderingContext2D, symbol: TBaseSymbol): void;
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
    draw(context2D: CanvasRenderingContext2D, symbol: TBaseSymbol): void;
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
    protected drawSymbol(context2D: CanvasRenderingContext2D, symbol: TBaseSymbol): void;
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
    buildElementFromSymbol(symbol: TSymbol): SVGGraphicsElement | undefined;
    prependElement(el: Element): void;
    changeOrderSymbol(symbolToMove: TSymbol, position: "first" | "last" | "forward" | "backward"): void;
    appendElement(el: Element): void;
    removeElement(id: string): void;
    drawSymbol(symbol: TSymbol | TEraser): SVGGraphicsElement | undefined;
    updateSelectedState(symbol: TSymbol, isSelected: boolean): void;
    updateDeletingState(symbol: TSymbol, isDeleting: boolean): void;
    replaceSymbol(id: string, symbols: TSymbol[]): SVGGraphicsElement[] | undefined;
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
declare class SVGStroker {
    protected getArcPath(center: TPointer, radius: number): string;
    protected getLinePath(begin: TPointer, end: TPointer, width: number): string;
    protected getFinalPath(begin: TPointer, end: TPointer, width: number): string;
    protected getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string;
    protected buildSVGPath(stroke: TLegacyStroke): string;
    drawStroke(svgElement: SVGElement, stroke: TLegacyStroke, attrs?: {
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
    protected drawStroke(svgElement: SVGElement, stroke: TLegacyStroke): void;
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
    drawPendingStroke(stroke: TLegacyStroke): void;
    clearErasingStrokes(): void;
    resize(model: Model): void;
    destroy(): void;
}

/**
 * @group SymbolUtils
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
    static createText(p: TPoint, text: string, attrs?: {
        [key: string]: string;
    }): SVGTextElement;
}

/**
 * @group Renderer
 */
declare const SVGRendererConst: {
    selectionFilterId: string;
    removalFilterId: string;
    crossMarker: string;
    noSelection: string;
};
/**
 * Common SVG path attribute presets for guide rendering
 * @group Renderer
 */
declare const GUIDE_PATH_ATTRS: {
    readonly "stroke-width": "1";
    readonly stroke: "grey";
    readonly fill: "none";
};
/**
 * Common SVG path attribute presets for sub-guide rendering
 * @group Renderer
 */
declare const SUB_GUIDE_PATH_ATTRS: {
    readonly "stroke-width": "0.25";
    readonly stroke: "grey";
    readonly fill: "none";
};

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
    constructor(configuration?: TPartialDeep<InkEditorConfiguration>);
}

/**
 * @group Editor
 */
type TInkEditorOptions = TPartialDeep<TEditorOptionsBase & {
    configuration: TInkEditorConfiguration;
}> & {
    override?: {
        grabber?: PointerEventGrabber;
        recognizer?: RecognizerHTTPV2;
    };
};
/**
 * @group Editor
 * @remarks InkEditor is the core editor variant focused on freeform ink input, rendering, and recognition. It provides a rich API for managing strokes, exports, and editor state, and serves as the foundation for more specialized editor variants.
 *
 * Key features include:
 * - Stroke management: Add, remove, and style ink strokes with real-time rendering.
 * - Recognition integration: Seamlessly send ink data to the recognizer and handle results.
 * - Export capabilities: Support for exporting recognized content in various formats.
 * - History management: Undo/redo functionality for stroke modifications and exports.
 * - Tool support: Built-in tools for writing and erasing with customizable styles.
 *
 * The InkEditor is designed for extensibility, allowing developers to override core components like the recognizer or input grabber for custom behavior.
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
    set penStyle(penStyle: TPartialDeep<TStyle>);
    get initializationPromise(): Promise<void>;
    get tool(): EditorTool;
    set tool(i: EditorTool);
    get model(): IModel;
    get configuration(): InkEditorConfiguration;
    initialize(): Promise<void>;
    updateSymbolsStyle(symbolIds: string[], style: TPartialDeep<TStyle>): void;
    export(requestedMimeTypes?: string[]): Promise<TExportV2>;
    resize({ height, width, }?: {
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
declare abstract class AbstractWriterManager {
    #private;
    grabber: PointerEventGrabber;
    editor: TInteractiveInkEditor | InkEditor;
    currentSymbol?: TSymbol;
    detectGesture: boolean;
    constructor(editor: TInteractiveInkEditor | InkEditor);
    get renderer(): SVGRenderer;
    attach(layer: HTMLElement): void;
    detach(): void;
    protected abstract createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TSymbol;
    protected abstract updateCurrentSymbol(pointer: TPointer): TSymbol;
    start(info: TPointerInfo): void;
    continue(info: TPointerInfo): void;
    abstract end(info: TPointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
declare class ColorPaletteManager {
    #private;
    private static instance;
    private static readonly EXCEL_PALETTE;
    private constructor();
    static getInstance(): ColorPaletteManager;
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
 * @group Manager
 */
type THittable = {
    bounds: TOBB;
    vertices: TPoint[];
    edges: TSegment[];
};
/**
 * @group Manager
 */
declare class EraseManager {
    #private;
    grabber: PointerEventGrabber;
    editor: TInteractiveInkEditor | InkEditor;
    eraserWidth: number;
    currentEraser?: TEraser;
    charsToDelete: Map<string, Set<string>>;
    constructor(editor: TInteractiveInkEditor | InkEditor);
    get renderer(): SVGRenderer;
    attach(layer: HTMLElement): void;
    detach(): void;
    start(info: TPointerInfo): void;
    continue(info: TPointerInfo): void;
    end(info: TPointerInfo): Promise<void>;
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
    constructor(configuration?: TPartialDeep<TInkEditorDeprecatedConfiguration>);
}

/**
 * @group Editor
 */
type TInkEditorDeprecatedOptions = TPartialDeep<TEditorOptionsBase & {
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
    protected onPointerDown(info: TPointerInfo): void;
    protected onPointerMove(info: TPointerInfo): void;
    protected onPointerUp(info: TPointerInfo): Promise<void>;
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
    set theme(theme: TPartialDeep<TTheme>);
    get configuration(): InkEditorDeprecatedConfiguration;
    initialize(): Promise<void>;
    drawCurrentStroke(): void;
    updateModelRendering(): Promise<Model>;
    export(mimeTypes?: string[]): Promise<Model>;
    convert(params?: {
        conversionState?: TConverstionState;
        mimeTypes?: string[];
    }): Promise<Model>;
    importPointEvents(strokes: TPartialDeep<TLegacyStroke>[]): Promise<Model>;
    resize({ height, width, }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    clear(): Promise<void>;
    destroy(): Promise<void>;
}

/**
 * Predefined editor themes — passed to `editor.setCssVars()`.
 * `vars: undefined` resets to the stylesheet defaults.
 * @group Editor
 */
type TEditorTheme = {
    id: string;
    label: string;
    /** Representative accent color shown as a swatch in the picker */
    swatch: string;
    /** Primary color used for labels and highlights */
    color: string;
    vars: Record<string, string> | undefined;
};
/** @group Editor */
declare const THEME_STORAGE_KEY = "iink-editor-theme";
/** @group Editor */
declare class EditorThemes {
    static EDITOR_THEMES: TEditorTheme[];
    static THEME_STORAGE_KEY: string;
    static getSavedThemeId(): string;
    static saveThemeId(id: string): void;
    static getThemeById(id: string): TEditorTheme;
}

/**
 * @group Menu
 * @remarks Base type for menu items
 */
type TMenuItemBase = {
    id: string;
    label?: string;
    disabled?: boolean | ((editor: TInteractiveInkEditor) => boolean);
    visible?: boolean | ((editor: TInteractiveInkEditor) => boolean);
};
/**
 * @group Menu
 * @remarks Union type for all menu types
 */
type TGenericMenuItem = TMenuItemBase & {
    type: string;
};
/**
 * @group Menu
 * @remarks Base class for all menu items
 */
declare abstract class BaseMenuItem<T extends HTMLElement = HTMLElement> {
    protected logger: Logger;
    protected config: TGenericMenuItem;
    protected editor: TInteractiveInkEditor;
    protected element?: T;
    protected get dom(): typeof DOMFactory;
    constructor(config: TGenericMenuItem, editor: TInteractiveInkEditor);
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
type TMenuButton = TMenuItemBase & {
    type: "button";
    icon?: string;
    action: (editor: TInteractiveInkEditor) => void | Promise<void>;
};
/**
 * @group Menu
 * @remarks Class for buttons
 */
declare class ButtonMenuItem extends BaseMenuItem<HTMLButtonElement> {
    protected config: TMenuButton;
    createElement(): HTMLButtonElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Menu action Clear
 */
declare class ClearMenuAction extends ButtonMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu action Convert
 */
declare class ConvertMenuAction extends ButtonMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Configuration for a button list (S, M, L, XL)
 */
type TMenuButtonList = TMenuItemBase & {
    type: "buttonlist";
    buttonType?: "square" | "round";
    options: Array<{
        label: string;
        value: string;
    }>;
    getValue: (editor: TInteractiveInkEditor) => string;
    setValue: (editor: TInteractiveInkEditor, value: string) => void;
};
/**
 * @group Menu
 * @remarks Class for button lists
 */
declare class ButtonListMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: TMenuButtonList;
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a checkbox
 */
type TMenuCheckbox = TMenuItemBase & {
    type: "checkbox";
    getValue: (editor: TInteractiveInkEditor) => boolean;
    setValue: (editor: TInteractiveInkEditor, value: boolean) => void;
};
/**
 * @group Menu
 * @remarks Class for checkboxes
 */
declare class CheckboxMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: TMenuCheckbox;
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a file input with a validation button
 */
type TMenuFileInput = TMenuItemBase & {
    type: "fileinput";
    accept?: string;
    multiple?: boolean;
    buttonLabel?: string;
    action: (editor: TInteractiveInkEditor, files: FileList) => void | Promise<void>;
};
/**
 * @group Menu
 * @remarks Menu item for selecting and validating a file
 */
declare class FileInputMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: TMenuFileInput;
    private inputElement;
    private buttonElement;
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a range input menu item
 */
type TMenuRange = TMenuItemBase & {
    type: "range";
    min: number;
    max: number;
    unit?: string;
    step: number;
    initValue?: number;
    onChange: (value: number, editor: TInteractiveInkEditor) => void;
};
/**
 * @group Menu
 * @remarks Class for range input menu items (slider)
 */
declare class RangeMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: TMenuRange;
    private currentValue;
    private input?;
    private output?;
    constructor(config: TMenuRange, editor: TInteractiveInkEditor);
    createElement(): HTMLDivElement;
    getValue(): number;
    setValue(value: number): void;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration for a select/dropdown menu item
 */
type TMenuSelect = TMenuItemBase & {
    type: "select";
    options: Array<{
        label: string;
        value: string;
    }>;
    getValue: (editor: TInteractiveInkEditor) => string;
    setValue: (editor: TInteractiveInkEditor, value: string) => void;
};
/**
 * @group Menu
 * @remarks Class for select/dropdown menu items
 */
declare class SelectMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: TMenuSelect;
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
type TSubMenuItems = TMenuButton | TMenuCheckbox | TMenuSelect | TMenuButtonList | TMenuFileInput | TMenuRange;
/**
 * @group Menu
 * @remarks Submenu configuration
 */
type TMenuSubMenu = TMenuItemBase & {
    type: "submenu";
    icon?: string;
    position?: TMenuPosition;
    menuTitle?: string;
    items: (TSubMenuItems | TMenuSubMenu)[];
};
/**
 * @group Menu
 * @remarks Class for submenu items
 */
declare class SubMenuItem extends BaseMenuItem<HTMLDivElement> {
    #private;
    protected config: TMenuSubMenu;
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

/** @group Menu */
type TExportActionItemsConfig = {
    json?: boolean;
    svg?: boolean;
    png?: boolean;
    text?: boolean;
};
/** @group Menu */
type TExportActionConfig = boolean | TExportActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action Export - Export en différents formats
 */
declare class ExportMenuAction extends SubMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string, itemsConfig?: TExportActionItemsConfig);
}

/** @group Menu */
type TGestureActionItemsConfig = {
    detect?: boolean;
    surround?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    insert?: boolean;
};
/** @group Menu */
type TGestureActionConfig = boolean | TGestureActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action Gesture - Détection et actions de gestes
 */
declare class GestureMenuAction extends SubMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string, itemsConfig?: TGestureActionItemsConfig);
}

/** @group Menu */
type TGuideActionItemsConfig = {
    enable?: boolean;
    type?: boolean;
    size?: boolean;
};
/** @group Menu */
type TGuideActionConfig = boolean | TGuideActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action Guide - Configuration des guides
 */
declare class GuideMenuAction extends SubMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string, itemsConfig?: TGuideActionItemsConfig);
}

/**
 * @group Menu
 * @remarks Menu action Import - Import de fichiers JSON
 */
declare class ImportMenuAction extends SubMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
    private readFileAsText;
}

/**
 * @group Menu
 * @remarks Menu action Language - Sélection de la langue
 */
declare class LanguageMenuAction extends BaseMenuItem<HTMLDivElement> {
    #private;
    private select;
    private subMenuWrapper;
    private subMenuContent;
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLDivElement;
    destroy(): void;
    /**
     * Wraps/unwraps according to screen size (mobile)
     */
    wrap(): void;
    unwrap(): void;
    update(): void;
}

/** @group Menu */
type TMathActionItemsConfig = {
    autoCompute?: boolean;
    resultMode?: boolean;
    resultColor?: boolean;
    showDependencies?: boolean;
    highlightOnSelect?: boolean;
    editVariables?: boolean;
    capabilities?: boolean;
    selectResultStrokes?: boolean;
    deleteResultStrokes?: boolean;
};
/** @group Menu */
type TMathActionConfig = boolean | TMathActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action for Math visualization and interaction controls
 */
declare class MathMenuAction extends SubMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string, itemsConfig?: TMathActionItemsConfig);
}

/**
 * @group Menu
 * @remarks Menu action to toggle the minimap overlay
 */
declare class MinimapMenuAction extends ButtonMenuItem {
    #private;
    constructor(editor: TInteractiveInkEditor, layer: HTMLElement, idPrefix?: string);
    update(): void;
    destroy(): void;
}

/** @group Menu */
type TOverlayActionItemsConfig = {
    showBlockOverlays?: boolean;
    badgeSize?: boolean;
    borderWidth?: boolean;
    labelMaxChars?: boolean;
    labelFontSize?: boolean;
};
/** @group Menu */
type TOverlayActionConfig = boolean | TOverlayActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action for overlay configuration (block overlays badge/border)
 */
declare class OverlayMenuAction extends SubMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string, itemsConfig?: TOverlayActionItemsConfig);
}

/** @group Menu */
type TSelectionActionItemsConfig = {
    text?: boolean;
    math?: boolean;
    shape?: boolean;
};
/** @group Menu */
type TSelectionActionConfig = boolean | TSelectionActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action for configuring selection granularity (text, math and shape levels)
 */
declare class SelectionMenuAction extends SubMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string, itemsConfig?: TSelectionActionItemsConfig);
}

/** @group Menu */
type TSnapActionItemsConfig = {
    guide?: boolean;
    element?: boolean;
    angle?: boolean;
};
/** @group Menu */
type TSnapActionConfig = boolean | TSnapActionItemsConfig;
/**
 * @group Menu
 * @remarks Menu action Snap - Configuration du snap
 */
declare class SnapMenuAction extends SubMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string, itemsConfig?: TSnapActionItemsConfig);
}

/**
 * Sub-menu action for switching predefined editor themes.
 * Selected theme is persisted to localStorage.
 * @group Menu
 */
declare class ThemeMenuAction extends SubMenuItem {
    private themes;
    private currentThemeId;
    private themeItems;
    constructor(editor: TInteractiveInkEditor, idPrefix?: string, themes?: TEditorTheme[]);
    createElement(): HTMLDivElement;
    private buildThemeItems;
    private applyTheme;
    private applyStoredTheme;
    private updateActiveItem;
    update(): void;
}

/**
 * @group Menu
 * @remarks Menu action Undo/Redo groupé
 */
declare class UndoRedoMenuAction extends BaseMenuItem<HTMLDivElement> {
    private undoButton;
    private redoButton;
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
}

/**
 * @group Menu
 * @remarks Menu action Zoom (In + Level + Out)
 */
declare class ZoomMenuAction extends BaseMenuItem<HTMLDivElement> {
    private zoomInButton;
    private zoomLevelButton;
    private zoomOutButton;
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLDivElement;
    private updateZoomLevel;
    update(): void;
}

/**
 * @group Menu
 * @remarks Configuration to enable/disable each action menu individually.
 * Sub-menus accept `boolean` to show/hide entirely, or an object to configure individual items.
 */
type TMenuActionConfig = {
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
    /** Enable/disable Gesture submenu. Pass an object to configure individual gesture items. */
    gesture?: TGestureActionConfig;
    /** Enable/disable Guide submenu. Pass an object to configure individual guide items. */
    guide?: TGuideActionConfig;
    /** Enable/disable Snap submenu. Pass an object to configure individual snap items. */
    snap?: TSnapActionConfig;
    /** Enable/disable Math submenu. Pass an object to configure individual math items. */
    math?: TMathActionConfig;
    /** Enable/disable Overlay submenu. Pass an object to configure individual overlay items. */
    overlay?: TOverlayActionConfig;
    /** Enable/disable Selection submenu. Pass an object to configure individual selection items. */
    selection?: TSelectionActionConfig;
    /** Enable/disable Export submenu. Pass an object to configure individual export formats. */
    export?: TExportActionConfig;
    /** Enable/disable Import submenu */
    import?: boolean;
    /** Enable/disable Minimap toggle button */
    minimap?: boolean;
    /** Enable/disable Theme picker */
    theme?: boolean;
    /** Override predefined themes shown in the theme picker */
    themes?: TEditorTheme[];
};
/** @group Menu */
declare const DefaultMenuActionConfig: Required<Omit<TMenuActionConfig, "themes">>;
/**
 * @group Menu
 */
declare class IIMenuAction {
    #private;
    editor: TInteractiveInkEditor;
    id: string;
    wrapper?: HTMLElement;
    config: Required<Omit<TMenuActionConfig, "themes">> & Pick<TMenuActionConfig, "themes">;
    private menuActions;
    constructor(editor: TInteractiveInkEditor, id?: string, config?: TMenuActionConfig);
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
 * @remarks Menu contextuel Convert - Convertit les symboles sélectionnés
 */
declare class ConvertContextMenu extends ButtonMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
}

/** @group Menu */
type TContextDecoratorItemsConfig = {
    highlight?: boolean;
    surround?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
};
/** @group Menu */
type TContextDecoratorConfig = boolean | TContextDecoratorItemsConfig;
/**
 * @group Menu
 * @remarks Menu contextuel Decorator - Décore les symboles sélectionnés
 */
declare class DecoratorContextMenu extends BaseMenuItem<HTMLElement> {
    #private;
    protected config: TGenericMenuItem & {
        idPrefix: string;
    };
    constructor(editor: TInteractiveInkEditor, idPrefix?: string, itemsConfig?: TContextDecoratorItemsConfig);
    get symbolsDecorable(): TText[];
    get showDecorator(): boolean;
    get hasSingleMathSymbol(): boolean;
    protected createDecoratorSubMenu(label: string, kind: DecoratorKind): HTMLElement;
    createElement(): HTMLElement;
    destroy(): void;
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
 * @remarks Configuration for a color list menu item
 */
type TMenuColorList = TMenuItemBase & {
    type: "colorlist";
    colors: string[];
    fill: boolean;
    initValue?: string;
    onChange: (color: string, editor: TInteractiveInkEditor) => void;
};
/**
 * @group Menu
 * @remarks Class for color list menu items
 */
declare class ColorListMenuItem extends BaseMenuItem<HTMLDivElement> {
    protected config: TMenuColorList;
    private currentValue;
    constructor(config: TMenuColorList, editor: TInteractiveInkEditor);
    createElement(): HTMLDivElement;
    getValue(): string;
    setValue(color: string): void;
    update(): void;
}

/**
 * @group Menu
 * @remarks Type union enriched with all menu item types
 */
type TAllMenuItems = TSubMenuItems | TMenuSubMenu | TMenuColorList | TMenuRange | TMenuFileInput;
/**
 * @group Menu
 * @remarks Factory function to create an instance of the appropriate menu item class
 */
declare function createMenuItemInstance(config: TAllMenuItems, editor: TInteractiveInkEditor): BaseMenuItem;

/**
 * @group Menu
 * @remarks Menu contextuel Duplicate - Duplique les symboles sélectionnés
 */
declare class DuplicateContextMenu extends ButtonMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Menu contextuel Edit - Édite le texte sélectionné
 */
declare class EditContextMenu extends BaseMenuItem<HTMLElement> {
    #private;
    protected config: TGenericMenuItem;
    editInput?: HTMLInputElement;
    editSaveBtn?: HTMLButtonElement;
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLElement;
    destroy(): void;
    update(): void;
}

/** @group Menu */
type TContextExportItemsConfig = {
    json?: boolean;
    svg?: boolean;
    png?: boolean;
    text?: boolean;
};
/** @group Menu */
type TContextExportConfig = boolean | TContextExportItemsConfig;
/**
 * @group Menu
 * @remarks Menu contextuel Export - Exporte les symboles sélectionnés
 */
declare class ExportContextMenu extends SubMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string, itemsConfig?: TContextExportItemsConfig);
}

/** @group Menu */
type TContextMathItemsConfig = {
    checkDiagnostic?: boolean;
    editVariables?: boolean;
    compute?: boolean;
    evaluate?: boolean;
    manageResultStrokes?: boolean;
};
/** @group Menu */
type TContextMathConfig = boolean | TContextMathItemsConfig;
/**
 * @group Menu
 * @remarks Menu contextuel Math - Opérations mathématiques sur les symboles
 */
declare class MathContextMenu extends SubMenuItem {
    protected logger: Logger;
    readonly id: string;
    readonly idEditVariables: string;
    readonly idNumericalComputation: string;
    readonly idCheckDiagnostic: string;
    readonly idEvaluate: string;
    readonly idSelectResultStrokes: string;
    readonly idDeleteResultStrokes: string;
    constructor(editor: TInteractiveInkEditor, idPrefix?: string, itemsConfig?: TContextMathItemsConfig);
    setMenuVisibility(show: boolean, { canEditVariables, canCompute, canEvaluate, hasDrawSolverOutputs, }: {
        canEditVariables: boolean;
        canCompute: boolean;
        canEvaluate: boolean;
        hasDrawSolverOutputs?: boolean;
    }): void;
}

/**
 * @group Menu
 * @remarks Menu contextuel Remove - Supprime les symboles sélectionnés
 */
declare class RemoveContextMenu extends ButtonMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
}

/** @group Menu */
type TContextReorderItemsConfig = {
    front?: boolean;
    forward?: boolean;
    backward?: boolean;
    back?: boolean;
};
/** @group Menu */
type TContextReorderConfig = boolean | TContextReorderItemsConfig;
/**
 * @group Menu
 * @remarks Menu contextuel Reorder - Réordonne les symboles sélectionnés
 */
declare class ReorderContextMenu extends SubMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string, itemsConfig?: TContextReorderItemsConfig);
}

/**
 * @group Menu
 * @remarks Menu contextuel Select All - Sélectionne tous les symboles
 */
declare class SelectAllContextMenu extends ButtonMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
}

/**
 * @group Menu
 * @remarks Configuration to enable/disable each context menu individually.
 * Sub-menus accept `boolean` to show/hide entirely, or an object to configure individual items.
 */
type TMenuContextConfig = {
    /** Enable/disable Edit menu */
    edit?: boolean;
    /** Enable/disable Decorator menu. Pass an object to configure individual decorator types. */
    decorator?: TContextDecoratorConfig;
    /** Enable/disable Reorder menu. Pass an object to configure individual reorder actions. */
    reorder?: TContextReorderConfig;
    /** Enable/disable Export menu. Pass an object to configure individual export formats. */
    export?: TContextExportConfig;
    /** Enable/disable Convert menu */
    convert?: boolean;
    /** Enable/disable Math menu. Pass an object to configure individual math operations. */
    math?: TContextMathConfig;
    /** Enable/disable Group menu */
    group?: boolean;
    /** Enable/disable Duplicate menu */
    duplicate?: boolean;
    /** Enable/disable Remove menu */
    remove?: boolean;
    /** Enable/disable Select All menu */
    selectAll?: boolean;
};
/** @group Menu */
declare const DefaultMenuContextConfig: Required<TMenuContextConfig>;
/**
 * @group Menu
 */
declare class IIMenuContext {
    #private;
    editor: TInteractiveInkEditor;
    id: string;
    wrapper?: HTMLElement;
    config: Required<TMenuContextConfig>;
    private contextMenus;
    position: {
        x: number;
        y: number;
    };
    constructor(editor: TInteractiveInkEditor, id?: string, config?: TMenuContextConfig);
    get symbolsSelected(): TSymbol[];
    get haveSymbolsSelected(): boolean;
    get symbolsDecorable(): (TStroke | TText)[];
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
 * @remarks Configuration to enable/disable each style element individually
 */
type TMenuStyleConfig = {
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
};
/** @group Menu */
declare const DefaultMenuStyleConfig: Required<TMenuStyleConfig>;
/**
 * @group Menu
 */
declare class IIMenuStyle {
    #private;
    editor: TInteractiveInkEditor;
    id: string;
    wrapper?: HTMLDivElement;
    config: Required<TMenuStyleConfig>;
    triggerBtn?: HTMLButtonElement;
    subMenuWrapper?: HTMLDivElement;
    subMenuContent?: HTMLDivElement;
    private styleItems;
    constructor(editor: TInteractiveInkEditor, id?: string, config?: TMenuStyleConfig);
    get model(): IIModel;
    get symbolsSelected(): TSymbol[];
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
 * @remarks Configuration to enable/disable each tool individually
 */
type TMenuToolConfig = {
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
};
/** @group Menu */
declare const DefaultMenuToolConfig: Required<TMenuToolConfig>;
/**
 * @group Menu
 */
declare class IIMenuTool {
    #private;
    editor: TInteractiveInkEditor;
    id: string;
    wrapper?: HTMLDivElement;
    config: Required<TMenuToolConfig>;
    private menuTools;
    constructor(editor: TInteractiveInkEditor, id?: string, config?: TMenuToolConfig);
    render(layer: HTMLElement): void;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Partial config accepted by {@link IIMenuManager.setConfig} after initial load.
 */
type TMenuConfigUpdate = {
    enable?: boolean;
    style?: TMenuStyleConfig & {
        enable?: boolean;
    };
    tool?: TMenuToolConfig & {
        enable?: boolean;
    };
    action?: TMenuActionConfig & {
        enable?: boolean;
    };
    context?: TMenuContextConfig & {
        enable?: boolean;
    };
};
/**
 * @group Manager
 */
declare class IIMenuManager {
    #private;
    editor: TInteractiveInkEditor;
    layer?: HTMLElement;
    action: IIMenuAction;
    tool: IIMenuTool;
    context: IIMenuContext;
    style: IIMenuStyle;
    constructor(editor: TInteractiveInkEditor, custom?: {
        style?: IIMenuStyle;
        tool?: IIMenuTool;
        action?: IIMenuAction;
        context?: IIMenuContext;
    });
    render(layer: HTMLElement): void;
    /**
     * Update menu configuration at runtime and re-render affected sections.
     * Merges deeply into the current config — omitted keys keep their current value.
     * @example
     * // Hide only PNG and text export
     * editor.menu.setConfig({ action: { export: { png: false, text: false } } })
     * // Disable the entire action menu
     * editor.menu.setConfig({ action: { enable: false } })
     */
    setConfig(config: TMenuConfigUpdate): void;
    update(): void;
    show(): void;
    hide(): void;
    destroy(): void;
}

/**
 * @group Menu
 */
type TMenuConfiguration = {
    enable: boolean;
    style: TMenuStyleConfig & {
        enable: boolean;
    };
    tool: TMenuToolConfig & {
        enable: boolean;
    };
    action: TMenuActionConfig & {
        enable: boolean;
    };
    context: TMenuContextConfig & {
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
 * @remarks Default eraser size values (diameter in px)
 */
declare const DEFAULT_ERASER_SIZE_LIST: {
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
 * @group Menu
 * @remarks Fill color style menu
 */
declare class FillColorStyle extends BaseMenuItem<HTMLDivElement> {
    private colorItem?;
    private colors;
    constructor(editor: TInteractiveInkEditor, colors: string[], idPrefix?: string);
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
    constructor(editor: TInteractiveInkEditor, fontSizeList: {
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
    constructor(editor: TInteractiveInkEditor, fontWeightList: {
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
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Stroke color style menu
 */
declare class StrokeColorStyle extends BaseMenuItem<HTMLDivElement> {
    private colorItem?;
    private colors;
    constructor(editor: TInteractiveInkEditor, colors: string[], idPrefix?: string);
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
    constructor(editor: TInteractiveInkEditor, thicknessList: {
        label: string;
        value: number;
    }[], idPrefix?: string);
    createElement(): HTMLDivElement;
    update(): void;
    destroy(): void;
}

/**
 * @group Menu
 * @remarks Edge tool - Sub-menu for lines and arrows
 */
declare class EdgeTool extends BaseMenuItem<HTMLDivElement> {
    #private;
    private subMenuButtons;
    private triggerButton?;
    private currentIcon;
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
    private createEdgeButton;
    createElement(): HTMLDivElement;
    destroy(): void;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Erase tool - Element erasure with configurable size
 */
declare class EraseTool extends BaseMenuItem<HTMLDivElement> {
    #private;
    private sizeButtons;
    private triggerButton?;
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
    private createEraserSizeIcon;
    private createSizeButton;
    createElement(): HTMLDivElement;
    destroy(): void;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Move tool - View movement
 */
declare class MoveTool extends ButtonMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLButtonElement;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Select tool - Element selection
 */
declare class SelectTool extends ButtonMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLButtonElement;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Shape tool - Sub-menu for geometric shapes
 */
declare class ShapeTool extends BaseMenuItem<HTMLDivElement> {
    #private;
    private subMenuButtons;
    private triggerButton?;
    private currentIcon;
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
    private createShapeButton;
    createElement(): HTMLDivElement;
    destroy(): void;
    update(): void;
    private unselectAll;
}

/**
 * @group Menu
 * @remarks Write tool - Pencil drawing
 */
declare class WriteTool extends ButtonMenuItem {
    constructor(editor: TInteractiveInkEditor, idPrefix?: string);
    createElement(): HTMLButtonElement;
    update(): void;
    private unselectAll;
}

/**
 * @group SymbolUtils
 * @summary Plugin interface for registering symbol behaviour.
 *
 * Implement this class to add a new symbol type that participates in the
 * standard dispatch for factory, derived-field updates, overlap detection,
 * snap-point extraction, and capability flags.
 *
 * Register with `symbolRegistry.register(new MyUtil())`.
 *
 * @example
 * class StickyNoteUtil extends SymbolUtil<TStickyNote> {
 *   readonly type = "sticky-note"
 *   create(partial) { ... }
 *   updateDerivedFields(s) { ... }
 *   overlaps(s, box) { ... }
 * }
 * symbolRegistry.register(new StickyNoteUtil())
 */
declare abstract class SymbolUtil<T extends TBaseSymbol> {
    abstract readonly type: string;
    abstract create(params: TPartialDeep<T>): T;
    abstract updateDerivedFields(symbol: T): void;
    abstract overlaps(symbol: T, box: TBox): boolean;
    getSnapPoints(_symbol: T): TPoint[];
    canSelect(_symbol: T): boolean;
    canTransform(_symbol: T): boolean;
    canResize(_symbol: T): boolean;
    canRotate(_symbol: T): boolean;
    getSVGElement?(_symbol: T): SVGGraphicsElement | undefined;
}

/**
 * @group Editor
 * @remarks Level of text selection granularity
 */
type TTextSelectionLevel = "element" | "word" | "char";
/**
 * @group Editor
 * @remarks Level of math selection granularity
 */
type TMathSelectionLevel = "element" | "operand";
/**
 * @group Editor
 * @remarks Level of shape (Node/Edge) selection granularity
 */
type TShapeSelectionLevel = "element" | "stroke";
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
    overlays: TOverlayConfig;
    textSelectionLevel: TTextSelectionLevel;
    mathSelectionLevel: TMathSelectionLevel;
    shapeSelectionLevel: TShapeSelectionLevel;
    /** Math manager configuration (computation behavior and visual interactions) */
    math: TMathConfig;
    /** CSS custom property overrides applied to the editor root element (e.g. `{ "--iink-primary": "#ff0" }`) */
    cssVars?: Record<string, string>;
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
    overlays: TOverlayConfig;
    textSelectionLevel: TTextSelectionLevel;
    mathSelectionLevel: TMathSelectionLevel;
    shapeSelectionLevel: TShapeSelectionLevel;
    math: TMathConfig;
    cssVars?: Record<string, string>;
    constructor(configuration?: TPartialDeep<TInteractiveInkEditorConfiguration>);
}

/**
 * @group Editor
 */
type TInteractiveInkEditorOptions = TPartialDeep<TEditorOptionsBase & {
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
declare class InteractiveInkEditor extends AbstractEditor implements TInteractiveInkEditor {
    #private;
    static readonly PASTE_OFFSET = 20;
    static readonly ZOOM_FIT_MARGIN = 40;
    /** SVG renderer responsible for drawing symbols onto the canvas layer. */
    renderer: SVGRenderer;
    /** WebSocket recognizer handling real-time communication with the MyScript backend. */
    recognizer: RecognizerWebSocket;
    /** Manages undo/redo history stack for all symbol changes. */
    history: IIHistoryManager;
    /** Handles ink input: captures pointer events and creates strokes. */
    writer: IIWriterManager;
    /** Handles keyboard shortcuts and hotkey-based tool switching. */
    keyboard: IIKeyboardManager;
    /** Handles erasing strokes and symbols via pointer interaction. */
    eraser: EraseManager;
    /** Detects and processes touch/pointer gestures (scratch-out, join, insert, etc.). */
    gesture: IIGestureManager;
    /** Orchestrates translate, resize, and rotation transforms on selected symbols. */
    transform: IITransformManager;
    /** Converts ink strokes to recognized text, math, or shape symbols. */
    converter: IIConversionManager;
    /** Manages text and math symbol layout: bounds computation and reflow after edits. */
    typeset: IITypesetManager;
    /** Handles symbol selection, selection group rendering, and hit-testing. */
    selector: IISelectionManager;
    /** Manages all visual overlays: math/text block indicators, debug visualizations. */
    overlays: IIOverlayManager;
    /** Manages snapping behavior for symbols during move/resize operations. */
    snaps: IISnapManager;
    /** Handles canvas panning when the Move tool is active. */
    move: IIMoveManager;
    /** Synchronizes the local model with the JIIX export from the backend recognizer. */
    synchronizer: IISynchronizerManager;
    /** Queries and maps JIIX data to local symbols for math/text label resolution. */
    jiix: IIJiixQueryManager;
    /** Manages math recognition: variables, computation, and evaluation rendering. */
    math: IIMathManager;
    /** Manages smart connectors and anchor-based endpoint updates. */
    connector: IIConnectorManager;
    /** Manages the floating UI menu (tool selector, style panel, action buttons). */
    menu: IIMenuManager;
    /** Static utility class for creating DOM elements. */
    readonly dom: typeof DOMFactory;
    /**
     * Create and attach an InteractiveInk editor to the given DOM element.
     * Use `Editor.load()` instead of calling this constructor directly.
     * @param rootElement - Host DOM element that will contain the editor layers
     * @param options - Editor options: configuration, CSS vars, manager overrides
     */
    constructor(rootElement: HTMLElement, options?: TInteractiveInkEditorOptions);
    /**
     * Promise that resolves when the WebSocket session is fully initialized.
     * Await this before calling any recognition methods.
     */
    get initializationPromise(): Promise<void>;
    /**
     * Active editing tool.
     * Setting this switches cursor style, attaches/detaches the corresponding manager,
     * clears selection, and emits a `toolChanged` event.
     */
    get tool(): EditorTool;
    set tool(i: EditorTool);
    /**
     * Current symbol model containing all ink, text, math, and shape symbols.
     */
    get model(): IIModel;
    /**
     * Active editor configuration (recognition, rendering, menu, math, etc.).
     */
    get configuration(): InteractiveInkEditorConfiguration;
    /**
     * Apply a partial rendering configuration at runtime.
     * Triggers a resize and guide-row recompute.
     * @param renderingConfiguration - Partial rendering config to merge
     */
    set renderingConfiguration(renderingConfiguration: TIIRendererConfiguration);
    /**
     * Current pen style applied to new strokes.
     * Setting this merges the provided partial style with the current style.
     */
    get penStyle(): TStyle;
    set penStyle(penStyle: TPartialDeep<TStyle>);
    protected updateLayerState(idle: boolean): void;
    /**
     * Update layer UI with debouncing
     * @param timeout - Debounce timeout in milliseconds (default: 500ms)
     */
    updateLayerUI(timeout?: number): void;
    /**
     * Display an error in the editor overlay and emit an `error` event.
     * @param error - Error to display and emit
     */
    manageError(error: Error): void;
    registerSymbolUtil<T extends TBaseSymbol>(util: SymbolUtil<T>): void;
    getSymbolUtil<T extends TBaseSymbol>(type: string): SymbolUtil<T> | undefined;
    protected setCursorStyle(): void;
    protected onContentChanged(undoRedoContext: THistoryContext): Promise<void>;
    /**
     * Initialize the editor: render layers, attach input handlers, connect to the
     * WebSocket recognizer, and load the initial session.
     * Called automatically by `Editor.load()` — do not call manually.
     * @throws If the recognizer connection or session setup fails
     */
    initialize(): Promise<void>;
    /**
     * Switch the recognition language without destroying the editor.
     * Opens a new backend session and re-sends all existing strokes.
     * @param code - BCP 47 language code (e.g. `"en_US"`, `"fr_FR"`)
     * @throws If the new session fails to open
     */
    changeLanguage(code: string): Promise<void>;
    /**
     * Build a symbol from partial data
     * @param partialSymbol - Partial symbol data
     * @returns Complete symbol instance
     */
    protected buildSymbol(partialSymbol: TPartialDeep<TSymbol>): TSymbol;
    /**
     * Create a symbol from partial data
     * @param partialSymbol - Partial symbol data
     * @returns Promise resolving to created symbol
     */
    createSymbol(partialSymbol: TPartialDeep<TSymbol>): Promise<TSymbol>;
    /**
     * Create multiple symbols from partial data
     * @param partialSymbols - Array of partial symbol data
     * @returns Promise resolving to array of created symbols
     */
    createSymbols(partialSymbols: TPartialDeep<TSymbol>[]): Promise<TSymbol[]>;
    /** @hidden */
    protected updateTypesetBounds(symbol: TSymbol): void;
    /** @hidden */
    addSymbol(sym: TSymbol, addToHistory?: boolean): Promise<TSymbol>;
    /**
     * Add multiple symbols to the model and renderer
     * @param symList - Array of symbols to add
     * @param addToHistory - Whether to add to history (default: true)
     * @returns Promise resolving to array of added symbols
     */
    addSymbols(symList: TSymbol[], addToHistory?: boolean): Promise<TSymbol[]>;
    /**
     * Update an existing symbol
     * @param sym - Symbol to update
     * @param addToHistory - Whether to add to history (default: true)
     * @returns Promise resolving to updated symbol
     */
    updateSymbol(sym: TSymbol, addToHistory?: boolean): Promise<TSymbol>;
    /**
     * Update multiple existing symbols
     * @param symList - Array of symbols to update
     * @param addToHistory - Whether to add to history (default: true)
     * @returns Promise resolving to array of updated symbols
     */
    updateSymbols(symList: TSymbol[], addToHistory?: boolean): Promise<TSymbol[]>;
    /**
     * Update style of multiple symbols
     * @param symbolIds - Array of symbol IDs to update
     * @param style - Partial style to apply
     * @param addToHistory - Whether to add to history (default: true)
     */
    updateSymbolsStyle(symbolIds: string[], style: TPartialDeep<TStyle>, addToHistory?: boolean): void;
    /**
     * Update font style of text symbols
     * @param textIds - Array of text symbol IDs
     * @param options - Font style options (fontSize, fontWeight)
     */
    updateTextFontStyle(textIds: string[], { fontSize, fontWeight, }: {
        fontSize?: number;
        fontWeight?: "normal" | "bold" | "auto";
    }): void;
    /**
     * Replace old symbols with new symbols
     * @param oldSymbols - Array of old symbols to be replaced
     * @param newSymbols - Array of new symbols to replace with
     * @param addToHistory - Whether to add this operation to history (default: true)
     */
    replaceSymbols(oldSymbols: TSymbol[], newSymbols: TSymbol[], addToHistory?: boolean): Promise<void>;
    /**
     * Change the order of a symbol in the rendering stack
     * @param symbol - Symbol to reorder
     * @param position - New position (first, last, forward, backward)
     */
    changeOrderSymbol(symbol: TSymbol, position: "first" | "last" | "forward" | "backward"): void;
    /**
     * Change the order of multiple symbols in the rendering stack
     * @param symbols - Symbols to reorder
     * @param position - New position (first, last, forward, backward)
     */
    changeOrderSymbols(symbols: TSymbol[], position: "first" | "last" | "forward" | "backward"): void;
    /**
     * Synchronize strokes with JIIX export
     */
    synchronize(): Promise<void>;
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
    removeSymbols(ids: string[], addToHistory?: boolean): Promise<TSymbol[]>;
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
    importPointEvents(partialStrokes: TPartialDeep<TStroke>[]): Promise<IIModel>;
    protected triggerDownload(fileName: string, urlData: string): void;
    /**
     * Get bounding box for a list of symbols
     * @param symbols - Symbols to calculate bounds for
     * @param margin - TMargin to add around bounds (default: SELECTION_MARGIN)
     * @returns Bounding box containing all symbols
     */
    getSymbolsBounds(symbols: TSymbol[], margin?: number): TBox;
    /**
     * Set the viewport zoom level, optionally anchored to a point.
     * @param zoom - Target zoom factor (e.g. 1.5 = 150 %)
     * @param centerX - X coordinate to zoom around (pixels, default: viewport center)
     * @param centerY - Y coordinate to zoom around (pixels, default: viewport center)
     */
    zoom(zoom: number, centerX?: number, centerY?: number): void;
    /**
     * Zoom and pan the view to fit the given symbols (or all symbols) within the viewport.
     * Resets to zoom 1 if there are no symbols.
     * @param symbols - Symbols to fit (default: all model symbols)
     */
    zoomToFit(symbols?: TSymbol[]): void;
    /**
     * Get the current viewport zoom level.
     * @returns Current zoom factor (1.0 = 100 %)
     */
    getZoom(): number;
    /**
     * Shift the viewport by the given pixel delta without changing zoom.
     * @param dx - Horizontal offset in pixels (positive = pan right)
     * @param dy - Vertical offset in pixels (positive = pan down)
     */
    pan(dx: number, dy: number): void;
    protected buildBlobFromSymbols(symbols: TSymbol[], box: TBox): Blob;
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
    protected extractTextFromSymbols(symbols: TSymbol[]): string;
    /**
     * Extract all strokes from symbols recursively
     * @param symbols - Symbols to extract strokes from
     * @returns Array of extracted strokes
     */
    extractStrokesFromSymbols(symbols: TSymbol[] | undefined): TStroke[];
    /**
     * Extract all math symbols recursively
     * @param symbols - Symbols to extract maths from
     * @returns Array of extracted math symbols
     */
    extractMathsFromSymbols(symbols: TSymbol[] | undefined): TMath[];
    protected extractBackendChanges(changes: TIIHistoryChanges): TIIHistoryBackendChanges;
    protected handleWheel: (event: WheelEvent) => void;
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
     * @returns Promise resolving with exports
     */
    export(mimeTypes?: string[]): Promise<TExport>;
    /**
     * Convert specific symbols, or all symbols if none specified
     * @param symbols - Symbols to convert (defaults to all symbols)
     * @returns Promise that resolves when conversion is complete
     */
    convert(symbols?: TSymbol[]): Promise<void>;
    /**
     * Duplicate specific symbols, or all symbols if none specified
     * @param symbols - Symbols to duplicate (defaults to all symbols)
     * @returns Promise resolving with duplicated symbols
     */
    duplicate(symbols?: TSymbol[]): Promise<TSymbol[]>;
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
    resize({ height, width, }?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    /**
     * Apply or replace CSS custom properties on the editor root element.
     * Clears all existing `--iink-*` properties first, then sets the provided vars.
     * Does not reinitialize — current model and session are preserved.
     * Pass `undefined` to reset to stylesheet defaults.
     * @group Editor
     */
    setCssVars(vars: Record<string, string> | undefined): void;
    /**
     * Clear all content from the editor
     * @returns Promise that resolves when cleared
     */
    clear(): Promise<void>;
    /**
     * Copy selected symbols (or all symbols if nothing selected) to the internal clipboard
     */
    copy(): void;
    /**
     * Paste clipboard symbols at an offset and select them
     */
    paste(): Promise<void>;
    /**
     * Cut selected symbols: copy them to clipboard, then remove from model
     */
    cut(): Promise<void>;
    /**
     * Destroy the editor and clean up resources
     * @returns Promise that resolves when destruction is complete
     */
    destroy(): Promise<void>;
}

/**
 * @group SmartGuide
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
    constructor(configuration?: TPartialDeep<TInteractiveInkSSREditorConfiguration>);
}

/**
 * @group Editor
 */
type TInteractiveInkSSREditorOptions = TPartialDeep<TEditorOptionsBase & {
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
    set penStyle(penStyle: TPartialDeep<TPenStyle>);
    get penStyleClasses(): string;
    set penStyleClasses(penClass: string);
    get theme(): TTheme;
    set theme(theme: TPartialDeep<TTheme>);
    protected syncStyle(): Promise<void>;
    protected onExport(exports: TExport): void;
    protected onPointerDown(info: TPointerInfo): void;
    protected onPointerMove(info: TPointerInfo): void;
    protected onPointerUp(info: TPointerInfo): Promise<void>;
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
    importPointEvents(strokes: TPartialDeep<TLegacyStroke>[]): Promise<Model>;
    resize({ height, width, }?: {
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
type TEditorVariantMap = {
    INTERACTIVEINK: InteractiveInkEditor;
    INKV1: InkEditorDeprecated;
    INTERACTIVEINKSSR: InteractiveInkSSREditor;
    INKV2: InkEditor;
};
/**
 * @group Editor
 * @hidden
 */
type TEditorOptionsMap = {
    INTERACTIVEINK: TInteractiveInkEditorOptions;
    INKV1: TInkEditorDeprecatedOptions;
    INTERACTIVEINKSSR: TInteractiveInkSSREditorOptions;
    INKV2: TInkEditorOptions;
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
    static createEditor<T extends TEditorType>(rootElement: HTMLElement, type: T, options: TEditorOptionsMap[T]): Promise<TEditorVariantMap[T]>;
    /**
     * Retrieves the currently active editor instance
     *
     * @returns The current editor instance or undefined if none exists
     */
    static getInstance(): TEditorVariantMap[TEditorType] | undefined;
    /**
     * Retrieves a specific editor instance by type
     *
     * @param type - The editor type to retrieve
     * @returns The editor instance of the specified type or undefined
     */
    static getInstanceByType<T extends TEditorType>(type: T): TEditorVariantMap[T] | undefined;
    /**
     * Clears all stored editor instances
     */
    static clearInstances(): Promise<void>;
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
    static load<T extends TEditorType>(rootElement: HTMLElement, type: T, options: TEditorOptionsMap[T]): Promise<TEditorVariantMap[T]>;
    /**
     * Gets the currently active editor instance
     *
     * @returns The current editor instance or undefined if none exists
     */
    static getInstance(): TEditorVariantMap[TEditorType] | undefined;
    /**
     * Gets a specific editor instance by type
     *
     * @template T - The editor type to retrieve
     * @param type - The editor type to retrieve
     * @returns The editor instance of the specified type or undefined
     */
    static getInstanceByType<T extends TEditorType>(type: T): TEditorVariantMap[T] | undefined;
}

/**
 * @group Manager
 */
declare class IWriterManager extends AbstractWriterManager {
    #private;
    editor: InkEditor;
    constructor(editor: InkEditor);
    get model(): IModel;
    protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TSymbol;
    protected updateCurrentSymbol(pointer: TPointer): TStroke;
    end(info: TPointerInfo): Promise<void>;
}

/**
 * Unified representation of a gesture's intent on a set of target strokes.
 * Handlers write annotations; IIGestureAnnotationProcessor executes them.
 * @group Manager
 */
type TGestureAnnotation = {
    kind: "decorator";
    decoratorKind: DecoratorKind;
} | {
    kind: "erase";
} | {
    kind: "thicken";
    factor: number;
} | {
    kind: "select";
};
/**
 * Centralized executor for gesture annotations.
 * Standalone TDecorator symbols live in model.symbols with targetIds referencing strokes.
 * @group Manager
 */
declare class IIGestureAnnotationProcessor {
    #private;
    private editor;
    constructor(editor: TInteractiveInkEditor);
    apply(ids: string[], annotation: TGestureAnnotation): Promise<TIIHistoryChanges | undefined>;
}

/**
 * @group Manager
 * @summary List all authorized gestures
 */
type TGestureType = "UNDERLINE" | "SCRATCH" | "JOIN" | "INSERT" | "STRIKETHROUGH" | "SURROUND";
/**
 * @group Manager
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
 * @group Manager
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
 * @group Manager
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
 * @group Manager
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
 * @group Manager
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
 * @group Manager
 * @source
 */
type TGestureConfiguration = {
    surround: SurroundAction;
    strikeThrough: StrikeThroughAction;
    underline: UnderlineAction;
    insert: InsertAction;
};
/**
 * @group Manager
 * @source
 */
declare const DefaultGestureConfiguration: TGestureConfiguration;

/**
 * Base abstract class for all Interactive Ink managers
 * Provides common structure and utilities to reduce code duplication
 *
 * All managers in iink-ts should extend this class to ensure consistent:
 * - Logger management
 * - Editor reference
 * - Common getters (model, renderer, recognizer, configuration)
 * - Lifecycle hooks (onInit, onDestroy)
 *
 * @example
 * ```typescript
 * export class IIMyManager extends IIAbstractManager {
 *   protected managerName = "IIMyManager"
 *
 *   constructor(editor: InteractiveInkEditor) {
 *     super(editor)
 *     // Custom initialization
 *   }
 *
 *   protected onInit(): void {
 *     // Called after constructor
 *     this.logger.info("IIMyManager initialized")
 *   }
 *
 *   myMethod() {
 *     // Use this.editor, this.model, this.renderer, this.logger
 *     this.logger.info("Doing something")
 *   }
 *
 *   protected onDestroy(): void {
 *     // Cleanup
 *   }
 * }
 * ```
 *
 * @group Manager
 */
declare abstract class IIAbstractManager {
    protected editor: TInteractiveInkEditor;
    /**
     * Logger instance for this manager
     * Automatically uses LoggerCategory.MANAGER
     */
    protected logger: Logger;
    /**
     * Name of the manager for logging purposes
     * Must be overridden in concrete classes
     *
     * @example "IITypesetManager", "IIMathManager"
     */
    protected abstract managerName: string;
    /**
     * Create a new manager
     * @param editor - The Interactive Ink Editor instance
     */
    constructor(editor: TInteractiveInkEditor, logger: LoggerCategory);
    /**
     * Get the model from the editor
     * Convenience getter to avoid accessing editor.model everywhere
     */
    get model(): IIModel;
    /**
     * Get the renderer from the editor
     * Convenience getter to avoid accessing editor.renderer everywhere
     */
    get renderer(): SVGRenderer;
    /**
     * Get the recognizer from the editor
     * Convenience getter to avoid accessing editor.recognizer everywhere
     */
    get recognizer(): RecognizerWebSocket;
    /**
     * Get the configuration from the editor
     * Convenience getter to avoid accessing editor.configuration everywhere
     */
    get configuration(): InteractiveInkEditorConfiguration;
    /**
     * Lifecycle hook called after manager initialization
     * Override in subclasses if needed
     *
     * This is called at the end of the constructor, allowing subclasses
     * to perform initialization that requires access to this.managerName
     * or other properties set in the subclass constructor.
     *
     * @example
     * ```typescript
     * protected onInit(): void {
     *   this.logger.info(`${this.managerName} initialized`)
     *   // Setup event listeners, etc.
     * }
     * ```
     */
    protected onInit?(): void;
    /**
     * Lifecycle hook called when the manager is being destroyed
     * Override in subclasses to cleanup resources
     *
     * @example
     * ```typescript
     * protected onDestroy(): void {
     *   this.logger.info(`${this.managerName} destroyed`)
     *   // Remove event listeners, clear intervals, etc.
     * }
     * ```
     */
    protected onDestroy?(): void;
    /**
     * Destroy the manager and cleanup resources
     * Calls the onDestroy hook if defined
     */
    destroy(): void;
}

/**
 * @group Manager
 */
declare class IITypesetManager extends IIAbstractManager {
    protected managerName: string;
    constructor(editor: TInteractiveInkEditor);
    get rowHeight(): number;
    protected drawSymbolHidden(symbol: TText | TMath): SVGGElement;
    setCharsBounds(text: TText, textGroupEl: SVGGElement): TText;
    setBounds(symbol: TText | TMath): void;
    getElementBoundingBox(textElement: SVGElement): TBox;
    getBoundingBox(text: TText): TBox;
    getSpaceWidth(fontSize: number): number;
    updateBounds(textSymbol: TText): TText;
    moveTextAfter(text: TText, tx: number): TSymbol[] | undefined;
}

/**
 * Abstract base class for transform managers (translate, rotate, resize)
 * @group Manager
 */
declare abstract class IIAbstractTransformManager extends IIAbstractManager {
    protected abstract transformName: string;
    interactElementsGroup?: SVGElement;
    constructor(editor: TInteractiveInkEditor);
    protected applyMatrixToPoints(points: TPoint[], matrix: MatrixTransform): void;
    setTransformOrigin(id: string, originX: number, originY: number): void;
    protected resolveInteractGroup(target: Element): SVGGElement;
    protected applyAndDraw(symbols: TSymbol[], matrix: MatrixTransform): void;
    protected finalizeTransform(): void;
    protected clearGhostStrokesForSelectedMath(): void;
    protected abstract applyToStroke(stroke: TStroke, matrix: MatrixTransform): TStroke;
    protected abstract applyToShape(shape: TShape, matrix: MatrixTransform): TShape;
    protected abstract applyToEdge(edge: TEdge, matrix: MatrixTransform): TEdge;
    protected abstract applyOnText(text: TText, matrix: MatrixTransform): TText;
    protected abstract applyOnMath(math: TMath, matrix: MatrixTransform): TMath;
    applyToSymbol(symbol: TSymbol, matrix: MatrixTransform): TSymbol;
}

/**
 * @group Manager
 */
declare class IITranslateManager extends IIAbstractTransformManager {
    protected managerName: string;
    protected transformName: string;
    transformOrigin: TPoint;
    constructor(editor: TInteractiveInkEditor);
    protected applyToStroke(stroke: TStroke, matrix: MatrixTransform): TStroke;
    protected applyToShape(shape: TShape, matrix: MatrixTransform): TShape;
    protected applyToEdge(edge: TEdge, matrix: MatrixTransform): TEdge;
    protected applyOnText(text: TText, matrix: MatrixTransform): TText;
    protected applyOnMath(math: TMath, matrix: MatrixTransform): TMath;
    translate(symbols: TSymbol[], tx: number, ty: number, addToHistory?: boolean): Promise<void>;
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
 * @remarks Orchestrator for gesture recognition and handling using Strategy Pattern
 */
declare class IIGestureManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    insertAction: InsertAction;
    surroundAction: SurroundAction;
    strikeThroughAction: StrikeThroughAction;
    underlineAction: UnderlineAction;
    constructor(editor: TInteractiveInkEditor, gestureAction?: TPartialDeep<TGestureConfiguration>);
    get translator(): IITranslateManager;
    get typeset(): IITypesetManager;
    get history(): IIHistoryManager;
    /**
     * Apply a detected gesture using the appropriate handler
     * @param gestureStroke - The stroke that represents the gesture
     * @param gesture - The detected gesture with metadata
     */
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
    /**
     * Detect gesture type from a stroke using contextless recognition
     * @param gestureStroke - The stroke to analyze
     * @returns The detected gesture or undefined
     */
    getGestureFromContextLess(gestureStroke: TStroke): Promise<TGesture | undefined>;
}

/**
 * Helper class containing all shared utility methods for gesture handlers
 * Centralizes common functionality to avoid code duplication across handlers
 * @group Manager
 */
declare class GestureHelpers {
    protected editor: TInteractiveInkEditor;
    constructor(editor: TInteractiveInkEditor);
    /**
     * Check if a symbol can have decorators applied to it
     * @param symbol - The symbol to check
     * @returns true if symbol is Stroke, Text, or RecognizedText
     */
    isDecorable(symbol: TSymbol): boolean;
}

/**
 * Base interface for gesture handlers
 * Each handler is responsible for applying a specific gesture type
 * @group Manager
 */
type TGestureHandler = {
    /**
     * The type of gesture this handler manages
     */
    readonly gestureType: TGestureType;
    /**
     * Apply the gesture to the model
     * @param gestureStroke - The stroke that forms the gesture
     * @param gesture - The detected gesture information
     * @returns Promise that resolves when the gesture is applied
     */
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void | TSymbol[]>;
};
/**
 * Abstract base class for gesture handlers
 * Provides common functionality and access to editor services via helpers
 * @group Manager
 */
declare abstract class GestureHandler implements TGestureHandler {
    protected editor: TInteractiveInkEditor;
    protected helpers: GestureHelpers;
    protected readonly logger: Logger;
    protected readonly processor: IIGestureAnnotationProcessor;
    constructor(editor: TInteractiveInkEditor, helpers: GestureHelpers);
    abstract readonly gestureType: TGestureType;
    abstract apply(gestureStroke: TStroke, gesture: TGesture): Promise<void | TSymbol[]>;
    /**
     * Get the editor's model
     */
    protected get model(): IIModel;
    /**
     * Get the editor's model
     */
    protected get manager(): IIGestureManager;
    /**
     * Get the editor's renderer
     */
    protected get renderer(): SVGRenderer;
    /**
     * Get the editor's history manager
     */
    protected get history(): IIHistoryManager;
    /**
     * Get the editor's recognizer
     */
    protected get recognizer(): RecognizerWebSocket;
    /**
     * Get the editor's translator manager
     */
    protected get translator(): IITranslateManager;
    /**
     * Get the editor's typeset manager
     */
    protected get typeset(): IITypesetManager;
    /**
     * Get the row height from configuration
     */
    protected get rowHeight(): number;
    /**
     * Get the stroke space width from configuration
     */
    protected get strokeSpaceWidth(): number;
}

/**
 * Handler for INSERT gesture type
 * Inserts line breaks or space by drawing vertical line
 * @group Manager
 */
declare class InsertGestureHandler extends GestureHandler {
    readonly gestureType: "INSERT";
    constructor(editor: TInteractiveInkEditor, helpers: GestureHelpers);
    /**
     * Create strokes from gesture substrokes
     * Reconstructs pointers with pressure and time information
     * @param strokeOrigin - The original stroke to get style and pointer info
     * @param subStrokes - Array of substroke data (x,y coordinates)
     * @returns Array of new strokes
     */
    createStrokesFromGestureSubStroke(strokeOrigin: TStroke, subStrokes: {
        x: number[];
        y: number[];
    }[]): TStroke[];
    /**
     * Compute split stroke into before/after parts
     * Applies translation to the "after" stroke
     * @param strokeOrigin - The original stroke to split
     * @param subStrokes - Array of substroke data
     * @returns Object with optional before and after strokes
     */
    computeSplitStroke(strokeOrigin: TStroke, subStrokes: {
        x: number[];
        y: number[];
    }[]): {
        before?: TStroke;
        after?: TStroke;
    };
    /**
     * Compute changes needed when splitting a stroke
     * Handles both simple Stroke symbols with child strokes
     * @param gestureStroke - The gesture stroke
     * @param strokeIdToSplit - ID of the stroke to split
     * @param subStrokes - Substroke data
     * @returns History changes object with translate and replaced arrays
     */
    computeChangesOnSplitStroke(gestureStroke: TStroke, strokeIdToSplit: string, subStrokes: {
        fullStrokeId: string;
        x: number[];
        y: number[];
    }[]): TIIHistoryChanges;
    /**
     * Compute changes when splitting a Text symbol
     * @param gestureStroke - The gesture stroke
     * @param textToSplit - The text symbol to split
     * @param insertAction - The insert action mode
     * @returns History changes object
     */
    computeChangesOnSplitText(gestureStroke: TStroke, textToSplit: TText, insertAction: InsertAction): TIIHistoryChanges;
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
}

/**
 * Handler for JOIN gesture type
 * Joins rows of text together by removing line breaks
 * @group Manager
 */
declare class JoinGestureHandler extends GestureHandler {
    readonly gestureType: "JOIN";
    constructor(editor: TInteractiveInkEditor, helpers: GestureHelpers);
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
}

/**
 * Handler for SCRATCH gesture type
 * Erases or partially removes symbols by scratching over them
 * @group Manager
 */
declare class ScratchGestureHandler extends GestureHandler {
    readonly gestureType: "SCRATCH";
    constructor(editor: TInteractiveInkEditor, helpers: GestureHelpers);
    /**
     * Compute scratch on strokes by subtracting the gesture stroke
     * @param gesture - The gesture information with subStrokes
     * @param stroke - The stroke to scratch
     * @returns Array of resulting strokes (before/after the scratch)
     */
    computeScratchOnStrokes(gesture: TGesture, stroke: TStroke): TStroke[];
    /**
     * Compute scratch on text symbol by removing overlapping characters
     * @param gestureStroke - The gesture stroke
     * @param textSymbol - The text symbol to scratch
     * @returns Updated text symbol, or undefined if all characters removed
     */
    computeScratchOnText(gestureStroke: TStroke, textSymbol: TText): TText | undefined;
    /**
     * Compute scratch on any symbol type
     * Handles different logic for each symbol type:
     * - Stroke: Uses computeScratchOnStrokes
     * - RecognizedText: Scratches child strokes, preserves decorators
     * - RecognizedMath/Diagram: Scratches child strokes, cleans solver outputs
     * - Text: Uses computeScratchOnText
     * - Math/Shape/Edge: Complete erasure
     *
     * @param gestureStroke - The gesture stroke
     * @param gesture - The gesture information
     * @param symbol - The symbol to scratch
     * @returns Object with 'erased' flag or 'replaced' array of new symbols
     */
    computeScratchOnSymbol(gestureStroke: TStroke, gesture: TGesture, symbol: TSymbol): {
        erased?: boolean;
        replaced?: TSymbol[];
    };
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
}

/**
 * Handler for STRIKETHROUGH gesture type
 * Supports two actions: Draw (apply decorator) and Erase (remove symbols)
 * @group Manager
 */
declare class StrikeThroughGestureHandler extends GestureHandler {
    readonly gestureType: "STRIKETHROUGH";
    constructor(editor: TInteractiveInkEditor, helpers: GestureHelpers);
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
}

/**
 * Handler for SURROUND gesture type
 * Supports three actions: Select, Highlight, and Surround
 * @group Manager
 */
declare class SurroundGestureHandler extends GestureHandler {
    readonly gestureType: "SURROUND";
    constructor(editor: TInteractiveInkEditor, helpers: GestureHelpers);
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
}

/**
 * Handler for UNDERLINE gesture type
 * Supports two actions: Draw (apply decorator) and Thicken (increase stroke width)
 * @group Manager
 */
declare class UnderlineGestureHandler extends GestureHandler {
    readonly gestureType: "UNDERLINE";
    constructor(editor: TInteractiveInkEditor, helpers: GestureHelpers);
    apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>;
}

/**
 * Manages anchored edges — edges whose endpoints are bound to other symbols.
 * When an anchored symbol moves, `updateAnchoredEdges` recomputes the
 * corresponding edge endpoints from their stored normalized anchor coordinates.
 * @group Manager
 */
declare class IIConnectorManager extends IIAbstractManager {
    protected managerName: string;
    constructor(editor: TInteractiveInkEditor);
    /**
     * Find the first non-edge symbol whose bounds contain the given point.
     * `excludeId` prevents matching the edge being dragged.
     */
    findSymbolAtPoint(point: TPoint, excludeId: string): TSymbol | undefined;
    /**
     * Draw a dashed highlight rect around a symbol's bounds to indicate an
     * active anchor snap target. Clears any previously shown hint first.
     */
    showAnchorHint(point: TPoint, excludeId: string): TSymbol | undefined;
    /** Remove the anchor snap hint from the interaction layer. */
    clearAnchorHint(): void;
    /**
     * Find where the ray from `anchoredPoint` toward `otherPoint` exits the polygon
     * defined by `shapeVertices`. Using a ray (not a segment) ensures a result even when
     * shapes overlap and `otherPoint` is inside the polygon.
     */
    private computeEntryPoint;
    /**
     * Recompute `entryPoint` on every anchor currently set on `edge`.
     * Must be called after the edge endpoints and anchor target shape are in their final positions.
     */
    private recomputeAllEntryPoints;
    /**
     * Assign or clear the start/end anchor on a Line or PolyLine edge endpoint.
     * When a target shape is found, snaps the endpoint to the shape center and
     * computes `entryPoint` (intersection with shape border) for split rendering.
     * Called after the user releases an edge endpoint drag.
     */
    applyEndpointAnchor(edge: TEdge, pointIndex: number, point: TPoint): void;
    /**
     * Visually reposition anchored edge endpoints by applying `matrix` to the
     * stored anchor point (original position) — no model update.
     * Call from transform `continue()` for real-time edge following.
     */
    drawAnchoredEdgesForMatrix(symbolIds: string[], matrix: MatrixTransform): void;
    /**
     * Resolve an anchor to a world point, optionally using pre-transform bounds + matrix.
     * When matrix and preTransformBoundsById are provided (rotation case), resolves in the
     * pre-transform AABB then applies the matrix — this preserves the physical point on
     * the shape regardless of AABB size change. Also updates normalizedXY on the anchor
     * so subsequent transforms resolve correctly in the new AABB.
     */
    private resolveAndUpdateAnchor;
    /**
     * Clear anchors from any edges in `symbols` that are being directly translated.
     * An anchored edge that the user explicitly moves becomes a free edge.
     */
    clearAnchoredEdgesFor(symbols: TSymbol[]): void;
    /**
     * Recompute endpoints of all edges anchored to any of the given symbol IDs.
     * Called by transform managers after translate / resize / rotate.
     * Pass `matrix` and `preTransformBoundsById` when called from rotation so that
     * anchor resolution uses the pre-transform AABB rather than the post-rotation AABB.
     */
    updateAnchoredEdges(symbolIds: string[], matrix?: MatrixTransform, preTransformBoundsById?: Map<string, TOBB>): void;
}

/**
 * @group Manager
 */
declare class IIConversionManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    constructor(editor: TInteractiveInkEditor);
    get fontStyleConfiguration(): {
        size: number | "auto";
        weight: "bold" | "normal" | "auto";
    };
    get rowHeight(): number;
    protected computeFontSize(chars: TJIIXChar[]): number;
    buildChar(char: TJIIXChar, strokes: TStroke[], fontSize: number): TSymbolChar;
    buildText(word: TJIIXWord, chars: TJIIXChar[], strokes: TStroke[], size: number | "auto"): TText;
    convertText(text: TJIIXTextElement, strokes: TStroke[], onlyText: boolean): {
        symbol: TText;
        strokes: TStroke[];
    }[] | undefined;
    buildCircle(circle: TJIIXNodeCircle, strokes: TStroke[]): TShapeCircle;
    buildEllipse(ellipse: TJIIXNodeEllipse, strokes: TStroke[]): TShapeEllipse;
    buildRectangle(rectangle: TJIIXNodeRectangle, strokes: TStroke[]): TShapePolygon;
    buildPolygon(polygon: TJIIXNodePolygon, strokes: TStroke[]): TShapePolygon;
    buildRhombus(polygon: TJIIXNodeRhombus, strokes: TStroke[]): TShapePolygon;
    buildTriangle(polygon: TJIIXNodeTriangle, strokes: TStroke[]): TShapePolygon;
    buildParallelogram(polygon: TJIIXNodeParallelogram, strokes: TStroke[]): TShapePolygon;
    convertNode(node: TJIIXNodeElement, strokes: TStroke[]): {
        symbol: TShape;
        strokes: TStroke[];
    } | undefined;
    buildLine(line: TJIIXEdgeLine, strokes: TStroke[]): TEdgeLine;
    buildPolyEdge(polyline: TJIIXEdgePolyEdge, strokes: TStroke[]): TEdgePolyLine;
    buildArc(arc: TJIIXEdgeArc, strokes: TStroke[]): TEdgeArc;
    convertEdge(edge: TJIIXEdgeElement, strokes: TStroke[]): {
        symbol: TEdge;
        strokes: TStroke[];
    } | undefined;
    protected convertLatexToUnicode(latex: string): string;
    buildMath(mathElement: TJIIXMathElement, strokes: TStroke[], fontSize: number): TMath;
    convertMath(mathElement: TJIIXMathElement, strokes: TStroke[]): {
        symbol: TMath;
        strokes: TStroke[];
    } | undefined;
    apply(symbols?: TSymbol[]): Promise<TSymbol[]>;
}

/**
 * Text metadata for a block
 * @group Manager
 */
type TBlockTextMetadata = {
    label?: string;
    word?: {
        label: string;
        firstChar?: number;
        lastChar?: number;
        bounds?: TBox;
        id?: string;
    };
    char?: {
        label: string;
        word: number;
        bounds?: TBox;
    };
    line?: {
        baseline: number;
        xHeight: number;
    };
};
/**
 * Result type for stroke queries
 * @group Manager
 */
type TStrokeQueryResult = {
    /** The stroke ID */
    strokeId: string;
    /** The JIIX element containing this stroke */
    element: TJIIXElement;
    /** The precise label for this stroke */
    label?: string;
    /** Additional context (word, char, expression, etc.) */
    context?: {
        /** For text strokes: word info */
        word?: {
            label: string;
            index: number;
        };
        /** For text strokes: char info */
        char?: {
            label: string;
            index: number;
            wordIndex: number;
        };
        /** For math strokes: expression info */
        expression?: {
            type: string;
            label?: string;
            expressionPath: string;
        };
    };
};
/**
 * Indexed JIIX data for fast queries
 * @group Manager
 */
type TJiixIndex = {
    /** Map stroke ID -> parent element */
    strokeToElement: Map<string, TJIIXElement>;
    /** Map stroke ID -> precise label */
    strokeToLabel: Map<string, string>;
    /** Map stroke ID -> context info */
    strokeToContext: Map<string, TStrokeQueryResult["context"]>;
    /** Map element ID -> all stroke IDs */
    elementToStrokes: Map<string, string[]>;
    /** Map element ID -> element (for label lookup without needing model.exports) */
    elementById: Map<string, TJIIXElement>;
    /** Cache version for invalidation */
    version: number;
};
/**
 * @group Manager
 * @remarks Manager for querying JIIX export data efficiently
 * Provides fast lookups for strokes, labels, and element groupings
 * Automatically indexes JIIX data on first access and invalidates cache when model changes
 */
declare class IIJiixQueryManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    constructor(editor: TInteractiveInkEditor);
    /**
     * Build or rebuild the JIIX index
     * Called automatically when index is stale
     */
    protected buildIndex(): void;
    /**
     * Index a single JIIX element and its strokes
     */
    protected indexElement(element: TJIIXElement, index: TJiixIndex): void;
    /**
     * Index a text element
     */
    protected indexTextElement(element: TJIIXTextElement, index: TJiixIndex, elementStrokes: string[]): void;
    /**
     * Index a math element
     */
    protected indexMathElement(element: TJIIXMathElement, index: TJiixIndex, elementStrokes: string[]): void;
    /**
     * Index a math expression recursively
     */
    protected indexMathExpression(expression: TJIIXMathExpression, element: TJIIXMathElement, index: TJiixIndex, elementStrokes: string[], path: string): void;
    /**
     * Index a node or edge element
     */
    protected indexNodeOrEdgeElement(element: TJIIXNodeElement | TJIIXEdgeElement, index: TJiixIndex, elementStrokes: string[]): void;
    /**
     * Ensure index is up to date.
     * When model.exports is absent (cleared by updateSymbol etc.) but a valid index exists,
     * preserve it rather than overwriting with an empty rebuild.
     */
    protected ensureIndexValid(): void;
    /**
     * Invalidate and immediately rebuild the index from current exports.
     * Called after mergeExport so the rebuild happens while exports are still set,
     * before any subsequent updateSymbol calls clear them.
     */
    invalidateIndex(): void;
    /**
     * Get the JIIX element containing a stroke
     * @param strokeId - The stroke ID
     * @returns The JIIX element or undefined
     */
    getElementForStroke(strokeId: string): TJIIXElement | undefined;
    /**
     * Get the precise label for a stroke
     * For text: returns char label if available, word label otherwise
     * For math: returns expression label or type
     * @param strokeId - The stroke ID
     * @returns The label or undefined
     */
    getLabelForStroke(strokeId: string): string | undefined;
    /**
     * Get detailed query result for a stroke
     * @param strokeId - The stroke ID
     * @returns Full query result with element, label, and context
     */
    getStrokeInfo(strokeId: string): TStrokeQueryResult | undefined;
    /**
     * Get the JIIX word group for a stroke (for word-level decorator spanning).
     * Returns all stroke IDs in the same word and the word's pixel bounding box.
     */
    getWordGroupForStroke(strokeId: string): {
        wordKey: string;
        wordBounds: TBox | null;
        allStrokeIds: string[];
        baseline: number | null;
        xHeight: number | null;
    } | null;
    /**
     * Get all stroke IDs belonging to an element
     * @param elementId - The JIIX element ID
     * @returns Array of stroke IDs
     */
    getStrokesForElement(elementId: string): string[];
    /**
     * Get all TStroke objects belonging to an element
     * @param elementId - The JIIX element ID
     * @returns Array of TStroke symbols
     */
    getStrokeSymbolsForElement(elementId: string): TStroke[];
    /**
     * Get all strokes grouped by word (for text elements)
     * @param elementId - The text element ID
     * @returns Array of word groups, each containing stroke IDs and label
     */
    getStrokesGroupedByWord(elementId: string): Array<{
        label: string;
        strokeIds: string[];
    }>;
    /**
     * Get all strokes grouped by character (for text elements)
     * @param elementId - The text element ID
     * @returns Array of char groups, each containing stroke IDs and label
     */
    getStrokesGroupedByChar(elementId: string): Array<{
        label: string;
        strokeIds: string[];
        wordIndex: number;
    }>;
    /**
     * Get all math blocks with their strokes
     * @returns Array of math blocks with their JIIX element and stroke IDs
     */
    getAllMathBlocksWithStrokes(): Array<{
        mathBlock: TJIIXMathElement;
        strokeIds: string[];
        strokes: TStroke[];
    }>;
    /**
     * Get all text blocks with their strokes
     * @returns Array of text blocks with their JIIX element and stroke IDs
     */
    getAllTextBlocksWithStrokes(): Array<{
        textBlock: TJIIXTextElement;
        strokeIds: string[];
        strokes: TStroke[];
    }>;
    /**
     * Get the label of a JIIX block by its ID
     * @param jiixBlockId - The JIIX element ID
     * @returns The label of the block, or undefined if not found
     */
    getBlockLabel(jiixBlockId: string): string | undefined;
    /**
     * Search strokes by label
     * @param label - The label to search for (case-insensitive partial match)
     * @returns Array of matching stroke query results
     */
    searchByLabel(label: string): TStrokeQueryResult[];
    getBlocksForSymbols(symbols: TSymbol[]): TJIIXElement[];
    /**
     * Get statistics about the indexed JIIX
     * @returns Index statistics
     */
    getIndexStats(): {
        totalStrokes: number;
        totalElements: number;
        byType: Record<string, number>;
        indexed: boolean;
    };
    /**
     * Get pixel-converted text metadata for a stroke
     */
    getTextMetadata(strokeId: string): TBlockTextMetadata | undefined;
    /**
     * Update pixel-converted text metadata for a stroke (called during sync)
     */
    updateTextMetadata(stroke: TStroke, element: TJIIXTextElement): void;
    /**
     * Clear text metadata for a stroke (called when stroke is deleted)
     */
    clearTextMetadata(strokeId: string): void;
    /**
     * Get stroke groups with pixel bboxes for text selection.
     * Only groups with valid bounding boxes are returned.
     * @param level - Selection granularity: "element", "word", or "char"
     */
    getTextSelectionGroups(level: "element" | "word" | "char"): Array<{
        strokeIds: string[];
        bounds: TBox;
    }>;
    /**
     * Get stroke groups with pixel bboxes for math selection.
     * Only groups with valid bounding boxes are returned.
     * @param level - Selection granularity: "element" or "operand"
     */
    getMathSelectionGroups(level: "element" | "operand"): Array<{
        strokeIds: string[];
        bounds: TBox;
    }>;
    /**
     * Get stroke groups with pixel bboxes for shape (Node/Edge) selection.
     * "element" level: one group per Node/Edge element.
     * "stroke" level: returns empty (signals fallback to stroke overlap).
     * @param level - Selection granularity: "element" or "stroke"
     */
    getShapeSelectionGroups(level: "element" | "stroke"): Array<{
        strokeIds: string[];
        bounds: TBox;
    }>;
    /**
     * Recursively collect math expression groups with pixel bboxes
     */
    protected collectMathExpressionGroups(expressions: TJIIXMathExpression[], groups: Array<{
        strokeIds: string[];
        bounds: TBox;
    }>): void;
}

/**
 * Manages keyboard input for the Interactive Ink editor
 * Handles tool switching via modifier keys (Ctrl/Cmd for Move mode)
 * @group Manager
 */
declare class IIKeyboardManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    static readonly ZOOM_STEP = 1.2;
    static readonly PAN_STEP = 100;
    constructor(editor: TInteractiveInkEditor);
    /**
     * Attach keyboard event listeners to the window
     */
    attach(): void;
    /**
     * Detach keyboard event listeners from the window
     */
    detach(): void;
    /**
     * Reset the stored tool when user manually changes tool
     * Called by the editor when tool changes programmatically
     */
    resetStoredTool(): void;
    /**
     * Handle keydown events
     * Handles copy/paste/cut shortcuts and Delete key; switches to Move tool when Ctrl/Cmd is pressed
     */
    protected handleKeyDown: (event: KeyboardEvent) => void;
    /**
     * Handle keyup events
     * Restores previous tool when Ctrl/Cmd is released
     */
    protected handleKeyUp: (event: KeyboardEvent) => void;
}

/**
 * Result display mode for math solver output
 * - "draw": add result strokes to the model (sent to backend, interactive)
 * - "ghost": render result strokes as SVG overlays (not in model, opacity 0.5, non-interactive)
 * @group Manager
 */
type TMathResultMode = "draw" | "ghost";
/**
 * Configuration for math computation behavior
 * @group Manager
 */
type TMathComputationConfig = {
    /** How solver output is displayed */
    resultMode: TMathResultMode;
    /** Automatically compute results when blocks end with = or ? */
    autoCompute: boolean;
    /** Color applied to result strokes (both draw and ghost modes) */
    resultColor: string;
};
/**
 * Computation data for a math block
 * @group Manager
 */
type TMathBlockComputation = {
    /** Computed result from the solver */
    computedResult?: unknown;
    /** IDs of strokes that are solver outputs */
    solverOutputStrokeIds?: string[];
    /** Last computation timestamp */
    lastComputedAt?: number;
};
/**
 * Sub-manager responsible for tracking math block computations and running numerical solver operations
 * @group Manager
 */
declare class IIMathComputationSubManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    static readonly DEFAULT_CONFIG: TMathComputationConfig;
    constructor(editor: TInteractiveInkEditor, config?: Partial<TMathComputationConfig>);
    getConfig(): TMathComputationConfig;
    updateConfig(config: Partial<TMathComputationConfig>): void;
    get computations(): ReadonlyMap<string, TMathBlockComputation>;
    updateComputationResult(jiixBlockId: string, result: unknown): void;
    updateSolverOutputs(jiixBlockId: string, solverOutputStrokeIds: string[]): void;
    updateSolverOutputsForAll(solverOutputStrokeIds: string[]): void;
    getMathBlock(jiixBlockId: string): TMathBlockComputation | undefined;
    removeMathBlock(jiixBlockId: string): void;
    getStoredSolverOutputs(jiixBlockId: string): string[] | undefined;
    protected buildGhostStrokePath(points: TPoint[]): string;
    protected addGhostOutputStrokes(result: TJIIXMathElement, style?: TStyle): string[];
    hasSolverOutputs(jiixBlockId: string): boolean;
    hasDrawSolverOutputs(jiixBlockId: string): boolean;
    hasGhostStrokes(jiixBlockId: string): boolean;
    clearGhostStrokes(jiixBlockId: string): void;
    clearAllGhostStrokes(): void;
    clearSolverOutputs(jiixBlockId: string): Promise<void>;
    clearAllSolverOutputs(): Promise<void>;
    computeNumericalResult(jiixBlockId: string, mode?: TMathResultMode): Promise<{
        result: TJIIXMathElement;
        addedStrokesCount: number;
        value?: number;
        wasRecomputed: boolean;
    }>;
    computeAllNumericalResults(): Promise<void>;
    protected extractSolverOutputStrokesFromExpression(expression: TJIIXMathExpression): Array<{
        X: number[];
        Y: number[];
        F?: number[];
        T?: number[];
    }>;
    protected extractSolverOutputStrokes(mathElement: TJIIXMathElement): Array<{
        X: number[];
        Y: number[];
        F?: number[];
        T?: number[];
    }>;
    addSolverOutputStrokes(result: TJIIXMathElement, style?: TStyle): Promise<TStroke[]>;
    clear(): void;
    protected onDestroy(): void;
}

/**
 * Sub-manager responsible for math function evaluation
 * @group Manager
 */
declare class IIMathFunctionEvaluationSubManager extends IIAbstractManager {
    protected managerName: string;
    constructor(editor: TInteractiveInkEditor);
    evaluateFunction(jiixBlockId: string, evaluation: {
        inputVariableName: string;
        outputVariableName: string;
        from: number;
        to: number;
        pointCount: number;
    }): Promise<{
        [key: string]: number;
    }[][]>;
    getEvaluables(jiixBlockId: string): Promise<TMathEvaluable[]>;
}

/**
 * Type representing math symbol dependencies
 * @group Manager
 */
type TMathDependencies = {
    /**
     * Map of variable names to their source block IDs
     */
    variableSources?: {
        [variableName: string]: string;
    };
    /**
     * Array of block IDs that depend on this block
     */
    dependentBlocks?: string[];
};
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
 * One display row for a variable in a specific math block context.
 * @group Manager
 */
type TMathVariableUsage = TMathVariable & {
    id: string;
    targetBlockId: string;
    targetLabel: string;
    sourceLabel?: string;
    isDefinition: boolean;
    isEditable: boolean;
};
/**
 * Unified sub-manager for math variable state, dependency tracking, and visual interactions.
 *
 * Responsibilities:
 * - Variable values: store, set, get per block
 * - Dependency graph: variable sources, dependent blocks, enrichment, cleanup
 * - Interaction visuals: hover highlighting, selection highlighting, dependency arrows
 *
 * @group Manager
 */
declare class IIMathVariableSubManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    private static readonly DEFAULT_CONFIG;
    private static readonly HIGHLIGHT_STYLES;
    constructor(editor: TInteractiveInkEditor, config?: Partial<TMathInteractionConfig>);
    updateConfig(config: Partial<TMathInteractionConfig>): void;
    getConfig(): TMathInteractionConfig;
    private getMathSymbols;
    findMathSymbolsByJiixId(jiixId: string): TStroke[];
    private getBlockBounds;
    private getAllMathBlockIds;
    protected findVariableBoxesInExpressions(expressions: TJIIXMathExpression[], variableName: string): TBox[];
    getDependencies(blockId: string): TMathDependencies | null;
    enrichMathDependencies(jiixBlockId: string): Promise<void>;
    cleanupMathDependencies(jiixBlockIds: string[]): void;
    invalidateCacheForBlock(jiixBlockId: string): void;
    getVariables(jiixBlockId?: string): Promise<TMathVariable[]>;
    getVariableValue(jiixBlockId: string, variableName: string): Promise<number | null>;
    setVariableValue(jiixBlockId: string, variableName: string, variableValue: number): Promise<void>;
    removeVariableValue(jiixBlockId: string, variableName: string): Promise<void>;
    asVariableDefinition(jiixBlockId: string): Promise<TMathVariableDefinition | null>;
    getVariableDefinitions(): Promise<TMathVariableDefinitions[]>;
    getAllVariableUsages(): Promise<TMathVariableUsage[]>;
    getRecursiveSources(jiixBlockId: string, visited?: Set<string>): Set<string>;
    getRecursiveDependents(jiixBlockId: string, visited?: Set<string>): Set<string>;
    onSymbolHover(jiixBlockId: string | null): void;
    private clearHoverHighlights;
    selectBlock(jiixBlockId: string): void;
    clearBlockSelection(): void;
    private clearSelectionHighlights;
    protected drawDependencyArrowToBox(fromId: string, fromBounds: TBox, toId: string, toBox: TBox, color: string): void;
    protected ensureArrowheadMarker(color: string): string;
    clearDependencyArrows(): void;
    protected drawDependencyArrows(jiixBlockId: string, sources: Set<string>, dependents: Set<string>): void;
    clearAll(): void;
    clear(): void;
    protected onDestroy(): void;
}

/**
 * Configuration passed to {@link IIMathManager} at load time.
 * Forwarded to the relevant sub-managers.
 * @group Manager
 */
type TMathConfig = {
    /** Override defaults for the computation sub-manager (resultMode, autoCompute) */
    computation?: Partial<TMathComputationConfig>;
    /** Override defaults for the variable/interaction sub-manager (showDependencyOnHover, highlightOnSelect, dimOpacity) */
    interaction?: Partial<TMathInteractionConfig>;
};
/**
 * Main Math manager that orchestrates all math-related sub-managers.
 *
 * Sub-managers:
 * - computation: Computation cache, solver I/O, numerical result ops
 * - variables: Variable state, dependency tracking, visual interactions (hover/select)
 * - evaluation: Function evaluation
 *
 * @group Manager
 */
declare class IIMathManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    constructor(editor: TInteractiveInkEditor, config?: TMathConfig);
    /**
     * Compute numerical result for a math symbol
     * @param jiixBlockId - The ID of the math block
     * @param mode - Result display mode ("draw" or "ghost"). Defaults to editor.mathResultMode
     * @returns Promise with the computation result, number of added strokes, and numeric value
     */
    computeNumericalResult(jiixBlockId: string, mode?: TMathResultMode): Promise<{
        result: TJIIXMathElement;
        addedStrokesCount: number;
        value?: number;
        wasRecomputed: boolean;
    }>;
    computeAllNumericalResults(): Promise<void>;
    clearSolverOutputs(jiixBlockId: string): Promise<void>;
    clearAllSolverOutputs(): Promise<void>;
    getComputation(jiixBlockId: string): TMathBlockComputation | undefined;
    getStoredSolverOutputs(jiixBlockId: string): string[] | undefined;
    clearGhostStrokes(jiixBlockId: string): void;
    hasSolverOutputs(jiixBlockId: string): boolean;
    hasDrawSolverOutputs(jiixBlockId: string): boolean;
    hasGhostStrokes(jiixBlockId: string): boolean;
    /**
     * Set value for a specific variable in a math expression
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @param variableName - Name of the variable to set
     * @param variableValue - Value to assign to the variable
     * @returns Promise that resolves when the variable is set
     */
    setVariableValue(jiixBlockId: string, variableName: string, variableValue: number): Promise<void>;
    /**
     * Set multiple variable values for a math symbol
     * @param jiixBlockId - The ID of the math block
     * @param variableValues - Object with variable names as keys and their values
     * @returns Promise that resolves when all variables are set
     */
    setListVariableValue(jiixBlockId: string, variableValues: Record<string, number>): Promise<void>;
    /**
     * Get variables from a math expression
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @returns Promise with array of variables
     */
    getVariables(jiixBlockId: string): Promise<TMathVariable[]>;
    /**
     * Get variable value from a math expression
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @param variableName - Name of the variable
     * @returns Promise with the value of the variable
     */
    getVariableValue(jiixBlockId: string, variableName: string): Promise<number | null>;
    getDependencies(jiixBlockId: string): TMathDependencies | null;
    enrichMathDependencies(jiixBlockId: string): Promise<void>;
    cleanupMathDependencies(jiixBlockIds: string[]): void;
    recalculateDependentBlocks(sourceBlockId: string): Promise<void>;
    selectBlock(jiixBlockId: string): void;
    clearBlockSelection(): void;
    onSymbolHover(jiixBlockId: string | null): void;
    getVariablesConfig(): TMathInteractionConfig;
    updateVariablesConfig(config: Partial<TMathInteractionConfig>): void;
    removeVariable(jiixBlockId: string, variableName: string): Promise<void>;
    asVariableDefinition(jiixBlockId: string): Promise<TMathVariableDefinition | null>;
    getVariableDefinitions(): Promise<TMathVariableDefinitions[]>;
    getAllVariableUsages(): Promise<TMathVariableUsage[]>;
    clearVariableInteractions(): void;
    /**
     * Evaluate a math function for a math symbol
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @param evaluation - Evaluation parameters
     * @returns Promise with evaluation points
     */
    evaluateFunction(jiixBlockId: string, evaluation: {
        inputVariableName: string;
        outputVariableName: string;
        from: number;
        to: number;
        pointCount: number;
    }): Promise<{
        [key: string]: number;
    }[][]>;
    /**
     * Get evaluables from a math expression
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @returns Promise with array of evaluables
     */
    getEvaluables(jiixBlockId: string): Promise<TMathEvaluable[]>;
    /**
     * Get diagnostic result for a specific math task
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @param task - The task to diagnose (e.g., "numerical-computation", "evaluation")
     * @returns Promise with diagnostic result (e.g., "ALLOWED", "NOT_ALLOWED")
     */
    getDiagnostic(jiixBlockId: string, task: string): Promise<string>;
    /**
     * Get available math solver actions for a specific math element
     * @param jiixBlockId - The ID of the math element (jiixId)
     * @returns Promise with array of available actions
     */
    getAvailableActions(jiixBlockId: string): Promise<string[]>;
    getComputationConfig(): TMathComputationConfig;
    updateComputationConfig(config: Partial<TMathComputationConfig>): void;
    tryAutoCompute(): Promise<void>;
    protected onDestroy(): void;
}

/**
 * @group Manager
 */
declare class IIMoveManager extends IIAbstractManager {
    protected managerName: string;
    grabber: PointerEventGrabber;
    origin?: {
        viewBoxX: number;
        viewBoxY: number;
        clientX: number;
        clientY: number;
    };
    constructor(editor: TInteractiveInkEditor);
    protected updateViewBox(info: TPointerInfo, redrawGuide: boolean): void;
    attach(layer: HTMLElement): void;
    detach(): void;
    start(info: TPointerInfo): void;
    continue(info: TPointerInfo): void;
    end(info: TPointerInfo): void;
}

/**
 * Visual overlay configuration
 * @group Manager
 */
type TOverlayConfig = {
    showBlockOverlays: boolean;
    badgeSize: number;
    borderWidth: number;
    panelPadding: number;
    labelMaxChars: number;
    labelFontSize: number;
};
/**
 * Default overlay configuration
 * @group Manager
 */
declare const DefaultOverlayConfig: TOverlayConfig;
/**
 * Unified overlay manager for all symbol types.
 *
 * Responsibilities:
 * - Math blocks: ∑ badge, border, hover zone, highlights, dimming
 * - Text blocks: recognized text badge, border
 *
 * Owned by InteractiveInkEditor as `editor.overlays`.
 *
 * @group Manager
 */
declare class IIOverlayManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    private static readonly BADGE_STYLES;
    private static readonly LABEL_STYLES;
    constructor(editor: TInteractiveInkEditor, config?: Partial<TOverlayConfig>);
    updateConfig(config: Partial<TOverlayConfig>): void;
    getConfig(): TOverlayConfig;
    protected drawBadge(box: TBox, id: string, content: string): void;
    protected drawBorder(box: TBox, id: string, color?: string, dashArray?: string): void;
    protected drawLabel(box: TBox, id: string, fullLabel: string): void;
    protected createHoverZone(bounds: TBox, blockId: string): void;
    private getMathBlockBounds;
    refresh(): void;
    protected refreshMathOverlays(): void;
    protected refreshTextOverlays(): void;
    protected refreshEdgeNodeOverlays(): void;
    clearAll(): void;
    protected sanitizeId(id: string): string;
    protected drawOverlayRect(id: string, bounds: TBox, idPrefix: string, attrs: Partial<Record<string, string>>): void;
    highlightPrimary(id: string, bounds: TBox, color?: string): void;
    highlightLinked(id: string, bounds: TBox): void;
    highlightWithColor(box: TBox, symbolId: string, colorKey: string): void;
    addHoverGlow(id: string, bounds: TBox): void;
    dimSymbol(id: string, bounds: TBox, opacity?: number): void;
    clearHighlights(): void;
    clearDimming(): void;
    apply(): void;
}

/**
 * @group Manager
 */
declare class IIResizeManager extends IIAbstractTransformManager {
    protected managerName: string;
    protected transformName: string;
    direction: ResizeDirection;
    boundingBox: TBox;
    transformOrigin: TPoint;
    keepRatio: boolean;
    constructor(editor: TInteractiveInkEditor);
    protected applyToStroke(stroke: TStroke, matrix: MatrixTransform): TStroke;
    protected applyToShape(shape: TShape, matrix: MatrixTransform): TShape;
    protected applyToEdge(edge: TEdge, matrix: MatrixTransform): TEdge;
    private applyOnTypeset;
    protected applyOnText(text: TText, matrix: MatrixTransform): TText;
    protected applyOnMath(math: TMath, matrix: MatrixTransform): TMath;
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
declare class IIRotationManager extends IIAbstractTransformManager {
    protected managerName: string;
    protected transformName: string;
    center: TPoint;
    origin: TPoint;
    constructor(editor: TInteractiveInkEditor);
    protected applyToStroke(stroke: TStroke, matrix: MatrixTransform): TStroke;
    protected applyToShape(shape: TShape, matrix: MatrixTransform): TShape;
    protected applyToEdge(edge: TEdge, matrix: MatrixTransform): TEdge;
    protected applyOnText(text: TText, matrix: MatrixTransform): TText;
    protected applyOnMath(math: TMath, matrix: MatrixTransform): TMath;
    rotateElement(id: string, degree: number): void;
    start(target: Element, origin: TPoint): void;
    continue(point: TPoint): number;
    end(point: TPoint): Promise<void>;
}

/**
 * @group Manager
 */
declare class IISelectionManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    grabber: PointerEventGrabber;
    startSelectionPoint?: TPoint;
    endSelectionPoint?: TPoint;
    selectedGroup?: SVGGElement;
    constructor(editor: TInteractiveInkEditor);
    get rotation(): IIRotationManager;
    get translate(): IITranslateManager;
    get resize(): IIResizeManager;
    get selectionBox(): TBox | undefined;
    attach(layer: HTMLElement): void;
    detach(): void;
    drawSelectingRect(box: TBox): void;
    clearSelectingRect(): void;
    protected getPoint(ev: PointerEvent): TPoint;
    protected createTranslateRect(box: TBox): SVGRectElement;
    protected createRotateGroup(box: TBox): SVGGElement;
    protected createResizeGroup(box: TBox): SVGGElement;
    protected createInteractElementsGroup(symbols: TSymbol[]): SVGGElement | undefined;
    protected createEdgeResizeGroup(edge: TEdge): SVGGElement;
    /**
     * Path-based hit area for line/polyline edges — narrow stroke aligned with edge geometry,
     * avoiding the AABB problem where diagonal edges have an oversized clickable rectangle.
     */
    protected createEdgeTranslatePath(edge: TEdgeLine | TEdgePolyLine): SVGPathElement;
    protected createInteractEdgeGroup(edge: TEdge): SVGGElement | undefined;
    drawSelectedGroup(symbols: TSymbol[]): void;
    resetSelectedGroup(symbols: TSymbol[]): void;
    removeSelectedGroup(): void;
    hideInteractElements(): void;
    /**
     * Build selected/covered stroke ID sets from JIIX text groups.
     * Returns null when no JIIX groups exist (fallback to stroke overlap).
     */
    protected getTextGroupSets(selectionBox: TBox): {
        selected: Set<string>;
        covered: Set<string>;
    } | null;
    /**
     * Build selected/covered stroke ID sets from JIIX math groups.
     * Returns null when no JIIX groups exist (fallback to stroke overlap).
     */
    protected getMathGroupSets(selectionBox: TBox): {
        selected: Set<string>;
        covered: Set<string>;
    } | null;
    /**
     * Build selected/covered stroke ID sets from JIIX shape (Node/Edge) groups.
     * Returns null when level is "stroke" or no groups exist (fallback to stroke overlap).
     */
    protected getShapeGroupSets(selectionBox: TBox): {
        selected: Set<string>;
        covered: Set<string>;
    } | null;
    start(info: TPointerInfo): void;
    continue(info: TPointerInfo): TSymbol[];
    /**
     * Find the JIIX block ID of the single fully-selected math block, if any.
     * In "element" mode: a block qualifies if any of its strokes are selected.
     * In "operand" mode: a block qualifies only if ALL its strokes are selected.
     * Returns undefined when zero or more than one block qualifies.
     */
    getSelectedMathJiixBlockId(): string | undefined;
    end(info: TPointerInfo): TSymbol[];
    protected onContextMenu(info: TPointerInfo): Promise<void>;
}

/**
 * @group Manager
 */
type TSnapConfiguration = {
    guide: boolean;
    symbol: boolean;
    angle: number;
};
/**
 * @group Manager
 * @source
 */
declare const DefaultSnapConfiguration: TSnapConfiguration;
/**
 * @group Manager
 */
declare class SnapConfiguration implements TSnapConfiguration {
    guide: boolean;
    symbol: boolean;
    angle: number;
    constructor(config?: TPartialDeep<TSnapConfiguration>);
}
/**
 * @group Manager
 */
type TSnapNudge = TPoint;
/**
 * @group Manager
 */
type TSnapLineInfos = {
    nudge: TSnapNudge;
    verticales: TSegment[];
    horizontales: TSegment[];
};
/**
 * @group Manager
 */
declare class IISnapManager extends IIAbstractManager {
    protected managerName: string;
    snapConfiguration: SnapConfiguration;
    constructor(editor: TInteractiveInkEditor, config?: TPartialDeep<TSnapConfiguration>);
    get selectionSnapPoints(): TPoint[];
    get otherSnapPoints(): TPoint[];
    get snapThreshold(): number;
    protected getNearestVerticalGuide(x: number): number;
    protected getNearestHorizontalGuide(y: number): number;
    protected getGuidePointToSnap(point: TPoint): TPoint;
    drawSnapToElementLines(lines: TSegment[]): void;
    clearSnapToElementLines(): void;
    protected buildXBuckets(points: TPoint[], bucketSize: number): Map<number, TPoint[]>;
    protected buildYBuckets(points: TPoint[], bucketSize: number): Map<number, TPoint[]>;
    protected getSnapLinesInfos(sourcePoints: TPoint[], targetPoints: TPoint[]): TSnapLineInfos;
    snapResize(point: TPoint, horizontal?: boolean, vertical?: boolean): TPoint;
    snapTranslate(tx: number, ty: number): TSnapNudge;
    snapRotation(angleDegree: number): number;
}

/**
 * @group Manager
 * @remarks Simplified synchronizer that only manages JIIX block IDs and stroke lifecycle
 */
declare class IISynchronizerManager extends IIAbstractManager {
    #private;
    protected managerName: string;
    static readonly SYNCHRONIZE_TIMEOUT = 30000;
    static readonly MAX_RETRY_ATTEMPTS = 3;
    constructor(editor: TInteractiveInkEditor);
    synchronize(): Promise<void>;
}

/**
 * Orchestrates the three transform sub-managers (translate, resize, rotation).
 * Access via editor.transform.translate / .resize / .rotation
 * @group Manager
 */
declare class IITransformManager extends IIAbstractManager {
    protected managerName: string;
    readonly translate: IITranslateManager;
    readonly resize: IIResizeManager;
    readonly rotation: IIRotationManager;
    constructor(editor: TInteractiveInkEditor);
}

/**
 * @group Manager
 */
declare class IIWriterManager extends AbstractWriterManager {
    #private;
    detectGesture: boolean;
    editor: TInteractiveInkEditor;
    currentSymbolOrigin?: TPoint;
    constructor(editor: TInteractiveInkEditor);
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
    protected needContextLessGesture(stroke: TStroke): boolean;
    protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TSymbol;
    protected updateCurrentSymbolShape(pointer: TPointer): void;
    protected updateCurrentSymbolEdge(pointer: TPointer): void;
    protected updateCurrentSymbol(pointer: TPointer): TSymbol;
    start(info: TPointerInfo): void;
    continue(info: TPointerInfo): void;
    protected interactWithBackend(stroke: TStroke): Promise<void>;
    end(info: TPointerInfo): Promise<void>;
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
    protected drawBoundingBox(symbols: TSymbol[]): void;
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
    emitConverted(exports?: TExport): void;
    addConvertedListener(callback: (exports: TExport) => void): void;
    emitImported(exports: TExport): void;
    addImportedListener(callback: (exports: TExport) => void): void;
    emitSelected(symbols: TBaseSymbol[]): void;
    addSelectedListener(callback: (symbols: TSymbol[]) => void): void;
    emitToolChanged(mode: EditorTool): void;
    addToolChangedListener(callback: (mode: EditorTool) => void): void;
    emitUIpdated(): void;
    addUIpdatedListener(callback: () => void): void;
    emitSynchronized(): void;
    addSynchronizedListener(callback: () => void): void;
    emitGestured(gesture: {
        gestureType: TGestureType;
        stroke: TStroke;
    }): void;
    addGesturedListener(callback: (gesture: {
        gestureType: TGestureType;
        stroke: TStroke;
    }) => void): void;
}

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
type TIHistoryChanges = {
    added?: TSymbol[];
    removed?: TSymbol[];
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
 * @group History
 */
type TIIHistoryChanges = {
    added?: TSymbol[];
    updated?: TSymbol[];
    erased?: TSymbol[];
    replaced?: {
        oldSymbols: TSymbol[];
        newSymbols: TSymbol[];
    };
    matrix?: {
        symbols: TSymbol[];
        matrix: TMatrixTransform;
    };
    translate?: {
        symbols: TSymbol[];
        tx: number;
        ty: number;
    }[];
    scale?: {
        symbols: TSymbol[];
        scaleX: number;
        scaleY: number;
        origin: TPoint;
    }[];
    rotate?: {
        symbols: TSymbol[];
        angle: number;
        center: TPoint;
    }[];
    style?: {
        symbols: TSymbol[];
        style?: TPartialDeep<TStyle>;
        fontSize?: number;
    };
    order?: {
        symbols: TSymbol[];
        position: "first" | "last" | "forward" | "backward";
    };
    group?: {
        symbols: TSymbol[];
    };
    ungroup?: {
        group: TSymbol;
    };
};
/**
 * @group History
 * @remarks used to send messages to the backend on undo or redo
 */
type TIIHistoryBackendChanges = {
    added?: TStroke[];
    erased?: TStroke[];
    replaced?: {
        oldStrokes: TStroke[];
        newStrokes: TStroke[];
    };
    matrix?: {
        strokes: TStroke[];
        matrix: TMatrixTransform;
    };
    translate?: {
        strokes: TStroke[];
        tx: number;
        ty: number;
    }[];
    scale?: {
        strokes: TStroke[];
        scaleX: number;
        scaleY: number;
        origin: TPoint;
    }[];
    rotate?: {
        strokes: TStroke[];
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
 * Structural type for InteractiveInkEditor used by all managers.
 * Managers depend on this type rather than the concrete class to
 * enable isolation testing and future editor variants.
 * @group Editor
 */
type TInteractiveInkEditor = {
    readonly model: IIModel;
    readonly configuration: InteractiveInkEditorConfiguration;
    readonly event: EditorEvent;
    readonly layers: EditorLayer;
    readonly renderer: SVGRenderer;
    readonly recognizer: RecognizerWebSocket;
    readonly dom: typeof DOMFactory;
    get penStyle(): TStyle;
    set penStyle(v: TPartialDeep<TStyle>);
    tool: EditorTool;
    set renderingConfiguration(v: TIIRendererConfiguration);
    readonly history: IIHistoryManager;
    readonly writer: IIWriterManager;
    readonly keyboard: IIKeyboardManager;
    readonly eraser: EraseManager;
    readonly selector: IISelectionManager;
    readonly move: IIMoveManager;
    readonly gesture: IIGestureManager;
    readonly transform: IITransformManager;
    readonly converter: IIConversionManager;
    readonly typeset: IITypesetManager;
    readonly overlays: IIOverlayManager;
    readonly snaps: IISnapManager;
    readonly synchronizer: IISynchronizerManager;
    readonly jiix: IIJiixQueryManager;
    readonly math: IIMathManager;
    readonly connector: IIConnectorManager;
    readonly menu: IIMenuManager;
    createSymbols(partialSymbols: TPartialDeep<TSymbol>[]): Promise<TSymbol[]>;
    addSymbol(sym: TSymbol, addToHistory?: boolean): Promise<TSymbol>;
    addSymbols(symList: TSymbol[], addToHistory?: boolean): Promise<TSymbol[]>;
    updateSymbol(sym: TSymbol, addToHistory?: boolean): Promise<TSymbol>;
    updateSymbols(symList: TSymbol[], addToHistory?: boolean): Promise<TSymbol[]>;
    updateSymbolsStyle(symbolIds: string[], style: TPartialDeep<TStyle>, addToHistory?: boolean): void;
    updateTextFontStyle(textIds: string[], opts: {
        fontSize?: number;
        fontWeight?: "normal" | "bold" | "auto";
    }): void;
    replaceSymbols(oldSymbols: TSymbol[], newSymbols: TSymbol[], addToHistory?: boolean): Promise<void>;
    changeOrderSymbols(symbols: TSymbol[], position: "first" | "last" | "forward" | "backward"): void;
    removeSymbol(id: string, addToHistory?: boolean): Promise<void>;
    removeSymbols(ids: string[], addToHistory?: boolean): Promise<TSymbol[]>;
    extractStrokesFromSymbols(symbols: TSymbol[] | undefined): TStroke[];
    duplicate(symbols?: TSymbol[]): Promise<TSymbol[]>;
    select(ids: string[]): void;
    selectAll(): void;
    unselectAll(): void;
    getSymbolsBounds(symbols: TSymbol[], margin?: number): TBox;
    zoomToFit(symbols?: TSymbol[]): void;
    zoom(zoom: number, centerX?: number, centerY?: number): void;
    undo(): Promise<IIModel>;
    redo(): Promise<IIModel>;
    copy(): void;
    cut(): Promise<void>;
    paste(): Promise<void>;
    export(mimeTypes?: string[]): Promise<TExport>;
    convert(symbols?: TSymbol[]): Promise<void>;
    changeLanguage(code: string): Promise<void>;
    downloadAsSVG(selection?: boolean): void;
    downloadAsPNG(selection?: boolean): void;
    downloadAsJson(selection?: boolean): void;
    downloadAsText(selection?: boolean): void;
    registerSymbolUtil<T extends TBaseSymbol>(util: SymbolUtil<T>): void;
    getSymbolUtil<T extends TBaseSymbol>(type: string): SymbolUtil<T> | undefined;
    clear(): Promise<void>;
    destroy(): Promise<void>;
    resize(dims?: {
        height?: number;
        width?: number;
    }): Promise<void>;
    setCssVars(vars: Record<string, string> | undefined): void;
    manageError(error: Error): void;
};

/**
 * @group Components
 */
type TMathSymbolCapabilities = {
    jiixBlockId: string;
    canCheckDiagnostic: boolean;
    canEditVariables: boolean;
    canCompute: boolean;
    canEvaluate: boolean;
};
/**
 * @group Components
 * @remarks Component for displaying math symbols capabilities in a table
 */
declare class IIMathCapabilitiesTable {
    private editor;
    private modal?;
    private table?;
    private capabilities;
    private actionButtons;
    private logger;
    constructor(editor: TInteractiveInkEditor);
    /**
     * Fetch capabilities for a single math symbol
     */
    private fetchSymbolCapabilities;
    /**
     * Create the table element
     */
    private createTable;
    /**
     * Handle row selection
     */
    private handleRowSelection;
    /**
     * Update action buttons enabled/disabled state based on selected rows
     */
    private updateActionButtons;
    /**
     * Create action buttons container
     */
    private createActionButtons;
    /**
     * Execute Check Diagnostic action for selected rows
     */
    private executeCheckDiagnostic;
    /**
     * Execute Edit Variables action for selected rows
     */
    private executeEditVariables;
    /**
     * Execute Compute Result action for selected rows
     */
    private executeComputeResult;
    /**
     * Execute Evaluate Function action for selected rows
     */
    private executeEvaluateFunction;
    /**
     * Show the capabilities overview modal
     */
    show(): Promise<void>;
    /**
     * Close the modal
     */
    close(): void;
}

/**
 * @group Components
 */
type TSymbolDiagnostic = {
    jiixBlockId: string;
    computeDiagnostic: string;
    evaluationDiagnostic: string;
};
/**
 * @group Components
 * @remarks Component for checking and displaying diagnostics for multiple math symbols
 */
declare class IIMathDiagnosticChecker {
    private editor;
    private jiixBlockIds;
    private modal?;
    private logger;
    constructor(editor: TInteractiveInkEditor, jiixBlockIds: string[]);
    /**
     * Show the diagnostic checker modal
     */
    show(): Promise<void>;
    /**
     * Create the modal content with diagnostics
     */
    private createModalContent;
    /**
     * Create a diagnostic section for a single symbol
     */
    private createSymbolDiagnosticSection;
    /**
     * Create a diagnostic sub-section
     */
    private createDiagnosticSubSection;
    /**
     * Close the diagnostic checker
     */
    close(): void;
}

/**
 * @group Components
 */
type TMathEvaluableFunction = {
    jiixBlockId: string;
    evaluables: Array<{
        inputName: string;
        outputName: string;
    }>;
    selectedEvaluableIndex: number;
    color: string;
};
/**
 * @group Components
 */
type TEvaluationResult = {
    func: TMathEvaluableFunction;
    points: {
        [key: string]: number;
    }[][];
};
/**
 * @group Components
 * @remarks Component for evaluating and displaying multiple math functions
 */
declare class IIMathFunctionEvaluator {
    private editor;
    private jiixBlockIds;
    private modal?;
    private evaluationResults?;
    private tabContent?;
    private currentTab;
    private functionsToEvaluate;
    private logger;
    private static readonly COLORS;
    constructor(editor: TInteractiveInkEditor, jiixBlockIds: string[]);
    /**
     * Show the function evaluator modal
     */
    show(): Promise<void>;
    /**
     * Create the modal content with inputs and tabs
     */
    private createModalContent;
    /**
     * Create a single function item for display
     */
    private createFunctionItem;
    /**
     * Create the functions list display
     */
    private createFunctionsList;
    /**
     * Create the evaluation inputs grid (from, to, points, step)
     */
    private createEvaluationInputsGrid;
    /**
     * Create the evaluate button
     */
    private createEvaluateButton;
    /**
     * Create the inputs section
     */
    private createInputsSection;
    /**
     * Setup input synchronization (step/pointCount)
     */
    private setupInputSynchronization;
    /**
     * Create the tabs section (Graph and Table)
     */
    private createTabsSection;
    /**
     * Create a tab header
     */
    private createTabHeader;
    /**
     * Evaluate all functions
     */
    private evaluateFunctions;
    /**
     * Render the current tab content
     */
    private renderCurrentTab;
    /**
     * Render the graph tab
     */
    private renderGraph;
    /**
     * Group evaluation results by input variable name
     */
    private groupResultsByInputName;
    /**
     * Create table title element
     */
    private createTableTitle;
    /**
     * Create table columns for a group of results
     */
    private createTableColumns;
    /**
     * Create table rows for a group of results
     */
    private createTableRows;
    /**
     * Render the table tab
     */
    private renderTable;
    /**
     * Close the evaluator
     */
    close(): void;
}

/**
 * @group Components
 * @remarks Modal editor for all variable definitions returned by get-variable-definitions.
 * Shows one row per (variable, block) usage. Definition rows are read-only;
 * BLOCK-provided and free (UNDEFINED) variables are editable/deletable.
 */
declare class IIMathVariableEditor {
    private editor;
    private modal?;
    private usages;
    private usagesById;
    private inputList?;
    private newRows;
    private logger;
    constructor(editor: TInteractiveInkEditor);
    show(): Promise<void>;
    private createModalContent;
    private createAddSection;
    private createNewVariableRow;
    private applyChanges;
    close(): void;
}

/**
 * @group Components
 */
type TVariableInputItem = {
    id?: string;
    name: string;
    initialValue?: number;
    sourceType?: string;
    sourceLabel?: string;
    isDefinition?: boolean;
    targetLabel?: string;
    disabled?: boolean;
    onDelete?: (name: string) => Promise<void>;
};
/**
 * @group Components
 * @remarks Pure UI component — renders a list of variable input rows.
 * Use getValues() to retrieve all valid (non-empty, non-NaN) inputs.
 */
declare class IIMathVariableInputList {
    readonly element: HTMLDivElement;
    private inputs;
    constructor(items: TVariableInputItem[]);
    private createRow;
    removeRow(name: string): void;
    getValues(): Map<string, number>;
}

/**
 * @group Components
 */
type TSymbolVariables = {
    jiixBlockId: string;
    definition: TMathVariableDefinition | null;
    variables: TMathVariable[];
};
/**
 * @group Components
 * @remarks Modal editor for variables of one or more math block symbols.
 * Fetches variables per jiixBlockId and applies changes via setListVariableValue.
 */
declare class IIMathVariablePerBlockEditor {
    private editor;
    private jiixBlockIds;
    private modal?;
    private blockVariables;
    private inputLists;
    private logger;
    constructor(editor: TInteractiveInkEditor, jiixBlockIds: string[]);
    show(): Promise<void>;
    private createModalContent;
    private createSymbolSection;
    private applyChanges;
    close(): void;
}

/**
 * @group Components
 */
type TMinimapOptions = {
    width?: number;
    height?: number;
};
/**
 * Minimap component showing a scaled-down overview of the editor canvas.
 * Click or drag to navigate the editor viewport.
 * @group Components
 */
declare class Minimap {
    #private;
    static readonly DEFAULT_WIDTH = 200;
    static readonly DEFAULT_HEIGHT = 150;
    constructor(editor: TInteractiveInkEditor, options?: TMinimapOptions);
    /**
     * Returns the minimap DOM element to insert into the page.
     */
    getElement(): HTMLDivElement;
    /**
     * Appends the minimap to the given element and syncs the initial state.
     */
    attach(element: HTMLElement): void;
    /**
     * Removes the minimap from its parent without cleaning up observers.
     */
    detach(): void;
    /**
     * Disconnects the observer, removes event listeners, and removes the minimap from the DOM.
     */
    destroy(): void;
}

/** @group Components */
type TModalType = "info" | "success" | "warning" | "error" | "primary";
/**
 * @group Components
 */
type TModalFieldOption = {
    value: string;
    label: string;
};
/**
 * @group Components
 */
type TModalField = {
    id: string;
    label: string;
    type: "text" | "number" | "select";
    defaultValue?: string | number;
    placeholder?: string;
    options?: TModalFieldOption[];
};
/**
 * @group Components
 */
type TModalConfig = {
    title: string;
    fields: TModalField[];
    type?: TModalType;
    buttons?: TButtonElConfig[];
    customContent?: HTMLElement;
    /** Element to mount the modal into. Defaults to document.body (viewport-fixed). */
    container?: HTMLElement;
    /** Container width (px) below which the modal opens in fullscreen. Defaults to 480. */
    mobileBreakpoint?: number;
    /** Called when the modal closes (close button, backdrop click, or timeout). */
    onClose?: () => void;
};
/**
 * @group Components
 */
declare class Modal {
    private config;
    private modal;
    private backdrop;
    private isOpen;
    private isFullscreen;
    private isDragging;
    private dragOffset;
    private modalPosition;
    private fullscreenButton?;
    private titleBar?;
    private contentWrapper?;
    private get container();
    private get isAnchored();
    constructor(config: TModalConfig);
    private createBackdrop;
    private createModal;
    private createModalContainer;
    private createTitleBar;
    private createTitleBarButtons;
    private createIconButton;
    private createContentWrapper;
    private createForm;
    private createFormField;
    private createSelectInput;
    private createTextInput;
    private createActionButtons;
    private createActionButton;
    private setupDragging;
    private computeDragPosition;
    private toggleFullscreen;
    /**
     * Open the modal. Auto-fullscreen if container width < mobileBreakpoint.
     */
    open(): void;
    /**
     * Close the modal without removing it from the DOM. Fires onClose.
     */
    close(): void;
    /**
     * Dismiss the modal programmatically without firing onClose.
     */
    dismiss(): void;
    /**
     * Close and remove the modal from the DOM. Fires onClose.
     */
    destroy(): void;
    /**
     * Remove the modal from the DOM without firing onClose.
     */
    destroySilent(): void;
}

/**
 * @group Components
 */
type TTableColumn = {
    header: string | HTMLElement;
    align?: "left" | "center" | "right";
    width?: string;
};
/**
 * @group Components
 */
type TTableCellConfig = {
    content: string | HTMLElement;
    align?: "left" | "center" | "right";
    style?: string;
};
/**
 * @group Components
 */
type TTableRow = {
    cells: (string | HTMLElement | TTableCellConfig)[];
    style?: string;
    hoverStyle?: string;
    data?: unknown;
};
/**
 * @group Components
 */
type TTableConfig = {
    columns: (string | TTableColumn)[];
    rows: TTableRow[];
    stickyHeader?: boolean;
    hoverEffect?: boolean;
    fontSize?: string;
    maxHeight?: string;
    width?: string;
    selectable?: boolean;
    multiSelect?: boolean;
    onRowClick?: (rowIndex: number, rowData?: unknown, isSelected?: boolean) => void;
};
/**
 * @group Components
 * @remarks Generic table component for displaying data in a structured format
 */
declare class Table {
    private table;
    private config;
    private rowElements;
    private selectedRows;
    constructor(config: TTableConfig);
    private createTable;
    private createHeader;
    private createBody;
    /**
     * Handle row click event
     */
    private handleRowClick;
    /**
     * Select a row by index
     */
    selectRow(rowIndex: number): void;
    /**
     * Unselect a row by index
     */
    unselectRow(rowIndex: number): void;
    /**
     * Clear all selections
     */
    clearSelection(): void;
    /**
     * Update row visual style based on selection state
     */
    private updateRowStyle;
    /**
     * Get selected row indices
     */
    getSelectedRows(): number[];
    /**
     * Get selected row data
     */
    getSelectedRowsData(): unknown[];
    /**
     * Get the table element
     */
    getElement(): HTMLTableElement;
    /**
     * Update table data and redraw
     */
    update(rows: TTableRow[]): void;
    /**
     * Destroy the table
     */
    destroy(): void;
}

/**
 * @group SymbolUtils
 */
declare class DecoratorUtil extends SymbolUtil<TDecorator> {
    readonly type = SymbolType.Decorator;
    create(partial: TPartialDeep<TDecorator>): TDecorator;
    updateDerivedFields(decorator: TDecorator): void;
    overlaps(decorator: TDecorator, box: TBox): boolean;
    getSnapPoints(decorator: TDecorator): TPoint[];
    canResize(_decorator: TDecorator): boolean;
    canRotate(_decorator: TDecorator): boolean;
    getSVGElement(decorator: TDecorator): SVGGeometryElement | undefined;
    static renderForSymbol(decorator: TDecorator, symbol: {
        bounds: TOBB;
        style: {
            width?: number;
            color?: string;
        };
    }): SVGGeometryElement | undefined;
    static renderFromBounds(decorator: TDecorator, bounds: TOBB, baseline?: number, xHeight?: number, symbolStyle?: {
        width?: number;
        color?: string;
    }): SVGGeometryElement | undefined;
}

/**
 * @group SymbolUtils
 */
declare const arrowHeadStartMarkerId = "arrow-head-start";
/**
 * @group SymbolUtils
 */
declare const arrowHeadEndMarkerId = "arrow-head-end";

/**
 * @group SymbolUtils
 */
declare class EdgeUtil extends SymbolUtil<TEdge> {
    readonly type = SymbolType.Edge;
    create(partial: TPartialDeep<TEdge>): TEdge;
    updateDerivedFields(edge: TEdge): void;
    overlaps(edge: TEdge, box: TBox): boolean;
    getSnapPoints(edge: TEdge): TPoint[];
    static getSVGPath(edge: TEdge): string;
    getSVGElement(edge: TEdge): SVGGraphicsElement;
}

/**
 * @group SymbolUtils
 */
declare class MathUtil extends SymbolUtil<TMath> {
    readonly type = SymbolType.Math;
    create(partial: TPartialDeep<TMath>): TMath;
    updateDerivedFields(math: TMath): void;
    overlaps(math: TMath, box: TBox): boolean;
    getSnapPoints(math: TMath): TPoint[];
    getSVGElement(math: TMath): SVGGraphicsElement;
}

/**
 * @group SymbolUtils
 */
declare function registerBuiltinSymbolUtils(): void;

/**
 * @group SymbolUtils
 */
declare class ShapeUtil extends SymbolUtil<TShape> {
    readonly type = SymbolType.Shape;
    create(partial: TPartialDeep<TShape>): TShape;
    updateDerivedFields(shape: TShape): void;
    overlaps(shape: TShape, box: TBox): boolean;
    getSnapPoints(shape: TShape): TPoint[];
    static getSVGPath(shape: TShape): string;
    getSVGElement(shape: TShape): SVGGraphicsElement;
}

/**
 * @group SymbolUtils
 */
declare class StrokeUtil extends SymbolUtil<TStroke> {
    readonly type = SymbolType.Stroke;
    create(partial: TPartialDeep<TStroke>): TStroke;
    updateDerivedFields(stroke: TStroke): void;
    overlaps(stroke: TStroke, box: TBox): boolean;
    getSnapPoints(stroke: TStroke): TPoint[];
    getSVGElement(stroke: TStroke): SVGGraphicsElement;
}

/**
 * @group SymbolUtils
 * @summary Create any TSymbol from partial data — dispatches by type using the registry for custom types.
 */
declare function createSymbolFromPartial(partial: TPartialDeep<TSymbol>): TSymbol;
/**
 * @group SymbolUtils
 * @summary Create multiple TSymbols from partial data — accumulates errors.
 */
declare function createSymbolsFromPartial(partials: TPartialDeep<TSymbol>[]): TSymbol[];

/**
 * @group SymbolUtils
 * @summary Registry for SymbolUtil implementations.
 *
 * Built-in types are registered via `registerBuiltinSymbolUtils()`, which the
 * editor calls on initialisation. External consumers may register additional
 * types before or after editor creation:
 *
 * @example
 * import { symbolRegistry } from "iink-ts"
 * symbolRegistry.register(new StickyNoteUtil())
 */
declare class SymbolRegistryClass {
    #private;
    register<T extends TBaseSymbol>(util: SymbolUtil<T>): this;
    getUtil<T extends TBaseSymbol>(type: string): SymbolUtil<T> | undefined;
    has(type: string): boolean;
}
/**
 * @group SymbolUtils
 */
declare const symbolRegistry: SymbolRegistryClass;

/**
 * @group SymbolUtils
 */
declare class TextUtil extends SymbolUtil<TText> {
    readonly type = SymbolType.Text;
    create(partial: TPartialDeep<TText>): TText;
    updateDerivedFields(text: TText): void;
    overlaps(text: TText, box: TBox): boolean;
    getSnapPoints(text: TText): TPoint[];
    getSVGElement(text: TText): SVGGraphicsElement;
}

export { AbstractEditor, AbstractWriterManager, BaseMenuItem, BaseRenderer, BoxOps, ButtonListMenuItem, ButtonMenuItem, CanvasRenderer, CanvasRendererShape, CanvasRendererStroke, CanvasRendererText, Chart, CheckboxMenuItem, ClearMenuAction, CollapsibleWrapper, ColorListMenuItem, ColorPaletteManager, ConvertContextMenu, ConvertMenuAction, DEFAULT_ERASER_SIZE_LIST, DEFAULT_FONT_SIZE_LIST, DEFAULT_FONT_WEIGHT_LIST, DEFAULT_MENU_COLORS, DEFAULT_THICKNESS_LIST, DOMFactory, DecoratorContextMenu, DecoratorKind, DecoratorOps, DecoratorUtil, DefaulRecognitionHTTPV1ConfigurationConfiguration, DefaultConvertionConfiguration, DefaultDebugConfiguration, DefaultDiagramConfiguration, DefaultDiagramConvertConfiguration, DefaultEditorTriggerConfiguration, DefaultEraserConfiguration, DefaultExportConfiguration, DefaultGestureConfiguration, DefaultGrabberConfiguration, DefaultGuidesConfiguration, DefaultHistoryConfiguration, DefaultIIRendererConfiguration, DefaultInkEditorConfiguration, DefaultInkEditorDeprecatedConfiguration, DefaultInteractiveInkEditorConfiguration, DefaultInteractiveInkSSREditorConfiguration, DefaultJiixConfiguration, DefaultListenerConfiguration, DefaultLoggerConfiguration, DefaultMarginConfiguration, DefaultMathConfiguration, DefaultMathUndoRedoConfiguration, DefaultMathV2Configuration, DefaultMenuActionConfig, DefaultMenuConfiguration, DefaultMenuContextConfig, DefaultMenuStyleConfig, DefaultMenuToolConfig, DefaultOverlayConfig, DefaultPenStyle, DefaultRawContentConfiguration, DefaultRawContentV2Configuration, DefaultRecognitionRendererConfiguration, DefaultRecognitionWebSocketConfiguration, DefaultRecognizerHTTPV1Configuration, DefaultRecognizerHTTPV2Configuration, DefaultRecognizerHTTPV2RecognitionConfiguration, DefaultRecognizerWebSocketConfiguration, DefaultRecognizerWebSocketSSRConfiguration, DefaultRecognizerWebSocketSSRRecognitionConfiguration, DefaultRendererConfiguration, DefaultServerHTTPConfiguration, DefaultServerWebsocketConfiguration, DefaultShapeBeautificationConfiguration, DefaultShapeConfiguration, DefaultShapeConvertConfiguration, DefaultSnapConfiguration, DefaultSolverConfiguration, DefaultStyle, DefaultTexConfigurationV2, DefaultTextConfiguration, DefaultTextGuidesConfiguration, DefaultTextGuidesConfigurationV2, DefaultTheme, DeferredPromise, DuplicateContextMenu, EdgeArcOps, EdgeDecoration, EdgeKind, EdgeLineOps, EdgeOps, EdgePolyLineOps, EdgeTool, EdgeUtil, EditContextMenu, Editor, EditorEvent, EditorEventName, EditorFactory, EditorLayer, EditorThemes, EditorTool, EditorWriteTool, EraseManager, EraseTool, EraserOps, ExportContextMenu, ExportMenuAction, ExportType, ExportV2Type, FileInputMenuItem, FillColorStyle, FontSizeStyle, FontWeightStyle, GUIDE_PATH_ATTRS, GestureHandler, GestureHelpers, GestureMenuAction, GuideMenuAction, HistoryManager, IDebugSVGManager, IHistoryManager, IIAbstractManager, IIAbstractTransformManager, IIConnectorManager, IIConversionManager, IIGestureAnnotationProcessor, IIGestureManager, IIHistoryManager, IIJiixQueryManager, IIKeyboardManager, IIMathCapabilitiesTable, IIMathComputationSubManager, IIMathDiagnosticChecker, IIMathFunctionEvaluationSubManager, IIMathFunctionEvaluator, IIMathManager, IIMathVariableEditor, IIMathVariableInputList, IIMathVariablePerBlockEditor, IIMathVariableSubManager, IIMenuAction, IIMenuContext, IIMenuManager, IIMenuStyle, IIMenuTool, IIModel, IIMoveManager, IIOverlayManager, IIResizeManager, IIRotationManager, IISelectionManager, IISnapManager, IISynchronizerManager, IITransformManager, IITranslateManager, IITypesetManager, IIWriterManager, IModel, IWriterManager, ImportMenuAction, InkEditor, InkEditorConfiguration, InkEditorDeprecated, InkEditorDeprecatedConfiguration, InsertAction, InsertGestureHandler, InteractiveInkEditor, InteractiveInkEditorConfiguration, InteractiveInkSSREditor, InteractiveInkSSREditorConfiguration, InteractiveInkSSRSVGRenderer, InteractiveInkSSRSmartGuide, JIIXEdgeKind, JIIXElementType, JIIXMathExpressionType, JIIXNodeKind, JIIXV2ShapeKind, JoinGestureHandler, LanguageMenuAction, Logger, LoggerCategory, LoggerLevel, LoggerManager, MathContextMenu, MathDiagnosticMessages, MathMenuAction, MathOps, MathUtil, MatrixTransform, Minimap, MinimapMenuAction, Modal, Model, MoveTool, OBBOps, OpacityStyle, OverlayMenuAction, PointerEventGrabber, RangeMenuItem, RecognizerError, RecognizerEvent, RecognizerEventName, RecognizerHTTPV1, RecognizerHTTPV1Configuration, RecognizerHTTPV2, RecognizerHTTPV2Configuration, RecognizerWebSocket, RecognizerWebSocketConfiguration, RecognizerWebSocketSSR, RecognizerWebSocketSSRConfiguration, RemoveContextMenu, ReorderContextMenu, ResizeDirection, SELECTION_MARGIN, SUB_GUIDE_PATH_ATTRS, SVGBuilder, SVGRenderer, SVGRendererConst, SVGStroker, ScratchGestureHandler, SelectAllContextMenu, SelectMenuItem, SelectTool, SelectionMenuAction, ShapeCircleOps, ShapeEllipseOps, ShapeKind, ShapeOps, ShapePolygonOps, ShapeTool, ShapeUtil, SnapConfiguration, SnapMenuAction, StrikeThroughAction, StrikeThroughGestureHandler, Stroke, StrokeColorStyle, StrokeOps, StrokeUtil, StyleHelper, StyleManager, SubMenuItem, SurroundAction, SurroundGestureHandler, SvgElementRole, SymbolRegistryClass, SymbolType, SymbolUtil, THEME_STORAGE_KEY, TRecognizerWebSocketMessageType, TWO_PI, Table, TextOps, TextUtil, ThemeMenuAction, ThicknessStyle, UnderlineAction, UnderlineGestureHandler, UndoRedoMenuAction, WriteTool, ZoomMenuAction, areValidCoordinates, arrowHeadEndMarkerId, arrowHeadStartMarkerId, assertServerConfig, buildButton, buildCanvas, buildCheckbox, buildDiv, buildFileInput, buildH3, buildLabel, buildNumberInput, buildOption, buildOutput, buildP, buildRange, buildSection, buildSelect, buildSpan, buildStyle, buildTBody, buildTHead, buildTable, buildTd, buildTextInput, buildTh, buildTr, cloneSymbol, computeAngleAxeRadian, computeAngleFromPointOnEllipse, computeAngleRadian, computeAverage, computeClosedEdges, computeDistance, computeDistanceBetweenPointAndSegment, computeDistanceSquared, computeEdgeBounds, computeEllipseArcPoints, computeEllipseRadiusAverage, computeHmac, computeLinksPointers, computeMiddlePointer, computeNearestPointOnSegment, computeNormalizedAnchor, computePointOnEllipse, computeRotatedPoint, computeTypesetSnapPoints, computeTypesetVertices, convertBoundingBoxMillimeterToPixel, convertDegreeToRadian, convertMillimeterToPixel, convertPartialStrokesToStrokes, convertPixelToMillimeter, convertRadianToDegree, createMenuItemInstance, createPointsOnSegment, createSymbolFromPartial, createSymbolsFromPartial, createUUID, findIntersectBetweenSegmentAndCircle, findIntersectionBetween2Segment, getApiInfos, getAvailableFontList, getAvailableLanguageList, getBoxConnectionPoint, getClosestPoint, getClosestPoints, getInitialHistoryContext, getMathDiagnosticMessage, isBetween, isDecorator, isDeepEqual, isDeepEqualIgnoring, isMath, isPointInsideBox, isPointInsidePolygon, isRecognizedMath, isRecognizedText, isStroke, isStrokeSolverOutput, isText, isValidNumber, isValidPoint, isVersionSuperiorOrEqual, mapCloseCodeToMessage, mergeDeep, normalizeAngle, registerBuiltinSymbolUtils, resolveAnchorPoint, scalaire, symbolRegistry };
export type { TAllMenuItems, TAnchor, TAngleUnit, TApiInfos, TBaseRendererConfiguration, TBaseSymbol, TBlockTextMetadata, TBox, TButtonElConfig, TCanvasShapeEllipseSymbol, TCanvasShapeLineSymbol, TCanvasShapeTableLineSymbol, TCanvasShapeTableSymbol, TCanvasTextSymbol, TCanvasTextUnderlineSymbol, TCanvasUnderLineSymbol, TChartConfig, TCheckboxElConfig, TContainerElConfig, TContextDecoratorConfig, TContextDecoratorItemsConfig, TContextExportConfig, TContextExportItemsConfig, TContextMathConfig, TContextMathItemsConfig, TContextReorderConfig, TContextReorderItemsConfig, TConverstionState, TConvertionConfiguration, TDecorator, TDiagramConfiguration, TDiagramConvertConfiguration, TEdge, TEdgeArc, TEdgeLine, TEdgePolyLine, TEditorConfiguration, TEditorLayerUI, TEditorLayerUIState, TEditorOptionsBase, TEditorOptionsMap, TEditorTheme, TEditorTriggerConfiguration, TEditorType, TEditorVariantMap, TEraser, TEraserConfiguration, TEvaluationResult, TExport, TExportActionConfig, TExportActionItemsConfig, TExportConfiguration, TExportV2, TFileInputElConfig, TGenericMenuItem, TGesture, TGestureActionConfig, TGestureActionItemsConfig, TGestureAnnotation, TGestureConfiguration, TGestureHandler, TGestureType, TGrabberConfiguration, TGuideActionConfig, TGuideActionItemsConfig, TGuidesConfiguration, THistoryConfiguration, THistoryContext, THittable, TIHistoryChanges, TIHistoryStackItem, TIIHistoryBackendChanges, TIIHistoryChanges, TIIHistoryStackItem, TIIRendererConfiguration, TImageConfiguration, TImageViewportConfiguration, TInkEditorConfiguration, TInkEditorDeprecatedConfiguration, TInkEditorDeprecatedOptions, TInkEditorOptions, TInputElConfig, TInteractiveInkEditor, TInteractiveInkEditorConfiguration, TInteractiveInkEditorOptions, TInteractiveInkSSREditorConfiguration, TInteractiveInkSSREditorOptions, TInteractiveInkSessionDescriptionMessage, TJIIXBase, TJIIXChar, TJIIXEdgeArc, TJIIXEdgeElement, TJIIXEdgeElementBase, TJIIXEdgeLine, TJIIXEdgePolyEdge, TJIIXElement, TJIIXElementBase, TJIIXExport, TJIIXLine, TJIIXMathElement, TJIIXMathExpression, TJIIXMathExpressionBase, TJIIXMathExpressionTypeValue, TJIIXMathFraction, TJIIXMathGroup, TJIIXMathNumber, TJIIXMathOperator, TJIIXMathPower, TJIIXMathRoot, TJIIXMathSquareRoot, TJIIXMathSubscript, TJIIXMathSubsuperscript, TJIIXMathSuperscript, TJIIXMathSymbol, TJIIXMathSymbolExpression, TJIIXMathUnderoverscript, TJIIXMathVariable, TJIIXNodeCircle, TJIIXNodeElement, TJIIXNodeElementBase, TJIIXNodeEllipse, TJIIXNodeParallelogram, TJIIXNodePolygon, TJIIXNodeRectangle, TJIIXNodeRhombus, TJIIXNodeTriangle, TJIIXStrokeItem, TJIIXTextElement, TJIIXV2Base, TJIIXV2Circle, TJIIXV2DrawingElement, TJIIXV2Element, TJIIXV2ElementBase, TJIIXV2Ellipse, TJIIXV2EllipseBase, TJIIXV2Export, TJIIXV2Expression, TJIIXV2Line, TJIIXV2LineSpan, TJIIXV2MathElement, TJIIXV2PolygonBase, TJIIXV2PolygonType, TJIIXV2PrimitiveArc, TJIIXV2PrimitiveLine, TJIIXV2Range, TJIIXV2RangeItem, TJIIXV2RawContentBase, TJIIXV2RawContentElement, TJIIXV2RawContentItemShape, TJIIXV2RawContentItemText, TJIIXV2RawContentShape, TJIIXV2RawContentTextLine, TJIIXV2ShapeArcOfCircle, TJIIXV2ShapeArcOfEllipse, TJIIXV2ShapeCurvedArrow, TJIIXV2ShapeCurvedDoubleArrow, TJIIXV2ShapeElement, TJIIXV2ShapeItemBase, TJIIXV2ShapeLine, TJIIXV2ShapeLineArrow, TJIIXV2ShapeLineDoubleArrow, TJIIXV2ShapeLinePolyline, TJIIXV2ShapeLinePolylineArrow, TJIIXV2ShapeLinePolylineDoubleArrow, TJIIXV2ShapePolygon, TJIIXV2ShapePolygonEquilateralTriangle, TJIIXV2ShapePolygonIsoscelesTriangle, TJIIXV2ShapePolygonParallelogram, TJIIXV2ShapePolygonQuadrilateral, TJIIXV2ShapePolygonRectangle, TJIIXV2ShapePolygonRhombus, TJIIXV2ShapePolygonRightIsoscelesTriangle, TJIIXV2ShapePolygonRightTriangle, TJIIXV2ShapePolygonSquare, TJIIXV2ShapePolygonTrapezoid, TJIIXV2ShapePolygonTriangle, TJIIXV2TextElement, TJIIXWord, TJiixConfiguration, TJiixIndex, TLabelElConfig, TLegacyStroke, TListenerConfiguration, TLoggerConfiguration, TMarginConfiguration, TMath, TMathActionConfig, TMathActionItemsConfig, TMathBlockComputation, TMathComputationConfig, TMathConfig, TMathConfiguration, TMathDependencies, TMathElement, TMathEvaluable, TMathEvaluableFunction, TMathInteractionConfig, TMathMLExport, TMathMLFlavor, TMathResultMode, TMathSelectionLevel, TMathSymbolCapabilities, TMathUndoRedoConfiguration, TMathVariable, TMathVariableDefinition, TMathVariableDefinitionInfo, TMathVariableDefinitions, TMathVariableUsage, TMatrixTransform, TMenuActionConfig, TMenuButton, TMenuButtonList, TMenuCheckbox, TMenuColorList, TMenuConfigUpdate, TMenuConfiguration, TMenuContextConfig, TMenuFileInput, TMenuItemBase, TMenuPosition, TMenuRange, TMenuSelect, TMenuStyleConfig, TMenuSubMenu, TMenuToolConfig, TMinimapOptions, TModalConfig, TModalField, TModalFieldOption, TModalType, TOBB, TOutputElConfig, TOverlayActionConfig, TOverlayActionItemsConfig, TOverlayConfig, TPartialDeep, TPenStyle, TPoint, TPointer, TPointerInfo, TRangeElConfig, TRawContentConfiguration, TRecognitionHTTPV1Configuration, TRecognitionPositions, TRecognitionRendererConfiguration, TRecognitionRendererDebugConfiguration, TRecognitionTypeBase, TRecognitionTypeV1, TRecognitionTypeV2, TRecognitionWebSocketConfiguration, TRecognizerHTTPV1Configuration, TRecognizerHTTPV1PostConfiguration, TRecognizerHTTPV1PostData, TRecognizerHTTPV2Configuration, TRecognizerHTTPV2PostConfiguration, TRecognizerHTTPV2PostData, TRecognizerHTTPV2RecognitionConfiguration, TRecognizerWebSocketConfiguration, TRecognizerWebSocketMessage, TRecognizerWebSocketMessageAuthenticated, TRecognizerWebSocketMessageContentChange, TRecognizerWebSocketMessageContextlessGesture, TRecognizerWebSocketMessageError, TRecognizerWebSocketMessageExport, TRecognizerWebSocketMessageGesture, TRecognizerWebSocketMessageHMACChallenge, TRecognizerWebSocketMessageIdle, TRecognizerWebSocketMessageMathSolverAsVariableDefinition, TRecognizerWebSocketMessageMathSolverAvailableActions, TRecognizerWebSocketMessageMathSolverEvaluate, TRecognizerWebSocketMessageMathSolverGetDiagnostic, TRecognizerWebSocketMessageMathSolverGetEvaluables, TRecognizerWebSocketMessageMathSolverGetVariableDefinitions, TRecognizerWebSocketMessageMathSolverGetVariableValue, TRecognizerWebSocketMessageMathSolverGetVariables, TRecognizerWebSocketMessageMathSolverNumericalComputation, TRecognizerWebSocketMessageMathSolverRemoveVariableValue, TRecognizerWebSocketMessageMathSolverResult, TRecognizerWebSocketMessageMathSolverSetVariableValue, TRecognizerWebSocketMessageNewPart, TRecognizerWebSocketMessagePartChange, TRecognizerWebSocketMessagePong, TRecognizerWebSocketMessageReceived, TRecognizerWebSocketSSRConfiguration, TRecognizerWebSocketSSRMessage, TRecognizerWebSocketSSRMessageContentChange, TRecognizerWebSocketSSRMessageContentPackageDescriptionMessage, TRecognizerWebSocketSSRMessageError, TRecognizerWebSocketSSRMessageExport, TRecognizerWebSocketSSRMessageHMACChallenge, TRecognizerWebSocketSSRMessagePartChange, TRecognizerWebSocketSSRMessageSVGPatch, TRecognizerWebSocketSSRRecognitionConfiguration, TRendererConfiguration, TRotation, TRoundingMode, TScheme, TSegment, TSelectElConfig, TSelectElOption, TSelectionActionConfig, TSelectionActionItemsConfig, TServerHTTPConfiguration, TServerWebsocketConfiguration, TShape, TShapeBeautificationConfiguration, TShapeCircle, TShapeConfiguration, TShapeConvertConfiguration, TShapeEllipse, TShapePolygon, TShapeSelectionLevel, TSnapActionConfig, TSnapActionItemsConfig, TSnapConfiguration, TSnapLineInfos, TSnapNudge, TSolverConfiguration, TSolverOptions, TStroke, TStrokeGroup, TStrokeGroupToSend, TStrokeMinimal, TStrokeQueryResult, TStyle, TSubMenuItems, TSymbol, TSymbolChar, TSymbolDiagnostic, TSymbolVariables, TTableBaseElConfig, TTableCellConfig, TTableCellElConfig, TTableColumn, TTableConfig, TTableRow, TText, TTextConfConfiguration, TTextConfiguration, TTextGuidesConfiguration, TTextGuidesConfigurationV2, TTextRecognizerHTTPV2ConfConfiguration, TTextRecognizerHTTPV2Configuration, TTextSelectionLevel, TTheme, TThemeMath, TThemeMathSolved, TThemeText, TTypesetChild, TUndoRedoMode, TUpdatePatch, TUpdatePatchAppendChild, TUpdatePatchInsertBefore, TUpdatePatchRemoveAttribut, TUpdatePatchRemoveChild, TUpdatePatchRemoveElement, TUpdatePatchReplaceAll, TUpdatePatchReplaceELement, TUpdatePatchSetAttribut, TUpdatePatchType, TVariableInputItem };
//# sourceMappingURL=iink.d.ts.map
