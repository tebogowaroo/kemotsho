// src/domain/ids.ts
import { Schema } from "effect"

/**
 * Creates a schema for a branded ID based on a string.
 * and attaches a make() method to generate a UUID.
 * @param brand The unique brand identifier.
 */
export const makeId = <B extends string>(brand: B) => {
    const schema = Schema.String.pipe(Schema.brand(brand))
    return Object.assign(schema, {
        make: (id?: string) => (id || crypto.randomUUID()) as Schema.Schema.Type<typeof schema>
    })
}

