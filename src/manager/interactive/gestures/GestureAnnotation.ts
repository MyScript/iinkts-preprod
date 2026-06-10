import type { DecoratorKind } from "@/symbol"

/**
 * Unified representation of a gesture's intent on a set of target strokes.
 * Handlers write annotations; IIGestureAnnotationProcessor executes them.
 * @group Manager
 */
export type TGestureAnnotation =
  | { kind: "decorator"; decoratorKind: DecoratorKind }
  | { kind: "erase" }
  | { kind: "thicken"; factor: number }
  | { kind: "select" }
