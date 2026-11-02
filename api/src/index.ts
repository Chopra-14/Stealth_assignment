import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Register payment routes
import { paymentRouter } from './routes/payments';
app.route('/api', paymentRouter);


export default app
