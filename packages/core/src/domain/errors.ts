// src/domain/errors.ts
import { Data } from "effect"

export class Unauthorized extends Data.TaggedError("Unauthorized") {}

export class Forbidden extends Data.TaggedError("Forbidden")<{
  readonly resource?: string
}> {}

export class NotFound extends Data.TaggedError("NotFound")<{
  readonly entity: string
  readonly id?: string
}> {}

export class UnexpectedError extends Data.TaggedError("UnexpectedError")<{
  readonly error: unknown
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string
}> {}

export class RepositoryError extends Data.TaggedError("RepositoryError")<{
  readonly message: string
}> {}
