export class ValidatorDiagnostics {
  #errors: string[] = [];
  #scopes: (string | number)[] = [];

  get errors() {
    return this.#errors;
  }

  get isOk(): boolean {
    return this.#errors.length === 0;
  }

  pushScope(scope: string | number) {
    this.#scopes.push(scope);
  }

  popScope() {
    this.#scopes.pop();
  }

  pushError(error: string): ValidatorDiagnostics {
    const scopes = this.#scopes;

    let message = "";
    for (let i = 0; i < scopes.length; i++) {
      const scope = scopes[i];
      if (typeof scope === "number") {
        message += `[${scope}]`;
      } else {
        if (typeof scope[i - 1] !== "number" && i !== 0) {
          message += `.${scope}`;
        } else {
          message += scope;
        }
      }
    }

    this.#errors.push(`'${message}': ${error}`);
    return this;
  }

  /** Tries to throw if there are any errors. */
  tryThrowErrors() {
    const errors = this.#errors;
    if (errors.length !== 0) {
      this.debug();
      throw new TypeError(
        "Failed to validate data. There is most likely more information above.",
      );
    }
  }

  debug() {
    for (const error of this.#errors) {
      console.error(error);
    }
  }
}

// deno-lint-ignore no-explicit-any
export interface Validator<T = any> {
  /** Returns a boolean indicating whether the value matches the validator's validation. */
  validate: (
    value: T,
    diagnostics?: ValidatorDiagnostics,
  ) => ValidatorDiagnostics;
}

export type GetJasonType<T extends Validator> = T extends Validator<infer K> ? K
  : never;

interface MinMax {
  min: number;
  max: number;
}

export interface StringInit {
  /** Either the minimum or maxmimum length as an object or just a static length. */
  length?: Partial<MinMax> | number;
  startsWith?: string;
  endsWith?: string;
  customValidator?: Validator<string>["validate"];
}

/** Matches a string value with the given options. */
export function string(init: StringInit = {}): Validator<string> {
  return {
    validate: (value: string, diagnostics = new ValidatorDiagnostics()) => {
      if (typeof value !== "string") {
        return diagnostics.pushError(`the value was not of type 'string'`);
      }

      if (
        init.startsWith !== undefined &&
        value.startsWith(init.startsWith) === false
      ) {
        return diagnostics.pushError(
          `'${value}' did not start with '${init.startsWith}'`,
        );
      }

      if (
        init.endsWith !== undefined &&
        value.endsWith(init.endsWith) === false
      ) {
        return diagnostics.pushError(
          `'${value}' did not end with '${init.endsWith}'`,
        );
      }

      if (init.length !== undefined) {
        if (typeof init.length === "number" && value.length !== init.length) {
          return diagnostics.pushError(
            `'${value}' did not have a length of '${init.length}'`,
          );
        }

        if (typeof init.length === "object") {
          if (init.length.min !== undefined && value.length < init.length.min) {
            return diagnostics.pushError(
              `'${value}' had a length less than the minimum length of '${init.length.min}'`,
            );
          }

          if (init.length.max !== undefined && value.length > init.length.max) {
            return diagnostics.pushError(
              `'${value}' had length greater than the maximum length of '${init.length.max}'`,
            );
          }
        }
      }

      if (init.customValidator !== undefined) {
        return init.customValidator(value, diagnostics);
      }

      return diagnostics;
    },
  };
}

export interface NumberInit extends Partial<MinMax> {
  customValidator?: Validator<number>["validate"];
}

export function boolean(): Validator<boolean> {
  return {
    validate: (
      value: boolean,
      diagnostics: ValidatorDiagnostics = new ValidatorDiagnostics(),
    ) => {
      if (value !== true && value !== false) {
        return diagnostics.pushError("the value is not of type 'boolean'");
      }
      return diagnostics;
    },
  };
}

/** Creates a validator that matches the `number` type with the optional options. */
export function number(init: NumberInit = {}): Validator<number> {
  return {
    validate: (
      value: number,
      diagnostics: ValidatorDiagnostics = new ValidatorDiagnostics(),
    ) => {
      if (typeof value !== "number") {
        return diagnostics.pushError(`the value is not of type 'number'`);
      }

      if (init.min !== undefined && value < init.min) {
        return diagnostics.pushError(
          `'${value}' is not greater than or equal to '${init.min}'`,
        );
      }

      if (init.max !== undefined && value > init.max) {
        return diagnostics.pushError(
          `${value} is not less or equal to '${init.max}'`,
        );
      }

      if (init.customValidator !== undefined) {
        return init.customValidator(value, diagnostics);
      }

      return diagnostics;
    },
  };
}

/** Creates a validator that matches either the contained `Validator` or `undefined`. */
export function optional<T>(validator: Validator<T>): Validator<T | undefined> {
  return {
    validate: (
      value: T | undefined,
      diagnostics: ValidatorDiagnostics = new ValidatorDiagnostics(),
    ) => {
      if (value === undefined) {
        return diagnostics;
      }
      return validator.validate(value, diagnostics);
    },
  };
}

/** Makes all properties that can be undefined also optional. */
type MakeUndefinedOptional<T> =
  & {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K];
  }
  & {
    [K in keyof T as undefined extends T[K] ? K : never]?: T[K];
  };

/**
 * Creates a validator that matches objects that match the shape of the given
 * object and where each of the keys specified have values that match their
 * given validator.
 */
export function object<T extends Record<string, Validator>>(
  init: T,
): Validator<
  MakeUndefinedOptional<
    {
      [K in keyof T]: T[K] extends Validator<infer I> ? I : never;
    }
  >
> {
  return {
    validate: (
      value: GetJasonType<ReturnType<typeof object>>,
      diagnostics: ValidatorDiagnostics = new ValidatorDiagnostics(),
    ) => {
      if (typeof value !== "object") {
        return diagnostics.pushError("the value was not of type 'object'");
      }

      for (const [k, v] of Object.entries(init)) {
        diagnostics.pushScope(k);
        // This 'any' is required because we don't add the requirement in the
        // generics. However, we block customly setting the generic with the
        // '__private__' key so it should be fine.
        // deno-lint-ignore no-explicit-any
        v.validate((value as any)[k], diagnostics);
        diagnostics.popScope();
      }

      return diagnostics;
    },
  };
}

export interface ArrayOptions {
  length?: Partial<MinMax> | number;
}

/**
 * Creates a validator that matches an array of items that match the given
 * validator within.
 */
export function array<T extends Validator>(
  validator: T,
  options: ArrayOptions = {},
): Validator<GetJasonType<T>[]> {
  return {
    validate: (
      value: T[],
      diagnostics: ValidatorDiagnostics = new ValidatorDiagnostics(),
    ) => {
      if (Array.isArray(value) === false) {
        return diagnostics.pushError("the value is not of type 'array'");
      }

      if (typeof options.length === "number") {
        if (value.length !== options.length) {
          return diagnostics.pushError(
            `the array length of '${value.length} is not equal to ${options.length}'`,
          );
        }
      } else if (typeof options.length === "object") {
        if (
          options.length.min !== undefined &&
          value.length < options.length.min
        ) {
          return diagnostics.pushError(
            `the array length of '${value.length} is not greater than or equal to ${options.length.min}'`,
          );
        } else if (
          options.length.max !== undefined &&
          options.length.max > options.length.max
        ) {
          return diagnostics.pushError(
            `the array length of '${value.length}' si not less than or equal to ${options.length.max}`,
          );
        }
      }

      for (let i = 0; i < value.length; i++) {
        diagnostics.pushScope(i);
        validator.validate(value[i], diagnostics);
        diagnostics.popScope();
      }
      return diagnostics;
    },
  };
}

/**
 * Creates a wrapper over the given validator and displays the given label
 * within error stack messages.
 *
 * Note: this includes the label in a JavaScript object-like notation
 * (`foo.b[2]`) so you should stick with PascalCase for labels to help tell the
 * difference between labelled validators and regular JavaScript object
 * properties from the `object` validator.
 */
export function labelled<T extends Validator>(
  label: string,
  validator: T,
): Validator<GetJasonType<T>> {
  return {
    validate: (
      value: GetJasonType<T>,
      diagnostics: ValidatorDiagnostics = new ValidatorDiagnostics(),
    ) => {
      diagnostics.pushScope(label);
      validator.validate(value, diagnostics);
      return diagnostics;
    },
  };
}
