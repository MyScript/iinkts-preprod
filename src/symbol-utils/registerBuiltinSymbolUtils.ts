import { symbolRegistry } from "./SymbolRegistry"
import { StrokeUtil } from "./stroke/StrokeUtil"
import { TextUtil } from "./text/TextUtil"
import { MathUtil } from "./math/MathUtil"
import { ShapeUtil } from "./shape/ShapeUtil"
import { EdgeUtil } from "./edge/EdgeUtil"
import { DecoratorUtil } from "./decorator/DecoratorUtil"

export function registerBuiltinSymbolUtils(): void
{
  symbolRegistry
    .register(new StrokeUtil())
    .register(new TextUtil())
    .register(new MathUtil())
    .register(new ShapeUtil())
    .register(new EdgeUtil())
    .register(new DecoratorUtil())
}
