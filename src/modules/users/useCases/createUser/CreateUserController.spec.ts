import request from "supertest";
import { Connection } from "typeorm";


import createConnection from "../../../../database";
import { app } from "../../../../app";

let connection: Connection;

describe("Create User ", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create user", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "NormalUser",
      email: "normaluser@email.com",
      password: "normalpassword"
    })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("id")
    expect(response.body.name).toEqual("NormalUser")
    expect(response.body.email).toEqual("normaluser@email.com")
  });

  it("should not be able to create user with same email", async () => {
    await request(app).post("/api/v1/users").send({
      name: "NormalUser",
      email: "normaluser@email.com",
      password: "normalpassword"
    })

    const response = await request(app).post("/api/v1/users").send({
      name: "NormalUser",
      email: "normaluser@email.com",
      password: "normalpassword"
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toEqual("User already exists")
  });
});
