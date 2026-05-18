require('dotenv').config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 5500;
const cors = require('cors');
const bodyParser = require("body-parser");
const dbConnection = require('./configs/db-config');
const authRoute = require('./routes/auth-route');
const adminRoute = require('./routes/admin-route');
const employeeRoute = require('./routes/employee-route');
const leaderRoute = require('./routes/leader-route');
const errorMiddleware = require('./middlewares/error-middleware');
const ErrorHandler = require('./utils/error-handler');
const {auth, authRole} = require('./middlewares/auth-middleware');
const payrollPolicyRoutes = require('./routes/payrollPolicyRoutes');
const cron = require("node-cron");
const userController = require("./controllers/user-controller");


// Database Connection
dbConnection();
const {CLIENT_URL} = process.env;
console.log(CLIENT_URL);

app.set("trust proxy", 1);

cron.schedule(
  '0 07 15 * * *',
  () => {
    console.log("⏰ Running Auto Attendance at 10:30 AM IST...");
    userController.autoMarkAttendanceForAll();
  },
  {
    timezone: "Asia/Kolkata"
  }
);

// ✅ Body parser BEFORE routes
cron.schedule(
  '10 0 * * *',
  async () => {
    try {
      const result = await userController.annualPayrollDataCleanup();
      if (result?.success) console.log("Annual payroll data cleanup completed:", result);
    } catch (error) {
      console.error("Annual payroll data cleanup failed:", error);
    }
  },
  {
    timezone: "Asia/Kolkata"
  }
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    "http://localhost:3000",
     "https://nextviewpayrollfrontendmerns-5wt1.vercel.app"
  ],
   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,                // allow cookies/auth headers
}));

// ✅ Mount routes
app.use('/api/auth', authRoute);
app.use('/api/admin', auth, authRole(['admin']), adminRoute);
app.use('/api/admin', auth, authRole(['admin']), payrollPolicyRoutes);
app.use('/api/employee', auth, authRole(['employee','leader']), employeeRoute);
app.use('/api/leader', auth, authRole(['leader']), leaderRoute);

// ... your existing middlewares (bodyParser, cookieParser, sessions, passport, etc.)
const path = require('path');
// ✅ Serve uploaded images statically
app.use('/storage', express.static(path.join(__dirname, 'storage')));

//Middlewares;
app.use((req,res,next)=>
{
    return next(ErrorHandler.notFound('The Requested Resources Not Found'));
});

app.use(errorMiddleware)



// ✅ Show all registered routes (including nested ones)
const listRoutes = (path, layer) => {
  if (layer.route) {
    // Direct routes
    const routePath = path + layer.route.path;
    const methods = Object.keys(layer.route.methods)
      .map(m => m.toUpperCase())
      .join(', ');
    console.log(`🛠 ${methods} ${routePath}`);
  } else if (layer.name === 'router' && layer.handle.stack) {
    // Nested routers (e.g. /api/admin)
    layer.handle.stack.forEach(subLayer => {
      listRoutes(path + (layer.regexp?.source === '^\\/?$' ? '' : layer.regexp.source.replace(/\\\//g, '/').replace(/\^|\$|\?/g, '')), subLayer);
    });
  }
};

// Call this *after* all your app.use(...)
if (app._router && app._router.stack) {
  console.log('\n📜 Registered Routes:\n');
  app._router.stack.forEach(layer => listRoutes('', layer));
  console.log('\n🚀 Server running on port', PORT, '\n');
}



app.listen(PORT,()=>console.log(`Listening On Port : ${PORT}`));
