import { Schema } from "effect"

// Recursive type for nested menus
export interface MenuItem {
  readonly id: string
  readonly label: string
  readonly path: string
  readonly target?: "_blank" | "_self" | undefined
  readonly children?: ReadonlyArray<MenuItem> | undefined
}

export const MenuItem: Schema.Schema<MenuItem> = Schema.suspend(() => 
  Schema.Struct({
    id: Schema.String,
    label: Schema.String,
    path: Schema.String,
    target: Schema.optional(Schema.Literal("_blank", "_self")),
    children: Schema.optional(Schema.Array(MenuItem))
  })
)

export const MenuTree = Schema.Array(MenuItem)
