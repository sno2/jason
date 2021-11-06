import * as jason from "../mod.ts";

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
