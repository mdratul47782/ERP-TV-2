"use server";

import {
  createUser,
  createProductionUser,
  findUserByCredentials,findProductionUserByCredentials
} from "@/db/queries";
import { redirect } from "next/navigation";

async function registerUser(formData) {
  const user = Object.fromEntries(formData);
  await createUser(user);
  redirect("/login");
}

async function ProductionRegisterUser(formData) {
  const ProductionUser = Object.fromEntries(formData);
  await createProductionUser(ProductionUser);
  redirect("/ProductionLogin");
}

async function PerformLogin(formData) {
  try {
    const credential = {};
    credential.user_name = formData.get("user_name");
    credential.password = formData.get("password");
    const found = await findUserByCredentials(credential);
    return found;
  } catch (error) {
    throw error;
  }
}

async function PerformProductionLogin(formData) {
  try {
    const credential = {};
    credential.Production_user_name = formData.get("Production_user_name");
    credential.password = formData.get("password");
    const found = await findProductionUserByCredentials(credential);
    return found;
  } catch (error) {
    throw error;
  }
}

export {
  registerUser,
  PerformLogin,
  ProductionRegisterUser,
  PerformProductionLogin,
};
