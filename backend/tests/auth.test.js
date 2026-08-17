// auth.test.js

const request = require("supertest");
const app = require("../app");

describe("Registration", () => {

  test("Register user successfully", async () => {

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name:"Test User",
        email:"test@gmail.com",
        password:"123456"
      });

    expect(res.statusCode).toBe(201);
  });

});