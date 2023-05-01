import gql from "graphql-tag";
import { readFileSync } from "fs";
import { ApolloServer } from "@apollo/server";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLError } from "graphql";
import resolvers from "./resolvers";

const port = process.env.PORT ?? 4001;
import { name as subgraphName } from "../package.json";
const routerSecret = process.env.ROUTER_SECRET;

async function main() {
  const typeDefs = gql(
    readFileSync("schema.graphql", {
      encoding: "utf-8",
    })
  );
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  });
  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => {
      if (
        routerSecret &&
        req.headers["router-authorization"] !== routerSecret
      ) {
        throw new GraphQLError("Missing router authentication", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 401 },
          },
        });
      }
    },
    listen: {
      port,
    },
  });

  console.log(`🚀  Subgraph ready at ${url}`);
  console.log(
    `In a new terminal, run rover dev --url http://localhost:${port} --name ${subgraphName}`
  );
}

main();
