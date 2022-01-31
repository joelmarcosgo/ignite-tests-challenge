import request from "supertest";
import { Connection } from "typeorm";


import createConnection from "../../../../database";
import { app } from "../../../../app";

let connection: Connection;
let user: {
  id: string;
  name: string;
  email: string;
  password: string;
}

describe("Create Statement", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const userCreated = await request(app).post("/api/v1/users").send({
      name: "TestUser",
      email: "testuser@email.com",
      password: "password"
    })

    user = {
      id: userCreated.body.id,
      name: userCreated.body.name,
      email: userCreated.body.email,
      password: "password"
    }
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to deposit", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: user.email,
      password: user.password,
    });

    const { token } = responseToken.body;

    const response = await request(app)
    .post("/api/v1/statements/deposit")
    .send({
      amount: 256,
      description: "Vale-Transporte"
    }).set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("id")
    expect(response.body.user_id).toEqual(user.id)
    expect(response.body.amount).toBe(256)
    expect(response.body.type).toEqual("deposit")
  });

  it("should be able to withdraw", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: user.email,
      password: user.password,
    });

    const { token } = responseToken.body;

    const response = await request(app)
    .post("/api/v1/statements/withdraw")
    .send({
      amount: 189,
      description: "Faculdade"
    }).set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("id")
    expect(response.body.user_id).toEqual(user.id)
    expect(response.body.amount).toBe(189)
    expect(response.body.type).toEqual("withdraw")
  });

  it("should not be able to deposit/withdraw with non-existing user", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "usernotexist@email.com",
      password: "usernotexistpassword",
    });

    expect(responseToken.status).toBe(401)
    expect(responseToken.body.message).toEqual('Incorrect email or password')
    expect(responseToken.body.token).toBe(undefined)
    const { token } = responseToken.body;

    const response = await request(app)
    .post("/api/v1/statements/deposit")
    .send({
      amount: 2456,
      description: "Salário"
    }).set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toEqual('JWT invalid token!')
  });

  it("should not be able to withdraw without money", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: user.email,
      password: user.password,
    });

    const { token } = responseToken.body;

    const response = await request(app)
    .post("/api/v1/statements/withdraw")
    .send({
      amount: 242,
      description: "Curso"
    }).set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toEqual('Insufficient funds')
  });
});
