import assert from "assert";
import { GraphQLJSONObject } from "graphql-type-json";
import { isEqual, reduce } from "lodash";
import { Arg, Authorized, Mutation, Query, Resolver } from "type-graphql";

import { baseConfig, baseConfigAdmin } from "../../client/constants/baseConfig";
import { configStringToValue } from "../../client/constants/validation";
import { ADMIN } from "../constants";
import { ConfigurationTable } from "../db/tables";

@Resolver()
export class ConfigurationResolver {
  static async getConfigData() {
    const data = await ConfigurationTable().select("*");

    const dataDb = data.reduce<Record<string, any>>((acum, { name, value }) => {
      acum[name] = configStringToValue(value);
      return acum;
    }, {});

    return reduce(
      baseConfigAdmin,
      (acum, value, key) => {
        acum[key] = dataDb[key] ?? value;

        return acum;
      },
      { ...baseConfigAdmin }
    );
  }

  @Authorized([ADMIN])
  @Mutation(() => GraphQLJSONObject)
  async editConfig(
    @Arg("name") name: string,
    @Arg("value") value: string
  ): Promise<typeof baseConfig> {
    assert(
      typeof baseConfigAdmin[name] === typeof configStringToValue(value),
      new Error("Invalid type of configuration value")
    );

    const exists = await ConfigurationTable()
      .select("name")
      .where({
        name,
      })
      .first();

    if (exists) {
      await ConfigurationTable()
        .update({
          value,
        })
        .where({
          name,
        });
    } else {
      await ConfigurationTable().insert({
        name,
        value,
      });
    }

    const dbConfigData = await ConfigurationResolver.getConfigData();

    (async () => {
      const dataDb = await ConfigurationTable().select("*");

      const dataConfigDb = dataDb.reduce<Record<string, any>>(
        (acum, { name, value }) => {
          acum[name] = configStringToValue(value);
          return acum;
        },
        {}
      );

      const { unnecessaryKeys, differentKeys } = reduce<
        typeof dataConfigDb,
        {
          differentKeys: { key: string; value: any }[];
          unnecessaryKeys: string[];
        }
      >(
        dataConfigDb,
        (acum, dbValue, dbKey) => {
          if (isEqual(baseConfigAdmin[dbKey], dbValue)) {
            acum.unnecessaryKeys.push(dbKey);
          } else {
            acum.differentKeys.push({
              key: dbKey,
              value: dbValue,
            });
          }
          return acum;
        },
        {
          differentKeys: [],
          unnecessaryKeys: [],
        }
      );

      console.log({
        unnecessaryKeys,
        differentKeys,
      });

      await ConfigurationTable()
        .delete()
        .whereIn("name", unnecessaryKeys)
        .catch((err) => {
          console.error("Error removing baseConfig unnecessaryKeys", err);
        });
    })();

    return dbConfigData;
  }
  @Query(() => GraphQLJSONObject)
  async config(): Promise<typeof baseConfig> {
    return await ConfigurationResolver.getConfigData();
  }
}
