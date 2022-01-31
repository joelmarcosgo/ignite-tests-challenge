import request from "supertest";
import { Connection } from "typeorm";


import createConnection from "../../../../database";
import { app } from "../../../../app";

let connection: Connection;

describe("Show User's Profile", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    await request(app).post("/api/v1/users").send({
      name: "Test User",
      email:"testuser@email.com",
      password: "password1235",
    })
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to list user's profile", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email:"testuser@email.com",
      password: "password1235",
    });

    const { token } = responseToken.body;

    const response = await request(app)
    .get("/api/v1/profile")
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(200)
  });

  it("should not be able to list non-existing user's profile", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "usernotexist@email.com",
      password: "usernotexistpassword",
    });

    expect(responseToken.status).toBe(401)
    expect(responseToken.body.message).toEqual('Incorrect email or password')
    expect(responseToken.body.token).toBe(undefined)

    const { token } = responseToken.body;

    const response = await request(app)
    .get("/api/v1/profile")
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(401)
    expect(response.body.message).toEqual('JWT invalid token!')
  });
});
