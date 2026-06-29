/**
 * @group Editor
 * @summary Editor variants for different use cases
 *
 * This module organizes different editor implementations:
 * - **InkEditorVariant**: Basic ink editor with HTTPv2 API (recommended for simple use cases)
 * - **InteractiveInkEditorVariant**: Full-featured interactive editor with WebSocket and advanced features
 * - **InteractiveInkSSREditorVariant**: SSR-compatible variant for server-side rendering
 * - **InkEditorDeprecatedVariant**: Legacy HTTPv1 implementation (do not use for new projects)
 */
export * from "./InkEditor"
export * from "./InkEditorConfiguration"
export * from "./InkEditorDeprecated"
export * from "./InkEditorDeprecatedConfiguration"
export * from "./InteractiveInkEditor"
export * from "./InteractiveInkEditorConfiguration"
export * from "./InteractiveInkSSREditor"
export * from "./InteractiveInkSSREditorConfiguration"
