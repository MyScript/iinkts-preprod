
import { IIMenuStyleConfig, defaultMenuStyleConfig } from "./IIMenuStyleConfig"
import { IIMenuToolConfig, defaultMenuToolConfig } from "./IIMenuToolConfig"
import { IIMenuActionConfig, defaultMenuActionConfig } from "./IIMenuActionConfig"

/**
 * @group Menu
 */
export type TMenuConfiguration = {
  enable: boolean,
  style: IIMenuStyleConfig & { enable: boolean }
  tool: IIMenuToolConfig & { enable: boolean }
  action: IIMenuActionConfig & { enable: boolean }
  context: {
    enable: boolean,
  }
}

/**
 * @group Menu
 * @source
 */
export const DefaultMenuConfiguration: TMenuConfiguration = {
  enable: true,
  style: {
    enable: true,
    ...defaultMenuStyleConfig
  },
  tool: {
    enable: true,
    ...defaultMenuToolConfig
  },
  action: {
    enable: true,
    ...defaultMenuActionConfig
  },
  context: {
    enable: true
  },
}
