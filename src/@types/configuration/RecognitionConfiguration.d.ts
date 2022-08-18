import { TConvertConfiguration } from './recognition/ConvertConfiguration'
import { TDiagramConfiguration } from './recognition/DiagramConfiguration'
import { TExportConfiguration } from './recognition/ExportConfiguration'
import { TMathConfiguration } from './recognition/MathConfiguration'
import { TRawContentConfiguration } from './recognition/RawContentConfiguration'
import { TTextConfiguration } from './recognition/TextConfiguration'

export type TDebugConfiguration = {
  'draw-text-boxes': boolean
  'draw-image-boxes': boolean
}

export type TRecognitionRendererConfiguration = {
  debug: TDebugConfiguration
}

export type TGesture = { enable: boolean }

export type TRecognitionConfiguration = {
  convert?: TConvertConfiguration
  type: 'TEXT' | 'MATH' | 'DIAGRAM' | 'Raw Content'
  alwaysConnected: boolean
  lang: string
  replaceMimeTypes: boolean
  math: TMathConfiguration
  text: TTextConfiguration
  diagram: TDiagramConfiguration
  renderer: TRecognitionRendererConfiguration
  export: TExportConfiguration
  rawContent: TRawContentConfiguration
  gesture: TGesture
}

export type TRecognitionConfigurationClient = {
  convert?: TConvertConfiguration
  type?: 'TEXT' | 'MATH' | 'DIAGRAM' | 'Raw Content'
  alwaysConnected?: boolean
  lang?: string
  replaceMimeTypes?: boolean
  math?: TMathConfiguration
  text?: TTextConfiguration
  diagram?: TDiagramConfiguration
  renderer?: TRecognitionRendererConfiguration
  export?: TExportConfiguration
  rawContent?: TRawContentConfiguration
  gesture?: TGesture
}