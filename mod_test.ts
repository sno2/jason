// deno-lint-ignore-file no-explicit-any

import type { GetJasonType } from "./mod.ts";
import * as jason from "./mod.ts";

import { assert } from "https://deno.land/std@0.113.0/testing/asserts.ts";

Deno.test("string composable", () => {
  {
    const schema = jason.string();
    assert(schema.validate("helo").isOk);
    assert(schema.validate("123").isOk);
  }

  {
    const schema = jason.string({ length: 5 });
    assert(schema.validate("12345").isOk);
    assert(!schema.validate("12").isOk);
    assert(!schema.validate("1234567").isOk);
  }

  {
    const schema = jason.string({ length: { min: 4 } });
    assert(schema.validate("1234").isOk);
    assert(!schema.validate("123").isOk);
  }

  {
    const schema = jason.string({ length: { max: 4 } });
    assert(schema.validate("123").isOk);
    assert(schema.validate("1234").isOk);
    assert(!schema.validate("12345").isOk);
  }

  {
    const schema = jason.string({ length: { min: 4, max: 6 } });
    assert(schema.validate("1234").isOk);
    assert(schema.validate("123456").isOk);
    assert(!schema.validate("12").isOk);
    assert(!schema.validate("1234567").isOk);
  }

  {
    const schema = jason.string({ startsWith: "foo-" });
    assert(schema.validate("foo-").isOk);
    assert(schema.validate("foo-bar").isOk);
    assert(!schema.validate("asdf").isOk);
    assert(!schema.validate("asdffoo-").isOk);
  }

  {
    const schema = jason.string({ endsWith: "foo-" });
    assert(schema.validate("asdffoo-").isOk);
    assert(schema.validate("foo-").isOk);
    assert(!schema.validate("foo-bar").isOk);
    assert(!schema.validate("asdf").isOk);
  }

  {
    const schema = jason.string({ startsWith: "foo-", endsWith: "foo-" });
    assert(schema.validate("foo-").isOk);
    assert(schema.validate("foo-foo-").isOk);
    assert(!schema.validate("asdffoo-").isOk);
    assert(!schema.validate("foo-bar").isOk);
    assert(!schema.validate("asdf").isOk);
  }
});

Deno.test("number composable", () => {
  {
    const schema = jason.number();
    assert(schema.validate(5).isOk);
    assert(schema.validate(-5).isOk);
    assert(schema.validate(0).isOk);
  }

  {
    const schema = jason.number({ min: 0 });
    assert(schema.validate(0).isOk);
    assert(schema.validate(100).isOk);
    assert(!schema.validate(-5).isOk);
  }

  {
    const schema = jason.number({ max: 0 });
    assert(schema.validate(0).isOk);
    assert(schema.validate(-100).isOk);
    assert(schema.validate(-5).isOk);
    assert(!schema.validate(5).isOk);
    assert(!schema.validate(20).isOk);
  }

  {
    const schema = jason.number({ min: 5, max: 10 });
    assert(schema.validate(5).isOk);
    assert(schema.validate(10).isOk);
    assert(!schema.validate(-2).isOk);
    assert(!schema.validate(15).isOk);
  }
});

Deno.test("object composable", () => {
  {
    const schema = jason.object({
      name: jason.string(),
    });

    assert(schema.validate({ name: "hey" }).isOk);
    assert(!schema.validate({ name: undefined } as any).isOk);
    assert(!schema.validate({ name: 23 } as any).isOk);
    assert(!schema.validate({} as any).isOk);
  }

  {
    // nested objects

    const schema = jason.object({
      inner: jason.object({
        name: jason.string(),
      }),
    });

    assert(
      schema.validate({
        inner: {
          name: "hey",
        },
      }).isOk,
    );

    assert(
      !schema.validate({
        inner: {
          name: undefined,
        },
      } as any).isOk,
    );

    assert(
      !schema.validate({
        name: undefined,
      } as any).isOk,
    );
  }
});

Deno.test("getting jason type", () => {
  {
    const schema = jason.object({
      name: jason.string(),
      age: jason.number(),
    });

    const _: GetJasonType<typeof schema> = { name: "", age: 0 };
  }

  {
    const schema = jason.object({
      inner: jason.object({
        inner: jason.object({
          a: jason.boolean(),
          b: jason.string(),
        }),
      }),
    });

    const _: GetJasonType<typeof schema> = {
      inner: { inner: { a: true, b: "" } },
    };
  }

  {
    const schema = jason.array(jason.string());

    const _: GetJasonType<typeof schema> = ["hey"];
  }

  {
    const schema = jason.array(jason.object({ name: jason.string() }));

    const _: GetJasonType<typeof schema> = [{ name: "" }, { name: "" }];
  }
});

Deno.test("matches composible", () => {
  const scheme = jason.matches((val: number) => val === 12);

  assert(scheme.validate(12).isOk);
  assert(!scheme.validate(-100).isOk);
});
