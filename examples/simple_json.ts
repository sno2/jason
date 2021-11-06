import * as jason from "../mod.ts";

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
