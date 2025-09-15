import { readFile } from 'fs/promises';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typeDefs = `#graphql
  type KPI {
    id: ID!
    name: String!
    values: [Float!]!
  }
  type Store {
    id: ID!
    name: String!
  }
  type DashboardData {
    categories: [String!]!
    kpis: [KPI!]!
    stores: [Store!]!
  }
  type Query {
    dashboard: DashboardData!
    kpi(id: ID!): KPI
  }
`;

async function loadData() {
  const raw = await readFile(path.join(__dirname, 'data.json'), 'utf-8');
  return JSON.parse(raw);
}

const resolvers = {
  Query: {
    dashboard: async () => {
      return await loadData();
    },
    kpi: async (_: any, { id }: { id: string }) => {
      const data = await loadData();
      return data.kpis.find((k: any) => k.id === id) || null;
    }
  }
};

async function start() {
  const server = new ApolloServer({ typeDefs, resolvers });
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async () => ({}),
    cors: {
      origin: 'http://localhost:5173',
      credentials: false
    }
  });
  console.log('GraphQL Server ready at', url);
}

start();