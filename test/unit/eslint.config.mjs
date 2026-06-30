import globals from "globals"

export default {
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
      ...globals.jest
    },
  },
}
