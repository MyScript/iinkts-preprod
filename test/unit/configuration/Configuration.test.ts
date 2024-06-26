import
{
  ConfigurationTextWebsocket,
  ConfigurationTextRest,
  ConfigurationDiagramRest,
  ConfigurationRawContentRest,
  AllOverrideConfiguration,
  OffScreenOverrideConfiguration,
} from "../__dataset__/configuration.dataset"

import {
  Configuration,
  DefaultConfiguration,
  PartialDeep,
  TConfiguration,
  TRecognitionConfiguration
} from "../../../src/iink"

describe("Configuration.ts", () =>
{
  test("should be default configuration", () =>
  {
    const configurationDefault = new Configuration()
    expect(configurationDefault.grabber).toStrictEqual(DefaultConfiguration.grabber)
    const defaultRecognition = JSON.parse(JSON.stringify(DefaultConfiguration.recognition)) as TRecognitionConfiguration
    // need to remove raw-content.gestures because not recognized when not offscreen configuration
    delete defaultRecognition["raw-content"].gestures
    expect(configurationDefault.recognition).toStrictEqual(defaultRecognition)
    expect(configurationDefault.rendering).toStrictEqual(DefaultConfiguration.rendering)
    expect(configurationDefault.server).toStrictEqual(DefaultConfiguration.server)
    expect(configurationDefault.triggers).toStrictEqual(DefaultConfiguration.triggers)
    expect(configurationDefault["undo-redo"]).toStrictEqual(DefaultConfiguration["undo-redo"])
  })

  const configurationsClient: { name: string, config: PartialDeep<TConfiguration> }[] = [
    { name: "ConfigurationTextWebsocket", config: ConfigurationTextWebsocket },
    { name: "ConfigurationTextRest", config: ConfigurationTextRest },
    { name: "ConfigurationDiagramRest", config: ConfigurationDiagramRest },
    { name: "ConfigurationRawContentRest", config: ConfigurationRawContentRest }
  ]

  configurationsClient.forEach(cc =>
  {
    const configuration: TConfiguration = new Configuration(cc.config)
    describe(`should merge ${ cc.name } with DefaultConfiguration`, () =>
    {
      test("should have server.protocol", () =>
      {
        expect(configuration.server.protocol).toStrictEqual(cc.config?.server?.protocol)
      })
      test("should have server.scheme", () =>
      {
        expect(configuration.server.scheme).toStrictEqual(cc.config?.server?.scheme)
      })
      test("should have server.host", () =>
      {
        expect(configuration.server.host).toStrictEqual(cc.config?.server?.host)
      })
      test("should have server.applicationKey", () =>
      {
        expect(configuration.server.applicationKey).toStrictEqual(cc.config?.server?.applicationKey)
      })
      test("should have server.hmacKey", () =>
      {
        expect(configuration.server.hmacKey).toStrictEqual(cc.config?.server?.hmacKey)
      })
      test("should have recognition.type", () =>
      {
        expect(configuration.recognition.type).toStrictEqual(cc.config?.recognition?.type)
      })
      if (cc.config.recognition?.type === "Raw Content") {
        test("should not have recognition[raw-content].mimeTypes", () =>
        {
          expect(configuration.recognition["raw-content"]).not.toHaveProperty("raw-content")
        })
      } else {
        test("should have recognition.text.mimeTypes", () =>
        {
          switch (configuration.recognition.type) {
            case "MATH":
              expect(configuration.recognition.math.mimeTypes).toStrictEqual(cc.config?.recognition?.math?.mimeTypes)
              break
            case "DIAGRAM":
              expect(configuration.recognition.diagram.mimeTypes).toStrictEqual(cc.config?.recognition?.diagram?.mimeTypes)
              break
            case "TEXT":
              expect(configuration.recognition.text.mimeTypes).toStrictEqual(cc.config?.recognition?.text?.mimeTypes)
              break
            default:
              break
          }
        })
      }
    })
  })

  describe("should override all values", () =>
  {
    const overrideConfig: TConfiguration = new Configuration(AllOverrideConfiguration)

    test("should override grabber", () =>
    {
      expect(overrideConfig.grabber).toStrictEqual(AllOverrideConfiguration.grabber)
    })

    test("should override recognition", () =>
    {
      const expectedRecongnitionConf = JSON.parse(JSON.stringify(AllOverrideConfiguration.recognition)) as TRecognitionConfiguration
      expect(overrideConfig.recognition).toStrictEqual(expectedRecongnitionConf)
    })

    test("should override rendering", () =>
    {
      expect(overrideConfig.rendering).toStrictEqual(AllOverrideConfiguration.rendering)
    })

    test("should override server", () =>
    {
      expect(overrideConfig.server).toStrictEqual(AllOverrideConfiguration.server)
    })

    test("should override triggers", () =>
    {
      expect(overrideConfig.triggers).toStrictEqual(AllOverrideConfiguration.triggers)
    })

    test("should override undo-redo", () =>
    {
      expect(overrideConfig["undo-redo"]).toStrictEqual(AllOverrideConfiguration["undo-redo"])
    })

    test("should override raw-content.gestures when offscreen=true", () =>
    {
      const c: TConfiguration = new Configuration(OffScreenOverrideConfiguration)
      expect(c.recognition["raw-content"].gestures).toStrictEqual(OffScreenOverrideConfiguration.recognition["raw-content"].gestures)
    })
  })

  describe("specifics rules", () =>
  {
    test("should add mimeType JIIX if rendering.smartGuide = true", () =>
    {
      const conf = JSON.parse(JSON.stringify(DefaultConfiguration)) as TConfiguration
      conf.server.protocol = "WEBSOCKET"
      conf.recognition.type = "TEXT"
      conf.rendering.smartGuide.enable = true
      conf.recognition.text.mimeTypes = ["text/plain"]
      expect(conf.recognition.text.mimeTypes).not.toContain("application/vnd.myscript.jiix")
      const c: TConfiguration = new Configuration(conf)
      expect(c.recognition.text.mimeTypes).toContain("application/vnd.myscript.jiix")
    })

    test("should set rendering.smartGuide = false if REST", () =>
    {
      const conf = { ...DefaultConfiguration }
      conf.server.protocol = "REST"
      conf.rendering.smartGuide.enable = true
      const c: TConfiguration = new Configuration(conf)
      expect(c.rendering.smartGuide.enable).toStrictEqual(false)
    })

    test("should set triggers.exportContent = QUIET_PERIOD if REST", () =>
    {
      const conf = { ...DefaultConfiguration }
      conf.server.protocol = "REST"
      conf.triggers.exportContent = "POINTER_UP"
      const c: TConfiguration = new Configuration(conf)
      expect(c.triggers.exportContent).toStrictEqual("QUIET_PERIOD")
    })

    test("should set rendering.smartGuide = false if not TEXT", () =>
    {
      const conf = { ...DefaultConfiguration }
      conf.recognition.type = "MATH"
      conf.rendering.smartGuide.enable = true
      const c: TConfiguration = new Configuration(conf)
      expect(c.rendering.smartGuide.enable).toStrictEqual(false)
    })

    test("should set server.scheme & server.host if server.useWindowLocation = true", () =>
    {
      const conf = { ...DefaultConfiguration }
      conf.server.useWindowLocation = true

      Object.defineProperty(window, "location", {
        value: new URL("https://localhost:3000")
      })

      const c: TConfiguration = new Configuration(conf)
      expect(c.server.scheme).toStrictEqual(window.location.protocol.replace(":", ""))
      expect(c.server.host).toStrictEqual(window.location.host)
    })

    test("should set recognitionType=Raw Content when offscreen=true", () =>
    {
      const c: TConfiguration = new Configuration(OffScreenOverrideConfiguration)
      expect(c.rendering).toStrictEqual(OffScreenOverrideConfiguration.rendering)
      expect(c.recognition.type).toStrictEqual("Raw Content")
    })

  })

})
