import request from "supertest";
import { Connection } from "typeorm";
import {v4 as uuidv4 } from "uuid"


import createConnection from "../../../../database";
import { app } from "../../../../app";

let connection: Connection;
let normalUser: {
  id: string;
  name: string;
  email: string;
  password: string;
}

describe("Get Statement", () => {
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

  it("should be able to get statement", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: normalUser.email,
      password: normalUser.password,
    });

    const { token } = responseToken.body;

    const responseDeposit = await request(app)
    .post("/api/v1/statements/deposit")
    .send({
      amount: 100,
      description: "100ÃO"
    }).set({
      Authorization: `Bearer ${token}`
    })

    const statement_id = responseDeposit.body.id

    const response = await request(app)
    .get(`/api/v1/statements/${statement_id}`)
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty("id")
    expect(response.body.user_id).toEqual(normalUser.id)
    expect(response.body.amount).toEqual("100.00")
    expect(response.body.type).toEqual("deposit")
  });

  it("should be not able to get statement from non-existing user", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "usernonexistent@email.com",
      password: "usernonexistentpassword",
    });

    expect(responseToken.status).toBe(401)
    expect(responseToken.body.message).toEqual('Incorrect email or password')
    expect(responseToken.body.token).toBe(undefined)
    const { token } = responseToken.body;

    const statement_id = uuidv4()
    const response = await request(app)
    .get(`/api/v1/statements/${statement_id}`)
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toEqual('JWT invalid token!')
  });

  it("should be not able to get non-existing statement", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: normalUser.email,
      password: normalUser.password,
    });

    const { token } = responseToken.body;

    const statement_id = uuidv4()
    const response = await request(app)
    .get(`/api/v1/statements/${statement_id}`)
    .set({
      Authorization: `Bearer ${token}`
    })

    expect(response.status).toBe(404)
    expect(response.body.message).toEqual('Statement not found')
  });
});
