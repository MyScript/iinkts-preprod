/**
 * @group Manager
 * @summary Math managers
 *
 * These managers handle math-specific features:
 * - VariableColorManager: Color palette for variable visualization
 * - TransientInkManager: Temporary solver result overlays
 * - MathOverlayManager: Visual overlays (badges, borders, result panels)
 * - MathInteractionManager: Interaction highlighting and dependency visualization
 */
export { VariableColorManager } from "./VariableColorManager"
export { TransientInkManager } from "./TransientInkManager"
export { MathOverlayManager, TMathOverlayConfig } from "./MathOverlayManager"
export { MathInteractionManager, TMathInteractionConfig } from "./MathInteractionManager"
