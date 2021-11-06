# jason

A Deno module for building composable validators for your JavaScript data with fluid TypeScript support.

## Usage

To use `jason`, simply import it from `deno.land`. We **strongly advise** to
import the module under the namespace of `jason` to avoid conflicts with some
TypeScript types and our methods.

```ts
import * as jason from "https://deno.land/x/jason/mod.ts";
```

## Examples

Find all examples in the [`examples` directory](./examples).

## Guides

### User Object

First, let's look at the format of the data we are going to be parsing:

```jsonc
{
  "id": "user-0128432", // must begin with 'user-'
  "username": "theskyisblue", // 4 - 16 characters
  "age": 23 // must be at least '0'
}
```

Now, let's build out a validator:

```ts
const userSchema = jason.object({
  id: jason.string({ startsWith: "user-" }),
  username: jason.string({ length: { min: 4, max: 16 } }), // these are inclusive
  age: jason.number({ min: 0 }),
});
```

After that, you might want to be able to create a TypeScript interface/type that
describes the shape of the `User` object. With `jason`, it's extremely simple to do by just importing our utility `GetJasonType` type:

```ts
import type { GetJasonType } from "https://deno.land/x/jason/mod.ts";

// ~~~ user schema definition ~~~

type User = GetJasonType<typeof userSchema>;
```

Now, we you get the type information for `User`, it should look like this:

```ts
type User = {
  id: string;
  username: string;
  age: number;
} & {}; // the `& {}` is from a TypeScript trick used to create optional properties
```

And now, let's finally validate our original data with our schema definition:

```ts
userSchema
  .validate({
    id: "user-0128432",
    username: "4to16characters",
    age: 23,
  })
  .tryThrowErrors();
```

After you run that, you will see that we get no errors! However, now let's test with some incorrect data:

```ts
userSchema
  .validate({
    id: "2353",
    username: "asd",
    age: -3,
  })
  .tryThrowErrors();
```

After that, you'll see the following messages:

```
'id': '2353' did not start with 'user-'

'username': 'asd' had a length less than the minimum length of '4'

'age': '-3' is not greater than or equal to '0'

error: Uncaught TypeError: Failed to validate data. There is most likely more information above.
```

## FAQ

### How do I have optional properties?

All you need to do is wrap the given property with the `jason.optional`
composable:

```ts
const schema = jason.object({
  name: jason.string(),
  friends: jason.optional(jason.array(jason.string())),
});

schema
  .validate({
    name: "Jon Doe",
    friends: ["Jane Doe", "Billy Bob"],
  })
  .tryThrowErrors();

schema
  .validate({
    name: "Jon Doe",
  })
  .tryThrowErrors();
```

### I am getting type errors when passing in parameters into `Validator.validate`. What am I doing wrong?

The `Validator.validate` method is actually type-checked to only take in values
that match the TypeScript version of your schema. This is to help by giving
editor hints on properties and also help you find errors when you are validating
data that would never pass validation. However, you can always just cast your
value to `any` if you want to forgo type-checking.

### How do I use it with JSON?

All you need to do is first parse the JSON with `JSON.parse()` (or just pass in
`Response#json` if you're using the Fetch API) into the `validate` method of
your schema:

```ts
const schema = jason.labelled(
  "User",
  jason.object({
    name: jason.string(),
    age: jason.number({ min: 0 }),
  })
);

const body = '{ "name": "awesomeguy23", "age": 23 }';
const data = JSON.parse(body);

schema.validate(data).tryThrowErrors();
```

## Contributing

Please format your code using `deno fmt` and make sure you run `deno test` before sending a pull request.

## License

[MIT](./LICENSE)
