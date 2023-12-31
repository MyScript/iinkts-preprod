
const { waitForEditorWebSocket } = require('../helper')

describe('Websocket Math Eraser', function () {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_math_iink_eraser.html')
    await waitForEditorWebSocket(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket Math Eraser')
  })

  require("../_partials/math/nav-actions-math-undo-redo-test")
  require("../_partials/math/nav-actions-math-clear-test")
})
