/**
 * @group Recognizer
 */
export type TRecognitionTypeBase = "TEXT" | "MATH" | "Raw Content"

/**
 * @group Recognizer
 */
export type TRecognitionTypeV1 = TRecognitionTypeBase | "DIAGRAM"

/**
 * @group Recognizer
 */
export type TRecognitionTypeV2 = TRecognitionTypeBase | "SHAPE"

/**
 * @group Recognizer
 */
export type TConverstionState = "DIGITAL_EDIT" | "HANDWRITING"
