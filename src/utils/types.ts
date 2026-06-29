/**
 * @group Utilities
 */
export type TPartialDeep<T> = T extends object
  ? {
      [P in keyof T]?: TPartialDeep<T[P]>
    }
  : T
