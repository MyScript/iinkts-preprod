import { DecoratorUtil } from "./decorator/DecoratorUtil"
import { EdgeUtil } from "./edge/EdgeUtil"
import { MathUtil } from "./math/MathUtil"
import { ShapeUtil } from "./shape/ShapeUtil"
import { StrokeUtil } from "./stroke/StrokeUtil"
import { symbolRegistry } from "./SymbolRegistry"
import { TextUtil } from "./text/TextUtil"

/**
 * @group SymbolUtils
 */
export function registerBuiltinSymbolUtils(): void {
  symbolRegistry
    .register(new StrokeUtil())
    .register(new TextUtil())
    .register(new MathUtil())
    .register(new ShapeUtil())
    .register(new EdgeUtil())
    .register(new DecoratorUtil())
}
