import app from '../src/index';
import { handle } from '@hono/node-server/vercel';

export default handle(app);
