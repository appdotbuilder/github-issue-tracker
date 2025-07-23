
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { 
  registerUserInputSchema, 
  loginUserInputSchema,
  createIssueTagInputSchema,
  updateIssueTagInputSchema,
  createIssueInputSchema,
  updateIssueInputSchema,
  issueFilterSchema,
  deleteInputSchema
} from './schema';
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { getUsers } from './handlers/get_users';
import { createIssueTag } from './handlers/create_issue_tag';
import { getIssueTags } from './handlers/get_issue_tags';
import { updateIssueTag } from './handlers/update_issue_tag';
import { deleteIssueTag } from './handlers/delete_issue_tag';
import { createIssue } from './handlers/create_issue';
import { getIssues } from './handlers/get_issues';
import { getIssueById } from './handlers/get_issue_by_id';
import { updateIssue } from './handlers/update_issue';
import { deleteIssue } from './handlers/delete_issue';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User routes
  registerUser: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),

  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  getUsers: publicProcedure
    .query(() => getUsers()),

  // Issue tag routes
  createIssueTag: publicProcedure
    .input(createIssueTagInputSchema)
    .mutation(({ input }) => createIssueTag(input)),

  getIssueTags: publicProcedure
    .query(() => getIssueTags()),

  updateIssueTag: publicProcedure
    .input(updateIssueTagInputSchema)
    .mutation(({ input }) => updateIssueTag(input)),

  deleteIssueTag: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteIssueTag(input)),

  // Issue routes
  createIssue: publicProcedure
    .input(createIssueInputSchema)
    .mutation(({ input }) => {
      // In a real implementation, you'd get the creator ID from authentication context
      const creatorId = 1; // Placeholder - should come from auth context
      return createIssue(input, creatorId);
    }),

  getIssues: publicProcedure
    .input(issueFilterSchema.optional())
    .query(({ input }) => getIssues(input)),

  getIssueById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getIssueById(input.id)),

  updateIssue: publicProcedure
    .input(updateIssueInputSchema)
    .mutation(({ input }) => updateIssue(input)),

  deleteIssue: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteIssue(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
