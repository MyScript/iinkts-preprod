import { Modal, ModalConfig } from "../../../src/components/Modal"

describe("Modal.ts", () =>
{
  let container: HTMLDivElement

  beforeEach(() =>
  {
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(() =>
  {
    document.body.innerHTML = ""
  })

  test("should create modal with basic config", () =>
  {
    const config: ModalConfig = {
      title: "Test Modal",
      fields: [
        {
          id: "name",
          label: "Name",
          type: "text",
          placeholder: "Enter name"
        }
      ],
      buttons: [
        {
          label: "OK",
          type: "primary",
          callback: jest.fn()
        }
      ]
    }

    const modal = new Modal(config)
    expect(modal).toBeDefined()
  })

  test("should create modal with multiple field types", () =>
  {
    const config: ModalConfig = {
      title: "Test Modal",
      fields: [
        {
          id: "name",
          label: "Name",
          type: "text",
          defaultValue: "John"
        },
        {
          id: "age",
          label: "Age",
          type: "number",
          defaultValue: 25
        },
        {
          id: "country",
          label: "Country",
          type: "select",
          options: [
            { value: "fr", label: "France" },
            { value: "us", label: "USA" }
          ],
          defaultValue: "fr"
        }
      ],
      buttons: [
        {
          label: "Submit",
          type: "primary",
          callback: jest.fn()
        }
      ]
    }

    const modal = new Modal(config)
    expect(modal).toBeDefined()
  })

  describe("open()", () =>
  {
    test("should open modal and add to DOM", () =>
    {
      const config: ModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: [
          {
            label: "Close",
            type: "secondary",
            callback: jest.fn()
          }
        ]
      }

      const modal = new Modal(config)
      modal.open()

      const backdrop = document.querySelector("div[style*='position: fixed']") as HTMLDivElement
      expect(backdrop).toBeTruthy()
      expect(backdrop.style.display).toBe("block")

      const modalElements = document.querySelectorAll("div[style*='position: fixed']")
      expect(modalElements.length).toBeGreaterThan(1)
    })

    test("should focus first input after opening", (done) =>
    {
      const config: ModalConfig = {
        title: "Test Modal",
        fields: [
          {
            id: "name",
            label: "Name",
            type: "text"
          }
        ],
        buttons: [
          {
            label: "OK",
            type: "primary",
            callback: jest.fn()
          }
        ]
      }

      const modal = new Modal(config)
      modal.open()

      setTimeout(() =>
      {
        const input = document.querySelector("#name") as HTMLInputElement
        expect(input).toBeTruthy()
        expect(document.activeElement).toBe(input)
        done()
      }, 100)
    })

    test("should not open if already open", () =>
    {
      const config: ModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: []
      }

      const modal = new Modal(config)
      modal.open()
      const initialCount = document.querySelectorAll("div[style*='position: fixed']").length

      modal.open()
      const finalCount = document.querySelectorAll("div[style*='position: fixed']").length

      expect(initialCount).toBe(finalCount)
    })
  })

  describe("close()", () =>
  {
    test("should close modal", () =>
    {
      const config: ModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: []
      }

      const modal = new Modal(config)
      modal.open()

      const backdrop = document.querySelector("div[style*='position: fixed']") as HTMLDivElement
      expect(backdrop.style.display).toBe("block")

      modal.close()
      expect(backdrop.style.display).toBe("none")
    })

    test("should not close if already closed", () =>
    {
      const config: ModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: []
      }

      const modal = new Modal(config)
      modal.close()

      // Should not throw error
      expect(() => modal.close()).not.toThrow()
    })
  })

  describe("destroy()", () =>
  {
    test("should remove modal from DOM", () =>
    {
      const config: ModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: []
      }

      const modal = new Modal(config)
      modal.open()

      expect(document.body.children.length).toBeGreaterThan(0)

      modal.destroy()

      expect(document.body.children.length).toBe(1) // Only container remains
    })
  })

  describe("button callbacks", () =>
  {
    test("should call button callback with field values", () =>
    {
      const callback = jest.fn()
      const config: ModalConfig = {
        title: "Test Modal",
        fields: [
          {
            id: "name",
            label: "Name",
            type: "text",
            defaultValue: "John"
          },
          {
            id: "age",
            label: "Age",
            type: "number",
            defaultValue: 30
          }
        ],
        buttons: [
          {
            label: "Submit",
            type: "primary",
            callback
          }
        ]
      }

      const modal = new Modal(config)
      modal.open()

      const button = document.querySelector("button") as HTMLButtonElement
      button.click()

      expect(callback).toHaveBeenCalledWith({
        name: "John",
        age: "30"
      })
    })

    test("should handle async button callbacks", async () =>
    {
      const callback = jest.fn().mockResolvedValue(undefined)
      const config: ModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: [
          {
            label: "Async",
            type: "primary",
            callback
          }
        ]
      }

      const modal = new Modal(config)
      modal.open()

      const button = document.querySelector("button") as HTMLButtonElement
      button.click()

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(callback).toHaveBeenCalled()
    })
  })

  describe("custom content", () =>
  {
    test("should render custom content", () =>
    {
      const customDiv = document.createElement("div")
      customDiv.id = "custom-content"
      customDiv.textContent = "Custom content here"

      const config: ModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: [],
        customContent: customDiv
      }

      const modal = new Modal(config)
      modal.open()

      const customElement = document.querySelector("#custom-content")
      expect(customElement).toBeTruthy()
      expect(customElement?.textContent).toBe("Custom content here")
    })
  })

  describe("backdrop interaction", () =>
  {
    test("should close modal when clicking backdrop", () =>
    {
      const config: ModalConfig = {
        title: "Test Modal",
        fields: [],
        buttons: []
      }

      const modal = new Modal(config)
      modal.open()

      const backdrop = document.querySelector("div[style*='z-index: 9999']") as HTMLDivElement
      expect(backdrop).toBeTruthy()

      backdrop.click()

      expect(backdrop.style.display).toBe("none")
    })
  })

  describe("field values", () =>
  {
    test("should update field values when user types", () =>
    {
      const callback = jest.fn()
      const config: ModalConfig = {
        title: "Test Modal",
        fields: [
          {
            id: "email",
            label: "Email",
            type: "text",
            defaultValue: ""
          }
        ],
        buttons: [
          {
            label: "Submit",
            type: "primary",
            callback
          }
        ]
      }

      const modal = new Modal(config)
      modal.open()

      const input = document.querySelector("#email") as HTMLInputElement
      expect(input).toBeTruthy()

      input.value = "test@example.com"

      const button = document.querySelector("button") as HTMLButtonElement
      button.click()

      expect(callback).toHaveBeenCalledWith({
        email: "test@example.com"
      })
    })

    test("should handle select field changes", () =>
    {
      const callback = jest.fn()
      const config: ModalConfig = {
        title: "Test Modal",
        fields: [
          {
            id: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" }
            ],
            defaultValue: "active"
          }
        ],
        buttons: [
          {
            label: "Submit",
            type: "primary",
            callback
          }
        ]
      }

      const modal = new Modal(config)
      modal.open()

      const select = document.querySelector("#status") as HTMLSelectElement
      expect(select).toBeTruthy()
      expect(select.value).toBe("active")

      select.value = "inactive"

      const button = document.querySelector("button") as HTMLButtonElement
      button.click()

      expect(callback).toHaveBeenCalledWith({
        status: "inactive"
      })
    })
  })
})
