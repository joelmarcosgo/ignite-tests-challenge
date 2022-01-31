import request from "supertest";
import { Connection } from "typeorm";


import createConnection from "../../../../database";
import { app } from "../../../../app";

let connection: Connection;
let normalUser: {
  id: string;
  name: string;
  email: string;
  password: string;
}

describe("Get Balance", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const userCreated = await request(app).post("/api/v1/users").send({
      name: "NormalUser",
      email: "normaluser@email.com",
      password: "normalpassword"
    })

    normalUser = {
      id: userCreated.body.id,
      name: userCreated.body.name,
      email: userCreated.body.email,
      password: "normalpassword"
    }
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to get balance", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: normalUser.email,
      password: normalUser.password,
    });

    const { token } = responseToken.body;

    await request(app)
    .post("/api/v1/statements/deposit")
    .send({
      amount: 100,
      description: "100ÃO"
    }).set({
      Authorization: `Bearer ${token}`
    })

    await request(app)
    .post("/api/v1/statements/withdraw")
    .send({
      amount: 50,
      description: "50ão"
    }).set({
      Authorization: `Bearer ${token}`
    })

    const response = await request(app)
    .get("/api/v1/statements/balance")
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(200)
    expect(response.body.statement[0]).toHaveProperty("id")
    expect(response.body.statement[1]).toHaveProperty("id")
    expect(response.body).toHaveProperty("balance")
    expect(response.body.balance).toEqual(50)
  });

  it("should not be able to get balance from non-existing user", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "usernonexistent@email.com",
      password: "usernonexistentpassword",
    });

    expect(responseToken.status).toBe(401)
    expect(responseToken.body.message).toEqual('Incorrect email or password')
    expect(responseToken.body.token).toBe(undefined)
    const { token } = responseToken.body;

    const response = await request(app)
    .get("/api/v1/statements/balance")
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toEqual('JWT invalid token!')
  });
});
