import { userModel } from "@/models/user-model";
import { ProductionUserModel } from "@/models/Production-user-model";
import { replaceMongoIdInArray, replaceMongoIdInObject } from "@/utils/data-util";
async function createUser(user) {
    return await userModel.create(user);
}
async function createProductionUser(ProductionUser) {
    return await ProductionUserModel.create(ProductionUser);
}


async function findUserByCredentials(credentials) {
    const user = await userModel.findOne(credentials).lean();
    if (user) {
        return replaceMongoIdInObject(user);
    }
    return null;
}

// async function findProductionUserByCredentials(credentials) {
//     const ProductionUser = await ProductionUserModel.findOne(credentials).lean();
//     if (user) {
//         return replaceMongoIdInObject(user);
//     }
//     return null;
// }


export { createUser,findUserByCredentials,createProductionUser };