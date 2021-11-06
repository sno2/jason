import type { GetJasonType } from "../mod.ts";
import * as jason from "../mod.ts";

const userSchema = jason.object({
  id: jason.string({ startsWith: "user-" }),
  username: jason.string({ length: { min: 4, max: 16 } }), // these are inclusive
  age: jason.number({ min: 0 }),
});

type User = GetJasonType<typeof userSchema>;

// no errors
userSchema
  .validate({
    id: "user-0128432",
    username: "4to16characters",
    age: 23,
  })
  .tryThrowErrors();

userSchema
  .validate({
    id: "user",
    username: "asd",
    age: -3,
  })
  .tryThrowErrors();
